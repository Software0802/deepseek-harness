/** Host loader entry for the Desktop Plugin Center browser implementation. */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Host services required to mark an explicitly enabled Web development page. */
export declare const inject: string[];
/** Plugin Center host configuration. */
export interface Config {
    /** Enable the deterministic browser-only development bridge marker. */
    development?: boolean;
}
/** Validated Plugin Center host configuration. */
export declare const Config: z<Config>;
/**
 * Mark index responses only when the dedicated development command opts in.
 * @param ctx - Host context carrying the Web index transform service.
 * @param config - Validated development-mode configuration.
 */
export declare function apply(ctx: Context, config?: Config): void;
//# sourceMappingURL=index.d.ts.map