/** Strict JSON boundary for the Desktop Plugin Center catalog. */
/** Discovery kind. Skill packs remain ordinary reviewed DSH Bundles. */
export type CatalogKind = 'plugin' | 'skill-pack';
/** Catalog scope selected by the user. */
export type CatalogScope = 'public' | 'local';
/** Server-owned discovery order. */
export type CatalogSection = 'featured' | 'popular' | 'recent';
/** Evidence age attached to every renderer result. */
export type CatalogFreshness = 'fresh' | 'cached' | 'stale';
/** Trusted source of the decoded snapshot. */
export type CatalogSource = 'network' | 'cache' | 'bundled';
/** Closed capability vocabulary reviewed with one exact Bundle. */
export type CatalogCapability = 'host' | 'client' | 'agent' | 'tool' | 'model-provider' | 'skill' | 'network' | 'filesystem' | 'subprocess';
/** Preflight summary available during discovery. */
export type CatalogCompatibilityStatus = 'compatible' | 'incompatible' | 'unknown';
/** Disclosure level, not a sandbox guarantee. */
export type CatalogRiskLevel = 'low' | 'medium' | 'high';
/** Bounded catalog media reference from an approved HTTPS origin. */
export interface CatalogMedia {
    readonly url: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
}
/** Platform-level compatibility summary for a catalog card. */
export interface CatalogCompatibility {
    readonly status: CatalogCompatibilityStatus;
    readonly reason: string | null;
    readonly platforms: readonly string[];
}
/** One exact DSH Bundle whose registry metadata has passed catalog validation. */
export interface CatalogSummary {
    readonly pluginId: string;
    readonly version: string;
    readonly catalogKind: CatalogKind;
    readonly scope: CatalogScope;
    readonly displayName: string;
    readonly summary: string;
    readonly publisher: string;
    readonly verified: boolean;
    readonly keywords: readonly string[];
    readonly capabilities: readonly CatalogCapability[];
    readonly icon: CatalogMedia | null;
    readonly brandColor: string | null;
    readonly compatibility: CatalogCompatibility;
    readonly updatedAt: string;
    readonly installed: boolean;
}
/** Exact-version detail and activation evidence bound to one validated Bundle. */
export interface CatalogDetail {
    readonly summary: CatalogSummary;
    readonly description: string;
    readonly screenshots: readonly CatalogMedia[];
    readonly permissions: readonly string[];
    readonly riskLevel: CatalogRiskLevel;
    readonly riskSummary: string;
    readonly changelog: string;
    readonly publishedAt: string;
    readonly expectedEntries: readonly string[];
    readonly expectedClientModules: readonly string[];
    readonly expectedSkillIds: readonly string[];
    readonly eligible: boolean;
    readonly withdrawn: boolean;
}
/** Immutable registry payload stored only after complete boundary decoding. */
export interface CatalogSnapshot {
    readonly schemaVersion: 1;
    readonly etag: string;
    readonly generatedAt: string;
    readonly maxAgeSeconds: number;
    readonly sections: Readonly<Record<CatalogSection, readonly string[]>>;
    readonly entries: readonly CatalogSummary[];
    readonly details: readonly CatalogDetail[];
    readonly preflights: readonly CatalogVersionPreflight[];
}
/** Renderer intent for a bounded list read. */
export interface CatalogListQuery {
    readonly catalogKind: CatalogKind;
    readonly scope: CatalogScope;
    readonly query: string;
    readonly limit: number;
}
/** Renderer intent for one exact detail read. */
export interface CatalogDetailQuery {
    readonly pluginId: string;
    readonly version: string;
}
/** Section rows returned to the renderer after trusted filtering. */
export interface CatalogListResult {
    readonly etag: string;
    readonly generatedAt: string;
    readonly freshness: CatalogFreshness;
    readonly source: CatalogSource;
    readonly sections: Readonly<Record<CatalogSection, readonly CatalogSummary[]>>;
}
/** Exact detail returned with the freshness of its owning snapshot. */
export interface CatalogDetailResult {
    readonly etag: string;
    readonly generatedAt: string;
    readonly freshness: CatalogFreshness;
    readonly source: CatalogSource;
    readonly detail: CatalogDetail | null;
}
/** Actions for which one exact compatibility decision may grant authority. */
export declare const COMPATIBILITY_ACTIONS: readonly ["install", "update", "enable", "disable", "uninstall"];
/** One closed Plugin Center mutation intent. */
export type CompatibilityAction = typeof COMPATIBILITY_ACTIONS[number];
/** Desktop targets supported by the first curated marketplace release. */
export declare const SUPPORTED_PLUGIN_PLATFORMS: readonly ["darwin-arm64", "win32-x64"];
/** One supported operating-system and architecture tuple. */
export type SupportedPluginPlatform = typeof SUPPORTED_PLUGIN_PLATFORMS[number];
/** Stable product order for metadata and action denials. */
export declare const COMPATIBILITY_REASON_ORDER: readonly ["catalog-metadata-invalid", "catalog-unverified", "version-withdrawn", "version-ineligible", "protected-package", "protected-entry", "desktop-version-unsupported", "dsh-version-unsupported", "node-version-unsupported", "platform-unsupported", "artifact-missing", "artifact-evidence-incomplete", "plugin-identity-conflict", "package-identity-conflict", "entry-identity-conflict", "declared-conflict", "operation-busy", "action-not-supported"];
/** One stable metadata or action denial code. */
export type CompatibilityReasonCode = typeof COMPATIBILITY_REASON_ORDER[number];
/** Stable product order for non-executing archive verification failures. */
export declare const ARTIFACT_VERIFICATION_REASON_ORDER: readonly ["packed-size-exceeded", "packed-size-mismatch", "sha256-mismatch", "integrity-mismatch", "archive-format-invalid", "archive-path-traversal", "archive-absolute-path", "archive-unsafe-link", "archive-duplicate-entry", "archive-file-count-exceeded", "archive-unpacked-size-exceeded", "package-manifest-missing", "package-manifest-invalid", "package-name-mismatch", "package-version-mismatch", "bundle-patch-mismatch", "bundle-patch-missing", "lifecycle-script-denied", "expected-evidence-missing"];
/** One stable artifact-verification failure code. */
export type ArtifactVerificationReasonCode = typeof ARTIFACT_VERIFICATION_REASON_ORDER[number];
/** Trusted catalog evidence for one platform-specific immutable archive. */
export interface CatalogArtifactEvidence {
    readonly platform: SupportedPluginPlatform;
    readonly url: string;
    readonly sha256: string;
    readonly integrity: string;
    readonly packedBytes: number;
    readonly unpackedBytes: number;
    readonly fileCount: number;
}
/** Identities an exact reviewed version declares incompatible. */
export interface CatalogVersionConflicts {
    readonly pluginIds: readonly string[];
    readonly packageNames: readonly string[];
    readonly entryIds: readonly string[];
}
/** Trusted exact-version input owned by the decoded catalog, never the renderer. */
export interface CatalogVersionPreflight {
    readonly pluginId: string;
    readonly version: string;
    readonly packageName: string;
    readonly catalogEtag: string;
    readonly reviewed: boolean;
    readonly eligible: boolean;
    readonly withdrawn: boolean;
    readonly desktopRange: string;
    readonly dshRange: string;
    readonly nodeRange: string;
    readonly artifacts: readonly CatalogArtifactEvidence[];
    readonly bundlePatch: string;
    readonly capabilities: readonly CatalogCapability[];
    readonly riskLevel: CatalogRiskLevel;
    readonly riskSummary: string;
    readonly executionAuthority: 'broad-application-authority';
    readonly conflicts: CatalogVersionConflicts;
    readonly expectedEntries: readonly string[];
    readonly expectedClientModules: readonly string[];
    readonly expectedSkillIds: readonly string[];
    readonly supportedActions: readonly CompatibilityAction[];
    readonly restartRequired: boolean;
}
/** Renderer-owned intent for one exact preflight check. */
export interface CompatibilityRequest {
    readonly pluginId: string;
    readonly version: string;
    readonly action: CompatibilityAction;
}
/** One plugin identity observed from the selected Profile projection. */
export interface InstalledPluginIdentity {
    readonly pluginId: string | null;
    readonly version: string;
    readonly packageName: string;
    readonly enabled: boolean;
    readonly entryIds: readonly string[];
}
/** Origin of one installed Profile package or Bundle. */
export declare const INSTALLED_PLUGIN_SOURCES: readonly ["system", "catalog", "local"];
/** Origin of one installed Profile package or Bundle. */
export type InstalledPluginSource = typeof INSTALLED_PLUGIN_SOURCES[number];
/** Joined package/composition/runtime state shown in the installed manager. */
export declare const INSTALLED_PLUGIN_RUNTIME_STATUSES: readonly ["running", "inactive", "failed", "unknown"];
/** Joined package/composition/runtime state shown in the installed manager. */
export type InstalledPluginRuntimeStatus = typeof INSTALLED_PLUGIN_RUNTIME_STATUSES[number];
/** One catalog-owned newer exact version available to an installed plugin. */
export interface InstalledPluginUpdate {
    readonly version: string;
    readonly changelog: string;
    readonly riskLevel: CatalogRiskLevel;
    readonly riskSummary: string;
}
/** One relative path a plugin declares below its own Desktop storage root. */
export interface InstalledPluginOwnedData {
    readonly path: string;
    readonly label: string;
}
/** Runtime evidence attributable to one installed Bundle. */
export interface InstalledPluginRuntimeProjection {
    readonly entries: readonly PluginRuntimeEntryEvidence[];
    readonly clientModules: readonly string[];
    readonly skillIds: readonly string[];
}
/** Rebuildable joined view of one installed system, catalog, or local Bundle. */
export interface InstalledPluginProjection {
    readonly pluginId: string | null;
    readonly packageName: string;
    readonly version: string | null;
    readonly displayName: string;
    readonly icon: CatalogMedia | null;
    readonly brandColor: string | null;
    readonly catalogKind: CatalogKind | null;
    readonly source: InstalledPluginSource;
    readonly protected: boolean;
    readonly enabled: boolean;
    readonly bundleOrder: number | null;
    readonly disabledOrder: number | null;
    readonly runtimeStatus: InstalledPluginRuntimeStatus;
    readonly runtime: InstalledPluginRuntimeProjection;
    readonly expectedEntries: readonly string[];
    readonly expectedClientModules: readonly string[];
    readonly expectedSkillIds: readonly string[];
    readonly compatibility: CatalogCompatibilityStatus;
    readonly compatibilityReason: string | null;
    readonly update: InstalledPluginUpdate | null;
    readonly pendingAction: CompatibilityAction | null;
    readonly supportedActions: readonly PluginManagementAction[];
    readonly configurationEntryIds: readonly string[];
    readonly ownedData: readonly InstalledPluginOwnedData[];
}
/** Renderer-safe installed projection for the selected Desktop Profile. */
export interface InstalledPluginListResult {
    readonly profileName: 'web';
    readonly profileRevision: number;
    readonly catalogFreshness: CatalogFreshness;
    readonly items: readonly InstalledPluginProjection[];
}
/** Immutable environment and Profile facts that scope one compatibility decision. */
export interface CompatibilityFingerprint {
    readonly desktopVersion: string;
    readonly dshVersion: string;
    readonly nodeVersion: string;
    readonly platform: SupportedPluginPlatform;
    readonly catalogEtag: string;
    readonly catalogFreshness: CatalogFreshness;
    readonly profileRevision: number;
    readonly installedPlugins: readonly InstalledPluginIdentity[];
    readonly protectedPackageNames: readonly string[];
    readonly protectedEntryIds: readonly string[];
    readonly activeOperation: boolean;
}
/** Stable denial fact localized only at the presentation boundary. */
export interface CompatibilityReason {
    readonly code: CompatibilityReasonCode;
    readonly subject: string;
    readonly actual: string | null;
    readonly expected: string | null;
}
/** Exact-action preflight result reused by presentation and later transactions. */
export interface CompatibilityDecision {
    readonly pluginId: string;
    readonly version: string;
    readonly action: CompatibilityAction;
    readonly allowed: boolean;
    readonly fingerprint: CompatibilityFingerprint;
    readonly reasons: readonly CompatibilityReason[];
    readonly restartRequired: boolean;
    readonly capabilities: readonly CatalogCapability[];
    readonly riskLevel: CatalogRiskLevel;
    readonly riskSummary: string;
    readonly executionAuthority: 'broad-application-authority';
}
/** Stable archive-verification fact without archive content or local paths. */
export interface ArtifactVerificationReason {
    readonly code: ArtifactVerificationReasonCode;
    readonly subject: string;
}
/** Result of reading an archive without importing or executing plugin code. */
export interface ArtifactVerificationResult {
    readonly verified: boolean;
    readonly reasons: readonly ArtifactVerificationReason[];
    readonly observedPackageName: string | null;
    readonly observedVersion: string | null;
    readonly observedBundlePatch: string | null;
    readonly entryCount: number;
    readonly unpackedBytes: number;
}
/** Ordered mutation phases before commit or recovery ownership. */
export declare const PLUGIN_MUTATION_PHASES: readonly ["preflight", "downloading", "verifying-artifact", "snapshotting", "stopping-host", "installing", "validating-profile", "starting-host", "reloading", "health-checking", "verifying-runtime"];
/** One pre-commit mutation phase. */
export type PluginMutationPhase = typeof PLUGIN_MUTATION_PHASES[number];
/** Idempotent recovery phases replayed before ordinary Host startup. */
export declare const PLUGIN_RECOVERY_PHASES: readonly ["recovery-stopping-host", "recovery-restoring-profile", "recovery-restoring-packages", "recovery-starting-host", "recovery-verifying-runtime"];
/** One durable recovery phase. */
export type PluginRecoveryPhase = typeof PLUGIN_RECOVERY_PHASES[number];
/** Ordered renderer phases of one mutation and any required recovery. */
export declare const PLUGIN_OPERATION_PHASES: readonly ["preflight", "downloading", "verifying-artifact", "snapshotting", "stopping-host", "installing", "validating-profile", "starting-host", "reloading", "health-checking", "verifying-runtime", "recovery-stopping-host", "recovery-restoring-profile", "recovery-restoring-packages", "recovery-starting-host", "recovery-verifying-runtime", "committed", "failed", "rolled-back", "recovery-failed"];
/** One durable mutation or recovery phase. */
export type PluginOperationPhase = typeof PLUGIN_OPERATION_PHASES[number];
/** Closed failure vocabulary exposed to the renderer. */
export declare const PLUGIN_OPERATION_FAILURE_CODES: readonly ["preflight-denied", "download-failed", "artifact-invalid", "profile-busy", "snapshot-failed", "package-mutation-failed", "profile-invalid", "host-restart-failed", "runtime-evidence-missing", "internal"];
/** One terminal trusted-install failure. */
export type PluginOperationFailureCode = typeof PLUGIN_OPERATION_FAILURE_CODES[number];
/** Stable recovery failure vocabulary retained in logs and diagnostics. */
export declare const PLUGIN_RECOVERY_REASON_CODES: readonly ["unsupported-journal-version", "journal-invalid", "snapshot-missing", "snapshot-invalid", "snapshot-root-mismatch", "snapshot-path-invalid", "snapshot-hash-mismatch", "profile-lock-busy", "host-stop-failed", "profile-restore-failed", "package-restore-failed", "host-start-failed", "runtime-verification-failed", "diagnostic-export-failed"];
/** One stable reason why recovery cannot currently complete. */
export type PluginRecoveryReasonCode = typeof PLUGIN_RECOVERY_REASON_CODES[number];
/** Durable completion states accepted by the transaction journal. */
export declare const PLUGIN_OPERATION_TERMINAL_RESULTS: readonly ["committed", "rolled-back", "recovery-failed"];
/** One durable completion result. */
export type PluginOperationTerminalResult = typeof PLUGIN_OPERATION_TERMINAL_RESULTS[number];
/** Persistence point recorded around one transaction side effect. */
export declare const PLUGIN_OPERATION_BOUNDARIES: readonly ["before-side-effect", "after-side-effect", "observation"];
/** One durable side-effect boundary. */
export type PluginOperationBoundary = typeof PLUGIN_OPERATION_BOUNDARIES[number];
/** Renderer-owned intent for one reviewed exact-version installation. */
export interface PluginInstallRequest {
    readonly pluginId: string;
    readonly version: string;
    readonly idempotencyKey: string;
}
/** Installed-item actions accepted by the single Profile operation owner. */
export declare const PLUGIN_MANAGEMENT_ACTIONS: readonly ["update", "enable", "disable", "uninstall"];
/** Installed-item actions accepted by the single Profile operation owner. */
export type PluginManagementAction = typeof PLUGIN_MANAGEMENT_ACTIONS[number];
/** Renderer intent for one exact installed-item action. */
export interface PluginManagementRequest {
    readonly pluginId: string;
    readonly version: string;
    readonly action: PluginManagementAction;
    readonly idempotencyKey: string;
}
/** Internal normalized mutation request consumed by the shared transaction runner. */
export interface PluginMutationRequest {
    readonly pluginId: string;
    readonly version: string;
    readonly action: CompatibilityAction;
    readonly idempotencyKey: string;
}
/** Separately confirmed deletion after an uninstall has already committed. */
export interface PluginOwnedDataRemovalRequest {
    readonly operationId: string;
    readonly pluginId: string;
    readonly paths: readonly string[];
    readonly confirmation: 'remove-owned-data';
}
/** Bounded result of deleting only approved plugin-owned relative paths. */
export interface PluginOwnedDataRemovalResult {
    readonly operationId: string;
    readonly pluginId: string;
    readonly removedPaths: readonly string[];
}
/** Durable post-reload offer derived from one committed uninstall authority record. */
export interface PluginOwnedDataOffer {
    readonly operationId: string;
    readonly pluginId: string;
    readonly packageName: string;
    readonly version: string;
    readonly declarations: readonly InstalledPluginOwnedData[];
}
/** Explicit decision to retain all remaining owned data and close the uninstall offer. */
export interface PluginOwnedDataRetentionRequest {
    readonly operationId: string;
    readonly pluginId: string;
    readonly confirmation: 'retain-owned-data';
}
/** Renderer-safe acknowledgement that the retain decision is durable. */
export interface PluginOwnedDataRetentionResult {
    readonly operationId: string;
    readonly pluginId: string;
    readonly retained: true;
}
/** Immutable renderer-safe view of one trusted installation. */
export interface PluginOperationSnapshot {
    readonly schemaVersion: 1;
    readonly operationId: string;
    readonly idempotencyKey: string;
    readonly profileName: 'web';
    readonly action: CompatibilityAction;
    readonly pluginId: string;
    readonly version: string;
    readonly phase: PluginOperationPhase;
    readonly startedAt: string;
    readonly updatedAt: string;
    readonly hostGeneration: number | null;
    readonly failureCode: PluginOperationFailureCode | null;
}
/** Result of attempting to start or join the single Profile operation. */
export type PluginOperationStartResult = {
    readonly kind: 'started' | 'joined';
    readonly operation: PluginOperationSnapshot;
} | {
    readonly kind: 'busy';
    readonly activeOperationId: string;
};
/** Hash-bound identity of the only Profile F005 may restore. */
export interface PluginProfileIdentity {
    readonly profileName: 'web';
    readonly rootSha256: string;
}
/** One Loader entry retained as prior or target runtime evidence. */
export interface PluginRuntimeEntryEvidence {
    readonly entryId: string;
    readonly enabled: boolean;
    readonly fiberPhase: string | null;
}
/** Exact Host, client, and Skill inventory accepted at a commit point. */
export interface PluginRuntimeEvidence {
    readonly entries: readonly PluginRuntimeEntryEvidence[];
    readonly clientModules: readonly string[];
    readonly skillIds: readonly string[];
}
/** Immutable header that owns one mutation across execution and recovery. */
export interface PluginOperationHeader {
    readonly operationId: string;
    readonly idempotencyKey: string;
    readonly profileIdentity: PluginProfileIdentity;
    readonly action: CompatibilityAction;
    readonly pluginId: string;
    readonly version: string;
    readonly startedAt: string;
}
/** Private snapshot reference and the old runtime state it must reproduce. */
export interface PluginPriorSnapshotReference {
    readonly snapshotId: string;
    readonly snapshotSha256: string;
    readonly runtimeEvidence: PluginRuntimeEvidence;
}
/** Append-only evidence for one persisted phase boundary. */
export interface PluginOperationPhaseEntry {
    readonly sequence: number;
    readonly phase: PluginOperationPhase;
    readonly boundary: PluginOperationBoundary;
    readonly at: string;
    readonly operationFailureCode: PluginOperationFailureCode | null;
    readonly recoveryReasonCode: PluginRecoveryReasonCode | null;
}
/** Explicit acceptance marker written only after target runtime verification. */
export interface PluginOperationCommitMarker {
    readonly committedAt: string;
    readonly fingerprintSha256: string;
    readonly runtimeEvidence: PluginRuntimeEvidence;
}
/** Versioned durable mutation record; absence of a commit marker requires recovery. */
export interface PluginTransactionJournalRecord {
    readonly schemaVersion: 2;
    readonly header: PluginOperationHeader;
    readonly operation: PluginOperationSnapshot;
    readonly priorFingerprint: CompatibilityFingerprint | null;
    readonly priorSnapshot: PluginPriorSnapshotReference | null;
    readonly phaseHistory: readonly PluginOperationPhaseEntry[];
    readonly commitMarker: PluginOperationCommitMarker | null;
    readonly terminalResult: PluginOperationTerminalResult | null;
    readonly recoveryAttempt: number;
    readonly recoveryReasonCode: PluginRecoveryReasonCode | null;
}
/** Renderer-safe recovery state, separate from private snapshot contents. */
export interface PluginRecoverySnapshot {
    readonly schemaVersion: 1;
    readonly operationId: string;
    readonly phase: 'recovering' | 'rolled-back' | 'recovery-failed';
    readonly recoveryPhase: PluginRecoveryPhase | null;
    readonly operationFailureCode: PluginOperationFailureCode;
    readonly recoveryReasonCode: PluginRecoveryReasonCode | null;
    readonly attempt: number;
    readonly updatedAt: string;
    readonly canRetry: boolean;
    readonly canExportDiagnostics: boolean;
}
/** Idempotent renderer intent to retry the same owned recovery. */
export interface PluginRecoveryRetryRequest {
    readonly operationId: string;
}
/** Idempotent renderer intent to export bounded diagnostics for one operation. */
export interface PluginDiagnosticExportRequest {
    readonly operationId: string;
}
/** Renderer result for a Desktop-owned diagnostic save operation. */
export interface PluginDiagnosticExportResult {
    readonly operationId: string;
    readonly status: 'saved' | 'cancelled';
    readonly filename: string | null;
    readonly sha256: string | null;
    readonly bytes: number | null;
}
/** Whitelisted diagnostic document; unreadable journals expose no guessed operation metadata. */
export type PluginRecoveryDiagnostic = {
    readonly schemaVersion: 1;
    readonly journalStatus: 'readable';
    readonly operationId: string;
    readonly profileName: 'web';
    readonly action: CompatibilityAction;
    readonly pluginId: string;
    readonly version: string;
    readonly phaseHistory: readonly PluginOperationPhaseEntry[];
    readonly terminalResult: PluginOperationTerminalResult | null;
    readonly recoveryAttempt: number;
    readonly recoveryReasonCode: PluginRecoveryReasonCode | null;
    readonly exportedAt: string;
} | {
    readonly schemaVersion: 1;
    readonly journalStatus: 'unreadable';
    readonly operationId: string;
    readonly profileName: null;
    readonly action: null;
    readonly pluginId: null;
    readonly version: null;
    readonly phaseHistory: readonly [];
    readonly terminalResult: 'recovery-failed';
    readonly recoveryAttempt: 1;
    readonly recoveryReasonCode: 'unsupported-journal-version' | 'journal-invalid';
    readonly exportedAt: string;
};
/** Review states owned by the production Registry for one exact immutable version. */
export declare const REGISTRY_MODERATION_STATES: readonly ["pending-review", "approved", "rejected", "withdrawn"];
/** Review state owned by the production Registry. */
export type RegistryModerationState = typeof REGISTRY_MODERATION_STATES[number];
/** Attributable decisions accepted by the internal Registry API. */
export declare const REGISTRY_MODERATION_ACTIONS: readonly ["approve", "reject", "withdraw"];
/** One internal decision that may change exact-version eligibility. */
export type RegistryModerationAction = typeof REGISTRY_MODERATION_ACTIONS[number];
/** Closed result values accepted by privacy-limited installation telemetry. */
export declare const REGISTRY_INSTALL_RESULTS: readonly ["success", "rollback", "install-failure", "activation-failure"];
/** One coarse local operation result; it never grants installation authority. */
export type RegistryInstallResult = typeof REGISTRY_INSTALL_RESULTS[number];
/** Closed reasons retained with privacy-limited installation telemetry. */
export declare const REGISTRY_INSTALL_REASONS: readonly ["none", "compatibility-denied", "artifact-invalid", "package-mutation-failed", "runtime-evidence-missing", "recovery-failed", "operator-test", "anomaly"];
/** One coarse operation reason accepted by the Registry. */
export type RegistryInstallReason = typeof REGISTRY_INSTALL_REASONS[number];
/** Closed duration buckets retained without precise local timing. */
export declare const REGISTRY_DURATION_BUCKETS: readonly ["lt-5s", "5s-30s", "30s-2m", "2m-10m", "gte-10m"];
/** One coarse operation duration bucket. */
export type RegistryDurationBucket = typeof REGISTRY_DURATION_BUCKETS[number];
/** Stable exclusion facts stored with one auditable popularity row. */
export declare const REGISTRY_RANK_EXCLUSION_REASONS: readonly ["ineligible", "withdrawn", "operator-test-only", "anomaly-only"];
/** One reason an exact version cannot contribute a positive popularity input. */
export type RegistryRankExclusionReason = typeof REGISTRY_RANK_EXCLUSION_REASONS[number];
/** Trusted object-store identity for one platform archive supplied to internal import. */
export interface RegistryArtifactObject {
    readonly platform: SupportedPluginPlatform;
    readonly objectKey: string;
}
/** Authenticated intent to import one exact version into pending review. */
export interface RegistryVersionImportRequest {
    readonly schemaVersion: 1;
    readonly requestId: string;
    readonly operatorId: string;
    readonly reason: string;
    readonly evidenceRef: string;
    readonly occurredAt: string;
    readonly publisher: {
        readonly publisherId: string;
        readonly displayName: string;
    };
    readonly detail: CatalogDetail;
    readonly preflight: CatalogVersionPreflight;
    readonly categoryIds: readonly string[];
    readonly artifactObjects: readonly RegistryArtifactObject[];
}
/** Authenticated eligibility decision for one imported exact version. */
export interface RegistryModerationRequest {
    readonly requestId: string;
    readonly operatorId: string;
    readonly pluginId: string;
    readonly version: string;
    readonly action: RegistryModerationAction;
    readonly reason: string;
    readonly evidenceRef: string;
    readonly occurredAt: string;
}
/** Authenticated editorial placement with a deterministic position and time window. */
export interface RegistryFeaturedPlacementRequest {
    readonly requestId: string;
    readonly operatorId: string;
    readonly pluginId: string;
    readonly version: string;
    readonly section: 'featured';
    readonly position: number;
    readonly startsAt: string;
    readonly endsAt: string | null;
    readonly reason: string;
}
/** Authenticated or scheduled intent to generate one complete popularity snapshot. */
export interface RegistryRankingRequest {
    readonly requestId: string;
    readonly operatorId: string;
    readonly reason: string;
    readonly occurredAt: string;
}
/** Strict replay-safe installation event accepted by the public Registry API. */
export interface RegistryInstallEvent {
    readonly schemaVersion: 1;
    readonly eventId: string;
    readonly pluginId: string;
    readonly version: string;
    readonly installationId: string;
    readonly platform: SupportedPluginPlatform;
    readonly desktopVersion: string;
    readonly dshVersion: string;
    readonly result: RegistryInstallResult;
    readonly reason: RegistryInstallReason;
    readonly durationBucket: RegistryDurationBucket;
    readonly occurredAt: string;
    readonly operatorTest: boolean;
}
/** Frozen inputs retained for the first production popularity formula. */
export interface RegistryRankInputs {
    readonly uniqueSuccess7d: number;
    readonly uniqueSuccess24h: number;
    readonly previousSuccess7d: number;
    readonly attempt7d: number;
    readonly rollbackOrActivationFailure7d: number;
    readonly ageInDays: number;
}
/** Immutable auditable score row stored with one popularity generation. */
export interface RegistryRankAudit {
    readonly pluginId: string;
    readonly version: string;
    readonly formulaVersion: 'popular-v1';
    readonly generatedAt: string;
    readonly inputs: RegistryRankInputs;
    readonly growth: number;
    readonly failureRate: number;
    readonly freshness: number;
    readonly score: number;
    readonly exclusionReasons: readonly RegistryRankExclusionReason[];
    readonly position: number | null;
}
/** Public exact-version response without any local Desktop state. */
export interface RegistryVersionResult {
    readonly moderationState: RegistryModerationState;
    readonly installable: boolean;
    readonly detail: CatalogDetail;
    readonly preflight: CatalogVersionPreflight;
}
/** Secret-free deployment health response. */
export interface RegistryHealthResult {
    readonly status: 'ok' | 'degraded';
    readonly database: 'ready' | 'unavailable';
    readonly currentCatalog: boolean;
}
/** Stable successful outcomes returned by authenticated Registry operations. */
export declare const REGISTRY_OPERATION_CODES: readonly ["version-imported", "version-approved", "version-rejected", "version-withdrawn", "featured-placement-set", "ranking-generated"];
/** One stable authenticated-operation outcome. */
export type RegistryOperationCode = typeof REGISTRY_OPERATION_CODES[number];
/** Bounded successful result returned by an internal Registry operation. */
export interface RegistryOperationResult {
    readonly requestId: string;
    readonly code: RegistryOperationCode;
    readonly pluginId: string | null;
    readonly version: string | null;
}
/** Stable failure codes returned without raw dependency details. */
export declare const REGISTRY_ERROR_CODES: readonly ["invalid-request", "unauthorized", "not-found", "immutable-conflict", "artifact-invalid", "moderation-conflict", "placement-conflict", "dependency-unavailable", "internal"];
/** One stable Registry failure code. */
export type RegistryErrorCode = typeof REGISTRY_ERROR_CODES[number];
/** Bounded failure response whose message contains no secret or local path. */
export interface RegistryErrorResult {
    readonly error: {
        readonly code: RegistryErrorCode;
        readonly message: string;
        readonly requestId: string;
    };
}
/** Error raised when untrusted catalog JSON violates the closed contract. */
export declare class CatalogContractError extends Error {
    readonly name = "CatalogContractError";
}
/**
 * Decode and fully validate one registry snapshot before it can replace cache.
 * @param value - Untrusted registry payload.
 * @returns The closed catalog snapshot.
 */
