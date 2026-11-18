// Porto Verde v6 — Dario on foot: walk, run, face the mouse, take a hit.
import { PLAYER_R, PLAYER_WALK, PLAYER_RUN, PLAYER_HP, START_MONEY, WORLD_W, WORLD_H } from './config.js';
import { clamp } from './random.js';
import { collideBuildings } from './world.js';

export function createPlayer() {
  return {
    x: 534, y: 540, angle: 0, hp: PLAYER_HP, invuln: 0,
    money: START_MONEY, car: null, onFoot: true,
    punchT: 0, shootT: 0, name: 'Dario Cruz',
  };
}

export function updatePlayerOnFoot(G, dt, move, running, mouseWorld) {
  const p = G.player;
  if (!p.onFoot) return;
  const speed = running ? PLAYER_RUN : PLAYER_WALK;
  let mx = move.x;
  let my = move.y;
  const len = Math.hypot(mx, my);
  if (len > 0) { mx /= len; my /= len; }
  p.x += mx * speed * dt;
  p.y += my * speed * dt;
  p.x = clamp(p.x, 274, WORLD_W - 16);
  p.y = clamp(p.y, 16, WORLD_H - 16);
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, PLAYER_R);
  p.x = fixed.x; p.y = fixed.y;
  if (mouseWorld) p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
  else if (len > 0) p.angle = Math.atan2(my, mx);
  if (p.invuln > 0) p.invuln -= dt;
  if (p.punchT > 0) p.punchT -= dt;
  if (p.shootT > 0) p.shootT -= dt;
}

export function hurtPlayer(G, amount) {
  const p = G.player;
  if (p.invuln > 0 || p.hp <= 0) return;
  p.hp -= amount;
  p.invuln = 0.6;
  G.effects.push({ kind: 'hit', x: p.x, y: p.y, t: 0, ttl: 0.4 });
  if (p.hp <= 0) {
    p.hp = 0;
    G.wasted = true;
    if (G.audio) G.audio.wasted();
  }
}

export function nearestCar(G, range) {
  const p = G.player;
  let best = null;
  let bestD = range;
  for (const car of G.cars) {
    if (car.wrecked || car.police) continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}
