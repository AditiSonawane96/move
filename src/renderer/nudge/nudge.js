// src/renderer/nudge/nudge.js
// ---------------------------------------------------------------------------
// The "director" of a nudge. It runs the scene step by step:
//
//   1. Load the character and draw it.
//   2. Walk in from the left or right edge of the screen.
//   3. Knock on the "glass" of your screen 3 times, with an excited face.
//   4. Wave and say a greeting out loud (lines from config/voice-lines.js).
//   5. (Only if switched on in Settings) "How are you feeling?"
//      Desk friendly / Full energy.
//   6. A random exercise (from the chosen group, or from all). The character says
//      "{name}, 10 squats with me. Ready? Go!" and does it with you while a
//      progress bar fills up.
//   7. Done = victory dance. Snooze or Skip = a short goodbye.
//   8. Walk off screen and tell main.js we're finished.
//
// The helpers it uses:
//   buildCharacterSVG  (rig.js)     draws the character
//   Face               (face.js)    blinking, expressions, lip sync
//   Voice              (voice.js)   speaking out loud
//   Sounds             (sounds.js)  the knock, jingle and spooky sounds
//   Effects            (effects.js) holiday hearts and fireworks
//
// Also: reactions if you ignore it, the Friday villain (characters/
// overclock.js) and holiday specials (config/holidays.js, effects.js).
// ---------------------------------------------------------------------------

// ----- The parts of the page we control -----
const buddy = document.getElementById('buddy');
const rigHolder = document.getElementById('rig-holder');
const bubble = document.getElementById('bubble');
const card = document.getElementById('card');
const cardKicker = document.getElementById('card-kicker');
const cardTitle = document.getElementById('card-title');
const todayCount = document.getElementById('today-count');
const feelingStep = document.getElementById('feeling-step');
const exerciseStep = document.getElementById('exercise-step');
const exerciseMeta = document.getElementById('exercise-meta');
const howToText = document.getElementById('how-to-text');
const progressFill = document.getElementById('progress-fill');
const timeLeft = document.getElementById('time-left');
const doneButton = document.getElementById('btn-done');

// How tall the character is, as a share of your screen height, for each
// "Character size" choice in Settings. (0.42 = 42% of the screen height.)
const SIZE_SHARE_OF_SCREEN = { small: 0.25, medium: 0.33, large: 0.42, huge: 0.55 };

// The character is drawn at 200 x 240 and then scaled up or down.
// These two are set by applySize() once we know the screen and the setting.
let BUDDY_WIDTH = 200;
let WALK_SPEED = 240; // pixels per second (bigger characters take bigger steps)

// Exercises that happen lying down, in a plank (see exercises.css).
const PLANK_EXERCISES = ['push-ups', 'mountain-climbers'];

// Every body-movement class we might put on the character.
const POSES = ['idle', 'walking', 'knocking', 'waving', 'dancing', 'plank', 'tapping', 'yawning', 'sitting', 'defeated'];

// Talking to main.js goes through preload.js. If this page is opened in a
// normal browser (no preload), we use "demo mode" so you can still preview it.
const bridge = window.moveNudge;
const isDemo = !bridge || !bridge.getNudgeData;

// Lines and voice styles from config/voice-lines.js, exercises from
// config/exercises.js. (New names here: two files can't both declare
// "VOICE_LINES" or "EXERCISES".)
const LINES = window.MoveNudgeVoiceConfig.VOICE_LINES;
const STYLES = window.MoveNudgeVoiceConfig.VOICE_STYLES;
const ALL_EXERCISES = window.MoveNudgeExercises;

let nudge = null; // info from main.js: { name, characterId, voiceOn, ... }
let character = null; // the character's drawing info (from characters/*.js)
let buddyX = 0; // where the character currently stands (pixels from the left)
let enteredFromLeft = true;
let sentenceCount = 0; // counts sentences, see say()

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Pause the scene: "await wait(1000)" waits one second.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fill in a line: "{name}, {exercise}!" -> "Aditi, 10 squats!"
const fillIn = (text, exercise) =>
  text.replaceAll('{name}', nudge.name).replaceAll('{exercise}', exercise ? exercise.sayAs : '');

