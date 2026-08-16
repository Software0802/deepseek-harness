/** Pure ownership check for Plugin Center IPC requests. */
/** Reject stale Host generations, unrelated WebContents, and malformed frame URLs. */
export function assertCatalogRequestOwner(identity, owner) {
    if (owner.origin === undefined || identity.senderId !== owner.webContentsId || identity.senderFrameUrl === undefined) {
        throw new Error('plugin catalog request is not owned by the current Desktop renderer');
    }
    let origin;
    try {
        origin = new URL(identity.senderFrameUrl).origin;
    }
    catch {
        throw new Error('plugin catalog request has an invalid renderer URL');
    }
    if (origin !== owner.origin)
        throw new Error('plugin catalog request origin is not current');
}
//# sourceMappingURL=bridge-policy.js.map