// preload.js
// ---------------------------------------------------------------------------
// The safe bridge between a window (the web page you see) and main.js
// (the app's brain).
//
// Windows can't touch your computer directly. Instead, this file gives each
// window a small object called "window.moveNudge" with only the actions it
// needs. Each action sends a message to main.js, which does the real work.
// ---------------------------------------------------------------------------

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('moveNudge', {
  // Ask for the saved settings (name, interval, voice...).
  getSettings: () => ipcRenderer.invoke('settings:get'),

  // Save some settings, e.g. saveSettings({ name: 'Aditi' }).
  saveSettings: (changes) => ipcRenderer.invoke('settings:save', changes),

  // Close the window this page is in.
  closeWindow: () => ipcRenderer.send('window:close'),

  // ----- Used by the nudge window -----

  // Ask what this nudge is about: { name, characterId, voiceOn, voiceName }.
  getNudgeData: () => ipcRenderer.invoke('nudge:get-data'),

  // true = the mouse is over the character/card, so catch clicks.
  // false = let clicks fall through to the desktop.
  setInteractive: (interactive) => ipcRenderer.send('nudge:set-interactive', interactive),

  // The character has walked off. result is "done", "snooze" or "skip".
  finishNudge: (result) => ipcRenderer.send('nudge:finished', result),
});
