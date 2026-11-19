// src/main/tray.js
// ---------------------------------------------------------------------------
// The little icon in the Mac menu bar (top of the screen) or the Windows
// system tray (bottom right, near the clock).
//
// Mac:     shows the icon plus live text, e.g. "Chip · 24:10".
// Windows: the tray can only show an icon, so the countdown appears when you
//          hover over it (tooltip) and at the top of the menu.
// ---------------------------------------------------------------------------

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const store = require('./store');
const { ROSTER, SPECIALS } = require('../../characters');

const isMac = process.platform === 'darwin';

let tray = null;
let actions = {}; // functions from main.js, e.g. actions.testNudge()
let lastStatus = { mode: 'running', away: false, msLeft: 0 };

function create(actionsFromMain) {
  actions = actionsFromMain;

  // On Mac, a file named "...Template.png" is automatically recoloured to
  // match a light or dark menu bar. Electron also finds the "@2x" version
  // by itself for sharp Retina screens.
  const iconFile = isMac ? 'trayTemplate.png' : 'tray-win.png';
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', '..', 'assets', iconFile));
  tray = new Tray(icon);

  // We build the menu fresh every time it opens, so the countdown and
  // streak shown inside it are always up to date.
  tray.on('click', showMenu);
  tray.on('right-click', showMenu);
}

// Turns milliseconds into "24:10".
function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// The short status text, e.g. "Chip · 24:10" or "Paused · 59:12".
function statusText(status) {
  const name = actions.characterOnDutyName();
  if (status.mode === 'paused') return `Paused · ${formatTime(status.msLeft)}`;
  if (status.mode === 'nudging') return `${name} · now!`;
  if (status.away) return `${name} · away`;
  return `${name} · ${formatTime(status.msLeft)}`;
}

// Called every second by main.js with the latest timer status.
function update(status) {
  lastStatus = status;
  if (!tray) return;
  const text = statusText(status);
  if (isMac) {
    // "monospacedDigit" keeps the numbers the same width, so the menu bar
    // doesn't jiggle every second.
    tray.setTitle(` ${text}`, { fontType: 'monospacedDigit' });
  }
  tray.setToolTip(`Move · ${text}`);
}

// Builds and shows the menu. "event.altKey" is true if you hold the
// Option (Mac) / Alt (Windows) key while clicking: that reveals the hidden
// developer options, which are also always shown when you run "npm run dev".
function showMenu(event) {
  const showDevOptions = actions.isDev || (event && event.altKey);
  tray.popUpContextMenu(buildMenu(showDevOptions));
}

function buildMenu(showDevOptions) {
  const streak = store.getStreakToday();
  const interval = store.get('intervalMinutes');
  const isPaused = lastStatus.mode === 'paused';

  // One radio item per interval option.
  const intervalItems = store.NORMAL_INTERVALS.map((minutes) => ({
    label: `Every ${minutes} minutes`,
    type: 'radio',
    checked: interval === minutes,
    click: () => actions.setInterval(minutes),
  }));

  const template = [
    // The countdown, shown as a non-clickable heading.
    { label: lastStatus.away ? `${statusText(lastStatus)} (restarts when you're back)` : statusText(lastStatus), enabled: false },
    { label: `🔥 Today's streak: ${streak} ${streak === 1 ? 'nudge' : 'nudges'}`, enabled: false },
    { type: 'separator' },
    { label: 'Test nudge now', click: actions.testNudge },
    isPaused
      ? { label: 'Resume now', click: actions.resume }
      : { label: 'Pause for 1 hour', click: actions.pauseForAnHour },
    { label: 'Interval', submenu: intervalItems },
    {
      label: 'Mute voice',
      type: 'checkbox',
      checked: !store.get('voiceOn'),
      click: (item) => actions.setVoiceOn(!item.checked),
    },
    { label: 'Change name…', click: actions.changeName },
    { label: 'Settings…', click: actions.openSettings },
  ];

  if (showDevOptions) {
    template.push(
      { type: 'separator' },
      {
        label: '🛠 Developer',
        submenu: [
          {
            label: `Every ${store.TEST_INTERVAL} minute (testing)`,
            type: 'radio',
            checked: interval === store.TEST_INTERVAL,
            click: () => actions.setInterval(store.TEST_INTERVAL),
          },
          {
            // Try any character right now, without waiting for its turn.
            label: 'Preview character',
            submenu: [...ROSTER, ...SPECIALS].map((character) => ({
              label: character.name,
              click: () => actions.testNudge(character.id),
            })),
          },
          {
            // Act as if today were a Friday or a holiday (until you quit).
            label: "Pretend it's…",
            submenu: actions.pretendOptions.map((option) => ({
              label: option.name,
              type: 'radio',
              checked: actions.getPretend() === option.id,
              click: () => actions.setPretend(option.id),
            })),
          },
          {
            // Ignore reactions after 5/10/15 seconds instead of 30/60/90.
            label: 'Fast ignore reactions',
            type: 'checkbox',
            checked: actions.getFastEscalation(),
            click: (item) => actions.setFastEscalation(item.checked),
          },
          { label: 'Simulate: I left and came back', click: actions.simulateAwayAndBack },
          { label: 'Reset everything (show welcome again)', click: actions.resetAll },
        ],
      }
    );
  }

  template.push({ type: 'separator' }, { label: 'Quit Move', click: actions.quit });
  return Menu.buildFromTemplate(template);
}

module.exports = { create, update };
