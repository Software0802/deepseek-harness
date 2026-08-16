/** Browser-local image validation, cover crop, and palette extraction. */
import type { AppearancePalette } from './bridge.ts';
/** Maximum source-image size accepted before local decoding. */
export declare const MAX_SOURCE_IMAGE_BYTES: number;
/** Stable palette used until a custom background yields sampled colors. */
export declare const DEFAULT_PALETTE: AppearancePalette;
/**
 * Reject files the known Canvas/WebP path cannot safely consume.
 * @param file Browser-selected source image.
 * @returns A learner-facing validation error, or undefined when accepted.
 */
export declare function validateImageFile(file: File): string | undefined;
/**
 * Decode an object/data/HTTP URL into an image element.
 * @param url Image URL owned by the current renderer.
 * @returns The fully decoded image element.
 */
export declare function loadImage(url: string): Promise<HTMLImageElement>;
/**
 * Cover-crop one image to the runtime 16:9 background.
 * @param image Decoded learner image.
 * @param focusY Vertical focal position from 0 to 100.
 * @returns A 1920 by 1080 canvas ready for WebP encoding.
 */
export declare function renderBackground(image: HTMLImageElement, focusY: number): HTMLCanvasElement;
/**
 * Extract a stable four-color theme palette from the processed background.
 * @param canvas Processed 16:9 background canvas.
 * @returns Accent, deep, mist, and highlight colors.
 */
export declare function extractPalette(canvas: HTMLCanvasElement): AppearancePalette;
//# sourceMappingURL=background-image.d.ts.map