// characters/chip.js
// ---------------------------------------------------------------------------
// Chip the CPU: a mint green square chip with gray pins.
//
// A character file only describes how the character LOOKS. The shared
// skeleton ("rig", in src/renderer/nudge/rig.js) adds the arms, legs and face
// in the right places, so every character can walk, wave and exercise.
//
// Drawing area: 200 wide x 240 tall. The ground (where feet touch) is at y=228.
// To make a new character, copy this file, change the colours, joints and
// body drawing, and add it to the list in characters/index.js.
// ---------------------------------------------------------------------------

(function () {
  const chip = {
    id: 'chip',
    name: 'Chip',

    // Which voice style to use (see config/voice-lines.js).
    voiceStyle: 'gadget',

    // Colours for the speech bubble and card: main (buttons), dark (borders
    // and headings), light (backgrounds).
    theme: { main: '#6ee7b7', dark: '#24a075', light: '#ecfdf5' },

    // Where a hat sits (for holidays like Christmas): the top-middle of the head.
    hat: { x: 100, y: 46, scale: 1 },

    // Colours for the arms/legs and the round hands/feet.
    colors: {
      limb: '#9aa3ad',
      hand: '#4b5563',
    },

    // Where the arms and legs attach to the body: [x, y].
    joints: {
      shoulderLeft: [54, 108],
      shoulderRight: [146, 108],
      hipLeft: [84, 146],
      hipRight: [116, 146],
    },

    // Where the face sits on the body, and how big it is (1 = normal).
    face: { x: 100, y: 90, scale: 1 },

    // The body drawing itself (SVG). Arms and legs are drawn behind it.
    body: `
      <!-- Gray pins on top and on the sides -->
      <g fill="#9aa3ad">
        <rect x="70" y="34" width="12" height="20" rx="3" />
        <rect x="94" y="34" width="12" height="20" rx="3" />
        <rect x="118" y="34" width="12" height="20" rx="3" />
        <rect x="40" y="64" width="20" height="11" rx="3" />
        <rect x="40" y="86" width="20" height="11" rx="3" />
        <rect x="140" y="64" width="20" height="11" rx="3" />
        <rect x="140" y="86" width="20" height="11" rx="3" />
      </g>
      <!-- The chip body -->
      <rect x="56" y="48" width="88" height="102" rx="18" fill="#6ee7b7" stroke="#24a075" stroke-width="5" />
      <!-- A shiny highlight, and a tiny circuit line for detail -->
      <rect x="66" y="56" width="30" height="8" rx="4" fill="#ffffff" opacity="0.45" />
      <path d="M70 136 H90 L96 130 H130" fill="none" stroke="#24a075" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    `,
  };

  // Hand this character to the nudge window.
  window.MoveNudgeCharacter = chip;
})();
