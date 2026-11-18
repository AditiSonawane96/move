// characters/mona.js
// ---------------------------------------------------------------------------
// Mona the monitor: a purple screen on a stand. Her face is on the screen.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  const mona = {
    id: 'mona',
    name: 'Mona',
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#c4b5fd', dark: '#6d28d9', light: '#f5f3ff' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 38, scale: 1.1 },

    colors: {
      limb: '#8b7bb8',
      hand: '#3b0764',
    },

    // The arms come out of the sides of the screen.
    joints: {
      shoulderLeft: [42, 96],
      shoulderRight: [158, 96],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 78, scale: 1.05 },

    body: `
      <!-- The stand: a neck and a foot -->
      <rect x="91" y="118" width="18" height="24" fill="#6d28d9" />
      <rect x="68" y="136" width="64" height="14" rx="7" fill="#6d28d9" />
      <!-- The screen's purple frame -->
      <rect x="34" y="34" width="132" height="90" rx="14" fill="#a78bfa" stroke="#6d28d9" stroke-width="5" />
      <!-- The screen itself, where the face is -->
      <rect x="45" y="44" width="110" height="70" rx="8" fill="#f5f3ff" stroke="#6d28d9" stroke-width="2.5" />
      <!-- A little power light -->
      <circle cx="154" cy="119" r="2.6" fill="#86efac" />
      <!-- A screen reflection -->
      <path d="M128 50 L148 50 L138 62 Z" fill="#ddd6fe" />
    `,
  };

  window.MoveNudgeCharacter = mona;
})();
