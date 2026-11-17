// wanted.js — The wanted level: stars, heat, and cooling off.
// Features: 0-5 wanted stars, crimes raise them (steal a car, shoot, hit a
// pedestrian), a HEAT meter that fills with crime, and stars that decay one by one
// only after the player stays out of sight of the police. The siren follows it.
import { WANTED } from './config.js';

export function createWanted() {
  return { stars: 0, heat: 0, lastCrime: -999, lastCrimeReason: '', decayTimer: 0 };
}

/** Raise the wanted level by n stars (max 5) and set the heat meter. */
export function addWanted(G, n, reason) {
  const w = G.wanted;
  const before = w.stars;
  w.stars = Math.min(WANTED.maxStars, w.stars + n);
  w.heat = Math.min(100, w.heat + n * 22);
  w.lastCrime = G.time;
  w.lastCrimeReason = reason;
  w.decayTimer = 0;
  if (w.stars > before) {
    G.audio.wantedUp();
    G.audio.setSiren(true);
    G.toast = reason + ' — WANTED LEVEL ' + w.stars;
    G.toastT = 3;
  }
}

/** Clear all stars (mission reward, or after a long clean stretch). */
export function clearWanted(G) {
  G.wanted.stars = 0;
  G.wanted.heat = 0;
  G.wanted.decayTimer = 0;
  G.wanted.lastCrimeReason = '';
  G.audio.setSiren(false);
}

/** One step: cool the heat, and decay stars while the player stays hidden. */
export function updateWanted(G, dt) {
  const w = G.wanted;
  if (w.stars === 0) {
    w.heat = Math.max(0, w.heat - dt * 4);
    return;
  }
  w.heat = Math.max(0, w.heat - dt * 1.2);
  const sinceCrime = G.time - w.lastCrime;
  let copNear = false;
  for (const cop of G.police) {
    const dx = cop.x - G.player.x;
    const dy = cop.y - G.player.y;
    if (dx * dx + dy * dy < 500 * 500) { copNear = true; break; }
  }
  if (sinceCrime > WANTED.decayDelay && !copNear) {
    w.decayTimer += dt;
    if (w.decayTimer >= WANTED.decayInterval) {
      w.decayTimer = 0;
      w.stars -= 1;
      if (w.stars === 0) G.audio.setSiren(false);
    }
  } else {
    w.decayTimer = 0;
  }
}
