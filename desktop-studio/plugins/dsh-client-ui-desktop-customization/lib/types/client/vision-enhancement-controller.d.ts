/** Shared browser state for the Desktop visual-enhancement controls. */
import type { ConnectionHandle, VisionProvider, VisionProviderView } from '@deepseek-ai/dsh-api-remotes/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/** Host settings namespace used by visual enhancement. */
export declare const VISION_SETTINGS_NAMESPACE = "vision-enhancement";
/** One image probe sent through the existing atomic enable operation. */
export interface VisionEnableProbe {
    /** Optional credential stored by the Host before verification. */
    apiKey?: string;
    /** Visual provider selected for this verification. */
    provider?: VisionProvider;
    /** Provider model id selected for this verification. */
    model?: string;
    /** Validated image media type. */
    mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    /** Canonical Base64 image payload. */
    data: string;
    /** Optional task-specific visual question. */
    question?: string;
    /** Optional display name for validation diagnostics. */
    name?: string;
}
/** Shared status rendered by the Settings row and composer shortcut. */
export interface VisionEnhancementState {
    /** Current read or mutation phase. */
    status: 'idle' | 'loading' | 'ready' | 'saving' | 'error';
    /** Host-authoritative enabled value. */
    enabled: boolean;
    /** Whether the Host can resolve a credential for the active provider. */
    configured: boolean;
    /** Active visual provider. */
    provider: VisionProvider;
    /** Available providers with value-free credential status. */
    providers: readonly VisionProviderView[];
    /** Visual provider model reported by the Host. */
    model: string;
    /** Latest status or mutation failure. */
    error: string | null;
}
type VisionApi = Pick<ConnectionHandle['api'], 'settings' | 'vision'>;
/** Controller joining status reads, enable verification, disable writes, and pushed refreshes. */
export declare class VisionEnhancementController {
    private readonly api;
    /** Status source shared by every visual-enhancement entry. */
    readonly store: SnapshotStore<VisionEnhancementState>;
    private generation;
    private loading;
    private refreshPending;
    /** @param api - Host visual-enhancement and Settings wire faces. */
    constructor(api: VisionApi);
    /** Load once for the first mounted surface and share the result. */
    ensureLoaded(): Promise<void>;
    /** Refresh status after a pushed settings, credential, or connection change. */
    refreshIfLoaded(): void;
    /** Read the authoritative Host status; the latest request wins. */
    load(): Promise<void>;
    /** Disable the shared capability through its existing Settings namespace. */
    disable(): Promise<void>;
    /**
     * Verify one real image and enable the capability atomically.
     * @param input - Credential and image probe submitted to the Host.
     * @param signal - Optional cancellation signal for the verification request.
     * @returns The verified visual description returned by the provider.
     */
    enable(input: VisionEnableProbe, signal?: AbortSignal): Promise<string>;
    /** Ignore every response that settles after the owning plugin is disposed. */
    dispose(): void;
    private flushPendingRefresh;
    private fail;
}
export {};
//# sourceMappingURL=vision-enhancement-controller.d.ts.map