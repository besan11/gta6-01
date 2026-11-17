// Porto Verde PD: cop cars spawn at the edge of view, chase the player, ram the car,
// and bust the player on foot when they close in and hold still.
import { POLICE, ROADS_X, ROADS_Y } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';
import { addWanted } from './wanted.js';

export function copsWanted(stars) {
  if (stars <= 0) return 0;
  if (stars === 1) return 1;
  if (stars === 2) return 2;
  if (stars === 3) return 3;
  if (stars === 4) return 4;
  return 5;
}

export function spawnCopCar(G) {
  const p = G.player;
  const angle = G.random() * Math.PI * 2;
  const d = POLICE.spawnDistance;
  let x = clamp(p.x + Math.cos(angle) * d, 60, 3140);
  let y = clamp(p.y + Math.sin(angle) * d, 60, 2340);
  // Prefer the nearest road so the unit arrives fast.
  let best = null;
  let bestD = Infinity;
  for (const rx of ROADS_X) {
    const dd = Math.abs(rx - x);
    if (dd < bestD) { bestD = dd; best = { x: rx, y }; }
  }
  for (const ry of ROADS_Y) {
    const dd = Math.abs(ry - y);
    if (dd < bestD) { bestD = dd; best = { x, y: ry }; }
  }
  if (best) { x = best.x; y = best.y; }
  const fixed = collideBuildings(G.city.buildings, x, y, 40);
  const cop = { x: fixed.x, y: fixed.y, angle: 0, speed: 0, siren: true, ramCd: 0, id: G.police.length };
  G.police.push(cop);
  return cop;
}

export function updatePolice(G, dt) {
  const p = G.player;
  const want = copsWanted(G.wanted.stars);
  while (G.police.length < want) spawnCopCar(G);
  if (G.police.length > want) G.police.length = want;
  for (const cop of G.police) {
    const d = dist(cop.x, cop.y, p.x, p.y);
    const target = Math.atan2(p.y - cop.y, p.x - cop.x);
    let diff = target - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += clamp(diff, -2.4 * dt, 2.4 * dt);
    const chaseSpeed = Math.min(POLICE.maxSpeed, 300 + G.wanted.stars * 55);
    cop.speed = Math.min(chaseSpeed, cop.speed + POLICE.accel * dt);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    const fixed = collideBuildings(G.city.buildings, cop.x, cop.y, 30);
    cop.x = fixed.x;
    cop.y = fixed.y;
    cop.x = clamp(cop.x, 30, 3170);
    cop.y = clamp(cop.y, 30, 2370);
    cop.ramCd = Math.max(0, cop.ramCd - dt);
    // Ram the player's car or knock the player down.
    if (d < 46 && cop.ramCd <= 0) {
      cop.ramCd = 0.9;
      if (p.car) {
        p.car.hp -= POLICE.ramDamage;
        G.effects.push({ x: cop.x, y: cop.y, t: 0.3, kind: 'hit' });
        if (p.car.hp <= 0) {
          p.car.wrecked = true;
          p.car = null;
          p.onFoot = true;
          G.toast = 'Your car is wrecked!';
          G.toastT = 2.5;
        }
      } else {
        hurtPlayerByCop(G, POLICE.ramDamage);
      }
    }
    // Bust: on foot, cop close, player slow — hold still and they cuff you.
    if (!p.car && d < POLICE.bustRadius) {
      const moving = Math.abs(p.vx || 0) + Math.abs(p.vy || 0) > 60;
      if (!moving) {
        G.bustTimer += dt;
        if (G.bustTimer > 2.2) {
          G.busted = true;
          if (G.audio) G.audio.busted();
        }
      } else {
        G.bustTimer = Math.max(0, G.bustTimer - dt * 2);
      }
    }
  }
  if (G.police.length === 0) G.bustTimer = 0;
}

function hurtPlayerByCop(G, amount) {
  G.player.hp -= amount;
  G.player.invuln = 0.7;
  G.effects.push({ x: G.player.x, y: G.player.y, t: 0.3, kind: 'hit' });
  if (G.player.hp <= 0) {
    G.player.hp = 0;
    G.wasted = true;
    if (G.audio) G.audio.wasted();
  }
  void addWanted;
}
