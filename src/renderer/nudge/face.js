// src/renderer/nudge/face.js
// ---------------------------------------------------------------------------
// Makes the face feel alive:
//   - blinks every few seconds (at random, like a real person)
//   - pupils glance around while it isn't talking
//   - expressions: happy, excited, impatient, sleepy, effort, joy
//   - lip sync: while talking, the mouth flips between open, half-open and
//     "oo" shapes, and the head gives a small nod
//
// face.css decides how each expression LOOKS. This file decides WHEN.
// Use it like:  Face.attach(buddyElement);  Face.setExpression('excited');
// ---------------------------------------------------------------------------

const Face = (() => {
  // The mouth each expression uses when the character isn't talking.
  const RESTING_MOUTH = {
    happy: 'smile',
    excited: 'grin',
    impatient: 'frown',
    sleepy: 'yawn',
    effort: 'teeth',
    joy: 'grin',
  };

  // Mouth shapes used for lip sync while talking.
  const TALK_SHAPES = ['open', 'half', 'oo'];

  let el = null; // the character's element (#buddy)
  let expression = 'happy';
  let talking = false;
  let lipSyncTimer = null;
  let effortTimer = null;

  // A random number between min and max.
  const random = (min, max) => min + Math.random() * (max - min);

  function attach(element) {
    el = element;
    setExpression('happy');
    scheduleBlink();
    scheduleGlance();
  }

  function setMouth(shape) {
    if (el) el.dataset.mouth = shape; // sets data-mouth="..." on the element
  }

  // ----- Expressions -----
  function setExpression(name) {
    expression = RESTING_MOUTH[name] ? name : 'happy';
    el.dataset.face = expression;

    // "Effort" breathes: gritted teeth, then an "oo" breath, over and over.
    clearInterval(effortTimer);
    if (expression === 'effort') {
      effortTimer = setInterval(() => {
        if (!talking) setMouth(el.dataset.mouth === 'teeth' ? 'oo' : 'teeth');
      }, 700);
    }
    if (!talking) setMouth(RESTING_MOUTH[expression]);
  }

  // ----- Blinking -----
  // Blink, then plan the next blink 2 to 5 seconds later.
  function scheduleBlink() {
    setTimeout(() => {
      blink();
      // Sometimes do a quick double blink, it looks more natural.
      if (Math.random() < 0.2) setTimeout(blink, 250);
      scheduleBlink();
    }, random(2000, 5000));
  }

  function blink() {
    if (!el || expression === 'joy') return; // joy eyes are already closed
    el.classList.add('blinking');
    setTimeout(() => el.classList.remove('blinking'), 130);
  }

  // ----- Glancing -----
  // Every 1-3 seconds, look somewhere new. While talking, look at you.
  function scheduleGlance() {
    setTimeout(() => {
      glance();
      scheduleGlance();
    }, random(1000, 3000));
  }

  function glance() {
    if (!el) return;
    const lookAtYou = talking || Math.random() < 0.3;
    const x = lookAtYou ? 0 : random(-2.8, 2.8);
    const y = lookAtYou ? 0 : random(-2, 2);
    for (const pupil of el.querySelectorAll('.pupil')) {
      pupil.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  // ----- Lip sync -----
  function startTalking() {
    if (!el || talking) return;
    talking = true;
    el.classList.add('talking');
    glance(); // look at you while talking
    let last = '';
    lipSyncTimer = setInterval(() => {
      // Pick a different shape than last time, so the mouth keeps moving.
      const options = TALK_SHAPES.filter((shape) => shape !== last);
      last = options[Math.floor(Math.random() * options.length)];
      setMouth(last);
    }, random(95, 140));
  }

  function stopTalking() {
    if (!el || !talking) return;
    talking = false;
    clearInterval(lipSyncTimer);
    el.classList.remove('talking');
    setMouth(RESTING_MOUTH[expression]);
  }

  return { attach, setExpression, startTalking, stopTalking, blink };
})();
