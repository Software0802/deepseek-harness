/** Client-local ordered projection of the Desktop trusted-install phases. */
import type { PluginOperationPhase } from '@deepseek-ai/dsh-plugin-center-contracts';
/** Ordered trusted-install phases rendered by the browser progress surface. */
export declare const PLUGIN_OPERATION_PHASES: readonly ["preflight", "downloading", "verifying-artifact", "snapshotting", "stopping-host", "installing", "validating-profile", "starting-host", "reloading", "health-checking", "verifying-runtime", "committed", "failed"];
/** One operation phase owned by the F003 trusted-install presentation. */
export type TrustedInstallPhase = typeof PLUGIN_OPERATION_PHASES[number];
/** Locale key for each Desktop-owned trusted-install phase. */
export declare const PLUGIN_OPERATION_PHASE_KEYS: {
    readonly preflight: "phasePreflight";
    readonly downloading: "phaseDownloading";
    readonly 'verifying-artifact': "phaseVerifyingArtifact";
    readonly snapshotting: "phaseSnapshotting";
    readonly 'stopping-host': "phaseStoppingHost";
    readonly installing: "phaseInstalling";
    readonly 'validating-profile': "phaseValidatingProfile";
    readonly 'starting-host': "phaseStartingHost";
    readonly reloading: "phaseReloading";
    readonly 'health-checking': "phaseHealthChecking";
    readonly 'verifying-runtime': "phaseVerifyingRuntime";
    readonly committed: "phaseCommitted";
    readonly failed: "phaseFailed";
};
/** User-facing groups that collapse implementation phases into four stable progress steps. */
export declare const PLUGIN_OPERATION_GROUPS: readonly [{
    readonly label: "progressPreparing";
    readonly phases: readonly ["preflight", "downloading", "verifying-artifact", "snapshotting"];
}, {
    readonly label: "progressInstalling";
    readonly phases: readonly ["stopping-host", "installing", "validating-profile"];
}, {
    readonly label: "progressReloading";
    readonly phases: readonly ["starting-host", "reloading", "health-checking"];
}, {
    readonly label: "progressVerifying";
    readonly phases: readonly ["verifying-runtime"];
}];
/**
 * Narrow the shared operation vocabulary to phases owned by the F003 UI.
 * @param phase - Phase received from the evolving Desktop operation protocol.
 * @returns True only for the trusted-install phases rendered by this Feature.
 */
export declare function isTrustedInstallPhase(phase: PluginOperationPhase): phase is TrustedInstallPhase;
/**
 * Report whether an operation can no longer advance through F003.
 * @param phase - Current Desktop operation phase.
 * @returns True for committed or failed operations.
 */
export declare function isTerminalOperationPhase(phase: PluginOperationPhase): boolean;
/**
 * Report whether an operation must keep later plugin mutations gated.
 * A completed rollback restored the previous environment and releases the gate;
 * failed recovery states stay gated until recovery succeeds.
 * @param phase - Current Desktop operation phase.
 * @returns True while another mutation is active or still needs recovery.
 */
export declare function isMutationBlockingOperationPhase(phase: PluginOperationPhase): boolean;
//# sourceMappingURL=operation-phases.d.ts.map