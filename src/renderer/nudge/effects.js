// src/renderer/nudge/effects.js
// ---------------------------------------------------------------------------
// Holiday effects around the character:
//   Effects.start('hearts', buddy)     hearts float up around it (Valentine's)
//   Effects.start('fireworks', buddy)  fireworks burst behind it (New Year)
//   Effects.stop()
//
// Each heart or spark is a tiny HTML element with a CSS animation
// (see "Holiday effects" in nudge.css). They remove themselves when done.
// ---------------------------------------------------------------------------

const Effects = (() => {
  let timer = null;
  const random = (min, max) => min + Math.random() * (max - min);
  const FIREWORK_COLORS = ['#f43f5e', '#facc15', '#22d3ee', '#a78bfa', '#4ade80', '#fb923c'];

  // Adds an element to the page and removes it after "ms" milliseconds.
  function addTemporary(element, ms) {
    document.body.appendChild(element);
    setTimeout(() => element.remove(), ms);
  }

  function spawnHeart(area) {
    const heart = document.createElement('div');
    heart.className = 'fx-heart';
    heart.textContent = '♥';
    heart.style.left = `${random(area.left - 40, area.right + 20)}px`;
    heart.style.top = `${random(area.top + area.height * 0.3, area.bottom - 20)}px`;
    heart.style.fontSize = `${random(18, 36)}px`;
    // Each heart drifts a little to the side as it floats up.
    heart.style.setProperty('--drift', `${random(-40, 40)}px`);
    addTemporary(heart, 2600);
  }

  function spawnFirework(area) {
    // Bursts happen above and around the character.
    const x = random(area.left - area.width, area.right + area.width);
    const y = random(area.top - area.height * 0.6, area.top + area.height * 0.3);
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const sparks = 16;
    for (let i = 0; i < sparks; i++) {
      const spark = document.createElement('div');
      spark.className = 'fx-spark';
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.background = color;
      // Spread the sparks evenly in a circle.
      const angle = (i / sparks) * Math.PI * 2;
      const distance = random(50, 90);
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      addTemporary(spark, 1300);
    }
  }

  function start(kind, buddy) {
    stop();
    const area = () => buddy.getBoundingClientRect(); // where the character is now
    if (kind === 'hearts') timer = setInterval(() => spawnHeart(area()), 380);
    if (kind === 'fireworks') timer = setInterval(() => spawnFirework(area()), 650);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  return { start, stop };
})();
