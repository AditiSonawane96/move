// characters/index.js
// ---------------------------------------------------------------------------
// The list of gadget buddies and who is "on duty" right now.
//
// Each entry's "id" must match a file in this folder: id "chip" = chip.js.
// That file holds the drawing; this list just says who's in the rotation.
// ---------------------------------------------------------------------------

// TO ADD A NEW CHARACTER:
//   1. Copy chip.js to a new file, e.g. toaster.js, and change the drawing.
//   2. Add a line here: { id: 'toaster', name: 'Toasty' },
//   3. (Optional) Add 'toaster' to ALL_CHARACTERS in
//      src/renderer/nudge/gallery.js to see it in the gallery.
const ROSTER = [
  { id: 'chip', name: 'Chip' }, // the CPU
  { id: 'clicky', name: 'Clicky' }, // the mouse
  { id: 'volt', name: 'Volt' }, // the battery
  { id: 'mona', name: 'Mona' }, // the monitor
  { id: 'keys', name: 'Keys' }, // the keyboard
  { id: 'bass', name: 'Bass' }, // the headphones
];

// Characters take turns: every nudge, the next buddy in the list comes
// (Chip, then Clicky, then Volt... then Chip again). "turn" is a counter
// that main.js saves and adds 1 to after each nudge.
// (The % sign means "remainder after dividing", so it loops back to Chip.)
function characterForTurn(turn = 0) {
  return ROSTER[turn % ROSTER.length];
}

// Special characters that are NOT in the normal rotation.
const VILLAIN = { id: 'overclock', name: 'Overclock' }; // Friday villain
const SPECIALS = [VILLAIN, { id: 'pumpkin', name: 'Pumpkin' }]; // pumpkin = Halloween

// On Fridays, the villain shows up instead about 1 time in 3.
const VILLAIN_CHANCE = 1 / 3;

// Who comes for the next nudge?
//   turn          whose turn it is (see characterForTurn)
//   holiday       today's holiday from config/holidays.js (or null)
//   forceVillain  true to always get the villain (developer testing)
function chooseCharacter({ turn = 0, date = new Date(), holiday = null, forceVillain = false } = {}) {
  const isFriday = date.getDay() === 5; // Sunday = 0, Monday = 1 ... Friday = 5
  if (forceVillain || (isFriday && Math.random() < VILLAIN_CHANCE)) return VILLAIN;
  if (holiday && holiday.character) {
    return SPECIALS.find((c) => c.id === holiday.character) || { id: holiday.character, name: holiday.name };
  }
  return characterForTurn(turn);
}

// Who the tray shows as coming next (the villain is a surprise, so not him).
function characterOnDuty({ turn = 0, holiday = null } = {}) {
  if (holiday && holiday.character) {
    return SPECIALS.find((c) => c.id === holiday.character) || { id: holiday.character, name: holiday.name };
  }
  return characterForTurn(turn);
}

module.exports = { ROSTER, SPECIALS, VILLAIN, characterForTurn, chooseCharacter, characterOnDuty };
