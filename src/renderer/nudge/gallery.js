// src/renderer/nudge/gallery.js
// ---------------------------------------------------------------------------
// Fills the gallery page with one tile per pose, exercise and expression,
// for one or more characters.
//
// Options in the address bar:
//   ?character=chip           one character
//   ?character=chip,volt      several characters
//   (no character)            every character
//   &only=squats              only tiles whose label contains this word
//   &scale=2                  draw everything bigger
//   &hat=santa                add the Christmas hat
// ---------------------------------------------------------------------------

const ALL_CHARACTERS = ['chip', 'clicky', 'volt', 'mona', 'keys', 'bass', 'overclock', 'pumpkin'];

const grid = document.getElementById('grid');
const params = new URLSearchParams(location.search);
const characterIds = params.get('character') ? params.get('character').split(',') : ALL_CHARACTERS;
const only = (params.get('only') || '').toLowerCase();
document.documentElement.style.setProperty('--scale', params.get('scale') || 1);

// What to show: [label, pose class, exercise id, expression]
const TILES = [
  ['Idle', 'idle', null, 'happy'],
  ['Walking', 'walking', null, 'happy'],
  ['Knocking', 'knocking', null, 'excited'],
  ['Waving', 'waving', null, 'happy'],
  ...window.MoveNudgeExercises.map((ex) => [
    ex.name,
    ['push-ups', 'mountain-climbers'].includes(ex.id) ? 'plank' : null,
    ex.id,
    'effort',
  ]),
  ['Victory dance', 'dancing', null, 'joy'],
  ['Impatient (tapping)', 'tapping', null, 'impatient'],
  ['Sleepy (yawning)', 'yawning', null, 'sleepy'],
  ['Sitting on cursor', 'sitting', null, 'excited'],
  ['Defeated', 'defeated', null, 'sleepy'],
];

const MOUTH_FOR = { happy: 'smile', excited: 'grin', joy: 'grin', impatient: 'frown', sleepy: 'yawn', effort: 'teeth' };

// Loads one character file and gives back its info.
function loadCharacter(id) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `../../../characters/${id}.js`;
    script.onload = () => resolve(window.MoveNudgeCharacter);
    script.onerror = () => reject(new Error(`Could not load ${id}`));
    document.head.appendChild(script);
  });
}

function addTile(character, [label, pose, exercise, expression]) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  const buddy = document.createElement('div');
  buddy.className = 'buddy';
  if (pose) buddy.classList.add(pose);
  if (exercise) buddy.classList.add(`ex-${exercise}`);
  const holder = document.createElement('div');
  holder.className = 'rig-holder';
  renderCharacter(holder, character, { hat: params.get('hat') });
  buddy.appendChild(holder);
  buddy.dataset.face = expression;
  buddy.dataset.mouth = MOUTH_FOR[expression];
  const caption = document.createElement('p');
  caption.textContent = characterIds.length > 1 ? `${character.name}: ${label}` : label;
  tile.append(buddy, caption);
  grid.appendChild(tile);
}

async function buildGallery() {
  // Load the characters one at a time (each file sets window.MoveNudgeCharacter).
  const characters = [];
  for (const id of characterIds) characters.push(await loadCharacter(id));
  document.querySelector('h1').textContent = `MoveNudge gallery: ${characters.map((c) => c.name).join(', ')}`;

  for (const tileInfo of TILES) {
    if (only && !tileInfo[0].toLowerCase().includes(only)) continue;
    for (const character of characters) addTile(character, tileInfo);
  }
}

buildGallery();
