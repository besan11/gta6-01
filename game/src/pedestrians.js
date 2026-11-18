// Pedestrians: city folk strolling the sidewalks and the beach. They flee
// from gunfire and count as a crime if you hit them — the city remembers.
import { ROADS_X, ROADS_Y, WORLD, BEACH_X } from './config.js';
import { dist } from './random.js';
import { collideBuildings } from './world.js';

const SHIRTS = ['#e2453c', '#3fa7c9', '#d9a441', '#7fae62', '#a06a8f', '#e8e0d0', '#5f8f7b'];

export function createPedestrians(G, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const onBeach = G.random() < 0.25;
    let x; let y;
    if (onBeach) {
      x = 268 + G.random() * (BEACH_X - 268);
      y = 60 + G.random() * (WORLD.h - 120);
    } else if (G.random() < 0.5) {
      const road = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      x = road + (G.random() < 0.5 ? -66 : 66);
      y = 80 + G.random() * (WORLD.h - 160);
    } else {
      const road = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      y = road + (G.random() < 0.5 ? -66 : 66);
      x = 380 + G.random() * (WORLD.w - 760);
    }
    const fixed = collideBuildings(G.city.buildings, x, y, 12);
    list.push({
      x: fixed.x, y: fixed.y,
      angle: G.random() * Math.PI * 2,
      speed: 28 + G.random() * 42,
      tx: fixed.x, ty: fixed.y,
      shirt: SHIRTS[Math.floor(G.random() * SHIRTS.length)],
      fleeing: 0,
    });
  }
  return list;
}

export function updatePedestrians(G, dt) {
  const px = G.player.car ? G.player.car.x : G.player.x;
  const py = G.player.car ? G.player.car.y : G.player.y;
  for (const p of G.peds) {
    if (p.fleeing > 0) {
      p.fleeing -= dt;
      const d = dist(p.x, p.y, px, py);
      if (d < 260 && d > 1) {
        p.angle = Math.atan2(p.y - py, p.x - px);
        p.tx = p.x + Math.cos(p.angle) * 120;
        p.ty = p.y + Math.sin(p.angle) * 120;
      }
    }
    const d = dist(p.x, p.y, p.tx, p.ty);
    if (d < 12) {
      const a = G.random() * Math.PI * 2;
      const step = 90 + G.random() * 160;
      p.tx = p.x + Math.cos(a) * step;
      p.ty = p.y + Math.sin(a) * step;
      p.tx = Math.max(268, Math.min(WORLD.w - 20, p.tx));
      p.ty = Math.max(30, Math.min(WORLD.h - 20, p.ty));
    } else {
      p.angle = Math.atan2(p.ty - p.y, p.tx - p.x);
    }
    const sp = p.fleeing > 0 ? p.speed * 2.4 : p.speed;
    p.x += Math.cos(p.angle) * sp * dt;
    p.y += Math.sin(p.angle) * sp * dt;
    const fixed = collideBuildings(G.city.buildings, p.x, p.y, 10);
    p.x = fixed.x;
    p.y = fixed.y;
  }
}
