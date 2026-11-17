// police.js — Porto Verde PD on wheels. One cruiser per star (up to four),
// spawning a little way off, steering at the player, ramming when close,
// and busting Dario when he is cornered on foot or crawling in a car.
import { POLICE, ROADS_X, ROADS_Y } from './config.js';
import { createCar } from './cars.js';
import { clamp, dist } from './random.js';
import { hurtPlayer } from './player.js';

export const COP_MODEL = { name: 'PD Cruiser', color: '#22447f', topSpeed: POLICE.maxSpeed, accel: POLICE.accel };

export function copsWanted(stars) {
  return Math.min(4, Math.max(0, stars));
}

export function spawnCopCar(G) {
  const p = G.player;
  const vertical = G.random() < 0.5;
  let x;
  let y;
  if (vertical) {
    const rx = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
    x = rx;
    y = p.y + (G.random() < 0.5 ? -POLICE.spawnDistance : POLICE.spawnDistance);
  } else {
    const ry = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
    x = p.x + (G.random() < 0.5 ? -POLICE.spawnDistance : POLICE.spawnDistance);
    y = ry;
  }
  x = clamp(x, 60, 3140);
  y = clamp(y, 60, 2340);
  const car = createCar(x, y, Math.atan2(p.y - y, p.x - x), COP_MODEL, 'police');
  car.siren = true;
  return car;
}

export function updatePolice(G, dt) {
  const want = copsWanted(G.wanted.stars);
  while (G.police.length < want) {
    const car = spawnCopCar(G);
    G.police.push(car);
    G.cars.push(car);
  }
  while (G.police.length > want) {
    const gone = G.police.pop();
    const at = G.cars.indexOf(gone);
    if (at >= 0) G.cars.splice(at, 1);
  }
  const p = G.player;
  const target = p.car || p;
  for (const cop of G.police) {
    if (cop.wrecked) continue;
    const d = dist(cop.x, cop.y, target.x, target.y);
    const wantAngle = Math.atan2(target.y - cop.y, target.x - cop.x);
    let da = wantAngle - cop.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    cop.angle += clamp(da, -2.4 * dt, 2.4 * dt);
    const near = d < 260 ? 0.75 : 1;
    cop.speed += (POLICE.maxSpeed * near - cop.speed) * Math.min(1, dt * 0.9);
    if (d < 60) cop.speed = Math.min(cop.speed, 160);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    cop.x = clamp(cop.x, 24, 3176);
    cop.y = clamp(cop.y, 24, 2376);
    cop.distToPlayer = d;
    cop.ramming = d < 110;
    if (d < 56) {
      if (p.car) {
        p.car.speed *= 0.92;
        if (Math.abs(cop.speed) > 200) hurtPlayer(G, POLICE.ramDamage * dt * 2);
      } else {
        hurtPlayer(G, POLICE.ramDamage * dt * 2);
      }
      // Busted: a cruiser sits on top of a slow or cornered Dario.
      const slow = p.car ? Math.abs(p.car.speed) < 60 : true;
      if (d < POLICE.bustRadius && slow) {
        G.bustTimer += dt;
        if (G.bustTimer > 1.6) {
          G.busted = true;
          G.bustTimer = 0;
        }
      } else {
        G.bustTimer = Math.max(0, G.bustTimer - dt);
      }
    } else {
      G.bustTimer = Math.max(0, G.bustTimer - dt * 2);
    }
  }
}
