import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Registration-side navigation action. */
export interface PluginCenterNavInjected {
    readonly pageId: string;
    readonly open: () => void;
}
/** Full props of the sidebar first-level Plugin entry. */
export type PluginCenterNavProps = PropsRuntime<'sidebar.primary.action'> & PropsLocale<'pluginCenter'> & InjectFace<PluginCenterNavInjected>;
/** First-level sidebar entry that opens the independent Plugin page. */
export declare function PluginCenterNavItem({ wide, primaryPage, pageId, open, t }: PluginCenterNavProps): import("react").JSX.Element;
//# sourceMappingURL=PluginCenterNavItem.d.ts.map