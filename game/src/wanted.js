// Wanted level 0–5: crimes raise it, hiding lets it decay. Heat is the
// visible urgency — high heat means the PD is not going home soon.
import { WANTED } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, lastCrime: '', lastCrimeReason: '', decayTimer: 0 };
}

export function addWanted(G, n, reason) {
  const w = G.wanted;
  w.stars = Math.min(WANTED.maxStars, w.stars + n);
  w.heat = Math.min(100, w.heat + n * 22);
  w.lastCrime = reason;
  w.lastCrimeReason = reason;
  w.decayTimer = 0;
}

export function clearWanted(G) {
  G.wanted.stars = 0;
  G.wanted.heat = 0;
  G.wanted.decayTimer = 0;
}

export function updateWanted(G, dt) {
  const w = G.wanted;
  if (w.stars <= 0) {
    if (w.heat > 0) w.heat = Math.max(0, w.heat - 6 * dt);
    return;
  }
  w.decayTimer += dt;
  if (w.decayTimer > WANTED.decayDelay) {
    const over = w.decayTimer - WANTED.decayDelay;
    const lost = Math.floor(over / WANTED.decayInterval);
    if (lost > 0) {
      w.stars = Math.max(0, w.stars - lost);
      w.heat = Math.max(0, w.heat - lost * 25);
      w.decayTimer = WANTED.decayDelay + (over % WANTED.decayInterval);
      if (w.stars === 0) { w.heat = 0; w.decayTimer = 0; }
    }
  }
}
