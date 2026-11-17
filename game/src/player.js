// The player on foot: Dario Cruz, walking, running, taking hits, finding the nearest car.
import { PLAYER, WORLD_W, WORLD_H } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';

export function createPlayer() {
  return {
    x: 534, y: 540, angle: 0, hp: PLAYER.hp, invuln: 0,
    money: 0, car: null, onFoot: true, vx: 0, vy: 0, punchCd: 0, shootCd: 0,
  };
}

export function updatePlayerOnFoot(G, dt, move, running, mouseWorld) {
  const p = G.player;
  if (!p.onFoot) return;
  const speed = running ? PLAYER.run : PLAYER.walk;
  p.vx = move.x * speed;
  p.vy = move.y * speed;
  p.x = clamp(p.x + p.vx * dt, 24, WORLD_W - 24);
  p.y = clamp(p.y + p.vy * dt, 24, WORLD_H - 24);
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, PLAYER.radius);
  p.x = fixed.x;
  p.y = fixed.y;
  if (mouseWorld) p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
  else if (move.x !== 0 || move.y !== 0) p.angle = Math.atan2(move.y, move.x);
  p.invuln = Math.max(0, p.invuln - dt);
  p.punchCd = Math.max(0, p.punchCd - dt);
  p.shootCd = Math.max(0, p.shootCd - dt);
}

export function hurtPlayer(G, amount) {
  const p = G.player;
  if (p.invuln > 0 || p.hp <= 0) return;
  p.hp -= amount;
  p.invuln = 0.6;
  G.effects.push({ x: p.x, y: p.y, t: 0.3, kind: 'hit' });
  if (p.hp <= 0) {
    p.hp = 0;
    G.wasted = true;
    if (G.audio) G.audio.wasted();
  }
}

export function nearestCar(G, range) {
  let best = null;
  let bestD = range;
  const all = G.cars.concat(G.traffic);
  for (const car of all) {
    if (car.wrecked) continue;
    const d = dist(G.player.x, G.player.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}
