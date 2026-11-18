// Porto Verde v6 — the police helicopter: at four stars and up, AIR-1 hangs
// over Dario with a sweeping spotlight. It cannot be shot down; it can only
// be outrun until the heat dies.
import { clamp } from './random.js';

export function createHeli() {
  return { active: false, x: 0, y: 0, rotor: 0, bobT: 0 };
}

export function updateHeli(G, dt) {
  const h = G.heli;
  const want = G.wanted.stars >= 4;
  if (want && !h.active) {
    h.active = true;
    h.x = G.player.x - 160;
    h.y = G.player.y - 200;
    if (G.audio) G.audio.setRotor(true);
  } else if (!want && h.active) {
    h.active = false;
    if (G.audio) G.audio.setRotor(false);
  }
  if (!h.active) return;
  h.bobT += dt;
  h.rotor += dt * 22;
  const px = G.player.x;
  const py = G.player.y;
  const tx = px - 120;
  const ty = py - 170 + Math.sin(h.bobT * 1.4) * 24;
  h.x += clamp(tx - h.x, -260 * dt, 260 * dt);
  h.y += clamp(ty - h.y, -260 * dt, 260 * dt);
}