export declare function decodeCatalogSnapshot(value: unknown): CatalogSnapshot;
/**
 * Decode one untrusted media reference before using it in a renderer-safe projection.
 * @param value - Candidate media metadata from a catalog publisher.
 * @returns A bounded HTTPS media reference from an approved origin.
 */
export declare function decodeCatalogMedia(value: unknown): CatalogMedia;
/**
 * Decode one untrusted catalog summary before it enters a renderer-safe cache.
 * @param value - Candidate catalog-card metadata.
 * @returns The closed catalog summary.
 */
export declare function decodeCatalogSummary(value: unknown): CatalogSummary;
/**
 * Decode renderer list intent; endpoints and package sources are never accepted.
 * @param value - Untrusted renderer value.
 * @returns The bounded list query.
 */
export declare function decodeCatalogListQuery(value: unknown): CatalogListQuery;
/**
 * Decode renderer detail intent; only one exact reviewed identity crosses IPC.
 * @param value - Untrusted renderer value.
 * @returns The exact-version detail query.
 */
export declare function decodeCatalogDetailQuery(value: unknown): CatalogDetailQuery;
/**
 * Decode renderer compatibility intent without accepting package or evidence authority.
 * @param value - Untrusted renderer value.
 * @returns One exact action request.
 */
export declare function decodeCompatibilityRequest(value: unknown): CompatibilityRequest;
/**
 * Decode trusted catalog-owned input for one exact compatibility evaluation.
 * @param value - Registry value after transport decoding.
 * @returns The complete exact-version preflight input.
 */
