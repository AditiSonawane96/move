// config/exercises.js
// ---------------------------------------------------------------------------
// Every exercise the characters can do. Edit freely!
//
// Each exercise has:
//   id       a short code name. It must match an animation in
//            src/renderer/nudge/exercises.css (like .ex-squats).
//   name     what the card shows as the title
//   group    "desk" = Desk friendly, "energy" = Full energy
//   reps     how many to do (shown on the card: "10 reps")
//   seconds  how long the character does it with you (the progress bar)
//   sayAs    how the character says it: "{name}, 10 squats with me. Ready? Go!"
//   howTo    one short tip, shown under "How to" on the card
//
// The card also shows "🔥 2 today", your count of completed nudges.
// ---------------------------------------------------------------------------

const EXERCISES = [
  // ----- Desk friendly -----
  {
    id: 'squats',
    name: 'Squats',
    group: 'desk',
    reps: 10,
    seconds: 60,
    sayAs: '10 squats',
    howTo: 'Feet hip-width apart. Sit back like there is a chair behind you, then stand tall.',
  },
  {
    id: 'calf-raises',
    name: 'Calf raises',
    group: 'desk',
    reps: 15,
    seconds: 60,
    sayAs: '15 calf raises',
    howTo: 'Rise up onto your toes, pause for a second, then lower slowly. Hold the desk if you need to.',
  },
  {
    id: 'arm-circles',
    name: 'Arm circles',
    group: 'desk',
    reps: 10,
    seconds: 60,
    sayAs: '10 arm circles',
    howTo: 'Arms straight out to the sides. Make big, slow circles, then switch direction.',
  },
  // Chair-friendly stretches: you can do these without getting up.
  {
    id: 'back-arch',
    name: 'Back arch',
    group: 'desk',
    reps: 8,
    seconds: 45,
    sayAs: '8 back arches',
    howTo: 'Sit tall, hands behind your head. Gently lean back over your chair and open your chest.',
  },
  {
    id: 'side-stretch',
    name: 'Side stretch',
    group: 'desk',
    reps: 6,
    seconds: 45,
    sayAs: '6 side stretches',
    howTo: 'Reach both arms overhead. Lean slowly to one side, breathe, then the other side.',
  },

  // ----- Full energy -----
  {
    id: 'jumping-jacks',
    name: 'Jumping jacks',
    group: 'energy',
    reps: 20,
    seconds: 60,
    sayAs: '20 jumping jacks',
    howTo: 'Jump your feet out wide while your arms swing overhead, then jump back in.',
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    group: 'energy',
    reps: 10,
    seconds: 60,
    sayAs: '10 push-ups',
    howTo: 'Hands under your shoulders, body in a straight line. Knees down is totally fine!',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain climbers',
    group: 'energy',
    reps: 20,
    seconds: 60,
    sayAs: '20 mountain climbers',
    howTo: 'Start in a plank. Drive one knee toward your chest, then switch legs quickly.',
  },
];

// Makes this file usable both by the nudge window (browser) and by Node.
if (typeof module !== 'undefined') module.exports = EXERCISES;
else window.MoveNudgeExercises = EXERCISES;