// Pick one item at random from a list.
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Scales the character (and its speech bubble) to fit your screen.
function applySize(sizeName) {
  const share = SIZE_SHARE_OF_SCREEN[sizeName] || SIZE_SHARE_OF_SCREEN.large;
  const scale = (window.innerHeight * share) / 240;
  // CSS reads this as var(--scale) (see nudge.css).
  document.documentElement.style.setProperty('--scale', scale);
  BUDDY_WIDTH = 200 * scale;
  WALK_SPEED = 240 * scale;
}

// Colours the speech bubble and card to match the character (see the
// "theme" in each characters/*.js file and --theme-... in nudge.css).
function applyTheme(theme) {
  if (!theme) return; // no theme: keep the default colours
  const root = document.documentElement.style;
  root.setProperty('--theme-main', theme.main);
  root.setProperty('--theme-dark', theme.dark);
  root.setProperty('--theme-light', theme.light);
}

// Switch the body movement. "pose" is one of POSES; "exercise" (optional)
// adds an exercise animation like "ex-squats" (see exercises.css).
function setPose(pose, exercise) {
  buddy.classList.remove(...POSES);
  for (const name of [...buddy.classList]) if (name.startsWith('ex-')) buddy.classList.remove(name);
  if (pose) buddy.classList.add(pose);
  if (exercise) buddy.classList.add(`ex-${exercise}`);
}

// Show a line in the speech bubble AND say it out loud, moving the mouth.
// "await say(...)" waits until the sentence is finished.
async function say(text, exercise) {
  const line = fillIn(text, exercise);
  bubble.textContent = line; // textContent: text only, never code
  bubble.hidden = false;
  const style = STYLES[character.voiceStyle] || STYLES.gadget;
  // If a new sentence starts before this one ends, only the newest one is
  // allowed to move the mouth (so an old "end" can't stop the new talking).
  const myTurn = ++sentenceCount;
  await Voice.speak(line, {
    pitch: style.pitch,
    rate: style.rate,
    onStart: () => myTurn === sentenceCount && Face.startTalking(),
    onEnd: () => myTurn === sentenceCount && Face.stopTalking(),
  });
}

function hideBubble() {
  bubble.hidden = true;
}

// Loads one character file from the "characters" folder.
function loadCharacter(id) {
  return new Promise((resolve, reject) => {
    // Only allow simple ids like "chip", so nothing odd can be loaded.
    if (!/^[a-z0-9-]+$/.test(id)) return reject(new Error(`Bad character id: ${id}`));
    const script = document.createElement('script');
    script.src = `../../../characters/${id}.js`;
    script.onload = () => resolve(window.MoveNudgeCharacter);
    script.onerror = () => reject(new Error(`Could not load character: ${id}`));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Moving around
// ---------------------------------------------------------------------------

// Moves the character to "x" pixels from the left, at walking speed,
// with the walking animation playing.
async function walkTo(x) {
  const distance = Math.abs(x - buddyX);
  buddy.classList.toggle('facing-left', x < buddyX);
  setPose('walking');

  const walk = buddy.animate(
    [{ transform: `translateX(${buddyX}px)` }, { transform: `translateX(${x}px)` }],
    { duration: (distance / WALK_SPEED) * 1000, easing: 'ease-in-out', fill: 'forwards' }
  );
  await walk.finished;

  // Keep the final position, then clean up the finished animation.
  buddyX = x;
  buddy.style.transform = `translateX(${x}px)`;
  walk.cancel();
  buddy.classList.remove('facing-left');
  setPose('idle');
}

// Instantly places the character (used before it walks in).
function placeAt(x) {
  buddyX = x;
  buddy.style.transform = `translateX(${x}px)`;
}

// ---------------------------------------------------------------------------
// Knocking on the glass
// ---------------------------------------------------------------------------
async function knockOnGlass() {
  Face.setExpression('excited');
  setPose('knocking');
  await wait(450); // time for the arm to come up
  for (let i = 0; i < 3; i++) {
    buddy.classList.add('knock-hit');
    Sounds.knock();
    showKnockEffect(i);
    await wait(130);
    buddy.classList.remove('knock-hit');
    await wait(240);
  }
  await wait(250);
}

// A ripple on the "glass" where the hand hits, plus a little "knock!".
function showKnockEffect(count) {
  const hand = buddy.querySelector('.arm-right .hand').getBoundingClientRect();
  const x = hand.left + hand.width / 2;
  const y = hand.top + hand.height / 2;

  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);

  const word = document.createElement('div');
  word.className = 'knock-word';
  word.textContent = 'knock!';
  word.style.left = `${x + (count - 1) * 22}px`; // spread the three words out
  word.style.top = `${y - 40}px`;
  document.body.appendChild(word);

  // Remove them once their animation is over.
  setTimeout(() => {
    ripple.remove();
    word.remove();
  }, 800);
}

// ---------------------------------------------------------------------------
// Click-through
// The window ignores the mouse, so clicks fall through to your desktop.
// Mouse MOVES still reach us, though. When the pointer is over the
// character or the card, we ask main.js to start catching clicks; when it
// leaves, clicks fall through again.
// ---------------------------------------------------------------------------
let catchingClicks = false;

document.addEventListener('mousemove', (event) => {
  const overSomething = Boolean(event.target.closest('.interactive'));
  if (overSomething !== catchingClicks) {
    catchingClicks = overSomething;
    if (!isDemo) bridge.setInteractive(overSomething);
  }
});

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

// Every card button has data-choice="..." (desk, energy, done, snooze, skip).
//
// nextChoice() gives back a promise for the next click. The click is kept
// until someone uses it with takeChoice(), so a click is never lost, even
// if you click while the character is still talking.
let choicePromise = null;
let resolveChoice = null;

function nextChoice() {
  if (!choicePromise) {
    choicePromise = new Promise((resolve) => {
      resolveChoice = resolve;
    });
  }
  return choicePromise;
}

card.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-choice]');
  if (!button) return;
  nextChoice(); // make sure there's a promise to put the click into
  if (resolveChoice) {
    resolveChoice(button.dataset.choice);
    resolveChoice = null; // ignore extra clicks until this one is used
  }
});