export declare function decodeCatalogVersionPreflight(value: unknown): CatalogVersionPreflight;
/**
 * Decode Desktop-owned environment and selected-Profile facts.
 * @param value - Trusted local facts at one profile revision.
 * @returns The immutable compatibility fingerprint.
 */
export declare function decodeCompatibilityFingerprint(value: unknown): CompatibilityFingerprint;
/**
 * Decode a persisted or bridged compatibility decision and enforce reason ordering.
 * @param value - Decision-shaped value from the Desktop owning boundary.
 * @returns A deterministic exact-action decision.
 */
export declare function decodeCompatibilityDecision(value: unknown): CompatibilityDecision;
/**
 * Decode an artifact-verification result and enforce stable failure ordering.
 * @param value - Verifier result-shaped value.
 * @returns A bounded result without archive bytes or local paths.
 */
export declare function decodeArtifactVerificationResult(value: unknown): ArtifactVerificationResult;
/**
 * Decode renderer installation intent without accepting mutation authority.
 * @param value - Untrusted renderer value.
 * @returns One exact reviewed target and idempotency key.
 */
export declare function decodePluginInstallRequest(value: unknown): PluginInstallRequest;
/**
 * Decode one installed-item mutation without accepting package or path authority.
 * @param value - Untrusted renderer value.
 * @returns One exact installed-item action and idempotency key.
 */
