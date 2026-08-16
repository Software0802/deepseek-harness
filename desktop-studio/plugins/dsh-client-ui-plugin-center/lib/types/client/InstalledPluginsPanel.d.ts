import type { ReactNode } from 'react';
import type { InstalledPluginListResult, InstalledPluginProjection, PluginManagementAction } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { PluginCenterTabProps } from './PluginCenterTab.tsx';
export type InstalledViewState = {
    readonly status: 'loading';
} | {
    readonly status: 'error';
} | {
    readonly status: 'ready';
    readonly result: InstalledPluginListResult;
};
/** Compact installed strip whose rows come only from the Desktop projection. */
export declare function InstalledIcons({ state, onOpen, t }: {
    readonly state: InstalledViewState;
    readonly onOpen: () => void;
    readonly t: PluginCenterTabProps['t'];
}): ReactNode;
/** Expanded management rows with retained links into the existing Settings owners. */
export declare function InstalledPluginsPanel({ state, mutationsEnabled, onRetry, onSettings, onAction, t }: {
    readonly state: InstalledViewState;
    readonly mutationsEnabled: boolean;
    readonly onRetry: () => void;
    readonly onSettings: (tabId: 'configurable' | 'all') => void;
    readonly onAction: (item: InstalledPluginProjection, action: PluginManagementAction) => void;
    readonly t: PluginCenterTabProps['t'];
}): ReactNode;
//# sourceMappingURL=InstalledPluginsPanel.d.ts.map