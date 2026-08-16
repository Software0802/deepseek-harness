/** Single-operation controller backed by the version-2 recovery journal. */
import { createHash, randomUUID } from 'node:crypto';
import { PLUGIN_MUTATION_PHASES, decodePluginInstallRequest, decodePluginManagementRequest, decodePluginOperationSnapshot, decodePluginOperationStartResult, decodePluginRuntimeEvidence, } from '@deepseek-ai/dsh-plugin-center-contracts';
/** Error carrying only a stable renderer-facing failure category. */
export class PluginOperationFailure extends Error {
    code;
    name = 'PluginOperationFailure';
    constructor(code, message, options) {
        super(message, options);
        this.code = code;
    }
}
function phaseIndex(phase) {
    return PLUGIN_MUTATION_PHASES.indexOf(phase);
}
function defaultBoundary(phase) {
    return phase === 'stopping-host' || phase === 'installing'
        || phase === 'starting-host' || phase === 'reloading'
        ? 'before-side-effect'
        : 'observation';
}
function fingerprintSha256(fingerprint) {
    return createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}
/** Owns idempotency, Profile serialization, durable state, commit, and recovery handoff. */
export class PluginOperationController {
    journal;
    run;
    readProfileIdentity;
    recover;
    now;
    createOperationId;
    injectFault;
    record = null;
    execution = null;
    startGate = Promise.resolve();
    listeners = new Set();
    constructor(journal, run, readProfileIdentity, recover, now = () => new Date(), createOperationId = randomUUID, injectFault = () => { }) {
        this.journal = journal;
        this.run = run;
        this.readProfileIdentity = readProfileIdentity;
        this.recover = recover;
        this.now = now;
        this.createOperationId = createOperationId;
        this.injectFault = injectFault;
    }
    /** Hydrate the last durable value before registering renderer handlers. */
    async initialize() {
        this.record = await this.journal.read();
    }
    getOperation() {
        return this.record?.operation ?? null;
    }
    get active() {
        return this.record !== null && this.record.terminalResult === null;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
    /** Start, join, or reject one exact install under a serialized ownership gate. */
    async start(value) {
        const install = decodePluginInstallRequest(value);
        return await this.startRequest({ ...install, action: 'install' });
    }
    /** Start, join, or reject one installed-item action through the same owner. */
    async manage(value) {
        return await this.startRequest(decodePluginManagementRequest(value));
    }
    async startRequest(request) {
        let release;
        const previous = this.startGate;
        this.startGate = new Promise((resolve) => { release = resolve; });
        await previous;
        try {
            const current = this.record;
            if (current?.operation.idempotencyKey === request.idempotencyKey) {
                return decodePluginOperationStartResult({ kind: 'joined', operation: current.operation });
            }
            if (current !== null && current.terminalResult === null) {
                return decodePluginOperationStartResult({
                    kind: 'busy',
                    activeOperationId: current.operation.operationId,
                });
            }
            const timestamp = this.now().toISOString();
            const profileIdentity = await this.readProfileIdentity();
            const operation = decodePluginOperationSnapshot({
                schemaVersion: 1,
                operationId: this.createOperationId(),
                idempotencyKey: request.idempotencyKey,
                profileName: 'web',
                action: request.action,
                pluginId: request.pluginId,
                version: request.version,
                phase: 'preflight',
                startedAt: timestamp,
                updatedAt: timestamp,
                hostGeneration: null,
                failureCode: null,
            });
            const record = {
                schemaVersion: 2,
                header: {
                    operationId: operation.operationId,
                    idempotencyKey: operation.idempotencyKey,
                    profileIdentity,
                    action: operation.action,
                    pluginId: operation.pluginId,
                    version: operation.version,
                    startedAt: operation.startedAt,
                },
                operation,
                priorFingerprint: null,
                priorSnapshot: null,
                phaseHistory: [{
                        sequence: 0,
                        phase: 'preflight',
                        boundary: 'observation',
                        at: timestamp,
                        operationFailureCode: null,
                        recoveryReasonCode: null,
                    }],
                commitMarker: null,
                terminalResult: null,
                recoveryAttempt: 0,
                recoveryReasonCode: null,
            };
            await this.journal.write(record);
            this.record = record;
            this.publish(operation);
            this.execution = this.execute(request);
            return decodePluginOperationStartResult({ kind: 'started', operation });
        }
        finally {
            release();
        }
    }
    /** Test and shutdown join point for the currently running mutation/recovery. */
    async whenSettled() {
        await this.execution;
    }
    async execute(request) {
        try {
            const operationId = this.requireActive().operation.operationId;
            const evidence = await this.run(request, {
                operationId,
                transition: (phase, hostGeneration, boundary) => this.transition(phase, hostGeneration, boundary),
                recordFoundation: (fingerprint, foundation) => this.recordFoundation(fingerprint, foundation),
                completeSideEffect: (phase, hostGeneration) => this.completeSideEffect(phase, hostGeneration),
            });
            await this.commit(evidence);
        }
        catch (error) {
            const code = error instanceof PluginOperationFailure ? error.code : 'internal';
            try {
                await this.recover(code);
                this.record = await this.journal.read();
                if (this.record !== null)
                    this.publish(this.record.operation);
            }
            catch (recoveryError) {
                console.error('plugin operation recovery could not be completed:', recoveryError);
                this.record = await this.journal.read().catch(() => this.record);
            }
        }
    }
    async transition(phase, hostGeneration, boundary = defaultBoundary(phase)) {
        const current = this.requireActive();
        const currentPhase = current.operation.phase;
        if (!PLUGIN_MUTATION_PHASES.includes(currentPhase)
            || phaseIndex(phase) <= phaseIndex(currentPhase)) {
            throw new Error(`plugin operation phase cannot move from ${currentPhase} to ${phase}`);
        }
        const timestamp = this.now().toISOString();
        const next = decodePluginOperationSnapshot({
            ...current.operation,
            phase,
            updatedAt: timestamp,
            hostGeneration: hostGeneration === undefined ? current.operation.hostGeneration : hostGeneration,
            failureCode: null,
        });
        await this.commitRecord({
            ...current,
            operation: next,
            phaseHistory: [...current.phaseHistory, {
                    sequence: current.phaseHistory.length,
                    phase,
                    boundary,
                    at: timestamp,
                    operationFailureCode: null,
                    recoveryReasonCode: null,
                }],
        });
        await this.injectFault({
            operationId: current.header.operationId,
            action: current.header.action,
            phase,
            boundary,
        });
        return next;
    }
    async completeSideEffect(phase, hostGeneration) {
        const current = this.requireActive();
        const latest = current.phaseHistory.at(-1);
        if (current.operation.phase !== phase || latest?.phase !== phase
            || latest.boundary !== 'before-side-effect') {
            throw new Error(`plugin operation cannot complete an unowned ${phase} side effect`);
        }
        const timestamp = this.now().toISOString();
        const next = decodePluginOperationSnapshot({
            ...current.operation,
            updatedAt: timestamp,
            hostGeneration: hostGeneration === undefined ? current.operation.hostGeneration : hostGeneration,
        });
        await this.commitRecord({
            ...current,
            operation: next,
            phaseHistory: [...current.phaseHistory, {
                    sequence: current.phaseHistory.length,
                    phase,
                    boundary: 'after-side-effect',
                    at: timestamp,
                    operationFailureCode: null,
                    recoveryReasonCode: null,
                }],
        }, false);
        await this.injectFault({
            operationId: current.header.operationId,
            action: current.header.action,
            phase,
            boundary: 'after-side-effect',
        });
    }
    async commit(evidence) {
        const current = this.requireActive();
        if (current.priorSnapshot === null || current.priorFingerprint === null) {
            throw new Error('plugin operation cannot commit without prior recovery evidence');
        }
        const timestamp = this.now().toISOString();
        const runtimeEvidence = decodePluginRuntimeEvidence(evidence.runtimeEvidence);
        const next = decodePluginOperationSnapshot({
            ...current.operation,
            phase: 'committed',
            updatedAt: timestamp,
            hostGeneration: evidence.hostGeneration,
            failureCode: null,
        });
        await this.commitRecord({
            ...current,
            operation: next,
            phaseHistory: [...current.phaseHistory, {
                    sequence: current.phaseHistory.length,
                    phase: 'committed',
                    boundary: 'observation',
                    at: timestamp,
                    operationFailureCode: null,
                    recoveryReasonCode: null,
                }],
            commitMarker: {
                committedAt: timestamp,
                fingerprintSha256: fingerprintSha256(evidence.fingerprint),
                runtimeEvidence,
            },
            terminalResult: 'committed',
        });
    }
    async recordFoundation(priorFingerprint, foundation) {
        const current = this.requireActive();
        if (current.priorFingerprint !== null || current.priorSnapshot !== null) {
            throw new Error('plugin operation foundation is already durable');
        }
        if (foundation.profileIdentity.rootSha256 !== current.header.profileIdentity.rootSha256) {
            throw new Error('plugin operation snapshot belongs to a different Profile root');
        }
        const priorSnapshot = {
            snapshotId: foundation.snapshotId,
            snapshotSha256: foundation.snapshotSha256,
            runtimeEvidence: decodePluginRuntimeEvidence(foundation.runtimeEvidence),
        };
        await this.commitRecord({
            ...current,
            priorFingerprint,
            priorSnapshot,
        }, false);
    }
    requireActive() {
        if (this.record === null || this.record.terminalResult !== null) {
            throw new Error('plugin operation is not active');
        }
        return this.record;
    }
    async commitRecord(record, notify = true) {
        await this.journal.write(record);
        this.record = record;
        if (notify)
            this.publish(record.operation);
    }
    publish(operation) {
        for (const listener of this.listeners) {
            try {
                listener(operation);
            }
            catch (error) {
                console.error('plugin operation listener failed:', error);
            }
        }
    }
}
//# sourceMappingURL=operation-controller.js.map