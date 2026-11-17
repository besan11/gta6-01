// pedestrians.js — The people of Porto Verde: shoppers on the sidewalks,
// strollers on the beach, and a few who just stand and watch the sunset.
// They wander, never walk through buildings, and scatter from a speeding car.
import { WORLD, ROADS_X, ROADS_Y, BEACH_X, SEA_X } from './config.js';
import { collideBuildings } from './world.js';
import { dist } from './random.js';

const SHIRTS = ['#e2574c', '#4f7fa0', '#e8a13c', '#7a3fd0', '#3f8f5f', '#d9a441', '#f4f1e8', '#5f8f7b'];
const SKINS = ['#f2c89b', '#d9a06b', '#b97e4e', '#8a5a34', '#f7d7b0'];

export function createPedestrians(G, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const beach = i < 7;
    let x;
    let y;
    if (beach) {
      x = SEA_X + 30 + G.random() * (BEACH_X - SEA_X - 40);
      y = 200 + G.random() * (WORLD.h - 400);
    } else if (G.random() < 0.5) {
      const rx = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      x = rx + (G.random() < 0.5 ? -64 : 64);
      y = 80 + G.random() * (WORLD.h - 160);
    } else {
      const ry = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      x = BEACH_X + 60 + G.random() * (WORLD.w - BEACH_X - 120);
      y = ry + (G.random() < 0.5 ? -64 : 64);
    }
    const fixed = collideBuildings(G.city.buildings, x, y, 12);
    list.push({
      x: fixed.x, y: fixed.y,
      angle: G.random() * Math.PI * 2,
      speed: 34 + G.random() * 40,
      shirt: SHIRTS[Math.floor(G.random() * SHIRTS.length)],
      skin: SKINS[Math.floor(G.random() * SKINS.length)],
      changeT: 2 + G.random() * 4,
      beach,
    });
  }
  return list;
}

export function updatePedestrians(G, dt) {
  for (const ped of G.peds) {
    ped.changeT -= dt;
    if (ped.changeT <= 0) {
      ped.angle = G.random() * Math.PI * 2;
      ped.changeT = 3 + G.random() * 5;
    }
    // Scatter from a fast car heading at them.
    const pc = G.player.car;
    if (pc && Math.abs(pc.speed) > 220 && dist(ped.x, ped.y, pc.x, pc.y) < 130) {
      ped.angle = Math.atan2(ped.y - pc.y, ped.x - pc.x);
      ped.changeT = 0.8;
    }
    const nx = ped.x + Math.cos(ped.angle) * ped.speed * dt;
    const ny = ped.y + Math.sin(ped.angle) * ped.speed * dt;
    const fixed = collideBuildings(G.city.buildings, nx, ny, 12);
    if (fixed.x === nx && fixed.y === ny) {
      ped.x = nx;
      ped.y = ny;
    } else {
      ped.angle += Math.PI / 2;
      ped.changeT = 1;
    }
    if (ped.x < SEA_X + 18) { ped.x = SEA_X + 18; ped.angle = 0; }
    if (ped.x > WORLD.w - 20) { ped.x = WORLD.w - 20; ped.angle = Math.PI; }
    if (ped.y < 20) { ped.y = 20; ped.angle = Math.PI / 2; }
    if (ped.y > WORLD.h - 20) { ped.y = WORLD.h - 20; ped.angle = -Math.PI / 2; }
  }
}
