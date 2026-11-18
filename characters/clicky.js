// characters/clicky.js
// ---------------------------------------------------------------------------
// Clicky the mouse: a light blue rounded computer mouse with a curly cord.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  const clicky = {
    id: 'clicky',
    name: 'Clicky',
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#93c5fd', dark: '#2563eb', light: '#eff6ff' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 42, scale: 1 },

    colors: {
      limb: '#7c93b3',
      hand: '#334155',
    },

    joints: {
      shoulderLeft: [60, 110],
      shoulderRight: [140, 110],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    // The buttons are at the top, so the face sits lower down.
    face: { x: 100, y: 108, scale: 0.95 },

    body: `
      <!-- The curly cord coming out of the top -->
      <path d="M100 42 C100 22 126 26 128 12 C130 0 114 -4 110 6" fill="none" stroke="#64748b" stroke-width="5" stroke-linecap="round" />
      <!-- The mouse body: a rounded egg shape -->
      <path d="M100 38 C134 38 144 62 144 96 C144 132 128 154 100 154 C72 154 56 132 56 96 C56 62 66 38 100 38 Z"
            fill="#93c5fd" stroke="#3b82f6" stroke-width="5" />
      <!-- The line between the two buttons, and the edge of the buttons -->
      <path d="M100 40 V80" stroke="#3b82f6" stroke-width="3.5" />
      <path d="M58 80 Q100 88 142 80" fill="none" stroke="#3b82f6" stroke-width="3.5" />
      <!-- The scroll wheel -->
      <rect x="94" y="50" width="12" height="22" rx="6" fill="#1e3a8a" />
      <rect x="97" y="54" width="6" height="5" rx="2" fill="#93c5fd" opacity="0.7" />
      <!-- A shiny highlight -->
      <path d="M68 70 Q70 52 86 46" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.55" />
    `,
  };

  window.MoveNudgeCharacter = clicky;
})();
