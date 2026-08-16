/** Resolve immutable release and selected-Profile facts for plugin preflight. */
import { decodeCompatibilityFingerprint, } from '@deepseek-ai/dsh-plugin-center-contracts';
/**
 * Map runtime OS and architecture facts to the marketplace's supported tuple.
 * @param os - Node runtime platform name.
 * @param architecture - Node runtime architecture name.
 * @returns The supported marketplace platform tuple.
 */
export function resolveSupportedPluginPlatform(os, architecture) {
    if (os === 'darwin' && architecture === 'arm64')
        return 'darwin-arm64';
    if (os === 'win32' && architecture === 'x64')
        return 'win32-x64';
    throw new Error(`plugin mutation is unsupported on ${os}-${architecture}`);
}
/**
 * Build and validate one immutable compatibility fingerprint from Desktop-owned facts.
 * @param input - Current release, Profile, protection, catalog, and operation facts.
 * @returns A closed fingerprint suitable for one exact compatibility decision.
 */
export function resolveCompatibilityFingerprint(input) {
    return decodeCompatibilityFingerprint({
        desktopVersion: input.desktopVersion,
        dshVersion: input.dshVersion,
        nodeVersion: input.nodeVersion,
        platform: resolveSupportedPluginPlatform(input.os, input.architecture),
        catalogEtag: input.catalogEtag,
        catalogFreshness: input.catalogFreshness,
        profileRevision: input.profileRevision,
        installedPlugins: input.installedPlugins,
        protectedPackageNames: input.systemComponents.packageNames,
        protectedEntryIds: input.systemComponents.entryIds,
        activeOperation: input.activeOperation,
    });
}
//# sourceMappingURL=environment.js.map