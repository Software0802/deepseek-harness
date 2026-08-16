/** Localized compatibility copy shared by catalog detail and installed management views. */
import type { CompatibilityReasonCode } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { PluginCenterTabProps } from './PluginCenterTab.tsx';
import type { PluginCenterLocaleKey } from './locales.ts';
/**
 * Resolve a structured compatibility reason to its localized copy key.
 * @param code - Stable reason code returned by the compatibility evaluator.
 * @returns Locale key for the user-facing reason label.
 */
export declare function compatibilityReasonKey(code: CompatibilityReasonCode): PluginCenterLocaleKey;
/**
 * Replace Desktop projection reason codes with concise product copy while retaining unknown prose.
 * @param reason - Semicolon-delimited Desktop compatibility summary.
 * @param t - Plugin Center locale resolver.
 * @returns Localized summary for the installed row, or null when no reason is present.
 */
export declare function installedCompatibilityReason(reason: string | null, t: PluginCenterTabProps['t']): string | null;
//# sourceMappingURL=compatibility-copy.d.ts.map