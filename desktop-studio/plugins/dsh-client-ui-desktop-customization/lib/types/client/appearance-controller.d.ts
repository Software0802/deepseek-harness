/** Live appearance state shared by the background settings page and shell. */
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { AppearanceSettings, DesktopRendererBridge } from './bridge.ts';
/** Bundled learner background served by the Desktop web host. */
export declare const DEFAULT_BACKGROUND_URL: "/dsh-desktop/default-background.webp" | "/dsh-desktop/cloud-cat-background.webp" | null;
/** Initial appearance before an optional persisted learner choice loads. */
export declare const DEFAULT_APPEARANCE: AppearanceSettings;
/** Observable state exposed to the background settings section. */
export interface AppearanceSnapshot {
    readonly status: 'loading' | 'ready' | 'saving' | 'error';
    readonly settings: AppearanceSettings;
    readonly message?: string;
}
/** Applies and persists one Desktop background without exposing Electron APIs elsewhere. */
export declare class AppearanceController {
    private readonly bridge;
    private readonly theme;
    private snapshot;
    private readonly listeners;
    private disposeTokens;
    private disposed;
    private previousMarker;
    private previousImage;
    private previousPosition;
    constructor(bridge: DesktopRendererBridge | undefined, theme: ThemeRuntime);
    /** Subscribe for React useSyncExternalStore. */
    subscribe: (listener: () => void) => (() => void);
    /** Current immutable snapshot. */
    getSnapshot: () => AppearanceSnapshot;
    /**
     * Apply the default immediately, then load any saved learner choice.
     * @returns A disposer that restores the prior theme state.
     */
    start(): () => void;
    /**
     * Persist and apply a processed background.
     * @param settings Validated appearance values to store through the preload bridge.
     */
    save(settings: AppearanceSettings): Promise<void>;
    /** Remove the custom image and return to the bundled background. */
    reset(): Promise<void>;
    private apply;
    private publish;
    private dispose;
}
//# sourceMappingURL=appearance-controller.d.ts.map