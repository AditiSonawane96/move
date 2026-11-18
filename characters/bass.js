// characters/bass.js
// ---------------------------------------------------------------------------
// Bass the headphones: pink headphones with a headband and two big ear cups.
// The face sits on the soft pad between the ear cups.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  const bass = {
    id: 'bass',
    name: 'Bass',
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#f9a8d4', dark: '#be185d', light: '#fdf2f8' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 46, scale: 1.05 },

    colors: {
      limb: '#b88aa3',
      hand: '#831843',
    },

    // The arms come out of the ear cups.
    joints: {
      shoulderLeft: [40, 112],
      shoulderRight: [160, 112],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 100, scale: 0.95 },

    body: `
      <!-- The headband: a thick arch over the top -->
      <path d="M48 96 C44 30 156 30 152 96" fill="none" stroke="#be185d" stroke-width="16" stroke-linecap="round" />
      <path d="M48 96 C44 30 156 30 152 96" fill="none" stroke="#f472b6" stroke-width="9" stroke-linecap="round" />
      <!-- The soft middle pad (where the face is) -->
      <rect x="64" y="66" width="72" height="84" rx="22" fill="#fbcfe8" stroke="#be185d" stroke-width="4.5" />
      <!-- Left ear cup: outer shell and cushion -->
      <rect x="30" y="82" width="42" height="64" rx="20" fill="#ec4899" stroke="#9d174d" stroke-width="4.5" />
      <rect x="58" y="90" width="12" height="48" rx="6" fill="#9d174d" />
      <!-- Right ear cup -->
      <rect x="128" y="82" width="42" height="64" rx="20" fill="#ec4899" stroke="#9d174d" stroke-width="4.5" />
      <rect x="130" y="90" width="12" height="48" rx="6" fill="#9d174d" />
      <!-- Little music notes on the cups -->
      <path d="M44 120 V104 L54 101 V117" fill="none" stroke="#fdf2f8" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="42" cy="121" r="3" fill="#fdf2f8" />
      <circle cx="52" cy="118" r="3" fill="#fdf2f8" />
      <path d="M152 112 V100" stroke="#fdf2f8" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="150" cy="113" r="3" fill="#fdf2f8" />
    `,
  };

  window.MoveNudgeCharacter = bass;
})();
