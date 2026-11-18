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

// Characters take turns by the hour: every new hour, the next buddy in the
// list takes over (midnight Chip, 1am Clicky, 2am Volt... 6am Chip again).
// (The % sign means "remainder after dividing", so it loops back to Chip.)
function characterForHour(hour = new Date().getHours()) {
  return ROSTER[hour % ROSTER.length];
}

// Special characters that are NOT in the hourly rotation.
const VILLAIN = { id: 'overclock', name: 'Overclock' }; // Friday villain
const SPECIALS = [VILLAIN, { id: 'pumpkin', name: 'Pumpkin' }]; // pumpkin = Halloween

// On Fridays, the villain shows up instead about 1 time in 3.
const VILLAIN_CHANCE = 1 / 3;

// Who comes for the next nudge?
//   holiday       today's holiday from config/holidays.js (or null)
//   forceVillain  true to always get the villain (developer testing)
function chooseCharacter({ date = new Date(), holiday = null, forceVillain = false } = {}) {
  const isFriday = date.getDay() === 5; // Sunday = 0, Monday = 1 ... Friday = 5
  if (forceVillain || (isFriday && Math.random() < VILLAIN_CHANCE)) return VILLAIN;
  if (holiday && holiday.character) {
    return SPECIALS.find((c) => c.id === holiday.character) || { id: holiday.character, name: holiday.name };
  }
  return characterForHour(date.getHours());
}

// Who the tray shows as "on duty" (the villain is a surprise, so not him).
function characterOnDuty({ date = new Date(), holiday = null } = {}) {
  if (holiday && holiday.character) {
    return SPECIALS.find((c) => c.id === holiday.character) || { id: holiday.character, name: holiday.name };
  }
  return characterForHour(date.getHours());
}

module.exports = { ROSTER, SPECIALS, VILLAIN, characterForHour, chooseCharacter, characterOnDuty };
