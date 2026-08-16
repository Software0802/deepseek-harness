/** General-settings row for the shared Desktop visual capability. */
import type { ReactNode } from 'react';
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { VisionEnhancementInjected } from './VisionEnhancementShortcut.tsx';
/** Full Settings-row props. */
export type VisionEnhancementRowProps = PropsRuntime<'settings.general.item'> & InjectFace<VisionEnhancementInjected>;
/** Render the full Settings entry while sharing status with the composer shortcut. */
export declare function VisionEnhancementRow({ useVisionEnhancement, load, disable, enable, }: VisionEnhancementRowProps): ReactNode;
//# sourceMappingURL=VisionEnhancementRow.d.ts.map