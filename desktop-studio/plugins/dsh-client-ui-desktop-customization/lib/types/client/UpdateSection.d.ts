/** Visible update center backed by the Electron main-process updater. */
import type { ReactNode } from 'react';
import type { DesktopRendererBridge } from './bridge.ts';
export interface UpdateSectionInjected {
    readonly bridge: DesktopRendererBridge | undefined;
}
export type UpdateSectionProps = Partial<UpdateSectionInjected>;
/** Render version, update status, progress, and the next valid action. */
export declare function UpdateSection({ bridge }: UpdateSectionProps): ReactNode;
//# sourceMappingURL=UpdateSection.d.ts.map