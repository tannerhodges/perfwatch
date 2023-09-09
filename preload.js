const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),

	openFolder: () => ipcRenderer.invoke('open-folder'),

	setFolder: (folderPath) => ipcRenderer.invoke('set-folder', folderPath),

	handleFileChange: (callback) => ipcRenderer.on('file-change', (_event, event, path) => {
		callback(event, path);
	}),

	handleLog: (callback) => ipcRenderer.on('log', (_event, data) => {
		callback(data);
	}),
});
