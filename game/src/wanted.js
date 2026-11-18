// Porto Verde v6 — wanted stars: crimes raise the heat, quiet time cools it down.
import { MAX_STARS, WANTED_DECAY_DELAY, WANTED_DECAY_STEP } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, lastCrime: '', lastCrimeReason: '', decayTimer: 0 };
}

export function addWanted(G, n, reason) {
  const w = G.wanted;
  const before = w.stars;
  w.stars = Math.min(MAX_STARS, w.stars + n);
  w.heat = Math.min(100, w.heat + n * 18);
  w.lastCrime = reason || 'crime';
  w.lastCrimeReason = reason || 'crime';
  w.decayTimer = 0;
  if (w.stars > before) {
    G.audio.wantedUp();
    G.toast = 'WANTED LEVEL ' + w.stars + ' — ' + (reason || 'the police are coming');
    G.toastT = 3;
    if (G.dialogue) G.dialogue.contextLine(G, 'wanted');
  }
}

export function clearWanted(G) {
  G.wanted.stars = 0;
  G.wanted.heat = 0;
  G.wanted.decayTimer = 0;
}

export function updateWanted(G, dt) {
  const w = G.wanted;
  if (w.stars === 0) { w.heat = Math.max(0, w.heat - dt * 4); return; }
  w.decayTimer += dt;
  if (w.decayTimer >= WANTED_DECAY_DELAY) {
    w.decayTimer = 0;
    w.stars -= 1;
    w.heat = Math.max(0, w.heat - 20);
    if (w.stars === 0) {
      G.toast = 'You lost the police. The heat is off.';
      G.toastT = 3;
      if (G.rep) G.rep.escaped = (G.rep.escaped || 0) + 1;
    }
  }
}
