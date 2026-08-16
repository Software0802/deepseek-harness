//#region lib/types/invariant.js
/** Package-owned invariant companion for Desktop customization. */
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-desktop-customization";
/** Cordis companion plugin name. */
const name = "client-ui-desktop-customization-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: fixed Electron bridge channels are validated in the
* main process, while slot registration and appearance disposal are covered
* through the assembled Desktop composition and focused browser tests.
*/
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
