// characters/keys.js
// ---------------------------------------------------------------------------
// Keys the keyboard: a wide orange keyboard with rows of keys.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  // Draw the rows of little keys with a small loop instead of typing
  // out 30 rectangles by hand.
  function keyRows() {
    let keys = '';
    const rows = [
      { y: 104, count: 10, start: 32 },
      { y: 117, count: 9, start: 38 },
    ];
    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        keys += `<rect x="${row.start + i * 13.6}" y="${row.y}" width="11" height="10" rx="2.5" fill="#fff7ed" />`;
      }
    }
    // The space bar, with a shift key on each side.
    keys += '<rect x="36" y="130" width="20" height="10" rx="2.5" fill="#fff7ed" />';
    keys += '<rect x="60" y="130" width="80" height="10" rx="3" fill="#fff7ed" />';
    keys += '<rect x="144" y="130" width="20" height="10" rx="2.5" fill="#fff7ed" />';
    return keys;
  }

  const keysCharacter = {
    id: 'keys',
    name: 'Keys',
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#fdba74', dark: '#c2410c', light: '#fff7ed' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 54, scale: 1.15 },

    colors: {
      limb: '#b98a6b',
      hand: '#7c2d12',
    },

    // A wide body, so the shoulders are far apart.
    joints: {
      shoulderLeft: [28, 98],
      shoulderRight: [172, 98],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 76, scale: 0.92 },

    body: `
      <!-- The keyboard body -->
      <rect x="22" y="50" width="156" height="100" rx="16" fill="#fb923c" stroke="#c2410c" stroke-width="5" />
      <!-- A darker panel where the keys sit -->
      <rect x="29" y="100" width="142" height="44" rx="8" fill="#ea580c" />
      ${keyRows()}
      <!-- A little status light -->
      <circle cx="162" cy="62" r="3" fill="#86efac" />
      <!-- A shiny highlight -->
      <rect x="32" y="57" width="34" height="6" rx="3" fill="#ffffff" opacity="0.45" />
    `,
  };

  window.MoveNudgeCharacter = keysCharacter;
})();