export declare function decodePluginManagementRequest(value: unknown): PluginManagementRequest;
/**
 * Decode the authoritative installed projection before exposing it across IPC.
 * @param value - Untrusted installed projection value.
 * @returns A bounded installed-plugin list for the selected Profile.
 */
export declare function decodeInstalledPluginListResult(value: unknown): InstalledPluginListResult;
/**
 * Decode a separately confirmed, post-uninstall owned-data removal request.
 * @param value - Untrusted renderer value.
 * @returns The bounded paths tied to one committed uninstall operation.
 */
export declare function decodePluginOwnedDataRemovalRequest(value: unknown): PluginOwnedDataRemovalRequest;
/**
 * Decode a bounded result without leaking Desktop storage paths.
 * @param value - Untrusted owned-data removal result.
 * @returns The operation identity and relative paths removed.
 */
export declare function decodePluginOwnedDataRemovalResult(value: unknown): PluginOwnedDataRemovalResult;
/** Decode one current committed-uninstall owned-data offer across the Desktop bridge. */
export declare function decodePluginOwnedDataOffer(value: unknown): PluginOwnedDataOffer;
/** Decode the explicit retain decision that closes one committed uninstall offer. */
export declare function decodePluginOwnedDataRetentionRequest(value: unknown): PluginOwnedDataRetentionRequest;
/** Decode the bounded acknowledgement returned after retaining owned data. */
export declare function decodePluginOwnedDataRetentionResult(value: unknown): PluginOwnedDataRetentionResult;
/**
 * Decode a journal or bridge snapshot for one trusted installation.
 * @param value - Snapshot-shaped value from the Desktop owning boundary.
 * @returns A closed immutable operation projection.
 */
