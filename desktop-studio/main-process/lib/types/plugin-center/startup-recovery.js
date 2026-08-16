/** Startup gate that gives an open Plugin Center journal ownership before ordinary Host boot. */
import { PluginOperationJournalError, } from "./operation-journal.js";
import { blocksNormalPluginStartup, needsAutomaticPluginRecovery, } from "./recovery-controller.js";
/** Recover an interrupted operation first, then start the normal Host only after a safe terminal state. */
export async function preparePluginCenterStartup(input) {
    let before;
    try {
        before = await input.journal.read();
    }
    catch (error) {
        if (!(error instanceof PluginOperationJournalError))
            throw error;
        return { mode: 'recovery-failed', recovery: await input.recovery.getSnapshot() };
    }
    if (needsAutomaticPluginRecovery(before))
        await input.recovery.recoverOpen('internal');
    let after;
    try {
        after = await input.journal.read();
    }
    catch (error) {
        if (!(error instanceof PluginOperationJournalError))
            throw error;
        return { mode: 'recovery-failed', recovery: await input.recovery.getSnapshot() };
    }
    const recovery = await input.recovery.getSnapshot();
    if (blocksNormalPluginStartup(after))
        return { mode: 'recovery-failed', recovery };
    await input.startNormalHost();
    return { mode: 'normal', recovery };
}
//# sourceMappingURL=startup-recovery.js.map