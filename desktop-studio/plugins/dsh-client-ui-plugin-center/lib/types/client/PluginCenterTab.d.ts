import { type ReactNode } from 'react';
import type { CatalogDetailQuery, CatalogDetailResult, CatalogListQuery, CatalogListResult, CatalogSection, CatalogSummary, CompatibilityDecision, CompatibilityRequest, InstalledPluginListResult, InstalledPluginProjection, PluginInstallRequest, PluginManagementAction, PluginManagementRequest, PluginDiagnosticExportRequest, PluginDiagnosticExportResult, PluginOperationSnapshot, PluginOperationStartResult, PluginOwnedDataOffer, PluginOwnedDataRemovalRequest, PluginOwnedDataRemovalResult, PluginOwnedDataRetentionRequest, PluginOwnedDataRetentionResult, PluginRecoveryRetryRequest, PluginRecoverySnapshot } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Registration-side fixed Desktop read face. */
export interface PluginCenterTabInjected {
    readonly available: boolean;
    readonly development: boolean;
    readonly list: (query: CatalogListQuery) => Promise<CatalogListResult>;
    readonly refresh: (query: CatalogListQuery) => Promise<CatalogListResult>;
    readonly detail: (query: CatalogDetailQuery) => Promise<CatalogDetailResult>;
    readonly checkCompatibility: (request: CompatibilityRequest) => Promise<CompatibilityDecision>;
    readonly listInstalled: () => Promise<InstalledPluginListResult>;
    readonly openPluginSettings: (tabId: 'configurable' | 'all') => void;
    readonly mutationsEnabled: boolean;
    readonly install: (request: PluginInstallRequest) => Promise<PluginOperationStartResult>;
    readonly manage: (request: PluginManagementRequest) => Promise<PluginOperationStartResult>;
    readonly getOwnedDataOffer?: () => Promise<PluginOwnedDataOffer | null>;
    readonly removeOwnedData: (request: PluginOwnedDataRemovalRequest) => Promise<PluginOwnedDataRemovalResult>;
    readonly retainOwnedData?: (request: PluginOwnedDataRetentionRequest) => Promise<PluginOwnedDataRetentionResult>;
    readonly getOperation: () => Promise<PluginOperationSnapshot | null>;
    readonly onOperationState: (listener: (operation: PluginOperationSnapshot) => void) => () => void;
    readonly getRecovery?: () => Promise<PluginRecoverySnapshot | null>;
    readonly retryRecovery?: (request: PluginRecoveryRetryRequest) => Promise<PluginRecoverySnapshot | null>;
    readonly exportRecoveryDiagnostics?: (request: PluginDiagnosticExportRequest) => Promise<PluginDiagnosticExportResult>;
    readonly onRecoveryState?: (listener: (snapshot: PluginRecoverySnapshot) => void) => () => void;
}
/** Full props assembled by the independent main-page renderer. */
export type PluginCenterTabProps = PropsRuntime<'main.page'> & PropsLocale<'pluginCenter'> & InjectFace<PluginCenterTabInjected>;
/** One server-owned discovery section. */
export declare function CatalogSectionView({ section, entries, installedItems, mutationsEnabled, operation, checkingEntry, onOpen, onInstall, onManage, t, }: {
    readonly section: CatalogSection;
    readonly entries: readonly CatalogSummary[];
    readonly installedItems: ReadonlyMap<string, InstalledPluginProjection>;
    readonly mutationsEnabled: boolean;
    readonly operation: PluginOperationSnapshot | null;
    readonly checkingEntry: string | null;
    readonly onOpen: (entry: CatalogSummary, element: HTMLButtonElement) => void;
    readonly onInstall: (entry: CatalogSummary, element: HTMLButtonElement) => void;
    readonly onManage: (item: InstalledPluginProjection, action: PluginManagementAction) => void;
    readonly t: PluginCenterTabProps['t'];
}): ReactNode;
/** Searchable Desktop Plugin Center with handed-off lifecycle actions. */
export declare function PluginCenterTab({ available, development, list, refresh, detail, checkCompatibility, listInstalled, openPluginSettings, mutationsEnabled, install, manage, getOwnedDataOffer, removeOwnedData, retainOwnedData: persistOwnedDataRetention, getOperation, onOperationState, getRecovery, retryRecovery, exportRecoveryDiagnostics, onRecoveryState, t, }: PluginCenterTabProps): ReactNode;
//# sourceMappingURL=PluginCenterTab.d.ts.map