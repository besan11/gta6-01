// Porto Verde PD: pursuit cars that ram, and a bust when they corner Dario
// on foot. Count scales with the wanted level; none spawn at zero stars.
import { POLICE, COP_MODEL, WORLD } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';
import { createCar, damageCar } from './cars.js';
import { hurtPlayer } from './player.js';

export function copsWanted(stars) {
  if (stars <= 0) return 0;
  return Math.min(stars + 1, 5);
}

export function spawnCopCar(G) {
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  const angle = G.random() * Math.PI * 2;
  const x = clamp(px + Math.cos(angle) * POLICE.spawnDistance, 300, WORLD.w - 20);
  const y = clamp(py + Math.sin(angle) * POLICE.spawnDistance, 40, WORLD.h - 20);
  const car = createCar(x, y, 0, COP_MODEL, 'police');
  car.hp = 120;
  G.police.push(car);
  return car;
}

export function updatePolice(G, dt) {
  const want = copsWanted(G.wanted.stars);
  while (G.police.length < want) spawnCopCar(G);
  while (G.police.length > want) G.police.pop();
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  const playerSpeed = p.car ? Math.abs(p.car.speed) : 0;
  for (const cop of G.police) {
    if (cop.wrecked) continue;
    if (cop.ramT > 0) cop.ramT -= dt;
    const d = dist(cop.x, cop.y, px, py);
    cop.prevDist = cop.dist !== undefined ? cop.dist : d;
    cop.dist = d;
    const wantAngle = Math.atan2(py - cop.y, px - cop.x);
    let da = wantAngle - cop.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    cop.angle += clamp(da, -2.4 * dt, 2.4 * dt);
    const closing = d < 900;
    if (closing) cop.speed = Math.min(cop.speed + POLICE.accel * dt, POLICE.maxSpeed);
    else cop.speed = Math.max(cop.speed - 200 * dt, 180);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    const fixed = collideBuildings(G.city.buildings, cop.x, cop.y, 26);
    cop.x = fixed.x;
    cop.y = fixed.y;
    cop.x = clamp(cop.x, 280, WORLD.w - 16);
    cop.y = clamp(cop.y, 16, WORLD.h - 16);
    if (d < 56 && cop.ramT <= 0) {
      cop.ramT = 0.8;
      if (p.car) {
        damageCar(G, p.car, POLICE.ramDamage);
        p.car.speed *= 0.55;
      } else {
        hurtPlayer(G, POLICE.ramDamage);
      }
      G.effects.push({ x: cop.x, y: cop.y, t: 0, kind: 'spark', life: 0.4 });
    }
    // Bust: cornered on foot, slow, cop right on top of you.
    if (p.onFoot && d < POLICE.bustRadius && playerSpeed < 5) {
      G.bustTimer += dt;
      if (G.bustTimer > 1.2) {
        G.busted = true;
        G.bustTimer = 0;
      }
    }
  }
  if (G.wanted.stars === 0) G.bustTimer = 0;
}
