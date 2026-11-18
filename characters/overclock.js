// characters/overclock.js
// ---------------------------------------------------------------------------
// Overclock, the Friday villain: a grumpy gray server rack with blinking
// lights. He sometimes shows up on Fridays instead of the usual character,
// demands 10 push-ups, and falls over in defeat when you press Done.
// (See chip.js for an explanation of the usual fields.)
// ---------------------------------------------------------------------------

(function () {
  const overclock = {
    id: 'overclock',
    name: 'Overclock',
    voiceStyle: 'villain', // low and slow (see config/voice-lines.js)

    // Villain extras:
    isVillain: true,
    defaultExpression: 'impatient', // always grumpy
    villainExercise: 'push-ups', // the exercise he always demands

    theme: { main: '#fca5a5', dark: '#991b1b', light: '#fef2f2' },

    colors: {
      limb: '#6b7280',
      hand: '#111827',
    },

    joints: {
      shoulderLeft: [60, 104],
      shoulderRight: [140, 104],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 70, scale: 1 },
    hat: { x: 100, y: 30, scale: 1 },

    // The "led" lights blink thanks to animations.css.
    body: `
      <!-- Little antennas -->
      <path d="M78 30 L70 14 M122 30 L130 14" stroke="#374151" stroke-width="4" stroke-linecap="round" />
      <circle cx="70" cy="13" r="4" fill="#ef4444" class="led led-a" />
      <circle cx="130" cy="13" r="4" fill="#ef4444" class="led led-b" />
      <!-- The rack cabinet -->
      <rect x="58" y="28" width="84" height="124" rx="9" fill="#4b5563" stroke="#1f2937" stroke-width="5" />
      <!-- The face panel -->
      <rect x="66" y="37" width="68" height="62" rx="6" fill="#9ca3af" stroke="#1f2937" stroke-width="2.5" />
      <!-- Two server drawers with vents and lights -->
      <rect x="66" y="106" width="68" height="18" rx="3" fill="#374151" />
      <rect x="66" y="128" width="68" height="18" rx="3" fill="#374151" />
      <path d="M72 111 H98 M72 115 H98 M72 119 H98 M72 133 H98 M72 137 H98 M72 141 H98" stroke="#6b7280" stroke-width="1.5" />
      <circle cx="110" cy="115" r="3" fill="#22c55e" class="led led-a" />
      <circle cx="119" cy="115" r="3" fill="#ef4444" class="led led-b" />
      <circle cx="128" cy="115" r="3" fill="#facc15" class="led led-c" />
      <circle cx="110" cy="137" r="3" fill="#ef4444" class="led led-c" />
      <circle cx="119" cy="137" r="3" fill="#22c55e" class="led led-a" />
      <circle cx="128" cy="137" r="3" fill="#22c55e" class="led led-b" />
    `,
  };

  window.MoveNudgeCharacter = overclock;
})();
