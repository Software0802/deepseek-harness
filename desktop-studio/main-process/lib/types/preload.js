/** Sandboxed renderer bridge: fixed methods only, no generic IPC escape hatch. */
import { contextBridge, ipcRenderer } from 'electron';
import { DESKTOP_CHANNELS, } from "./desktop-bridge-contract.js";
const bridge = Object.freeze({
    platform: process.platform,
    appearance: Object.freeze({
        get: () => ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceGet),
        save: (settings) => ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceSave, settings),
        reset: () => ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceReset),
    }),
    updates: Object.freeze({
        getState: () => ipcRenderer.invoke(DESKTOP_CHANNELS.updatesGet),
        check: () => ipcRenderer.invoke(DESKTOP_CHANNELS.updatesCheck),
        download: () => ipcRenderer.invoke(DESKTOP_CHANNELS.updatesDownload),
        install: () => ipcRenderer.invoke(DESKTOP_CHANNELS.updatesInstall),
        onState: (listener) => {
            const receive = (_event, state) => { listener(state); };
            ipcRenderer.on(DESKTOP_CHANNELS.updatesState, receive);
            return () => { ipcRenderer.off(DESKTOP_CHANNELS.updatesState, receive); };
        },
    }),
    catalog: Object.freeze({
        list: (query) => ipcRenderer.invoke(DESKTOP_CHANNELS.catalogList, query),
        refresh: (query) => ipcRenderer.invoke(DESKTOP_CHANNELS.catalogRefresh, query),
        detail: (query) => ipcRenderer.invoke(DESKTOP_CHANNELS.catalogDetail, query),
        checkCompatibility: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.catalogCheckCompatibility, request),
    }),
    installedPlugins: Object.freeze({
        list: () => ipcRenderer.invoke(DESKTOP_CHANNELS.installedPluginsList),
    }),
    pluginOperations: Object.freeze({
        mutationsEnabled: true,
        install: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationStart, request),
        manage: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationStart, request),
        getOperation: () => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationGet),
        onState: (listener) => {
            const receive = (_event, operation) => {
                listener(operation);
            };
            ipcRenderer.on(DESKTOP_CHANNELS.pluginOperationState, receive);
            return () => { ipcRenderer.off(DESKTOP_CHANNELS.pluginOperationState, receive); };
        },
    }),
    pluginOwnedData: Object.freeze({
        getOffer: () => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataGetOffer),
        remove: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataRemove, request),
        retain: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataRetain, request),
    }),
    pluginRecovery: Object.freeze({
        getState: () => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryGet),
        retry: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryRetry, request),
        exportDiagnostics: (request) => ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryExport, request),
        onState: (listener) => {
            const receive = (_event, snapshot) => {
                listener(snapshot);
            };
            ipcRenderer.on(DESKTOP_CHANNELS.pluginRecoveryState, receive);
            return () => { ipcRenderer.off(DESKTOP_CHANNELS.pluginRecoveryState, receive); };
        },
    }),
});
contextBridge.exposeInMainWorld('dshDesktop', bridge);
//# sourceMappingURL=preload.js.map