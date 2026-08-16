/** Deterministic browser-only catalog used by the dedicated development command. */
import type { DesktopCatalogBridge } from './bridge.ts';
/**
 * Return a fixture bridge only when the Host injected the explicit marker.
 * @returns The deterministic development bridge when explicitly enabled.
 */
export declare function developmentCatalogBridge(): DesktopCatalogBridge | undefined;
//# sourceMappingURL=development-bridge.d.ts.map