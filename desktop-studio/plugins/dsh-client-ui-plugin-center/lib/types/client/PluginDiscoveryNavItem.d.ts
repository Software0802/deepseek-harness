import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Registration-side navigation action for Plugin Discovery. */
export interface PluginDiscoveryNavInjected {
    readonly pageId: string;
    readonly open: () => void;
}
/** Full props of the sidebar Plugin Discovery entry. */
export type PluginDiscoveryNavProps = PropsRuntime<'sidebar.primary.action'> & PropsLocale<'pluginCenter'> & InjectFace<PluginDiscoveryNavInjected>;
/** First-level sidebar entry that opens the independent Plugin Discovery page. */
export declare function PluginDiscoveryNavItem({ wide, primaryPage, pageId, open, t }: PluginDiscoveryNavProps): import("react").JSX.Element;
//# sourceMappingURL=PluginDiscoveryNavItem.d.ts.map