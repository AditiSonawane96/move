// characters/volt.js
// ---------------------------------------------------------------------------
// Volt the battery: a green battery with a charge bar on its tummy.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  const volt = {
    id: 'volt',
    name: 'Volt',
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#4ade80', dark: '#15803d', light: '#f0fdf4' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 36, scale: 1 },

    colors: {
      limb: '#6b8f71',
      hand: '#14532d',
    },

    joints: {
      shoulderLeft: [62, 104],
      shoulderRight: [138, 104],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 84, scale: 1 },

    body: `
      <!-- The metal bump on top (the + terminal) -->
      <rect x="84" y="32" width="32" height="18" rx="5" fill="#9ca3af" stroke="#4b5563" stroke-width="4" />
      <!-- The battery body -->
      <rect x="60" y="44" width="80" height="108" rx="16" fill="#4ade80" stroke="#15803d" stroke-width="5" />
      <!-- A plus sign -->
      <path d="M126 56 V68 M120 62 H132" stroke="#15803d" stroke-width="3.5" stroke-linecap="round" />
      <!-- The charge bar: a window with 3 of 4 blocks lit up -->
      <rect x="70" y="116" width="60" height="26" rx="7" fill="#f0fdf4" stroke="#15803d" stroke-width="3.5" />
      <rect x="75" y="121" width="11" height="16" rx="2.5" fill="#22c55e" />
      <rect x="89" y="121" width="11" height="16" rx="2.5" fill="#22c55e" />
      <rect x="103" y="121" width="11" height="16" rx="2.5" fill="#22c55e" />
      <rect x="117" y="121" width="9" height="16" rx="2.5" fill="#bbf7d0" />
      <!-- A shiny highlight -->
      <rect x="68" y="52" width="8" height="40" rx="4" fill="#ffffff" opacity="0.45" />
    `,
  };

  window.MoveNudgeCharacter = volt;
})();
