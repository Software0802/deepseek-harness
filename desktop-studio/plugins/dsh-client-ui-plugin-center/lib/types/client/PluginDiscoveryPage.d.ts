import { type ReactNode } from 'react';
import type { CatalogDetailResult, CatalogListQuery, CatalogListResult, CompatibilityDecision, InstalledPluginListResult, PluginOperationSnapshot, PluginOperationStartResult } from '@deepseek-ai/dsh-plugin-center-contracts';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Registration-side read and trusted-install face for Plugin Discovery. */
export interface PluginDiscoveryInjected {
    readonly available: boolean;
    readonly development: boolean;
    readonly list: (query: CatalogListQuery) => Promise<CatalogListResult>;
    readonly refresh: (query: CatalogListQuery) => Promise<CatalogListResult>;
    readonly detail: (query: {
        readonly pluginId: string;
        readonly version: string;
    }) => Promise<CatalogDetailResult>;
    readonly checkCompatibility: (request: {
        readonly pluginId: string;
        readonly version: string;
        readonly action: 'install';
    }) => Promise<CompatibilityDecision>;
    readonly listInstalled: () => Promise<InstalledPluginListResult>;
    readonly mutationsEnabled: boolean;
    readonly install: (request: {
        readonly pluginId: string;
        readonly version: string;
        readonly idempotencyKey: string;
    }) => Promise<PluginOperationStartResult>;
    readonly getOperation: () => Promise<PluginOperationSnapshot | null>;
    readonly onOperationState: (listener: (operation: PluginOperationSnapshot) => void) => () => void;
    readonly openPluginCenter: () => void;
    readonly findWithAgent: (requirement: string) => Promise<AgentPluginFinderResult>;
}
/** Result of handing one discovery requirement to the current Agent session. */
export type AgentPluginFinderResult = 'sent' | 'needs-model' | 'session-starting';
/** Full props assembled by the independent Plugin Discovery page renderer. */
export type PluginDiscoveryPageProps = PropsRuntime<'main.page'> & PropsLocale<'pluginCenter'> & InjectFace<PluginDiscoveryInjected>;
/** Searchable editorial discovery page over the existing trusted Desktop catalog. */
export declare function PluginDiscoveryPage({ available, development, list, refresh, detail, checkCompatibility, listInstalled, mutationsEnabled, install, getOperation, onOperationState, openPluginCenter, findWithAgent, t, }: PluginDiscoveryPageProps): ReactNode;
//# sourceMappingURL=PluginDiscoveryPage.d.ts.map