// Dario Cruz on foot: walk, run, aim, take damage. The car lives on the
// player object too, so the rest of the game asks one question: onFoot?
import { PLAYER, WORLD } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';

export function createPlayer() {
  return {
    x: 534, y: 540, angle: -Math.PI / 2,
    hp: PLAYER.hp, invuln: 0, money: 150,
    car: null, onFoot: true,
    punchT: 0, shootT: 0,
  };
}

export function updatePlayerOnFoot(G, dt, move, running, mouseWorld) {
  const p = G.player;
  if (!p.onFoot) return;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.punchT > 0) p.punchT -= dt;
  if (p.shootT > 0) p.shootT -= dt;
  const speed = running ? PLAYER.run : PLAYER.walk;
  p.x += move.x * speed * dt;
  p.y += move.y * speed * dt;
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, PLAYER.r);
  p.x = fixed.x;
  p.y = fixed.y;
  p.x = clamp(p.x, 272, WORLD.w - 16);
  p.y = clamp(p.y, 16, WORLD.h - 16);
  if (mouseWorld && (move.x !== 0 || move.y !== 0 || G.input.mouse.down)) {
    p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
  } else if (move.x !== 0 || move.y !== 0) {
    p.angle = Math.atan2(move.y, move.x);
  }
}

export function hurtPlayer(G, amount) {
  const p = G.player;
  if (p.invuln > 0 || G.busted || G.wasted || G.gameWon) return;
  p.hp -= amount;
  p.invuln = 0.6;
  if (p.hp <= 0) {
    p.hp = 0;
    G.wasted = true;
  }
}

export function nearestCar(G, range) {
  const p = G.player;
  let best = null;
  let bestD = range;
  const all = G.cars.concat(G.traffic, G.police);
  for (const car of all) {
    if (car.wrecked) continue;
    const d = dist(p.x, p.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}