// Waits for a click (or uses one that already happened) and clears it.
async function takeChoice() {
  const choice = await nextChoice();
  choicePromise = null;
  return choice;
}

// "🔥 2 today" in the corner of the card.
function showTodayCount() {
  const n = nudge.streakToday || 0;
  todayCount.textContent = n > 0 ? `🔥 ${n} today` : '';
}

// Puts the card beside the character, on the side facing the middle of the
// screen. If that would push it off the edge, it uses the other side.
function positionCard() {
  card.hidden = false; // show it first, so we can measure its width
  const gap = 12;
  const cardWidth = card.offsetWidth;
  const roomOnRight = window.innerWidth - (buddyX + BUDDY_WIDTH + gap);
  const roomOnLeft = buddyX - gap;
  const goRight = enteredFromLeft
    ? roomOnRight >= cardWidth || roomOnRight > roomOnLeft
    : roomOnLeft < cardWidth && roomOnRight > roomOnLeft;
  const left = goRight ? buddyX + BUDDY_WIDTH + gap : buddyX - gap - cardWidth;
  // Never let it go past the screen edges.
  card.style.left = `${Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8))}px`;
}

// Step 1: "How are you feeling?"
function showFeelingCard(question) {
  const examples = (group) =>
    ALL_EXERCISES.filter((ex) => ex.group === group)
      .map((ex) => ex.name.toLowerCase())
      .slice(0, 3)
      .join(', ');
  document.getElementById('desk-examples').textContent = examples('desk');
  document.getElementById('energy-examples').textContent = examples('energy');

  cardKicker.textContent = `${character.name} says`;
  cardTitle.textContent = fillIn(question);
  feelingStep.hidden = false;
  exerciseStep.hidden = true;
  doneButton.hidden = true;
  showTodayCount();
  positionCard();
}

// Step 2: the exercise, with its tip and the progress bar.
function showExerciseCard(exercise) {
  cardKicker.textContent = exercise.group === 'desk' ? '🪑 Desk friendly' : '⚡ Full energy';
  cardTitle.textContent = exercise.name;
  exerciseMeta.textContent = `${exercise.reps} reps · ${exercise.seconds} sec`;
  howToText.textContent = exercise.howTo;
  feelingStep.hidden = true;
  exerciseStep.hidden = false;
  doneButton.hidden = false;
  progressFill.style.width = '0%';
  timeLeft.textContent = `${exercise.seconds}s left`;
  showTodayCount();
  positionCard();
}

