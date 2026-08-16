//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-client-ui-plugin-center/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-plugin-center";
/** Cordis companion plugin name. */
const name = "client-ui-plugin-center-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: Electron owns authority and this package only renders its read result. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
