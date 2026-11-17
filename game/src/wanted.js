// Wanted level: stars rise with crimes, cool down when the player stays clean.
import { WANTED } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, lastCrime: '', lastCrimeReason: '', decayTimer: 0 };
}

export function addWanted(G, n, reason) {
  const w = G.wanted;
  const before = w.stars;
  w.stars = Math.min(WANTED.maxStars, w.stars + n);
  w.heat = Math.min(100, w.heat + n * 18);
  w.lastCrime = reason || 'crime';
  w.lastCrimeReason = reason || 'crime';
  w.decayTimer = 0;
  if (w.stars > before && G.audio) G.audio.wantedUp();
  return w.stars;
}

export function clearWanted(G) {
  G.wanted.stars = 0;
  G.wanted.heat = 0;
  G.wanted.decayTimer = 0;
}

export function updateWanted(G, dt) {
  const w = G.wanted;
  if (w.stars === 0) {
    w.heat = Math.max(0, w.heat - dt * 4);
    return;
  }
  w.decayTimer += dt;
  if (w.decayTimer >= WANTED.decayDelay) {
    w.heat = Math.max(0, w.heat - dt * 6);
    if (w.heat <= 0) {
      w.stars -= 1;
      w.heat = w.stars > 0 ? 60 : 0;
      w.decayTimer = WANTED.decayDelay - WANTED.decayInterval;
      if (w.stars === 0) {
        w.decayTimer = 0;
        if (G.toast !== undefined) { G.toast = 'You lost the cops. Heat is off.'; G.toastT = 3; }
      }
    }
  }
  if (G.audio) G.audio.setSiren(w.stars >= 1);
}
