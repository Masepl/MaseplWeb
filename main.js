const { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
// Set userData path to %appdata%/MaseplStudio
const pathAppData = app.getPath('appData');
const maseplStudioPath = path.join(pathAppData, 'MaseplStudio');
if (!fs.existsSync(maseplStudioPath)) {
  fs.mkdirSync(maseplStudioPath, { recursive: true });
}
app.setPath('userData', maseplStudioPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    },
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    menuBarVisible: false,
    icon: path.join(__dirname, 'icon.ico'),
  });
  win.loadFile('index.html');

  // Listen for update check from renderer
  ipcMain.handle('check-for-update', async () => {
    try {
      const latest = await getLatestRelease();
      if (!latest) return { error: 'No release found' };
      const asset = latest.assets.find(a => a.name.endsWith('.exe'));
      if (!asset) return { error: 'No installer found in release' };
      const tempPath = path.join(app.getPath('temp'), asset.name);
      await downloadFile(asset.browser_download_url, tempPath);
      return { version: latest.tag_name, notes: latest.body, path: tempPath };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.on('run-updater', (event, exePath) => {
    shell.openPath(exePath);
    app.quit();
  });
}
// Helper: Get latest release from GitHub
function getLatestRelease() {
  return new Promise((resolve, reject) => {
    https.get('https://api.github.com/repos/Masepl/MaseplWeb/releases/latest', {
      headers: { 'User-Agent': 'MaseplWeb-Updater' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Helper: Download file from URL
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'MaseplWeb-Updater' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed to download: ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Register global shortcut for Ctrl+Shift+Win+M
  globalShortcut.register('CommandOrControl+Shift+Super+M', () => {
    const creditsWin = new BrowserWindow({
      width: 400,
      height: 320,
      resizable: false,
      minimizable: false,
      maximizable: false,
      title: 'Credits',
      autoHideMenuBar: true,
      modal: true,
      parent: BrowserWindow.getFocusedWindow(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    creditsWin.loadFile('credits.html');
  });
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