function hideCard() {
  card.hidden = true;
}

// Fills the progress bar over "seconds". Gives back a promise that finishes
// when the time is up, and a stop() function to end it early.
function runProgress(seconds) {
  const start = performance.now();
  let frame = null;
  let finish = () => {};
  const done = new Promise((resolve) => {
    finish = resolve;
  });

  const update = () => {
    const elapsed = (performance.now() - start) / 1000;
    const share = Math.min(elapsed / seconds, 1);
    progressFill.style.width = `${share * 100}%`;
    timeLeft.textContent = share < 1 ? `${Math.ceil(seconds - elapsed)}s left` : "Time's up!";
    if (share < 1) frame = requestAnimationFrame(update);
    else finish('time-up');
  };
  frame = requestAnimationFrame(update);

  return { done, stop: () => cancelAnimationFrame(frame) };
}

// ---------------------------------------------------------------------------
// Exercising
// ---------------------------------------------------------------------------

// Start an exercise animation. Plank exercises first get down into the
// plank (a smooth 0.7 second move), then start moving.
async function startExercise(exercise) {
  Face.setExpression('effort');
  if (PLANK_EXERCISES.includes(exercise.id)) {
    // In a plank the head sticks out to the right. If the card is on the
    // right, lie down facing the other way so the head doesn't hit it.
    buddy.classList.toggle('facing-left', card.offsetLeft > buddyX);
    setPose('plank');
    await wait(700);
    setPose('plank', exercise.id);
  } else {
    setPose(null, exercise.id);
  }
}

// Stop exercising and stand back up.
async function stopExercise(exercise) {
  if (PLANK_EXERCISES.includes(exercise.id)) {
    setPose('plank'); // hold the plank for a moment...
    await wait(250);
  }
  setPose('idle'); // ...then spring back up
  buddy.classList.remove('facing-left');
  Face.setExpression(baseFace());
  await wait(500);
}

// The whole exercise part. Gives back "done", "snooze" or "skip".
//   group: "desk", "energy", "any" (all exercises) or "villain"
async function exerciseTogether(group) {
  let exercise;
  if (group === 'villain') {
    // The villain always demands his favourite exercise.
    exercise = ALL_EXERCISES.find((ex) => ex.id === character.villainExercise) || ALL_EXERCISES[0];
  } else {
    const choices = group === 'any' ? ALL_EXERCISES : ALL_EXERCISES.filter((ex) => ex.group === group);
    exercise = pickRandom(choices);
  }

  // Demo mode only: "?exercise=push-ups&seconds=5" in the address forces
  // an exercise and a shorter timer, handy for testing.
  if (isDemo) {
    const params = new URLSearchParams(location.search);
    const forced = ALL_EXERCISES.find((ex) => ex.id === params.get('exercise'));
    if (forced) exercise = forced;
    if (params.get('seconds')) exercise = { ...exercise, seconds: Number(params.get('seconds')) };
  }

  showExerciseCard(exercise);
  // (The villain already said what he wants in his greeting.)
  if (group !== 'villain') {
    Face.setExpression('excited');
    await say(pickRandom(LINES.startExercise), exercise);
  }
  hideBubble();

  await startExercise(exercise);
  const progress = runProgress(exercise.seconds);

  // Whichever comes first: you click a button, or the time runs out.
  const first = await Promise.race([nextChoice(), progress.done]);
  progress.stop();
  await stopExercise(exercise);

  if (first === 'time-up') {
    // Say "time's up", unless you already clicked something meanwhile.
    const clickedAlready = await Promise.race([nextChoice(), wait(0).then(() => null)]);
    if (!clickedAlready) await say(pickRandom(LINES.exerciseFinished));
  }
  // The button you clicked, or the next one you click. If you take a long
  // time, the character starts reacting (see "If you ignore it" below).
  return waitForChoiceWatching();
}

// ---------------------------------------------------------------------------
// If you ignore it
// While the character waits for a click, it gets more and more playful:
//   after 30 s  hands on hips, taps its foot, impatient face, "Ahem..."
//   after 60 s  a big stretchy yawn with a sleepy face
//   after 90 s  sits on your mouse cursor and follows it around
// (main.js decides the times; the developer menu can make them faster.)
// ---------------------------------------------------------------------------
async function waitForChoiceWatching() {
  const watch = startIgnoreWatch();
  const choice = await takeChoice();
  await watch.stop();
  return choice;
}

