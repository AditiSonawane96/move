// src/main/windows.js
// ---------------------------------------------------------------------------
// Opens the small, normal windows: the welcome screen and settings.
// (The big see-through nudge window comes in Stage 2, in its own file.)
//
// If a window is already open, we just bring it to the front instead of
// opening a second copy.
// ---------------------------------------------------------------------------

const { app, BrowserWindow } = require('electron');
const path = require('path');

const openWindows = {}; // e.g. { welcome: <window>, settings: <window> }

function openWindow(key, htmlFile, { width, height, title }) {
  const existing = openWindows[key];
  if (existing && !existing.isDestroyed()) {
    existing.show();
    existing.focus();
    return existing;
  }

  const win = new BrowserWindow({
    width,
    height,
    title,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false, // wait until it's drawn, so it doesn't flash white
    backgroundColor: '#fff8ef',
    webPreferences: {
      // The preload script is the only bridge between this window and the
      // app's "brain". These settings keep the window safely locked down.
      preload: path.join(__dirname, '..', '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setMenuBarVisibility(false); // hides the File/Edit bar on Windows
  win.loadFile(path.join(__dirname, '..', 'renderer', htmlFile));
  win.once('ready-to-show', () => {
    win.show();
    // Move has no Dock icon on Mac, so we ask to come to the front.
    app.focus({ steal: true });
  });
  win.on('closed', () => delete openWindows[key]);

  openWindows[key] = win;
  return win;
}

function openWelcome() {
  return openWindow('welcome', 'welcome/welcome.html', { width: 440, height: 560, title: 'Welcome to Move' });
}

function openSettings() {
  return openWindow('settings', 'settings/settings.html', { width: 460, height: 780, title: 'Move Settings' });
}

function closeAll() {
  for (const win of Object.values(openWindows)) if (!win.isDestroyed()) win.close();
}

module.exports = { openWelcome, openSettings, closeAll };
