// random.js — Seeded random numbers (mulberry32) plus small helpers.
// Features: deterministic city generation and traffic so ?seed=N always builds the
// same Porto Verde, which is what makes the screenshot scenes repeatable.
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a seeded random function. */
export function randInt(random, min, max) {
  if (max < min) { const t = min; min = max; max = t; }
  return min + Math.floor(random() * (max - min + 1));
}

/** One element of an array, picked by a seeded random function. */
export function randPick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/** Clamp a value into [min, max]. */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Shortest signed angle difference, in radians. */
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Distance between two points. */
export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
