// player.js — Dario Cruz on foot: walking, running, punching and aiming.
// Features: on-foot movement with building collision, run with Shift, punch (F)
// with cooldown, mouse-aimed shooting, entering/exiting cars (E), health and
// invulnerability after a hit. The player object lives on the shared game state.
import { PLAYER } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';

/** Create the player at the Marina Cafe, on foot, with starting cash. */
export function createPlayer() {
  return {
    x: 660, y: 470, angle: 0, hp: PLAYER.hp, money: 120,
    onFoot: true, car: null, speed: 0,
    punchCooldown: 0, shootCooldown: 0, invuln: 0,
    moving: false, faceX: 1, faceY: 0,
  };
}

/** Move the player on foot for one step; returns nothing, mutates G.player. */
export function updatePlayerOnFoot(G, dt, move, running, mouseWorld) {
  const p = G.player;
  if (!p.onFoot) return;
  const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
  const len = Math.hypot(move.x, move.y);
  p.moving = len > 0;
  if (len > 0) {
    const nx = p.x + (move.x / len) * speed * dt;
    const ny = p.y + (move.y / len) * speed * dt;
    const fixed = collideBuildings(G.city.buildings, nx, ny, PLAYER.radius);
    p.x = clamp(fixed.x, 16, 3184);
    p.y = clamp(fixed.y, 16, 2384);
    p.faceX = move.x / len;
    p.faceY = move.y / len;
  }
  // Face the mouse when shooting is possible; otherwise face the walk direction.
  if (mouseWorld) {
    const dx = mouseWorld.x - p.x;
    const dy = mouseWorld.y - p.y;
    if (Math.hypot(dx, dy) > 24) p.angle = Math.atan2(dy, dx);
  } else if (len > 0) {
    p.angle = Math.atan2(p.faceY, p.faceX);
  }
  if (p.punchCooldown > 0) p.punchCooldown -= dt;
  if (p.shootCooldown > 0) p.shootCooldown -= dt;
  if (p.invuln > 0) p.invuln -= dt;
}

/** Hurt the player; returns true when the player is wasted (hp <= 0). */
export function hurtPlayer(G, amount) {
  const p = G.player;
  if (p.invuln > 0 || p.hp <= 0) return false;
  p.hp -= amount;
  p.invuln = 0.7;
  if (p.hp <= 0) {
    p.hp = 0;
    return true;
  }
  return false;
}

/** The nearest drivable car within range of the player, or null. */
export function nearestCar(G, range) {
  const p = G.player;
  let best = null;
  let bestD = range;
  for (const car of G.cars) {
    if (car.wrecked) continue;
    const d = dist(p.x, p.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}
