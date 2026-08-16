/** Successful trusted-install transaction from exact preflight through runtime evidence. */
import { readProfileManifest } from '@deepseek-ai/dsh-app-boot';
import { verifyPluginArtifact } from "./artifact-verifier.js";
import { PluginOperationFailure, } from "./operation-controller.js";
import { installTrustedPackage, } from "./package-manager.js";
import { reconcileAndValidateInstalledBundle } from "./profile-installation.js";
function failure(code, message, cause) {
    return new PluginOperationFailure(code, message, { cause });
}
async function transitionOrThrow(controls, phase, generation) {
    await controls.transition(phase, generation);
}
/** Build the controller runner that commits only after all joined evidence passes. */
export function createTrustedInstallRunner(options) {
    return async (request, controls) => {
        if (request.action !== 'install') {
            throw new PluginOperationFailure('preflight-denied', 'trusted install runner accepts install actions only');
        }
        const resolved = await options.compatibility.resolve({
            pluginId: request.pluginId,
            version: request.version,
            action: 'install',
        });
        const candidate = resolved.candidate;
        if (candidate === null || !resolved.decision.allowed) {
            throw new PluginOperationFailure('preflight-denied', 'trusted installation preflight denied the exact target');
        }
        await transitionOrThrow(controls, 'downloading');
        let artifact;
        try {
            artifact = await options.downloader.download(candidate, options.platform, controls.operationId);
        }
        catch (error) {
            throw failure('download-failed', 'validated plugin artifact could not be downloaded', error);
        }
        await transitionOrThrow(controls, 'verifying-artifact');
        const verification = await verifyPluginArtifact({
            bytes: artifact.bytes,
            candidate,
            platform: options.platform,
        });
        if (!verification.verified) {
            throw new PluginOperationFailure('artifact-invalid', 'validated plugin artifact failed verification');
        }
        let lock;
        try {
            lock = await options.profileLock.acquire(controls.operationId);
        }
        catch (error) {
            throw failure('profile-busy', 'selected Profile already has a mutation owner', error);
        }
        try {
            await transitionOrThrow(controls, 'snapshotting');
            let before;
            let snapshot;
            try {
                const currentGeneration = options.host.current;
                if (currentGeneration === undefined)
                    throw new Error('current Host is unavailable before snapshotting');
                const priorRuntimeEvidence = await options.runtimeVerifier.readEvidence(currentGeneration.origin);
                before = readProfileManifest('desktop', options.profileDirectory);
                snapshot = await options.snapshotStore.capture(controls.operationId, candidate.packageName);
                await controls.recordFoundation(resolved.fingerprint, {
                    snapshotId: snapshot.snapshotId,
                    snapshotSha256: snapshot.snapshotSha256,
                    profileIdentity: snapshot.profileIdentity,
                    runtimeEvidence: priorRuntimeEvidence,
                });
            }
            catch (error) {
                throw failure('snapshot-failed', 'selected Profile could not be snapshotted before mutation', error);
            }
            const oldGeneration = options.host.current?.id ?? null;
            let targetFingerprint;
            await transitionOrThrow(controls, 'stopping-host', oldGeneration);
            let generation;
            try {
                generation = await options.host.restart(`install ${candidate.pluginId}@${candidate.version}`, async () => {
                    await controls.completeSideEffect('stopping-host', oldGeneration);
                    await transitionOrThrow(controls, 'installing', oldGeneration);
                    try {
                        await installTrustedPackage(options.packageManager, {
                            packageName: candidate.packageName,
                            version: candidate.version,
                            artifactPath: artifact.path,
                        });
                    }
                    catch (error) {
                        throw failure('package-mutation-failed', 'fixed package mutation failed', error);
                    }
                    await controls.completeSideEffect('installing', oldGeneration);
                    await transitionOrThrow(controls, 'validating-profile', oldGeneration);
                    try {
                        await reconcileAndValidateInstalledBundle({
                            before,
                            profileDirectory: options.profileDirectory,
                            installAnchor: options.installAnchor,
                            candidate,
                        });
                        targetFingerprint = await options.postFingerprint(resolved.selection);
                        const installed = targetFingerprint.installedPlugins.find(plugin => plugin.pluginId === candidate.pluginId);
                        if (installed?.version !== candidate.version || !installed.enabled
                            || installed.packageName !== candidate.packageName) {
                            throw new Error('installed Profile projection does not expose the exact active Bundle');
                        }
                    }
                    catch (error) {
                        if (error instanceof PluginOperationFailure)
                            throw error;
                        throw failure('profile-invalid', 'mutated Profile failed exact-version validation', error);
                    }
                    await transitionOrThrow(controls, 'starting-host', oldGeneration);
                });
            }
            catch (error) {
                if (error instanceof PluginOperationFailure)
                    throw error;
                throw failure('host-restart-failed', 'replacement Host generation could not start', error);
            }
            await controls.completeSideEffect('starting-host', generation.id);
            await transitionOrThrow(controls, 'reloading', generation.id);
            try {
                await options.reloadHost(generation.origin);
            }
            catch (error) {
                throw failure('host-restart-failed', 'Desktop window could not reconnect to the replacement Host', error);
            }
            await controls.completeSideEffect('reloading', generation.id);
            await transitionOrThrow(controls, 'health-checking', generation.id);
            try {
                await options.runtimeVerifier.verifyHealth(generation.origin);
            }
            catch (error) {
                throw failure('host-restart-failed', 'replacement Host failed loopback health verification', error);
            }
            await transitionOrThrow(controls, 'verifying-runtime', generation.id);
            let runtimeEvidence;
            try {
                runtimeEvidence = await options.runtimeVerifier.verifyActivation(generation.origin, candidate);
            }
            catch (error) {
                throw failure('runtime-evidence-missing', 'declared runtime activation evidence is incomplete', error);
            }
            if (targetFingerprint === undefined) {
                throw new PluginOperationFailure('internal', 'target fingerprint was not retained through Host restart');
            }
            return {
                hostGeneration: generation.id,
                fingerprint: targetFingerprint,
                runtimeEvidence,
            };
        }
        finally {
            await lock.release();
        }
    };
}
//# sourceMappingURL=trusted-install-executor.js.map