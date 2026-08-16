/** Fixed Electron bridge shared by the Desktop main process and preload. */
/** Closed channel set; the preload never accepts a caller-provided channel. */
export const DESKTOP_CHANNELS = {
    appearanceGet: 'dsh-desktop:appearance:get',
    appearanceSave: 'dsh-desktop:appearance:save',
    appearanceReset: 'dsh-desktop:appearance:reset',
    updatesGet: 'dsh-desktop:updates:get',
    updatesCheck: 'dsh-desktop:updates:check',
    updatesDownload: 'dsh-desktop:updates:download',
    updatesInstall: 'dsh-desktop:updates:install',
    updatesState: 'dsh-desktop:updates:state',
    catalogList: 'dsh-desktop:catalog:list',
    catalogRefresh: 'dsh-desktop:catalog:refresh',
    catalogDetail: 'dsh-desktop:catalog:detail',
    catalogCheckCompatibility: 'dsh-desktop:catalog:check-compatibility',
    installedPluginsList: 'dsh-desktop:installed-plugins:list',
    pluginOperationStart: 'dsh-desktop:plugin-operation:start',
    pluginOperationGet: 'dsh-desktop:plugin-operation:get',
    pluginOperationState: 'dsh-desktop:plugin-operation:state',
    pluginOwnedDataGetOffer: 'dsh-desktop:plugin-owned-data:get-offer',
    pluginOwnedDataRemove: 'dsh-desktop:plugin-owned-data:remove',
    pluginOwnedDataRetain: 'dsh-desktop:plugin-owned-data:retain',
    pluginRecoveryGet: 'dsh-desktop:plugin-recovery:get',
    pluginRecoveryRetry: 'dsh-desktop:plugin-recovery:retry',
    pluginRecoveryExport: 'dsh-desktop:plugin-recovery:export',
    pluginRecoveryState: 'dsh-desktop:plugin-recovery:state',
};
//# sourceMappingURL=desktop-bridge-contract.js.map