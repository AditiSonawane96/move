// src/renderer/nudge/voice.js
// ---------------------------------------------------------------------------
// Speaking out loud with the Web Speech API (speechSynthesis). It uses the
// voices already installed on your computer, so it works offline.
//
//   Voice.configure({ enabled: true, voiceName: '' });
//   await Voice.speak('Hello!', { pitch: 1.4, rate: 1.05, onStart, onEnd });
//
// speak() waits until the sentence is finished. The browser normally tells
// us with an "end" event, but sometimes it forgets, so there's also a backup
// timer based on how long the sentence is.
// If voice is switched off, speak() still waits about as long as the
// sentence would take, so the mouth still moves along with the bubble.
// Also used by the settings window for the "Test" button.
// ---------------------------------------------------------------------------

const Voice = (() => {
  let enabled = true;
  let chosenName = ''; // '' means "pick automatically"

  function configure(options) {
    enabled = options.enabled !== false;
    chosenName = options.voiceName || '';
  }

  // The list of voices loads a moment after the page opens. This waits for
  // it (at most 1.5 seconds).
  function voicesReady() {
    return new Promise((resolve) => {
      if (speechSynthesis.getVoices().length) return resolve();
      speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
      setTimeout(resolve, 1500);
    });
  }

  // Choose the voice: your pick from settings, otherwise the first voice
  // from PREFERRED_VOICES (config/voice-lines.js), otherwise any English one.
  function pickVoice(name = chosenName) {
    const voices = speechSynthesis.getVoices();
    const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));

    if (name) {
      const exact = voices.find((voice) => voice.name === name);
      if (exact) return exact;
    }
    const preferred = (window.MoveNudgeVoiceConfig && window.MoveNudgeVoiceConfig.PREFERRED_VOICES) || [];
    for (const wanted of preferred) {
      const found = english.find((voice) => voice.name.includes(wanted));
      if (found) return found;
    }
    return english.find((voice) => voice.lang === 'en-US') || english[0] || null;
  }

  // Roughly how long a sentence takes to say, in milliseconds.
  function estimateMs(text, rate = 1) {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1100, (words * 360 + 300) / rate);
  }

  async function speak(text, { pitch = 1.4, rate = 1.05, onStart = () => {}, onEnd = () => {} } = {}) {
    const estimate = estimateMs(text, rate);

    // Voice off: just "mouth" the words silently.
    if (!enabled) {
      onStart();
      await new Promise((resolve) => setTimeout(resolve, estimate));
      onEnd();
      return;
    }

    await voicesReady();
    speechSynthesis.cancel(); // stop anything still talking

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.pitch = pitch;
      utterance.rate = rate;

      let started = false;
      let finished = false;
      const start = () => {
        if (started) return;
        started = true;
        onStart();
      };
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(startBackup);
        clearTimeout(endBackup);
        start(); // (in case it never started, keep onStart/onEnd in pairs)
        onEnd();
        resolve();
      };

      utterance.onstart = start;
      utterance.onend = finish; // the normal way it finishes
      utterance.onerror = finish;

      // Backup timers, in case the browser never sends the events.
      const startBackup = setTimeout(start, 700);
      const endBackup = setTimeout(finish, estimate * 1.8 + 1500);

      speechSynthesis.speak(utterance);
    });
  }

  return { configure, speak, pickVoice, voicesReady };
})();