export declare function decodePluginOperationSnapshot(value: unknown): PluginOperationSnapshot;
/**
 * Decode one start/join/busy response before it reaches presentation state.
 * @param value - Result-shaped value from the Desktop operation controller.
 * @returns The closed operation-start result.
 */
export declare function decodePluginOperationStartResult(value: unknown): PluginOperationStartResult;
/**
 * Decode exact runtime inventory retained at a transaction commit point.
 * @param value - Runtime-evidence-shaped value from the trusted Host boundary.
 * @returns Bounded Loader, client-module, and Skill evidence.
 */
export declare function decodePluginRuntimeEvidence(value: unknown): PluginRuntimeEvidence;
/**
 * Decode and validate one version-2 durable transaction journal record.
 * @param value - Journal-shaped value read from local durable storage.
 * @returns A record whose header, phase history, commit marker, and terminal result agree.
 */
export declare function decodePluginTransactionJournalRecord(value: unknown): PluginTransactionJournalRecord;
/**
 * Decode the renderer-safe state of an owned recovery.
 * @param value - Recovery projection from the Desktop bridge.
 * @returns A bounded recovery state with stable retry and export capabilities.
 */
export declare function decodePluginRecoverySnapshot(value: unknown): PluginRecoverySnapshot;
/**
 * Decode an idempotent recovery retry intent.
 * @param value - Untrusted renderer value.
 * @returns The operation selected for a recovery retry.
 */
