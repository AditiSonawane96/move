// src/renderer/nudge/rig.js
// ---------------------------------------------------------------------------
// The "rig" is the shared skeleton every character uses. It takes a
// character file (like characters/chip.js) and builds one SVG drawing with:
//
//   shadow                      a soft shadow on the ground
//   char-root                   everything that moves together (bobbing, jumping)
//     arm-left  > forearm-left  each arm: upper arm, forearm, round hand
//     arm-right > forearm-right
//     leg-left  > shin-left     each leg: thigh, shin, foot
//     leg-right > shin-right
//     torso
//       body                    the character's own drawing
//       face                    eyebrows, eyes (with pupils), mouth
//
// HOW THE JOINTS WORK (important!)
// Each moving part is wrapped in TWO groups:
//   <g transform="translate(...)">   OUTER: puts the joint in the right place
//     <g class="joint arm-left">     INNER: the CSS animation rotates this one
// The inner group's (0, 0) point is exactly the joint (shoulder, elbow,
// hip, knee), so it rotates around the joint. If we put the animation on
// the outer group instead, the CSS animation would REPLACE the position
// and the part would jump to the top-left corner (or disappear).
// ---------------------------------------------------------------------------

// Limb sizes, shared by all characters so every exercise fits everyone.
const UPPER_ARM = 30;
const FOREARM = 28;
const THIGH = 36;
const SHIN = 36;
const LIMB_WIDTH = 10;

// How far the arms hang out from the body when resting (degrees).
const ARM_REST_ANGLE = 28;

// One arm. "side" is "left" or "right" (as you look at the screen).
function armMarkup(side, [x, y], colors) {
  // Positive angles swing the hand to the left, negative to the right,
  // so each arm hangs outward, away from the body.
  const rest = side === 'left' ? ARM_REST_ANGLE : -ARM_REST_ANGLE;
  return `
    <g class="shoulder-${side}" transform="translate(${x} ${y})">
      <g transform="rotate(${rest})">
        <g class="joint arm-${side}">
          <rect x="${-LIMB_WIDTH / 2}" y="-5" width="${LIMB_WIDTH}" height="${UPPER_ARM + 10}" rx="${LIMB_WIDTH / 2}" fill="${colors.limb}" />
          <g transform="translate(0 ${UPPER_ARM})">
            <g class="joint forearm-${side}">
              <rect x="${-LIMB_WIDTH / 2}" y="-5" width="${LIMB_WIDTH}" height="${FOREARM + 8}" rx="${LIMB_WIDTH / 2}" fill="${colors.limb}" />
              <circle class="hand" cx="0" cy="${FOREARM + 5}" r="9" fill="${colors.hand}" />
            </g>
          </g>
        </g>
      </g>
    </g>`;
}

// One leg, with a foot that points slightly outward.
function legMarkup(side, [x, y], colors) {
  const footOffset = side === 'left' ? -3 : 3;
  return `
    <g class="hip-${side}" transform="translate(${x} ${y})">
      <g class="joint leg-${side}">
        <rect x="${-LIMB_WIDTH / 2}" y="-5" width="${LIMB_WIDTH}" height="${THIGH + 10}" rx="${LIMB_WIDTH / 2}" fill="${colors.limb}" />
        <g transform="translate(0 ${THIGH})">
          <g class="joint shin-${side}">
            <rect x="${-LIMB_WIDTH / 2}" y="-5" width="${LIMB_WIDTH}" height="${SHIN + 5}" rx="${LIMB_WIDTH / 2}" fill="${colors.limb}" />
            <ellipse class="foot" cx="${footOffset}" cy="${SHIN + 3}" rx="12" ry="6.5" fill="${colors.hand}" />
          </g>
        </g>
      </g>
    </g>`;
}

