const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const http = require('node:http');
const path = require('path');

let server;
let fileWatcher;
let mainWindow;

const port = 1873;

function startServer() {
	const pathToScript = path.join(__dirname, 'perfwatch.js');

	server = http.createServer((req, res) => {
		if (req.method === 'GET' && req.url === '/perfwatch.js') {
			// GET /perfwatch.js
			fs.readFile(pathToScript, (err, data) => {
				if (err) {
					// TODO: Show error message in app.
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Internal Server Error');
				} else {
					res.writeHead(200, { 'Content-Type': 'text/javascript' });
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
				} catch (error) {
					// TODO: Show error message in app.
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
		// TODO: Show error message in app.
		socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
	});

	server.listen(port, () => {
		console.log(`perfwatch server is running on http://localhost:${port}`);
	});
}

async function resetFileWatcher() {
	if (fileWatcher) {
		await fileWatcher.close();
	}

	fileWatcher = chokidar.watch([], {
		ignored: [
			'**/.*', // Ignore hidden files
			'**/.*/**/*', // Ignore hidden folders
			'**/node_modules/**/*',
		],
		ignoreInitial: true,
	});

	fileWatcher.on('all', (event, path) => {
		mainWindow.webContents.send('file-change', event, path);
	});
}

async function handleFolderOpen() {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openDirectory'],
	});

	if (!canceled) {
		await resetFileWatcher();

		fileWatcher.add(filePaths[0]);

		return filePaths[0];
	}
}

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	mainWindow.loadFile('index.html');
};

app.whenReady().then(async () => {
	startServer();

	await resetFileWatcher();

	ipcMain.handle('open-folder', handleFolderOpen);

	ipcMain.handle('set-folder', async (event, folderPath) => {
		await resetFileWatcher();
		fileWatcher.add(folderPath);
	});

	ipcMain.handle('get-app-version', () => app.getVersion());

	createWindow();

	app.on('activate', () => {
		// Open a window if none are open (macOS).
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', async () => {
	server.close();

	await fileWatcher.close();

	// Quit the app when all windows are closed (Windows & Linux).
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