export declare function decodePluginRecoveryRetryRequest(value: unknown): PluginRecoveryRetryRequest;
/**
 * Decode a diagnostic export intent without accepting a renderer path.
 * @param value - Untrusted renderer value.
 * @returns The operation selected for a Desktop-owned diagnostic export.
 */
export declare function decodePluginDiagnosticExportRequest(value: unknown): PluginDiagnosticExportRequest;
/**
 * Decode the bounded result of a Desktop-owned diagnostic save.
 * @param value - Export-result-shaped value.
 * @returns Saved metadata or an explicit user cancellation.
 */
export declare function decodePluginDiagnosticExportResult(value: unknown): PluginDiagnosticExportResult;
/**
 * Decode one whitelisted diagnostic document before writing or displaying it.
 * @param value - Diagnostic-shaped value assembled by Desktop.
 * @returns Bounded transaction facts without paths, file contents, or environment values.
 */
export declare function decodePluginRecoveryDiagnostic(value: unknown): PluginRecoveryDiagnostic;
/**
 * Decode an authenticated pending-review import without accepting unknown package authority.
 * @param value - Untrusted internal API payload.
 * @returns One exact immutable version and its trusted object identities.
 */
export declare function decodeRegistryVersionImportRequest(value: unknown): RegistryVersionImportRequest;
/**
 * Decode one attributable exact-version eligibility decision.
 * @param value - Untrusted internal API payload.
 * @returns The closed moderation action and evidence identity.
 */