// The face. Every part has its own class so expressions can change
// eyebrows, eyes and mouth separately (see face.js and face.css).
//
// Each eye is wrapped in THREE groups, so three animations never fight:
//   .eye       blinking (squashes flat for a moment)
//   .eye-size  expressions (wide when excited, half-closed when sleepy)
//   .pupil     glancing around
function faceMarkup({ x, y, scale }) {
  const eye = (side, ex) => `
    <g transform="translate(${ex} 0)">
      <g class="joint eye eye-${side}">
        <g class="joint eye-size">
          <ellipse class="eye-white" rx="8.5" ry="9.5" fill="#ffffff" stroke="#1f2937" stroke-width="2" />
          <g class="joint pupil">
            <circle r="5.2" fill="#1f2937" />
            <circle cx="1.8" cy="-2" r="1.8" fill="#ffffff" />
          </g>
        </g>
        <!-- Happy closed eyes, like upside-down U's (shown for "joy") -->
        <path class="eye-happy" d="M-7.5 3 Q0 -7 7.5 3" fill="none" stroke="#1f2937" stroke-width="3.5" stroke-linecap="round" />
      </g>
    </g>`;

  // All the mouth shapes. Only one is visible at a time: face.js picks it
  // by setting data-mouth="..." on the character (see face.css).
  const DARK = '#1f2937';
  const TONGUE = '#f87171';
  const mouths = `
    <path class="mouth-smile" d="M-11 -1 Q0 10 11 -1" fill="none" stroke="${DARK}" stroke-width="3.5" stroke-linecap="round" />
    <g class="mouth-grin">
      <path d="M-13 -3 Q0 0 13 -3 Q12 14 0 15 Q-12 14 -13 -3 Z" fill="${DARK}" />
      <ellipse cx="0" cy="10" rx="6" ry="3.5" fill="${TONGUE}" />
    </g>
    <g class="mouth-open">
      <ellipse cx="0" cy="3" rx="7" ry="8" fill="${DARK}" />
      <ellipse cx="0" cy="7.5" rx="4.5" ry="2.8" fill="${TONGUE}" />
    </g>
    <ellipse class="mouth-half" cx="0" cy="2" rx="7.5" ry="4" fill="${DARK}" />
    <circle class="mouth-oo" cx="0" cy="2" r="4" fill="${DARK}" />
    <path class="mouth-frown" d="M-10 6 Q0 -3 10 6" fill="none" stroke="${DARK}" stroke-width="3.5" stroke-linecap="round" />
    <g class="mouth-yawn">
      <ellipse cx="0" cy="5" rx="9" ry="13" fill="${DARK}" />
      <ellipse cx="0" cy="13" rx="5.5" ry="3.5" fill="${TONGUE}" />
    </g>
    <g class="mouth-teeth">
      <rect x="-12" y="-4" width="24" height="11" rx="3.5" fill="#ffffff" stroke="${DARK}" stroke-width="2.5" />
      <path d="M-12 1.5 H12 M-6 -4 V7 M0 -4 V7 M6 -4 V7" stroke="${DARK}" stroke-width="1.5" />
    </g>`;
  const brow = (side, bx) => `
    <g transform="translate(${bx} -17)">
      <g class="joint brow brow-${side}">
        <path d="M-7 1 Q0 -3 7 1" fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round" />
      </g>
    </g>`;
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <g class="joint head">
        ${brow('left', -14)} ${brow('right', 14)}
        ${eye('left', -14)} ${eye('right', 14)}
        <circle cx="-25" cy="12" r="5" fill="#fca5a5" opacity="0.7" />
        <circle cx="25" cy="12" r="5" fill="#fca5a5" opacity="0.7" />
        <g transform="translate(0 15)">
          <g class="joint mouth">${mouths}</g>
        </g>
      </g>
    </g>`;
}

// A Santa hat for Christmas. It sits at the character's "hat" spot (the
// top-middle of its head) and leans to one side with a white pom-pom.
function santaHatMarkup(spot = { x: 100, y: 40, scale: 1 }) {
  return `
    <g transform="translate(${spot.x} ${spot.y}) scale(${spot.scale || 1}) rotate(-10)">
      <path d="M-30 2 C-26 -30 4 -54 40 -42 C28 -34 22 -20 26 2 Z" fill="#dc2626" stroke="#991b1b" stroke-width="3" stroke-linejoin="round" />
      <circle cx="42" cy="-42" r="8.5" fill="#ffffff" stroke="#d1d5db" stroke-width="2" />
      <rect x="-36" y="-6" width="68" height="15" rx="7.5" fill="#ffffff" stroke="#d1d5db" stroke-width="2" />
    </g>`;
}

// Draws the character inside "container" (an HTML element).
//
// It also sets two CSS variables (--shoulder-y, --hip-y) used by
// exercises.css for push-ups and mountain climbers: when the character turns
// sideways, its arms and legs slide to the middle of its body.
// (Rule for character files: the body's centre line is at x = 100.)
// We set them from code because the app's security rules block style="..."
// written inside HTML.
// "extras" is optional, e.g. { hat: 'santa' } for Christmas.
function renderCharacter(container, character, extras = {}) {
  container.innerHTML = buildCharacterSVG(character, extras);
  const svg = container.querySelector('.rig');
  svg.style.setProperty('--shoulder-y', `${character.joints.shoulderRight[1]}px`);
  svg.style.setProperty('--hip-y', `${character.joints.hipRight[1]}px`);
}

// Puts it all together and returns the full SVG as text.
function buildCharacterSVG(character, extras = {}) {
  const { joints, colors } = character;
  return `
    <svg class="rig" viewBox="0 0 200 240" width="200" height="240" aria-label="${character.name}">
      <defs>
        <radialGradient id="shadow-gradient">
          <stop offset="0%" stop-color="#000" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse class="shadow" cx="100" cy="230" rx="58" ry="9" fill="url(#shadow-gradient)" />
      <g class="char-root">
        ${legMarkup('left', joints.hipLeft, colors)}
        ${legMarkup('right', joints.hipRight, colors)}
        ${armMarkup('left', joints.shoulderLeft, colors)}
        ${armMarkup('right', joints.shoulderRight, colors)}
        <!-- The torso (body + face) squashes thin when turning sideways. -->
        <g class="torso">
          <g class="body">${character.body}</g>
          ${faceMarkup(character.face)}
          ${extras.hat === 'santa' ? santaHatMarkup(character.hat) : ''}
        </g>
      </g>
    </svg>`;
}
