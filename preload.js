const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),

	openFolder: () => ipcRenderer.invoke('open-folder'),

	setFolder: (folderPath) => ipcRenderer.invoke('set-folder', folderPath),

	handleFileChange: (callback) => ipcRenderer.on('file-change', (_event, event, path) => {
		callback(event, path);
	}),

	handleFileDiff: (callback) => ipcRenderer.on('file-diff', (_event, diff) => {
		callback(diff);
	}),

	commitInstance: (instanceId) => ipcRenderer.invoke('commit-instance', instanceId),

	handleLog: (callback) => ipcRenderer.on('log', (_event, data) => {
		callback(data);
	}),
});
