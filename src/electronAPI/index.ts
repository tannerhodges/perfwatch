import { ipcRenderer } from 'electron';

type HandleFileDiffCallback = (diff: string) => void;
type HandleLogCallback = (data: Record<string, unknown>) => void;

const electronAPI = {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),

	openFolder: () => ipcRenderer.invoke('open-folder'),

	setFolder: (folderPath: string) =>
		ipcRenderer.invoke('set-folder', folderPath),

	handleFileDiff: (callback: HandleFileDiffCallback) =>
		ipcRenderer.on('file-diff', (_event, diff) => {
			callback(diff);
		}),

	commitInstance: (instanceId: string) =>
		ipcRenderer.invoke('commit-instance', instanceId),

	handleLog: (callback: HandleLogCallback) =>
		ipcRenderer.on('log', (_event, data) => {
			callback(data);
		}),
};

export default electronAPI;
