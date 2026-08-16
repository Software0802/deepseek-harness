/** Guided visual-provider configuration shared by the Settings row and composer shortcut. */
import type { ReactNode } from 'react';
import type { VisionEnableProbe, VisionEnhancementState } from './vision-enhancement-controller.ts';
/** Props for the shared atomic enable dialog. */
interface VisionEnhancementDialogProps {
    open: boolean;
    provider: VisionEnhancementState['provider'];
    providers: VisionEnhancementState['providers'];
    model: string;
    failure?: string | undefined;
    onClose: () => void;
    enable: (input: VisionEnableProbe, signal?: AbortSignal) => Promise<string>;
}
/** Verify a real image before enabling the shared visual capability. */
export declare function VisionEnhancementDialog({ open, provider: activeProvider, providers, model: activeModel, failure: outerFailure, onClose, enable, }: VisionEnhancementDialogProps): ReactNode;
export {};
//# sourceMappingURL=VisionEnhancementDialog.d.ts.map