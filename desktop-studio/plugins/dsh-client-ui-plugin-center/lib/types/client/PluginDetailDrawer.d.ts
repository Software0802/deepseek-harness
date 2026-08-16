import type { CatalogDetailResult } from '@deepseek-ai/dsh-plugin-center-contracts';
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
/** Exact-version detail dialog; all actions remain presentation-only in F001. */
export declare function PluginDetailDrawer({ state, onClose, t }: {
    readonly state: DetailState | null;
    readonly onClose: () => void;
    readonly t: PluginCenterTabProps['t'];
}): import("react").JSX.Element;
//# sourceMappingURL=PluginDetailDrawer.d.ts.map