import z from "@deepseek-ai/schemastery";
//#region lib/types/development-bootstrap.js
/** Host-rendered marker enabling the deterministic browser development bridge. */
const DEVELOPMENT_MARKER = "<script>window.__DSH_PLUGIN_CENTER_DEV__ = Object.freeze({ version: 1 })<\/script>";
/**
* Insert the development marker before the browser plugin tree starts.
* @param html - Raw application index HTML.
* @returns HTML with the explicit development marker.
*/
function injectPluginCenterDevelopment(html) {
	const body = /<body(?:\s[^>]*)?>/i.exec(html);
	if (body === null) return `${html}${DEVELOPMENT_MARKER}`;
	const at = body.index + body[0].length;
	return `${html.slice(0, at)}${DEVELOPMENT_MARKER}${html.slice(at)}`;
}
//#endregion
//#region lib/types/index.js
/** Host loader entry for the Desktop Plugin Center browser implementation. */
/** Host services required to mark an explicitly enabled Web development page. */
const inject = ["webServer"];
/** Validated Plugin Center host configuration. */
const Config = z.object({ development: z.boolean().default(false) });
/**
* Mark index responses only when the dedicated development command opts in.
* @param ctx - Host context carrying the Web index transform service.
* @param config - Validated development-mode configuration.
*/
function apply(ctx, config = {}) {
	if (config.development !== true) return;
	ctx.effect(() => ctx.webServer.tapIndex(injectPluginCenterDevelopment), "ui-plugin-center: browser development bridge marker");
}
//#endregion
export { Config, apply, inject };
