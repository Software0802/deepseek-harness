/** Bundled Desktop themes and their fixed presentation defaults. */
import type { AppearancePalette, BuiltinAppearanceTheme } from './bridge.ts';
/** One named skin shipped as a static Desktop Web asset. */
export interface BundledAppearanceTheme {
    readonly id: BuiltinAppearanceTheme;
    readonly imageUrl: string | null;
    readonly palette: AppearancePalette;
    readonly focusY: number;
    readonly glassStrength: number;
}
/** Theme used before a learner makes a persisted choice. */
export declare const DEFAULT_BUILTIN_APPEARANCE_THEME: BuiltinAppearanceTheme;
/** Fixed themes shipped with the Desktop web frontend. */
export declare const BUNDLED_APPEARANCE_THEMES: Readonly<{
    official: Readonly<{
        id: "official";
        imageUrl: null;
        palette: readonly ["#2563EB", "#1F2937", "#D1D5DB", "#60A5FA"];
        focusY: 50;
        glassStrength: 72;
    }>;
    'whale-maid': Readonly<{
        id: "whale-maid";
        imageUrl: "/dsh-desktop/default-background.webp";
        palette: readonly ["#587ac2", "#253555", "#d9e5f7", "#8ba5d6"];
        focusY: 50;
        glassStrength: 72;
    }>;
    'cloud-cat': Readonly<{
        id: "cloud-cat";
        imageUrl: "/dsh-desktop/cloud-cat-background.webp";
        palette: readonly ["#3b5891", "#1d2739", "#b0c7e8", "#7091cc"];
        focusY: 50;
        glassStrength: 72;
    }>;
}>;
/**
 * Resolve either a custom image or one bundled theme into a renderer URL.
 * @param settings - Validated built-in identity and optional custom-image data.
 * @returns A bundled asset URL, the persisted custom-image data URL, or null for the original UI.
 */
export declare function resolveAppearanceBackground(settings: Pick<import('./bridge.ts').AppearanceSettings, 'builtinTheme' | 'imageDataUrl'>): string | null;
//# sourceMappingURL=appearance-themes.d.ts.map