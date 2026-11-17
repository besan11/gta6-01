// player.js — Dario Cruz on foot: walking, running, getting hurt, and
// finding the nearest car worth stealing.
import { PLAYER, WORLD } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';

export function createPlayer() {
  return {
    x: 534, y: 540, angle: -Math.PI / 2,
    hp: PLAYER.hp, invuln: 0, money: 0,
    car: null, onFoot: true,
    punchT: 0, shootT: 0,
  };
}

export function updatePlayerOnFoot(G, dt, move, running, mouseWorld) {
  const p = G.player;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.punchT > 0) p.punchT -= dt;
  if (p.shootT > 0) p.shootT -= dt;
  const speed = running ? PLAYER.run : PLAYER.walk;
  let mx = move.x;
  let my = move.y;
  const len = Math.sqrt(mx * mx + my * my);
  if (len > 0) {
    mx /= len;
    my /= len;
    p.x += mx * speed * dt;
    p.y += my * speed * dt;
    p.angle = Math.atan2(my, mx);
  }
  if (mouseWorld) p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, PLAYER.radius);
  p.x = clamp(fixed.x, 20, WORLD.w - 20);
  p.y = clamp(fixed.y, 20, WORLD.h - 20);
}

export function hurtPlayer(G, amount) {
  const p = G.player;
  if (p.invuln > 0 || G.wasted || G.busted) return;
  p.hp -= amount;
  p.invuln = 0.6;
  G.effects.push({ kind: 'hit', x: p.x, y: p.y, t: 0, life: 0.4 });
  if (p.hp <= 0) {
    p.hp = 0;
    G.wasted = true;
  }
}

export function nearestCar(G, range) {
  let best = null;
  let bestD = range;
  for (const car of G.cars) {
    if (car.wrecked || car.driver === 'player') continue;
    const d = dist(G.player.x, G.player.y, car.x, car.y);
    if (d < bestD) {
      best = car;
      bestD = d;
    }
  }
  return best;
}
