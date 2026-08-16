/** Desktop-only browser features registered through existing UI slots. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type DesktopCustomizationKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Desktop background and update navigation copy. */
        'desktop.customization': DesktopCustomizationKey;
    }
}
/** Services required by the Desktop customization client plugin. */
export declare const inject: string[];
/** Register appearance, updates, and the team attribution overlay. */
export declare function apply(ctx: ClientContext): void;
export type { AppearanceSnapshot } from './appearance-controller.ts';
export type { AppearanceSettings, BuiltinAppearanceTheme, DesktopUpdateState } from './bridge.ts';
//# sourceMappingURL=index.d.ts.map