// src/main/timer.js
// ---------------------------------------------------------------------------
// The countdown until the next nudge.
//
// The timer "ticks" once per second. On every tick it checks:
//   1. Are you away? (screen locked, computer asleep, or no mouse/keyboard
//      activity for 5+ minutes). If so, no nudge. When you come back, the
//      countdown starts fresh, because you were probably already moving.
//   2. Is a "Pause for 1 hour" over? Then start a fresh countdown.
//   3. Has the countdown reached zero? Then it's nudge time!
//
// The timer can be in one of these modes:
//   "running"  counting down normally
//   "paused"   you chose "Pause for 1 hour"
//   "nudging"  a nudge is on screen right now; we wait until it's finished
// Being "away" is tracked separately, on top of the mode.
// ---------------------------------------------------------------------------

const { powerMonitor } = require('electron');
const store = require('./store');

const AWAY_AFTER_IDLE_SECONDS = 5 * 60; // 5 minutes without touching anything
const PAUSE_LENGTH_MS = 60 * 60 * 1000; // 1 hour

let mode = 'running';
let nextNudgeAt = 0; // a timestamp (milliseconds) when the next nudge is due
let pausedUntil = 0; // a timestamp when "Pause for 1 hour" ends
let screenLocked = false; // true while locked or asleep
let away = false; // true while you are away (locked, asleep or idle)

// main.js gives us these functions so we can tell it what's happening.
let onTick = () => {};
let onNudgeDue = () => {};
let onAway = () => {};

// Starts the timer. Call this once when the app starts.
function start(callbacks) {
  onTick = callbacks.onTick || onTick;
  onNudgeDue = callbacks.onNudgeDue || onNudgeDue;
  onAway = callbacks.onAway || onAway;

  // powerMonitor tells us when the computer locks, unlocks, sleeps, wakes.
  powerMonitor.on('lock-screen', () => setLocked(true));
  powerMonitor.on('suspend', () => setLocked(true));
  powerMonitor.on('unlock-screen', () => setLocked(false));
  powerMonitor.on('resume', () => setLocked(false));

  restart();
  setInterval(tick, 1000);
}

function setLocked(value) {
  screenLocked = value;
  tick(); // react right away instead of waiting up to a second
}

// The heartbeat: runs every second.
function tick() {
  const now = Date.now();

  // --- 1. Away detection ---
  // getSystemIdleTime() = seconds since you last touched mouse or keyboard.
  const awayNow = screenLocked || powerMonitor.getSystemIdleTime() >= AWAY_AFTER_IDLE_SECONDS;
  if (awayNow && !away) {
    away = true;
    onAway(); // lets main.js tidy up (e.g. hide a nudge nobody is watching)
  } else if (!awayNow && away) {
    away = false;
    // Welcome back! Start a fresh countdown (unless you paused on purpose).
    if (mode !== 'paused') restart();
  }

  // --- 2. Is the 1-hour pause over? ---
  if (mode === 'paused' && now >= pausedUntil) restart();

  // --- 3. Time for a nudge? ---
  if (mode === 'running' && !away && now >= nextNudgeAt) {
    mode = 'nudging'; // stays like this until main.js calls restart() or snooze()
    onNudgeDue();
  }

  onTick(getStatus());
}

// A fresh countdown using the interval from settings.
function restart() {
  mode = 'running';
  pausedUntil = 0;
  nextNudgeAt = Date.now() + store.get('intervalMinutes') * 60 * 1000;
  onTick(getStatus());
}

// "Snooze 5 min": come back sooner than a full interval.
function snooze(minutes) {
  mode = 'running';
  nextNudgeAt = Date.now() + minutes * 60 * 1000;
  onTick(getStatus());
}

function pauseForAnHour() {
  mode = 'paused';
  pausedUntil = Date.now() + PAUSE_LENGTH_MS;
  onTick(getStatus());
}

// Marks that a nudge is on screen (used by "Test nudge now").
function markNudging() {
  mode = 'nudging';
  onTick(getStatus());
}

// Developer helper: pretend you left and came back, without waiting 5 minutes.
function simulateAwayAndBack() {
  away = true;
  onAway();
  away = false;
  if (mode !== 'paused') restart();
}

// A small summary for the tray to display.
function getStatus() {
  const now = Date.now();
  let msLeft = 0;
  if (mode === 'running') msLeft = Math.max(0, nextNudgeAt - now);
  if (mode === 'paused') msLeft = Math.max(0, pausedUntil - now);
  return { mode, away, msLeft };
}

module.exports = { start, restart, snooze, pauseForAnHour, markNudging, simulateAwayAndBack, getStatus };
