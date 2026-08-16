import type { CatalogSummary, CompatibilityDecision, InstalledPluginProjection, InstalledPluginOwnedData, PluginManagementAction, PluginOperationSnapshot } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { PluginCenterTabProps } from './PluginCenterTab.tsx';
type Translator = PluginCenterTabProps['t'];
/**
 * Ask for one explicit acknowledgement before sending a trusted install intent.
 * @param props - Exact catalog version, compatibility decision, and controlled actions.
 * @returns The controlled confirmation modal.
 */
export declare function PluginInstallConfirmation({ open, entry, decision, acknowledged, onAcknowledgedChange, onCancel, onConfirm, t, }: {
    readonly open: boolean;
    readonly entry: CatalogSummary;
    readonly decision: CompatibilityDecision;
    readonly acknowledged: boolean;
    readonly onAcknowledgedChange: (value: boolean) => void;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
    readonly t: Translator;
}): import("react").JSX.Element;
/** Confirm one installed-item mutation without folding owned-data deletion into uninstall. */
export declare function PluginManagementConfirmation({ open, item, action, acknowledged, onAcknowledgedChange, onCancel, onConfirm, t, }: {
    readonly open: boolean;
    readonly item: InstalledPluginProjection;
    readonly action: PluginManagementAction;
    readonly acknowledged: boolean;
    readonly onAcknowledgedChange: (value: boolean) => void;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
    readonly t: Translator;
}): import("react").JSX.Element;
/**
 * Keep uninstall separate from the optional permanent deletion of declared plugin-owned data.
 * @param props - Controlled declarations, selection, acknowledgement, progress, and actions.
 * @returns The post-uninstall deletion modal.
 */
export declare function PluginOwnedDataRemovalConfirmation({ open, displayName, declarations, selectedPaths, acknowledged, status, retaining, removedCount, onSelectionChange, onAcknowledgedChange, onRetain, onRemove, onDone, t, }: {
    readonly open: boolean;
    readonly displayName: string;
    readonly declarations: readonly InstalledPluginOwnedData[];
    readonly selectedPaths: readonly string[];
    readonly acknowledged: boolean;
    readonly status: 'idle' | 'removing' | 'removed' | 'failed';
    readonly retaining: boolean;
    readonly removedCount: number;
    readonly onSelectionChange: (paths: readonly string[]) => void;
    readonly onAcknowledgedChange: (value: boolean) => void;
    readonly onRetain: () => void;
    readonly onRemove: () => void;
    readonly onDone: () => void;
    readonly t: Translator;
}): import("react").JSX.Element;
/**
 * Present one restored Desktop operation as a compact, modal progress journey.
 * @param props - Controlled operation visibility, snapshot, close action, and copy.
 * @returns The active or terminal operation modal.
 */
export declare function PluginOperationDialog({ open, operation, installedItem, onClose, t, }: {
    readonly open: boolean;
    readonly operation: PluginOperationSnapshot | null;
    readonly installedItem: InstalledPluginProjection | null;
    readonly onClose: () => void;
    readonly t: Translator;
}): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=PluginInstallDialogs.d.ts.map