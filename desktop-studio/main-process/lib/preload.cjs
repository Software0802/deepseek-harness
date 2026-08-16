let electron = require("electron");
//#region lib/types/desktop-bridge-contract.js
/** Fixed Electron bridge shared by the Desktop main process and preload. */
/** Closed channel set; the preload never accepts a caller-provided channel. */
const DESKTOP_CHANNELS = {
	appearanceGet: "dsh-desktop:appearance:get",
	appearanceSave: "dsh-desktop:appearance:save",
	appearanceReset: "dsh-desktop:appearance:reset",
	updatesGet: "dsh-desktop:updates:get",
	updatesCheck: "dsh-desktop:updates:check",
	updatesDownload: "dsh-desktop:updates:download",
	updatesInstall: "dsh-desktop:updates:install",
	updatesState: "dsh-desktop:updates:state",
	catalogList: "dsh-desktop:catalog:list",
	catalogRefresh: "dsh-desktop:catalog:refresh",
	catalogDetail: "dsh-desktop:catalog:detail",
	catalogCheckCompatibility: "dsh-desktop:catalog:check-compatibility",
	installedPluginsList: "dsh-desktop:installed-plugins:list",
	pluginOperationStart: "dsh-desktop:plugin-operation:start",
	pluginOperationGet: "dsh-desktop:plugin-operation:get",
	pluginOperationState: "dsh-desktop:plugin-operation:state",
	pluginOwnedDataGetOffer: "dsh-desktop:plugin-owned-data:get-offer",
	pluginOwnedDataRemove: "dsh-desktop:plugin-owned-data:remove",
	pluginOwnedDataRetain: "dsh-desktop:plugin-owned-data:retain",
	pluginRecoveryGet: "dsh-desktop:plugin-recovery:get",
	pluginRecoveryRetry: "dsh-desktop:plugin-recovery:retry",
	pluginRecoveryExport: "dsh-desktop:plugin-recovery:export",
	pluginRecoveryState: "dsh-desktop:plugin-recovery:state"
};
//#endregion
//#region lib/types/preload.js
/** Sandboxed renderer bridge: fixed methods only, no generic IPC escape hatch. */
const bridge = Object.freeze({
	platform: process.platform,
	appearance: Object.freeze({
		get: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceGet),
		save: (settings) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceSave, settings),
		reset: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.appearanceReset)
	}),
	updates: Object.freeze({
		getState: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.updatesGet),
		check: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.updatesCheck),
		download: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.updatesDownload),
		install: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.updatesInstall),
		onState: (listener) => {
			const receive = (_event, state) => {
				listener(state);
			};
			electron.ipcRenderer.on(DESKTOP_CHANNELS.updatesState, receive);
			return () => {
				electron.ipcRenderer.off(DESKTOP_CHANNELS.updatesState, receive);
			};
		}
	}),
	catalog: Object.freeze({
		list: (query) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.catalogList, query),
		refresh: (query) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.catalogRefresh, query),
		detail: (query) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.catalogDetail, query),
		checkCompatibility: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.catalogCheckCompatibility, request)
	}),
	installedPlugins: Object.freeze({ list: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.installedPluginsList) }),
	pluginOperations: Object.freeze({
		mutationsEnabled: true,
		install: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationStart, request),
		manage: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationStart, request),
		getOperation: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOperationGet),
		onState: (listener) => {
			const receive = (_event, operation) => {
				listener(operation);
			};
			electron.ipcRenderer.on(DESKTOP_CHANNELS.pluginOperationState, receive);
			return () => {
				electron.ipcRenderer.off(DESKTOP_CHANNELS.pluginOperationState, receive);
			};
		}
	}),
	pluginOwnedData: Object.freeze({
		getOffer: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataGetOffer),
		remove: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataRemove, request),
		retain: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginOwnedDataRetain, request)
	}),
	pluginRecovery: Object.freeze({
		getState: () => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryGet),
		retry: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryRetry, request),
		exportDiagnostics: (request) => electron.ipcRenderer.invoke(DESKTOP_CHANNELS.pluginRecoveryExport, request),
		onState: (listener) => {
			const receive = (_event, snapshot) => {
				listener(snapshot);
			};
			electron.ipcRenderer.on(DESKTOP_CHANNELS.pluginRecoveryState, receive);
			return () => {
				electron.ipcRenderer.off(DESKTOP_CHANNELS.pluginRecoveryState, receive);
			};
		}
	})
});
electron.contextBridge.exposeInMainWorld("dshDesktop", bridge);
//#endregion
