// main.js
// ---------------------------------------------------------------------------
// The starting point of Move: the "brain" that runs in the background.
//
// It doesn't do much work itself. It wires the other parts together:
//   store.js    remembers your settings
//   timer.js    counts down to the next nudge
//   tray.js     the menu bar / tray icon and its menu
//   windows.js       the welcome and settings windows
//   nudge-window.js  the see-through window the character walks across
// ---------------------------------------------------------------------------

const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');

// The app used to be called "MoveNudge", and its settings (your name,
// streak...) are saved in a folder with that name. Keep using that folder,
// so nobody loses their settings after the rename to "Move".
// (This must happen BEFORE store.js is loaded on the next line.)
app.setPath('userData', path.join(app.getPath('appData'), 'MoveNudge'));

const store = require('./src/main/store');
const timer = require('./src/main/timer');
const tray = require('./src/main/tray');
const windows = require('./src/main/windows');
const nudgeWindow = require('./src/main/nudge-window');
const { chooseCharacter, characterOnDuty } = require('./characters');
const { HOLIDAYS, holidayOn } = require('./config/holidays');

const SNOOZE_MINUTES = 5;

// When the character starts reacting if you ignore it (seconds).
const ESCALATE_AFTER = [30, 60, 90];
const ESCALATE_AFTER_FAST = [5, 10, 15]; // developer testing

// ----- Developer testing options (from the 🛠 Developer menu) -----
// "pretend" makes the app act as if today were a special day:
//   'none'    the real date
//   'friday'  the villain always comes
//   or a holiday id from config/holidays.js, like 'christmas'
const dev = { pretend: 'none', fastEscalation: false };

// Today's holiday (or the pretend one), or null.
function currentHoliday() {
  if (dev.pretend === 'none') return holidayOn(new Date());
  return HOLIDAYS.find((h) => h.id === dev.pretend) || null;
}

// "npm run dev" starts the app with --dev, which shows developer options.
const isDev = process.argv.includes('--dev');
const isMac = process.platform === 'darwin';

// Only allow one copy of Move to run at a time. If you open it again,
// the second copy quits and the first one shows its settings instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => windows.openSettings());
  app.whenReady().then(startApp);
}

function startApp() {
  // A menu bar app shouldn't have a Dock icon on Mac.
  if (isMac) app.dock.hide();
  // Windows needs an app ID for notifications to show up properly.
  if (process.platform === 'win32') app.setAppUserModelId('com.movenudge.app');

  applyStartAtLogin();
  registerWindowMessages();
  nudgeWindow.registerMessages();

  // Create the tray icon and tell it what each menu item should do.
  tray.create({
    isDev,
    // "Test nudge now" (no character given) or "Preview character" (an id).
    // Menus also pass extra info we don't need, so we only use text ids.
    testNudge: (characterId) => startNudge(typeof characterId === 'string' ? characterId : undefined),
    pauseForAnHour: () => timer.pauseForAnHour(),
    resume: () => timer.restart(),
    setInterval: (minutes) => {
      store.saveSettings({ intervalMinutes: minutes });
      timer.restart(); // a new interval means a fresh countdown
    },
    setVoiceOn: (on) => store.saveSettings({ voiceOn: on }),
    changeName: () => windows.openWelcome(),
    openSettings: () => windows.openSettings(),
    simulateAwayAndBack: () => timer.simulateAwayAndBack(),
    // For the tray title: who's on duty right now.
    characterOnDutyName: () => characterOnDuty({ turn: store.getCharacterTurn(), holiday: currentHoliday() }).name,
    // Developer: pretend it's Friday or a holiday; faster ignore reactions.
    pretendOptions: [{ id: 'none', name: 'A normal day' }, { id: 'friday', name: 'Friday (villain)' }, ...HOLIDAYS],
    getPretend: () => dev.pretend,
    setPretend: (id) => {
      dev.pretend = id;
    },
    getFastEscalation: () => dev.fastEscalation,
    setFastEscalation: (on) => {
      dev.fastEscalation = on;
    },
    resetAll: () => {
      nudgeWindow.close();
      store.resetAll();
      timer.restart();
      windows.closeAll();
      windows.openWelcome();
    },
    quit: () => app.quit(),
  });

  // Start counting. Every second the timer reports back, and we pass that
  // on to the tray so the countdown text stays live.
  timer.start({
    onTick: (status) => tray.update(status),
    onNudgeDue: () => startNudge(),
    // You walked away (or locked the screen) during a nudge: nobody is
    // watching, so remove it. A fresh countdown starts when you're back.
    onAway: () => nudgeWindow.close(),
  });

  // First launch? Ask for a name.
  if (!store.get('name')) windows.openWelcome();

  // "npm run nudge" starts with a nudge straight away (handy for testing).
  // Add "-- --character=volt" to pick who comes.
  else if (process.argv.includes('--nudge-now')) {
    const picked = process.argv.find((arg) => arg.startsWith('--character='));
    setTimeout(() => startNudge(picked ? picked.split('=')[1] : undefined), 1500);
  }
}