export declare function decodeRegistryModerationRequest(value: unknown): RegistryModerationRequest;
/**
 * Decode one attributable featured placement and deterministic active window.
 * @param value - Untrusted internal API payload.
 * @returns The exact version, position, and editorial window.
 */
export declare function decodeRegistryFeaturedPlacementRequest(value: unknown): RegistryFeaturedPlacementRequest;
/**
 * Decode one attributable popularity-generation intent.
 * @param value - Untrusted internal API or scheduled-worker payload.
 * @returns Stable trigger identity, actor, reason, and time.
 */
export declare function decodeRegistryRankingRequest(value: unknown): RegistryRankingRequest;
/**
 * Decode strict replay-safe installation telemetry and reject every unknown field.
 * @param value - Untrusted public API payload.
 * @returns Privacy-limited coarse operation facts.
 */
export declare function decodeRegistryInstallEvent(value: unknown): RegistryInstallEvent;
/**
 * Decode one immutable popularity audit row with bounded formula values.
 * @param value - Rank row read from durable storage or an internal result.
 * @returns Frozen formula inputs, score, exclusions, and optional position.
 */
export declare function decodeRegistryRankAudit(value: unknown): RegistryRankAudit;
/**
 * Decode one exact public Registry result and enforce eligibility semantics.
 * @param value - Public exact-version response.
 * @returns Immutable reviewed metadata and its current moderation state.
 */
export declare function decodeRegistryVersionResult(value: unknown): RegistryVersionResult;
/**
 * Decode one bounded internal Registry success response.
 * @param value - Internal operation result.
 * @returns A stable operation code and optional exact-version identity.
 */
export declare function decodeRegistryOperationResult(value: unknown): RegistryOperationResult;
/**
 * Decode one secret-free Registry failure response.
 * @param value - Public or internal failure response.
 * @returns A stable error code, bounded product message, and request id.
 */
export declare function decodeRegistryErrorResult(value: unknown): RegistryErrorResult;
/**
 * Decode the secret-free Registry health response.
 * @param value - Health response payload.
 * @returns Deployment health without dependency addresses or credentials.
 */
export declare function decodeRegistryHealthResult(value: unknown): RegistryHealthResult;
//# sourceMappingURL=index.d.ts.map