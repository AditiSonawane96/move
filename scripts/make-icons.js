// scripts/make-icons.js
// ---------------------------------------------------------------------------
// Draws the little "Chip" tray icons as PNG files, using only plain Node.js
// (no image editor, no extra packages). You only need to run this if you want
// to change how the tray icon looks:   npm run icons
//
// How it works, in short:
//   1. We describe the picture as a list of shapes (rectangles, circles...).
//   2. For every pixel we ask "which shape is on top here?" and colour it.
//   3. We pack those pixels into the PNG file format and save it.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ----- Part 1: shape helpers ------------------------------------------------
// Every helper returns a function that answers: "is point (x, y) inside me?"
// Coordinates go from 0 to 1, so the same drawing works at any size.

const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

const roundRect = (x0, y0, x1, y1, r) => (x, y) => {
  if (!rect(x0, y0, x1, y1)(x, y)) return false;
  // Clamp the point into the "inner" rectangle; if it is further than r away
  // from that, it is in a cut-off corner.
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

// A smile: part of a ring, only the bottom half.
const smile = (cx, cy, rInner, rOuter) => (x, y) => {
  const d2 = (x - cx) ** 2 + (y - cy) ** 2;
  return d2 >= rInner * rInner && d2 <= rOuter * rOuter && y > cy + 0.03;
};

// ----- Part 2: the Chip drawing ----------------------------------------------
// Layers are drawn in order: later layers cover earlier ones.
// A colour is [red, green, blue, alpha] with values 0-255.
function chipLayers({ pin, border, body, face }) {
  const layers = [];
  // Three pins sticking out of each side of the chip.
  for (const t of [0.36, 0.5, 0.64]) {
    layers.push({ shape: rect(t - 0.045, 0.06, t + 0.045, 0.25), color: pin }); // top
    layers.push({ shape: rect(t - 0.045, 0.75, t + 0.045, 0.94), color: pin }); // bottom
    layers.push({ shape: rect(0.06, t - 0.045, 0.25, t + 0.045), color: pin }); // left
    layers.push({ shape: rect(0.75, t - 0.045, 0.94, t + 0.045), color: pin }); // right
  }
  layers.push({ shape: roundRect(0.18, 0.18, 0.82, 0.82, 0.13), color: border });
  layers.push({ shape: roundRect(0.23, 0.23, 0.77, 0.77, 0.09), color: body });
  layers.push({ shape: circle(0.4, 0.45, 0.065), color: face }); // left eye
  layers.push({ shape: circle(0.6, 0.45, 0.065), color: face }); // right eye
  layers.push({ shape: smile(0.5, 0.5, 0.1, 0.16), color: face }); // smile
  return layers;
}

// Mac "template" icon: pure black + transparency. macOS recolours it
// automatically so it looks right in both light and dark menu bars.
// The face is "cut out" (transparent) so you can see through it.
const BLACK = [0, 0, 0, 255];
const CLEAR = [0, 0, 0, 0];
const macLayers = chipLayers({ pin: BLACK, border: BLACK, body: BLACK, face: CLEAR });

// Windows icon: full colour, mint green chip with gray pins.
const winLayers = chipLayers({
  pin: [154, 163, 173, 255],
  border: [36, 160, 117, 255],
  body: [110, 231, 183, 255],
  face: [31, 41, 55, 255],
});

// The app icon (installer, Dock, Start menu): Chip on a rounded square.
// "shrink" squeezes Chip's drawing into the middle 64% of the icon.
const shrink = (shape) => (x, y) => shape((x - 0.18) / 0.64, (y - 0.2) / 0.64);
const appIconLayers = [
  { shape: roundRect(0.08, 0.08, 0.92, 0.92, 0.2), color: [255, 248, 239, 255] }, // cream tile
  { shape: roundRect(0.08, 0.66, 0.92, 0.92, 0.2), color: [254, 215, 170, 255] }, // warm floor
  { shape: rect(0.08, 0.66, 0.92, 0.72), color: [254, 215, 170, 255] },
  ...winLayers.map((layer) => ({ shape: shrink(layer.shape), color: layer.color })),
];

// ----- Part 3: turn shapes into pixels ---------------------------------------
// We check several sample points inside each pixel and average them, which
// gives smooth (anti-aliased) edges instead of jagged ones. Big images use
// fewer samples per pixel (smooth enough, and much faster).
function render(layers, size) {
  const pixels = Buffer.alloc(size * size * 4);
  const SAMPLES = size > 256 ? 2 : 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px + (sx + 0.5) / SAMPLES) / size;
          const y = (py + (sy + 0.5) / SAMPLES) / size;
          let color = CLEAR;
          for (const layer of layers) if (layer.shape(x, y)) color = layer.color;
          const alpha = color[3] / 255;
          r += color[0] * alpha; g += color[1] * alpha; b += color[2] * alpha; a += alpha;
        }
      }
      const i = (py * size + px) * 4;
      pixels[i] = a ? Math.round(r / a) : 0;
      pixels[i + 1] = a ? Math.round(g / a) : 0;
      pixels[i + 2] = a ? Math.round(b / a) : 0;
      pixels[i + 3] = Math.round((a / (SAMPLES * SAMPLES)) * 255);
    }
  }
  return pixels;
}

// ----- Part 4: the PNG file format -------------------------------------------
// A PNG is a fixed "signature" followed by chunks: IHDR (size info),
// IDAT (the compressed pixels) and IEND (the end). Each chunk has a checksum.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePNG(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); // width
  header.writeUInt32BE(size, 4); // height
  header[8] = 8; // 8 bits per colour channel
  header[9] = 6; // colour type 6 = red, green, blue + alpha
  // Each row of pixels starts with a "filter" byte; 0 means "no filter".
  const rowLength = size * 4;
  const raw = Buffer.alloc((rowLength + 1) * size);
  for (let y = 0; y < size; y++) {
    pixels.copy(raw, y * (rowLength + 1) + 1, y * rowLength, (y + 1) * rowLength);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ----- Part 5: save the files ------------------------------------------------
// "@2x" files are the sharper versions used on Retina / high-DPI screens.
// Electron picks the right one automatically.
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const files = [
  ['trayTemplate.png', macLayers, 16],
  ['trayTemplate@2x.png', macLayers, 32],
  ['tray-win.png', winLayers, 16],
  ['tray-win@2x.png', winLayers, 32],
];

for (const [name, layers, size] of files) {
  fs.writeFileSync(path.join(outDir, name), encodePNG(size, render(layers, size)));
  console.log(`Saved assets/${name} (${size}x${size})`);
}

// The app icon goes in the "build" folder, where electron-builder looks for
// it. It turns this one big PNG into the Mac (.icns) and Windows (.ico) icons.
const buildDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'icon.png'), encodePNG(1024, render(appIconLayers, 1024)));
console.log('Saved build/icon.png (1024x1024)');
