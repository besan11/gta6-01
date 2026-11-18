// Porto Verde v6 — Porto Verde PD: how many cruisers a wanted level buys, and
// how they hunt. Cops ram, they corner, and on foot they close in to bust.
import { COP_MAX, COP_ACCEL, COP_RAM, BUST_RADIUS, COP_SPAWN_DIST } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';
import { addWanted } from './wanted.js';

export function copsWanted(stars) {
  return [0, 1, 2, 3, 4, 5][stars] || 0;
}

export function spawnCopCar(G) {
  const p = G.player;
  const angle = G.random() * Math.PI * 2;
  const x = clamp(p.x + Math.cos(angle) * COP_SPAWN_DIST, 300, 3150);
  const y = clamp(p.y + Math.sin(angle) * COP_SPAWN_DIST, 60, 2340);
  const fixed = collideBuildings(G.city.buildings, x, y, 34);
  const car = {
    x: fixed.x, y: fixed.y, angle: 0, speed: 0, driver: 'cop',
    model: { name: 'PD Interceptor', color: '#22447f', top: COP_MAX, accel: COP_ACCEL },
    wrecked: false, hp: 120, police: true, name: 'PD Interceptor', siren: true,
  };
  G.police.push(car);
  G.cars.push(car);
  return car;
}

export function updatePolice(G, dt) {
  const p = G.player;
  const want = copsWanted(G.wanted.stars);
  while (G.police.length < want) spawnCopCar(G);
  while (G.police.length > want) {
    const extra = G.police.pop();
    const ci = G.cars.indexOf(extra);
    if (ci >= 0) G.cars.splice(ci, 1);
  }
  G.bustTimer = G.bustTimer || 0;
  let nearFoot = false;
  for (const cop of G.police) {
    if (cop.wrecked) continue;
    const d = dist(cop.x, cop.y, p.x, p.y);
    const wantAngle = Math.atan2(p.y - cop.y, p.x - cop.x);
    let da = wantAngle - cop.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    cop.angle += clamp(da, -2.4 * dt, 2.4 * dt);
    cop.speed = Math.min(COP_MAX, cop.speed + COP_ACCEL * dt);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    const fixed = collideBuildings(G.city.buildings, nx, ny, 32);
    cop.x = fixed.x; cop.y = fixed.y;
    if (d < 70) {
      if (p.car) {
        p.car.hp -= COP_RAM * dt * 2;
        if (p.car.hp <= 0) { p.car.wrecked = true; p.car.speed = 0; }
      } else {
        nearFoot = true;
      }
      cop.speed *= 0.5;
    }
    if (d < BUST_RADIUS && p.onFoot && G.wanted.stars >= 1) nearFoot = true;
  }
  if (nearFoot && p.onFoot && G.wanted.stars >= 1) {
    G.bustTimer += dt;
    if (G.bustTimer > 1.4) {
      G.busted = true;
      if (G.audio) G.audio.busted();
    }
  } else {
    G.bustTimer = 0;
  }
  if (G.audio) G.audio.setSiren(G.police.length > 0 && G.wanted.stars >= 1);
}
