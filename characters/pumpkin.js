// characters/pumpkin.js
// ---------------------------------------------------------------------------
// Pumpkin: the Halloween special (Oct 25 to 31, see config/holidays.js).
// An orange pumpkin with a curly stem and a leaf.
// (See chip.js for an explanation of every field.)
// ---------------------------------------------------------------------------

(function () {
  const pumpkin = {
    id: 'pumpkin',
    name: 'Pumpkin',
    voiceStyle: 'gadget',

    theme: { main: '#fdba74', dark: '#6d28d9', light: '#fff7ed' },

    colors: {
      limb: '#65a30d',
      hand: '#365314',
    },

    joints: {
      shoulderLeft: [50, 104],
      shoulderRight: [150, 104],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    face: { x: 100, y: 96, scale: 1.05 },
    hat: { x: 100, y: 52, scale: 1 },

    body: `
      <!-- The stem and a leaf -->
      <path d="M98 56 C96 44 100 36 110 32" fill="none" stroke="#4d7c0f" stroke-width="9" stroke-linecap="round" />
      <path d="M108 44 C122 34 136 40 138 50 C126 54 114 52 108 44 Z" fill="#65a30d" stroke="#365314" stroke-width="2" />
      <!-- Pumpkin sections: two outer bumps, then the middle one on top -->
      <ellipse cx="72" cy="102" rx="30" ry="46" fill="#f97316" stroke="#9a3412" stroke-width="4" />
      <ellipse cx="128" cy="102" rx="30" ry="46" fill="#f97316" stroke="#9a3412" stroke-width="4" />
      <ellipse cx="100" cy="102" rx="34" ry="50" fill="#fb923c" stroke="#9a3412" stroke-width="4" />
      <!-- A shiny highlight -->
      <path d="M80 68 Q84 58 94 56" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.5" />
    `,
  };

  window.MoveNudgeCharacter = pumpkin;
})();
