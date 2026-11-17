// wanted.js — The heat. Crimes raise stars and reset the decay clock; hide
// long enough and the city slowly forgets, one star at a time.
import { WANTED } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, lastCrime: '', lastCrimeReason: '', decayTimer: 0 };
}

export function addWanted(G, n, reason) {
  const w = G.wanted;
  w.stars = Math.min(WANTED.maxStars, w.stars + n);
  w.heat = Math.min(100, w.heat + n * 25);
  w.lastCrime = reason || '';
  w.lastCrimeReason = reason || '';
  w.decayTimer = 0;
  if (G.audio) G.audio.wantedUp();
}

export function clearWanted(G) {
  const w = G.wanted;
  w.stars = 0;
  w.heat = 0;
  w.decayTimer = 0;
}

export function updateWanted(G, dt) {
  const w = G.wanted;
  if (w.stars <= 0) {
    w.heat = Math.max(0, w.heat - dt * 4);
    return;
  }
  w.decayTimer += dt;
  if (w.decayTimer > WANTED.decayDelay) {
    w.heat = Math.max(0, w.heat - dt * 3);
    const over = w.decayTimer - WANTED.decayDelay;
    if (over > WANTED.decayInterval) {
      w.stars -= 1;
      w.decayTimer = WANTED.decayDelay;
      if (w.stars === 0) w.heat = 0;
    }
  }
}
