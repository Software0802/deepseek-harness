/** Desktop Plugin Center first-level navigation and independent main page. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type PluginCenterLocaleKey } from './locales.ts';
export type { DesktopCatalogBridge } from './bridge.ts';
export type { PluginCenterTabInjected, PluginCenterTabProps } from './PluginCenterTab.tsx';
export type { PluginCenterLocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Desktop Plugin and Skill Bundle catalog copy. */
        pluginCenter: PluginCenterLocaleKey;
    }
}
/** Dictionary namespace owned by this plugin. */
export declare const NS = "pluginCenter";
/** Services used by the slot contribution. */
export declare const inject: string[];
/** Add the Desktop-only catalog as a first-level page without replacing Settings. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map