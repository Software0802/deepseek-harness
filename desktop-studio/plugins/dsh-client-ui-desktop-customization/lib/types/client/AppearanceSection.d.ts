/** In-app background chooser over the proven Harness image-skin pipeline. */
import type { ReactNode } from 'react';
import type { AppearanceController } from './appearance-controller.ts';
export interface AppearanceSectionInjected {
    readonly controller: AppearanceController;
}
export type AppearanceSectionProps = Partial<AppearanceSectionInjected>;
/** Render the background selection, crop focus, glass, save, and reset controls. */
export declare function AppearanceSection({ controller }: AppearanceSectionProps): ReactNode;
//# sourceMappingURL=AppearanceSection.d.ts.map