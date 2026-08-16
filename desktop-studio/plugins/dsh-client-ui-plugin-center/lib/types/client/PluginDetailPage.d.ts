import type { CatalogDetailResult, CatalogSummary, CompatibilityDecision, PluginOperationSnapshot } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { PluginCenterTabProps } from './PluginCenterTab.tsx';
/** Async exact-version detail state. */
export type DetailState = {
    readonly status: 'loading';
} | {
    readonly status: 'error';
} | {
    readonly status: 'ready';
    readonly result: CatalogDetailResult;
};
/** Async exact-action preflight state. Local entries deliberately have no state. */
export type CompatibilityState = {
    readonly status: 'loading';
} | {
    readonly status: 'error';
} | {
    readonly status: 'ready';
    readonly result: CompatibilityDecision;
};
/** Exact-version detail page with F003 trusted-install confirmation and status. */
export declare function PluginDetailPage({ entry, state, compatibility, mutationsEnabled, operation, operationRequestFailed, onInstall, t, }: {
    readonly entry: CatalogSummary;
    readonly state: DetailState;
    readonly compatibility: CompatibilityState | null;
    readonly mutationsEnabled: boolean;
    readonly operation: PluginOperationSnapshot | null;
    readonly operationRequestFailed: boolean;
    readonly onInstall: () => void;
    readonly t: PluginCenterTabProps['t'];
}): import("react").JSX.Element;
//# sourceMappingURL=PluginDetailPage.d.ts.map