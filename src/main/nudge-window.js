// src/main/nudge-window.js
// ---------------------------------------------------------------------------
// The big see-through window the character walks across.
//
// It is:
//   transparent     you see your desktop through it
//   frameless       no title bar or borders
//   always on top   floats above your other apps
//   click-through   clicks go to the apps underneath, EXCEPT over the
//                   character and its card (nudge.js tells us when the
//                   mouse is over those)
//
// It covers the screen your mouse is on, but not the Dock / taskbar, so the
// character stands right on top of it.
// ---------------------------------------------------------------------------

const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

const RESULTS = ['done', 'snooze', 'skip'];
const MAX_NUDGE_MS = 10 * 60 * 1000; // 10 minutes

let win = null;
let nudgeData = null; // what the window asks for when it starts (name, character...)
let onFinished = () => {};

function isOpen() {
  return Boolean(win && !win.isDestroyed());
}

// Opens the window and starts a nudge. "whenFinished" is called with
// "done", "snooze" or "skip" once the character has walked off.
function show(data, whenFinished) {
  if (isOpen()) return false; // only one nudge at a time
  nudgeData = data;
  onFinished = whenFinished;

  // The screen where your mouse is right now (handy with 2+ monitors).
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const area = display.workArea; // the screen minus the Dock / taskbar

  win = new BrowserWindow({
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    transparent: true,
    backgroundColor: '#00000000', // fully transparent
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true, // no extra button in the Windows taskbar
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false, // keep animations smooth even when not focused
      autoplayPolicy: 'no-user-gesture-required', // allow the knock sound without a click first
    },
  });

  // "screen-saver" is the highest level: above almost everything.
  win.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    // Also appear on every desktop/Space and over full-screen apps.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  }

  // Start fully click-through. "forward: true" still sends us mouse
  // movements, so we can notice when you hover over the character.
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'nudge', 'nudge.html'));

  // showInactive: appear WITHOUT stealing keyboard focus from what you're typing.
  win.once('ready-to-show', () => win.showInactive());

  // Safety nets, so a nudge can never get stuck on your screen:
  // if the page crashes, or it's somehow still open after 10 minutes,
  // clean up and count it as skipped.
  win.webContents.on('render-process-gone', () => finish('skip'));
  const safetyTimer = setTimeout(() => finish('skip'), MAX_NUDGE_MS);
  win.on('closed', () => {
    clearTimeout(safetyTimer);
    win = null;
  });
  return true;
}

// Closes the window and reports the result to main.js.
function finish(result) {
  if (!isOpen()) return;
  win.destroy();
  win = null;
  onFinished(RESULTS.includes(result) ? result : 'skip');
}

// Closes the window without reporting anything (e.g. you walked away).
function close() {
  if (!isOpen()) return;
  win.destroy();
  win = null;
}

// Messages from nudge.js (through preload.js). Registered once at startup.
function registerMessages() {
  ipcMain.handle('nudge:get-data', () => nudgeData);

  // Mouse is over the character/card (true) or over empty space (false).
  ipcMain.on('nudge:set-interactive', (event, interactive) => {
    if (!isOpen()) return;
    win.setIgnoreMouseEvents(!interactive, { forward: true });
  });

  ipcMain.on('nudge:finished', (event, result) => finish(result));
}

module.exports = { show, close, isOpen, registerMessages };
