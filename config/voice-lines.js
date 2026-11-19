// config/voice-lines.js
// ---------------------------------------------------------------------------
// EVERYTHING the characters say lives here, so you can edit it in one place.
//
//   {name}      is replaced with your saved name
//   {exercise}  is replaced with the exercise, e.g. "10 squats"
//
// When a group has several lines, one is picked at random each time.
// ---------------------------------------------------------------------------

const VOICE_LINES = {
  // Said while waving, right after knocking on the screen.
  greetings: [
    "{name}, let's take a short break!",
    'Psst, {name}! Stand up with me!',
    '{name}, time to move!',
    "Hey {name}! Your legs called. They miss you!",
    '{name}! Quick break, you and me. Deal?',
  ],

  // The question on the card.
  howAreYou: ['How are you feeling?'],

  // When an exercise starts.
  startExercise: ['{name}, {exercise} with me. Ready? Go!', "Let's do {exercise} together, {name}. Go!"],

  // When the exercise timer runs out.
  exerciseFinished: ["That's time, {name}! Did you do it? Hit Done!", 'Phew! Nice moves, {name}. Press Done!'],

  // After the buttons.
  done: ['Woohoo! Great job, {name}! See you next round!'],
  snooze: ['Okay, 5 more minutes!'],
  skip: ['Okay {name}, next time then.'],

  // If you ignore the character.
  ignored30: ["Ahem. {name}, I'm waiting!"],
  ignored60: ['Yawwwn. {name}, come on, just one minute!'],
  ignored90: ["Found you, {name}! I'm sitting right here until you click!"],

  // Overclock, the Friday villain.
  villainGreeting: ["Ha ha ha! {name}, you can't defeat me! 10 push-ups or I stay!"],
  villainDefeated: ['Nooo! You win this time, {name}!'],
  villainSnooze: ["Five minutes! Then I'll be BACK!"],
  villainSkip: ['Mwahaha! Victory is mine, {name}!'],
};

// How the voices sound. pitch: 0 (low) to 2 (high). rate: speed, 1 = normal.
const VOICE_STYLES = {
  gadget: { pitch: 1.4, rate: 1.05 }, // the friendly gadget characters
  villain: { pitch: 0.6, rate: 0.9 }, // Overclock, the Friday villain
};

// Voices we'd love to use, best first. The first one found on the computer
// wins. If none are found, any English voice is used.
const PREFERRED_VOICES = [
  'Samantha', // Mac
  'Aria', // Windows (if installed)
  'Jenny', // Windows (if installed)
  'Ava', // Mac
  'Allison', // Mac
  'Karen', // Mac (Australian)
  'Zira', // Windows (always installed)
  'Google US English',
];

// Makes this file usable both in the windows (browser) and in Node.
if (typeof module !== 'undefined') module.exports = { VOICE_LINES, VOICE_STYLES, PREFERRED_VOICES };
else window.MoveNudgeVoiceConfig = { VOICE_LINES, VOICE_STYLES, PREFERRED_VOICES };
