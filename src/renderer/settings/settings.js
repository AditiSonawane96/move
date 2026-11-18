// src/renderer/settings/settings.js
// ---------------------------------------------------------------------------
// Makes the settings window work:
//   1. Fill in the form with your saved settings.
//   2. List the English voices installed on this computer.
//   3. "Test" speaks a sample line so you can hear the chosen voice.
//   4. "Save" sends the changes to main.js, which stores them.
// ---------------------------------------------------------------------------

const form = document.getElementById('settings-form');
const streakLine = document.getElementById('streak-line');
const nameInput = document.getElementById('name');
const intervalSelect = document.getElementById('interval');
const sizeSelect = document.getElementById('character-size');
const askFeelingInput = document.getElementById('ask-feeling');
const voiceOnInput = document.getElementById('voice-on');
const voiceSelect = document.getElementById('voice-name');
const testVoiceButton = document.getElementById('test-voice');
const startAtLoginInput = document.getElementById('start-at-login');
const savedNote = document.getElementById('saved-note');
const cancelButton = document.getElementById('cancel');

const NORMAL_INTERVALS = [20, 30, 45, 60];
const TEST_INTERVAL = 1;

let settings = null;

async function init() {
  settings = await window.moveNudge.getSettings();

  const n = settings.streakToday;
  streakLine.textContent = `🔥 Today's streak: ${n} ${n === 1 ? 'nudge' : 'nudges'} completed`;
  nameInput.value = settings.name;
  sizeSelect.value = settings.characterSize;
  askFeelingInput.checked = settings.askFeeling;
  voiceOnInput.checked = settings.voiceOn;
  startAtLoginInput.checked = settings.startAtLogin;

  // Interval choices. The 1-minute testing option only appears in dev mode,
  // or if it's already selected (so the dropdown shows the real value).
  const choices = [...NORMAL_INTERVALS];
  if (settings.isDev || settings.intervalMinutes === TEST_INTERVAL) choices.unshift(TEST_INTERVAL);
  for (const minutes of choices) {
    const label = minutes === TEST_INTERVAL ? '1 minute (testing)' : `${minutes} minutes`;
    intervalSelect.add(new Option(label, minutes, false, minutes === settings.intervalMinutes));
  }

  fillVoiceList();
  updateVoiceControls();
}

// ---------------------------------------------------------------------------
// Voices
// The computer loads its voice list a moment after the page opens, so we
// fill the list now AND again when the "voiceschanged" event fires.
// ---------------------------------------------------------------------------
function fillVoiceList() {
  if (!settings) return;
  const englishVoices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith('en'));

  voiceSelect.innerHTML = '';
  voiceSelect.add(new Option('Automatic (best available)', ''));
  for (const voice of englishVoices) {
    const selected = voice.name === settings.voiceName;
    voiceSelect.add(new Option(`${voice.name} (${voice.lang})`, voice.name, false, selected));
  }
  labelAutomaticVoice();
}
speechSynthesis.addEventListener('voiceschanged', fillVoiceList);

// Grey out the voice picker when voice is switched off.
function updateVoiceControls() {
  voiceSelect.disabled = !voiceOnInput.checked;
  testVoiceButton.disabled = !voiceOnInput.checked;
}
voiceOnInput.addEventListener('change', updateVoiceControls);

// Speak a sample line exactly like the characters do (voice.js).
// "Automatic" picks Samantha, Aria, Jenny... whichever this computer has.
testVoiceButton.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'friend';
  const { pitch, rate } = window.MoveNudgeVoiceConfig.VOICE_STYLES.gadget;
  Voice.configure({ enabled: true, voiceName: voiceSelect.value });
  Voice.speak(`Hi ${name}! Ready to move with me?`, { pitch, rate });
});

// Show which voice "Automatic" will actually use (called by fillVoiceList).
function labelAutomaticVoice() {
  const best = Voice.pickVoice('');
  voiceSelect.options[0].text = best ? `Automatic (${best.name})` : 'Automatic (best available)';
}

// ---------------------------------------------------------------------------
// Save and Cancel
// ---------------------------------------------------------------------------
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  settings = await window.moveNudge.saveSettings({
    name,
    intervalMinutes: Number(intervalSelect.value), // dropdown values are text; make it a number
    characterSize: sizeSelect.value,
    askFeeling: askFeelingInput.checked,
    voiceOn: voiceOnInput.checked,
    voiceName: voiceSelect.value,
    startAtLogin: startAtLoginInput.checked,
  });

  // Show "Saved ✓" for a moment, then close.
  savedNote.hidden = false;
  setTimeout(() => window.moveNudge.closeWindow(), 700);
});

cancelButton.addEventListener('click', () => window.moveNudge.closeWindow());

init();
