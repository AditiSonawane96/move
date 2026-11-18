// src/renderer/nudge/sounds.js
// ---------------------------------------------------------------------------
// Sound effects, created from scratch with the Web Audio API.
// No sound files needed: we build each sound from simple ingredients:
//   oscillator  a pure tone (like a tuning fork) whose pitch we can slide
//   noise       random crackle, like a tiny burst of static
//   gain        a volume knob we can turn up and down very quickly
//
// Sounds.knock()   a knuckle tapping on glass
// Sounds.jingle()  Christmas bells
// Sounds.spooky()  a Halloween ghost "wooo"
// ---------------------------------------------------------------------------

const Sounds = (() => {
  let ctx = null; // the "audio engine", created the first time it's needed
  let master = null; // overall volume for every sound

  function engine() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // A short burst of noise that fades out (the "click" of a knuckle).
  function noiseBurst(seconds) {
    const audio = engine();
    const length = Math.floor(audio.sampleRate * seconds);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const fade = (1 - i / length) ** 3; // loud at the start, quickly quieter
      data[i] = (Math.random() * 2 - 1) * fade;
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  function knock() {
    const audio = engine();
    const now = audio.currentTime;

    // 1. The "thud": a low tone that drops in pitch and dies away fast.
    const tone = audio.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(260, now);
    tone.frequency.exponentialRampToValueAtTime(90, now + 0.09);
    const toneVolume = audio.createGain();
    toneVolume.gain.setValueAtTime(0.0001, now);
    toneVolume.gain.exponentialRampToValueAtTime(0.9, now + 0.004);
    toneVolume.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    tone.connect(toneVolume).connect(master);
    tone.start(now);
    tone.stop(now + 0.16);

    // 2. The "click" of the knuckle on glass: bright noise, very short.
    const click = noiseBurst(0.035);
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 1.4;
    const clickVolume = audio.createGain();
    clickVolume.gain.value = 0.55;
    click.connect(filter).connect(clickVolume).connect(master);
    click.start(now);
  }

  // A short bell-like note at "frequency" (Hz), starting "when" seconds from now.
  function bellNote(frequency, when, length) {
    const audio = engine();
    const start = audio.currentTime + when;
    const tone = audio.createOscillator();
    tone.type = 'triangle';
    tone.frequency.value = frequency;
    const volume = audio.createGain();
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + length);
    tone.connect(volume).connect(master);
    tone.start(start);
    tone.stop(start + length + 0.05);
  }

  // A sleigh-bell "shake": a quick burst of very high, bright noise.
  function sleighBell(when) {
    const audio = engine();
    const bells = noiseBurst(0.09);
    const filter = audio.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const volume = audio.createGain();
    volume.gain.value = 0.25;
    bells.connect(filter).connect(volume).connect(master);
    bells.start(audio.currentTime + when);
  }

  // Christmas: the start of "Jingle Bells" (a traditional, free-to-use tune)
  // with sleigh bells on every beat.
  function jingle() {
    const E = 659, G = 784, C = 523, D = 587; // note pitches in Hz
    const beat = 0.22; // seconds
    // [note, how many beats it lasts]
    const tune = [[E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 3]];
    let time = 0;
    for (const [note, beats] of tune) {
      bellNote(note, time, beat * beats + 0.25);
      sleighBell(time);
      time += beat * beats;
    }
  }

  // Halloween: a wobbly, ghostly "wooo-ooo" sliding up and down, over a
  // low hum and a bit of wind.
  function spooky() {
    const audio = engine();
    const now = audio.currentTime;
    const length = 2.6;

    // The ghost voice: a pure tone whose pitch slides and wobbles.
    const ghost = audio.createOscillator();
    ghost.type = 'sine';
    ghost.frequency.setValueAtTime(320, now);
    ghost.frequency.linearRampToValueAtTime(520, now + 0.9);
    ghost.frequency.linearRampToValueAtTime(260, now + length);
    // The wobble: a slow oscillator that pushes the pitch up and down.
    const wobble = audio.createOscillator();
    wobble.frequency.value = 6;
    const wobbleAmount = audio.createGain();
    wobbleAmount.gain.value = 14;
    wobble.connect(wobbleAmount).connect(ghost.frequency);
    const ghostVolume = audio.createGain();
    ghostVolume.gain.setValueAtTime(0.0001, now);
    ghostVolume.gain.exponentialRampToValueAtTime(0.3, now + 0.3);
    ghostVolume.gain.exponentialRampToValueAtTime(0.0001, now + length);
    ghost.connect(ghostVolume).connect(master);

    // The low hum underneath.
    const hum = audio.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 55;
    const humFilter = audio.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 200;
    const humVolume = audio.createGain();
    humVolume.gain.setValueAtTime(0.0001, now);
    humVolume.gain.exponentialRampToValueAtTime(0.18, now + 0.5);
    humVolume.gain.exponentialRampToValueAtTime(0.0001, now + length);
    hum.connect(humFilter).connect(humVolume).connect(master);

    for (const node of [ghost, wobble, hum]) {
      node.start(now);
      node.stop(now + length + 0.1);
    }
  }

  // Plays a holiday sound by name ("jingle" or "spooky"), if it exists.
  function play(name) {
    if (name === 'jingle') jingle();
    if (name === 'spooky') spooky();
  }

  return { knock, jingle, spooky, play };
})();
