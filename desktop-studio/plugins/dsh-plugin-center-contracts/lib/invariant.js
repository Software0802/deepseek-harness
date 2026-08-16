//#region lib/types/invariant.js
/** Package-owned invariant companion. @module @deepseek-ai/dsh-plugin-center-contracts/invariant */
const PACKAGE_NAME = "@deepseek-ai/dsh-plugin-center-contracts";
/** Cordis companion plugin name. */
const name = "plugin-center-contracts-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: catalog contracts are pure decoded values. */
const install = () => {};
/** Register this package's invariant companion. */
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
