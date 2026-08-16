/** Cross-process ownership lock for one Desktop Profile mutation. */
import { randomBytes } from 'node:crypto';
import { lstat, mkdir, open, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write';
/** Raised when another process already owns the selected Profile. */
export class ProfileMutationBusyError extends Error {
    name = 'ProfileMutationBusyError';
}
/** Lock owner; only recovery may reclaim a dead owner for the exact durable operation. */
export class ProfileMutationLock {
    path;
    recoveryPath;
    constructor(profileDirectory) {
        this.path = join(profileDirectory, '.plugin-center-mutation.lock');
        this.recoveryPath = join(profileDirectory, '.plugin-center-mutation.recovery.lock');
    }
    async acquire(operationId) {
        await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
        let handle;
        try {
            handle = await open(this.path, 'wx', 0o600);
        }
        catch (error) {
            if (error.code === 'EEXIST') {
                throw new ProfileMutationBusyError('the web Profile already has an active mutation owner');
            }
            throw error;
        }
        const nonce = randomBytes(16).toString('hex');
        const content = lockContent(operationId, nonce);
        try {
            await handle.writeFile(content, 'utf8');
        }
        catch (error) {
            await handle.close().catch(() => undefined);
            await rm(this.path, { force: true }).catch(() => undefined);
            throw error;
        }
        return acquiredLock(this.path, nonce, handle);
    }
    /** Reclaim a dead same-operation owner without ever accepting a different operation's lock. */
    async acquireRecovery(operationId) {
        await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
        let observed;
        try {
            observed = await readFile(this.path, 'utf8');
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return await this.acquire(operationId);
            throw error;
        }
        const metadata = await lstat(this.path);
        if (!metadata.isFile() || metadata.isSymbolicLink()) {
            throw new ProfileMutationBusyError('the web Profile recovery lock is not a regular owned file');
        }
        const owner = decodeLock(observed);
        if (owner.operationId !== operationId || processIsAlive(owner.pid)) {
            throw new ProfileMutationBusyError('the web Profile already has a live or different mutation owner');
        }
        const gate = await acquireRecoveryGate(this.recoveryPath, operationId);
        const gateNonce = randomBytes(16).toString('hex');
        try {
            await gate.writeFile(lockContent(operationId, gateNonce), 'utf8');
            const current = decodeLock(await readFile(this.path, 'utf8'));
            if (current.nonce !== owner.nonce || current.operationId !== operationId || processIsAlive(current.pid)) {
                throw new ProfileMutationBusyError('the web Profile mutation owner changed during recovery claim');
            }
            const nonce = randomBytes(16).toString('hex');
            await writeFileAtomic(this.path, lockContent(operationId, nonce), { mode: 0o600, dirMode: 0o700 });
            const primary = acquiredLock(this.path, nonce);
            const recoveryGate = acquiredLock(this.recoveryPath, gateNonce, gate);
            try {
                await recoveryGate.release();
            }
            catch (error) {
                await primary.release().catch(() => undefined);
                throw error;
            }
            return primary;
        }
        catch (error) {
            await gate.close().catch(() => { });
            await removeOwned(this.recoveryPath, gateNonce).catch(() => { });
            throw error;
        }
    }
}
async function acquireRecoveryGate(path, operationId) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            return await open(path, 'wx', 0o600);
        }
        catch (error) {
            if (error.code !== 'EEXIST')
                throw error;
            if (attempt > 0) {
                throw new ProfileMutationBusyError('the web Profile already has a recovery owner');
            }
            const metadata = await lstat(path);
            if (!metadata.isFile() || metadata.isSymbolicLink()) {
                throw new ProfileMutationBusyError('the web Profile recovery owner is not a regular file');
            }
            const owner = decodeLock(await readFile(path, 'utf8'));
            if (owner.operationId !== operationId || processIsAlive(owner.pid)) {
                throw new ProfileMutationBusyError('the web Profile already has a live or different recovery owner');
            }
            await removeOwned(path, owner.nonce);
        }
    }
    throw new ProfileMutationBusyError('the web Profile recovery owner could not be acquired');
}
function lockContent(operationId, nonce) {
    return `${JSON.stringify({ schemaVersion: 1, operationId, pid: process.pid, nonce })}\n`;
}
function decodeLock(value) {
    let source;
    try {
        source = JSON.parse(value);
    }
    catch {
        throw new ProfileMutationBusyError('the web Profile mutation lock is invalid');
    }
    if (typeof source !== 'object' || source === null || Array.isArray(source)) {
        throw new ProfileMutationBusyError('the web Profile mutation lock is invalid');
    }
    const record = source;
    const keys = Object.keys(record).sort();
    if (keys.join(',') !== 'nonce,operationId,pid,schemaVersion'
        || record['schemaVersion'] !== 1
        || typeof record['operationId'] !== 'string'
        || typeof record['nonce'] !== 'string'
        || !Number.isInteger(record['pid'])
        || record['pid'] <= 0) {
        throw new ProfileMutationBusyError('the web Profile mutation lock is invalid');
    }
    return {
        schemaVersion: 1,
        operationId: record['operationId'],
        pid: record['pid'],
        nonce: record['nonce'],
    };
}
function processIsAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        return error.code !== 'ESRCH';
    }
}
async function removeOwned(path, nonce) {
    let observed;
    try {
        observed = await readFile(path, 'utf8');
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return;
        throw error;
    }
    try {
        if (decodeLock(observed).nonce === nonce)
            await rm(path);
    }
    catch (error) {
        if (!(error instanceof ProfileMutationBusyError))
            throw error;
    }
}
function acquiredLock(path, nonce, handle) {
    let released = false;
    let handleClosed = handle === undefined;
    let execution = null;
    return {
        path,
        release: async () => {
            if (released)
                return;
            if (execution !== null) {
                await execution;
                return;
            }
            execution = (async () => {
                if (!handleClosed) {
                    await handle?.close();
                    handleClosed = true;
                }
                await removeOwned(path, nonce);
                released = true;
            })();
            try {
                await execution;
            }
            finally {
                execution = null;
            }
        },
    };
}
//# sourceMappingURL=profile-lock.js.map