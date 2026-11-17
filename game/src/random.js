// random.js — The game's only source of randomness: a small seeded generator.
// Everything that must be identical between two runs (traffic, pedestrians,
// buildings, thug spawns, radio rotation) draws from here. Never use
// Math.random or Date.now in any render or simulation path.
export function createRandom(seed) {
  let a = (seed >>> 0) || 1;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
