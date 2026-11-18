// src/renderer/welcome/welcome.js
// ---------------------------------------------------------------------------
// Makes the welcome screen work:
//   1. Load the saved settings. If a name already exists, we're in
//      "change name" mode, so the wording changes a little.
//   2. When you press the button, save the name.
//   3. Show a friendly "nice to meet you" message with where to find the app.
//
// "window.moveNudge" comes from preload.js: it's how this page talks to the
// app's brain (main.js).
// ---------------------------------------------------------------------------

// Grab the parts of the page we need, by their id="..." in welcome.html.
const askStep = document.getElementById('ask-step');
const askTitle = document.getElementById('ask-title');
const askText = document.getElementById('ask-text');
const form = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const saveButton = document.getElementById('save-button');
const doneStep = document.getElementById('done-step');
const doneTitle = document.getElementById('done-title');
const doneText = document.getElementById('done-text');
const doneButton = document.getElementById('done-button');

let settings = null;
let isChangingName = false;

async function init() {
  settings = await window.moveNudge.getSettings();
  isChangingName = Boolean(settings.name);

  if (isChangingName) {
    askTitle.textContent = 'What should I call you?';
    askText.textContent = "Type a new name and I'll use it from now on.";
    nameInput.value = settings.name;
    nameInput.select();
    saveButton.textContent = 'Save';
  }
}

// Where to find the app, in words that match your computer.
function whereToFindMe() {
  if (settings.platform === 'darwin') return 'in the menu bar at the top of your screen';
  return 'in the system tray near the clock (click the ^ arrow if you don\'t see me)';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the page from reloading (default form behaviour)

  const name = nameInput.value.trim();
  if (!name) {
    // No name typed: give the box a little shake and try again.
    nameInput.classList.remove('shake');
    void nameInput.offsetWidth; // restarts the animation if it ran before
    nameInput.classList.add('shake');
    nameInput.focus();
    return;
  }

  settings = await window.moveNudge.saveSettings({ name });

  // We use textContent (not innerHTML) so a name can never be treated as code.
  if (isChangingName) {
    doneTitle.textContent = `Got it, ${settings.name}!`;
    doneText.textContent = "From now on, that's what I'll call you.";
  } else {
    doneTitle.textContent = `Nice to meet you, ${settings.name}! 🎉`;
    doneText.textContent =
      `Every ${settings.intervalMinutes} minutes, one of my gadget friends will walk onto your screen ` +
      `to get you moving. You'll find me ${whereToFindMe()}.`;
  }

  askStep.hidden = true;
  doneStep.hidden = false;
  doneButton.focus();
});

doneButton.addEventListener('click', () => window.moveNudge.closeWindow());

init();
