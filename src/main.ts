import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { execSync } from 'child_process';
import fs from 'fs';
import http from 'node:http';
import path from 'path';
import _debug from 'debug';

const debug = _debug('perfwatch');

let server: http.Server;
let projectFolderPath: string;
let gitFolderPath: string;
let mainWindow: BrowserWindow;

const port = 1873;

function startServer() {
	const pathToScript = path.join(__dirname, './perfwatch.js');

	server = http.createServer((req, res) => {
		if (req.method === 'GET' && req.url === '/perfwatch.js') {
			// GET /perfwatch.js
			fs.readFile(pathToScript, (err, data) => {
				if (err) {
					console.log('🚨 TODO: Show error messages in app.', err);
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Internal Server Error');
				} else {
					res.writeHead(200, {
						'Content-Type': 'text/javascript',
						'Access-Control-Allow-Origin': '*',
					});
					res.end(data);
				}
			});
		} else if (req.method === 'POST' && req.url === '/perfwatch/log') {
			// POST /perfwatch/log
			let body = '';

			req.on('data', (chunk) => {
				body += chunk.toString();
			});

			req.on('end', () => {
				try {
					const parsedBody = JSON.parse(body);
					mainWindow.webContents.send('log', parsedBody);
				} catch (err) {
					console.log('🚨 TODO: Show error messages in app.', err);
				}

				res.writeHead(204);
				res.end();
			});
		} else {
			// 404
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
		}
	});

	server.on('clientError', (err, socket) => {
		console.log('🚨 TODO: Show error messages in app.', err);
		socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
	});

	server.on('error', (err) => {
		console.log('🚨 TODO: Show error messages in app.', err);
	});

	server.listen(port, () => {
		console.log(`⏱️ perfwatch server is running on http://localhost:${port}`);
	});
}

async function handleFolderOpen() {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openDirectory'],
	});

	if (!canceled) {
		if (filePaths[0]) {
			projectFolderPath = filePaths[0];
		}
		return filePaths[0];
	}
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit();
}

const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
		);
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	startServer();

	ipcMain.handle('open-folder', handleFolderOpen);

	ipcMain.handle('set-folder', async (event, folderPath) => {
		if (!folderPath) {
			console.log('🚨 TODO: Folder path is empty.');
			return;
		}

		if (!fs.existsSync(folderPath)) {
			console.log('🚨 TODO: Folder does not exist.', folderPath);
			return;
		}

		projectFolderPath = folderPath;

		// Make a "projects" folder in the user's app data folder if it doesn't exist.
		// TODO: Keep track of multiple projects. How to handle potential naming conflicts?
		const projectFolderBaseName = path.basename(projectFolderPath);
		gitFolderPath = path.join(
			app.getPath('userData'),
			'projects',
			projectFolderBaseName
		);
		if (!fs.existsSync(gitFolderPath)) {
			fs.mkdirSync(gitFolderPath, { recursive: true });
			// TODO: Verify git is installed.
			// TODO: Verify git initialized the project folder.
			execSync(
				`git --work-tree="${projectFolderPath}" --git-dir="${gitFolderPath}" init`
			);
			// TODO: Replace commit message with initial instance ID.
			execSync(`git -C "${gitFolderPath}" add .`);
			execSync(`git -C "${gitFolderPath}" commit -m "Initial commit"`);
		}
	});

	ipcMain.handle('commit-instance', async (_, instanceId) => {
		if (!instanceId) {
			console.log('🚨 TODO: Instance ID is empty.');
			return;
		}

		// TODO: Handle error when `gitFolderPath` hasn't been set by the time `commit-instance` is called.
		// TODO: Do same validation as other `git` commands (see above).
		if (gitFolderPath && fs.existsSync(gitFolderPath)) {
			try {
				// Check for changes.
				const gitStatus = execSync(
					`git -C "${gitFolderPath}" status --porcelain`
				);
				const hasChanges = gitStatus.length > 0;

				if (!hasChanges) {
					debug('No changes to commit.');
					return;
				}

				// Commit changes.
				execSync(`git -C "${gitFolderPath}" add .`, { encoding: 'utf-8' });
				execSync(`git -C "${gitFolderPath}" commit -m "${instanceId}"`, {
					encoding: 'utf-8',
				});

				// Send "git diff" back to the app.
				const diff = execSync(`git -C "${gitFolderPath}" show HEAD`, {
					encoding: 'utf-8',
				});

				mainWindow.webContents.send('file-diff', diff);
			} catch (err) {
				console.log('🚨 TODO: Failed to commit instance.', err);
			}
		} else {
			console.log(
				'🚨 TODO: Git folder path is either empty or could not be found.',
				gitFolderPath
			);
		}
	});

	ipcMain.handle('get-app-version', () => app.getVersion());

	createWindow();

	app.on('activate', () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', async () => {
	server.close();

	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