// ---------------------------------------------------------------------------
// The nudge itself: open the see-through window and let the character
// do its thing. The countdown waits until the nudge is finished.
// ---------------------------------------------------------------------------
// "characterId" is optional: without it, chooseCharacter() decides
// (the next character in turn, a holiday character, or the Friday villain).
function startNudge(characterId) {
  const holiday = currentHoliday();
  const chosen =
    characterId || chooseCharacter({ turn: store.getCharacterTurn(), holiday, forceVillain: dev.pretend === 'friday' }).id;
  const opened = nudgeWindow.show(
    {
      name: store.getName(),
      characterId: chosen,
      holidayId: holiday ? holiday.id : null,
      escalateAfter: dev.fastEscalation ? ESCALATE_AFTER_FAST : ESCALATE_AFTER,
      voiceOn: store.get('voiceOn'),
      voiceName: store.get('voiceName'),
      characterSize: store.get('characterSize'),
      askFeeling: store.get('askFeeling'),
      streakToday: store.getStreakToday(), // for "🔥 2 today" on the card
    },
    onNudgeFinished
  );
  if (!opened) return; // a nudge was already showing: do nothing
  timer.markNudging();
  // A normal nudge used up this character's turn: next time, the next one comes.
  if (!characterId) store.nextCharacterTurn();
}

// Called after the character has walked off screen.
function onNudgeFinished(result) {
  if (result === 'done') store.addToStreak();
  if (result === 'snooze') {
    timer.snooze(SNOOZE_MINUTES);
  } else {
    timer.restart(); // "done" or "skip": a full fresh countdown
  }
}

// Start automatically when you log in to your computer.
// We only do this in the installed app: while developing with "npm start",
// it would register the bare Electron program instead of Move.
function applyStartAtLogin() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: store.get('startAtLogin') });
}

// ---------------------------------------------------------------------------
// Messages from the windows (sent through preload.js).
// ---------------------------------------------------------------------------
function registerWindowMessages() {
  // A window asks: "what are the current settings?"
  ipcMain.handle('settings:get', () => ({
    ...store.getSettings(),
    streakToday: store.getStreakToday(),
    platform: process.platform, // "darwin" = Mac, "win32" = Windows
    isDev,
  }));

  // A window says: "please save these changes".
  ipcMain.handle('settings:save', (event, changes) => {
    const before = store.getSettings();
    const after = store.saveSettings(changes || {});
    if (after.intervalMinutes !== before.intervalMinutes) timer.restart();
    if (after.startAtLogin !== before.startAtLogin) applyStartAtLogin();
    return after;
  });

  // A window says: "close me".
  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });
}

// Normally an app quits when its last window closes. Move lives in the
// tray, so we keep running. (Use "Quit Move" in the menu to exit.)
app.on('window-all-closed', () => {});
