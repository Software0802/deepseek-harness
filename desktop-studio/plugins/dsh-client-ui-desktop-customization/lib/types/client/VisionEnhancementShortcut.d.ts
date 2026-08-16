/** Composer shortcut for the existing Desktop visual-enhancement capability. */
import type { ReactNode } from 'react';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { VisionEnableProbe, VisionEnhancementState } from './vision-enhancement-controller.ts';
/** Shared registration face for the Settings row and composer shortcut. */
export interface VisionEnhancementInjected {
    hooks: {
        /** Host-backed status bound by the slot renderer as useVisionEnhancement. */
        visionEnhancement: SnapshotStore<VisionEnhancementState>;
    };
    /** Load status once when either entry first mounts. */
    load: () => Promise<void>;
    /** Disable the capability through its existing Settings namespace. */
    disable: () => Promise<void>;
    /** Verify a real image and enable the capability atomically. */
    enable: (input: VisionEnableProbe, signal?: AbortSignal) => Promise<string>;
}
/** Full composer shortcut props. */
export type VisionEnhancementShortcutProps = PropsRuntime<'conversation.input.left'> & InjectFace<VisionEnhancementInjected>;
/** Render an always-visible, shared-state visual-enhancement switch in the composer. */
export declare function VisionEnhancementShortcut({ useVisionEnhancement, load, disable, enable, }: VisionEnhancementShortcutProps): ReactNode;
//# sourceMappingURL=VisionEnhancementShortcut.d.ts.map