function startIgnoreWatch() {
  const [first, second, third] = nudge.escalateAfter || [30, 60, 90];
  const timers = [];
  let following = null;
  const after = (seconds, action) => timers.push(setTimeout(action, seconds * 1000));

  after(first, () => {
    Face.setExpression('impatient');
    setPose('tapping');
    say(pickRandom(LINES.ignored30));
  });
  after(second, () => {
    Face.setExpression('sleepy');
    setPose('yawning');
    say(pickRandom(LINES.ignored60));
  });
  after(third, () => {
    Face.setExpression('excited');
    following = followCursor();
    say(pickRandom(LINES.ignored90));
  });

  return {
    // You clicked: stop reacting, come back down, and calm the face.
    async stop() {
      timers.forEach(clearTimeout);
      if (following) await following.stop();
      hideBubble();
      setPose('idle');
      Face.setExpression(baseFace());
    },
  };
}

// The last known mouse position. Mouse moves reach this window even while
// it lets clicks fall through (see "Click-through" above).
let mouse = null;
document.addEventListener('mousemove', (event) => {
  mouse = { x: event.clientX, y: event.clientY };
});

// Shrinks the character a bit, sits it on top of your mouse pointer and
// follows the pointer smoothly. The mouse goes "through" the character
// (class "following"), so it never blocks a click.
function followCursor() {
  const SIT_SCALE = 0.7;
  // How far above the bottom of the drawing the bottom of its body is
  // (the hips are at y = 146 in the 240-tall drawing).
  const HIPS_FROM_BOTTOM = (240 - 146) / 240;

  buddy.classList.add('following');
  setPose('sitting');
  let x = buddyX;
  let y = 0;
  let frame = null;

  const step = () => {
    if (mouse) {
      const seatHeight = buddy.offsetHeight * HIPS_FROM_BOTTOM * SIT_SCALE;
      const targetX = mouse.x - BUDDY_WIDTH / 2;
      // y = 0 means "standing on the bottom of the screen"; negative = higher.
      // Never go so high that the speech bubble leaves the top of the screen.
      const highest = -(window.innerHeight - buddy.offsetHeight * SIT_SCALE - 110);
      const targetY = Math.max(highest, Math.min(0, mouse.y - 4 + seatHeight - window.innerHeight));
      // Move 20% of the way each frame: smooth and a little bit lazy.
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
    }
    buddy.style.transform = `translate(${x}px, ${y}px) scale(${SIT_SCALE})`;
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);

  return {
    // Hop back down to the ground right below, at normal size.
    async stop() {
      cancelAnimationFrame(frame);
      const landX = Math.max(0, Math.min(x, window.innerWidth - BUDDY_WIDTH));
      const hop = buddy.animate(
        [{ transform: buddy.style.transform }, { transform: `translate(${landX}px, 0px) scale(1)` }],
        { duration: 600, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)', fill: 'forwards' }
      );
      await hop.finished;
      buddyX = landX;
      buddy.style.transform = `translateX(${landX}px)`;
      hop.cancel();
      buddy.classList.remove('following');
    },
  };
}

// The villain falls over and fades away instead of walking off.
async function villainDefeat() {
  Face.setExpression('sleepy');
  setPose('defeated');
  await Promise.all([say(pickRandom(LINES.villainDefeated)), wait(2700)]);
  await wait(500);
  hideBubble();
  const fade = buddy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' });
  await fade.finished;
}

