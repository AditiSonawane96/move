// src/main/store.js
// ---------------------------------------------------------------------------
// Everything Move remembers lives here: your name, your interval, voice
// settings and today's streak.
//
// We use the "electron-store" package, which saves a small JSON file on YOUR
// computer only. Nothing is ever sent over the internet. You can find the file:
//   Mac:     ~/Library/Application Support/MoveNudge/config.json
//   Windows: %APPDATA%\MoveNudge\config.json
// (The folder keeps the app's old name, MoveNudge. See the top of main.js.)
// ---------------------------------------------------------------------------

const Store = require('electron-store');

// The intervals people can pick in the menu / settings (in minutes).
// 1 minute is a hidden testing option, so it's allowed but not shown normally.
const NORMAL_INTERVALS = [20, 30, 45, 60];
const TEST_INTERVAL = 1;

// How big the character is on screen (see SIZE_SHARE_OF_SCREEN in nudge.js).
const CHARACTER_SIZES = ['small', 'medium', 'large', 'huge'];

// Default values, used the very first time the app runs.
const store = new Store({
  defaults: {
    name: '', // empty means "we haven't asked yet"
    intervalMinutes: 30,
    voiceOn: true,
    voiceName: '', // empty means "pick the best voice automatically"
    characterSize: 'large',
    askFeeling: false, // ask "How are you feeling?" before picking an exercise
    startAtLogin: true,
    streak: { date: '', count: 0 }, // nudges completed today
    characterTurn: 0, // whose turn it is next (see characters/index.js)
  },
});

// Today's date as text, like "2026-11-18", in your local time zone.
// We use it to reset the streak at midnight.
function todayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The name to use in sentences. Falls back to "friend" if no name is saved.
function getName() {
  return store.get('name') || 'friend';
}

// How many nudges you've completed today (0 if the saved count is from
// another day).
function getStreakToday() {
  const streak = store.get('streak');
  return streak.date === todayKey() ? streak.count : 0;
}

// Called when you press "Done" on a nudge.
function addToStreak() {
  const count = getStreakToday() + 1;
  store.set('streak', { date: todayKey(), count });
  return count;
}

// The settings the windows are allowed to see and change.
function getSettings() {
  return {
    name: store.get('name'),
    intervalMinutes: store.get('intervalMinutes'),
    voiceOn: store.get('voiceOn'),
    voiceName: store.get('voiceName'),
    characterSize: store.get('characterSize'),
    askFeeling: store.get('askFeeling'),
    startAtLogin: store.get('startAtLogin'),
  };
}

// Whose turn it is to visit, and moving on to the next character.
function getCharacterTurn() {
  return store.get('characterTurn');
}

function nextCharacterTurn() {
  store.set('characterTurn', store.get('characterTurn') + 1);
}

// Saves changes coming from a window. We double-check every value, because
// we never want a typo or a bad value to break the saved settings.
function saveSettings(changes) {
  if (typeof changes.name === 'string') {
    // Trim spaces and keep names to a sensible length.
    store.set('name', changes.name.trim().slice(0, 30));
  }
  if (isAllowedInterval(changes.intervalMinutes)) {
    store.set('intervalMinutes', changes.intervalMinutes);
  }
  if (typeof changes.voiceOn === 'boolean') store.set('voiceOn', changes.voiceOn);
  if (typeof changes.voiceName === 'string') store.set('voiceName', changes.voiceName);
  if (CHARACTER_SIZES.includes(changes.characterSize)) store.set('characterSize', changes.characterSize);
  if (typeof changes.askFeeling === 'boolean') store.set('askFeeling', changes.askFeeling);
  if (typeof changes.startAtLogin === 'boolean') store.set('startAtLogin', changes.startAtLogin);
  return getSettings();
}

function isAllowedInterval(minutes) {
  return NORMAL_INTERVALS.includes(minutes) || minutes === TEST_INTERVAL;
}

// Wipes everything, as if the app was just installed (a developer option).
function resetAll() {
  store.clear();
}

module.exports = {
  NORMAL_INTERVALS,
  TEST_INTERVAL,
  get: (key) => store.get(key),
  getName,
  getStreakToday,
  addToStreak,
  getCharacterTurn,
  nextCharacterTurn,
  getSettings,
  saveSettings,
  resetAll,
};