// ---------------------------------------------------------------------------
// The scene, step by step
// ---------------------------------------------------------------------------
async function runNudge() {
  // 1. Get the info, draw the character and bring its face to life.
  nudge = isDemo ? demoNudge() : await bridge.getNudgeData();
  applySize(nudge.characterSize);
  character = await loadCharacter(nudge.characterId);
  const isVillain = Boolean(character.isVillain);
  const holiday = window.MoveNudgeHolidays.HOLIDAYS.find((h) => h.id === nudge.holidayId) || null;
  renderCharacter(rigHolder, character, { hat: holiday ? holiday.hat : null });
  applyTheme(character.theme);
  Face.attach(buddy);
  Face.setExpression(baseFace());
  Voice.configure({ enabled: nudge.voiceOn, voiceName: nudge.voiceName });

  // 2. Walk in from a random side and stop a little way in.
  const screenWidth = window.innerWidth;
  enteredFromLeft = Math.random() < 0.5;
  placeAt(enteredFromLeft ? -BUDDY_WIDTH - 20 : screenWidth + 20);
  const stopX = enteredFromLeft
    ? Math.round(screenWidth * 0.12)
    : Math.round(screenWidth * 0.88 - BUDDY_WIDTH);
  await walkTo(stopX);

  // Holiday hearts or fireworks keep going until the character leaves.
  if (holiday && holiday.effect) Effects.start(holiday.effect, buddy);

  // 3. Knock on the glass.
  await wait(250);
  await knockOnGlass();

  // 4. The greeting: the villain's challenge, a holiday line, or a normal
  //    greeting with a wave. The villain stands with hands on hips instead.
  let greetings = LINES.greetings;
  if (holiday && holiday.greeting) greetings = [holiday.greeting];
  if (isVillain) greetings = LINES.villainGreeting;
  if (holiday && holiday.sound) Sounds.play(holiday.sound);
  Face.setExpression(baseFace());
  setPose(isVillain ? 'tapping' : 'waving');
  await Promise.all([say(pickRandom(greetings)), wait(2400)]);
  setPose('idle');

  // 5. "How are you feeling?" Only if it's switched on in Settings (and
  //    never for the villain, he decides!). Otherwise a random exercise.
  let choice = isVillain ? 'villain' : 'any';
  if (!isVillain && nudge.askFeeling) {
    const question = pickRandom(LINES.howAreYou);
    showFeelingCard(question);
    say(question); // (no "await": the buttons work while it's still talking)
    choice = await waitForChoiceWatching();
    hideBubble();
  }

  // 6. Exercise together.
  if (['desk', 'energy', 'any', 'villain'].includes(choice)) {
    choice = await exerciseTogether(choice);
  }
  hideCard();

  // 7. React to the choice.
  let walkOff = true;
  if (choice === 'done' && isVillain) {
    await villainDefeat();
    walkOff = false; // he already faded away
  } else if (choice === 'done') {
    Face.setExpression('joy');
    setPose('dancing');
    await Promise.all([say(pickRandom(LINES.done)), wait(3000)]);
    setPose('idle');
  } else if (choice === 'snooze') {
    Face.setExpression(baseFace());
    await say(pickRandom(isVillain ? LINES.villainSnooze : LINES.snooze));
  } else {
    Face.setExpression(isVillain ? 'excited' : 'impatient');
    await say(pickRandom(isVillain ? LINES.villainSkip : LINES.skip));
  }
  await wait(300);
  hideBubble();

  // 8. Walk back out the way we came.
  if (walkOff) await walkTo(enteredFromLeft ? -BUDDY_WIDTH - 40 : screenWidth + 40);
  Effects.stop();

  if (isDemo) {
    // In a normal browser, just play the scene again.
    location.reload();
  } else {
    bridge.finishNudge(choice);
  }
}

// The resting expression: happy for gadgets, grumpy for the villain.
function baseFace() {
  return (character && character.defaultExpression) || 'happy';
}

// Demo mode (page opened in a browser): pretend settings, with a few
// options in the address bar for testing:
//   ?character=overclock  ?holiday=christmas  ?fast (ignore reactions after
//   5/10/15 s)  ?ask (ask how you're feeling)  ?exercise=squats&seconds=5
function demoNudge() {
  const params = new URLSearchParams(location.search);
  return {
    name: 'friend',
    characterId: params.get('character') || 'chip',
    holidayId: params.get('holiday'),
    voiceOn: false,
    voiceName: '',
    characterSize: 'large',
    streakToday: 2,
    askFeeling: params.has('ask'),
    escalateAfter: params.has('fast') ? [5, 10, 15] : [30, 60, 90],
  };
}

runNudge().catch((error) => {
  // If anything goes wrong, never leave a frozen character on screen.
  console.error(error);
  if (!isDemo) bridge.finishNudge('skip');
});
