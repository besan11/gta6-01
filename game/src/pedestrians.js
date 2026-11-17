// Pedestrians: Porto Verde locals strolling sidewalks, parks and the beach.
// Beachgoers are a separate sunset crowd that never leaves the sand.
import { WORLD_W, WORLD_H, BEACH_X, SEA_X } from './config.js';
import { clamp } from './random.js';
import { collideBuildings } from './world.js';

const SHIRTS = ['#e2453c', '#3f8fd0', '#7be07b', '#ffd94d', '#a06a8f', '#f4f1e8', '#5f8f7b', '#e07b4f'];

export function createPedestrians(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const x = BEACH_X + 40 + G.random() * (WORLD_W - BEACH_X - 80);
    const y = 60 + G.random() * (WORLD_H - 120);
    const fixed = collideBuildings(G.city.buildings, x, y, 16);
    list.push({
      x: fixed.x, y: fixed.y, angle: G.random() * Math.PI * 2,
      speed: 40 + G.random() * 50, shirt: SHIRTS[i % SHIRTS.length],
      walkT: G.random() * 4, idleT: 0, flee: 0, seed: G.random(),
    });
  }
  return list;
}

export function createBeachgoers(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    list.push({
      x: SEA_X + 14 + G.random() * (BEACH_X - SEA_X - 24),
      y: 120 + G.random() * (WORLD_H - 240),
      angle: G.random() * Math.PI * 2, speed: 18 + G.random() * 22,
      shirt: SHIRTS[Math.floor(G.random() * SHIRTS.length)],
      walkT: 2 + G.random() * 4, idleT: G.random() * 2, flee: 0, seed: G.random(),
    });
  }
  return list;
}

export function updatePedestrians(G, dt) {
  const p = G.player;
  for (const ped of G.peds) {
    updateOne(G, ped, dt, p, false);
  }
  for (const bg of G.beachgoers || []) {
    updateOne(G, bg, dt, p, true);
  }
}

function updateOne(G, ped, dt, p, beach) {
  if (ped.flee > 0) {
    ped.flee -= dt;
    const away = Math.atan2(ped.y - p.y, ped.x - p.x);
    ped.x += Math.cos(away) * 170 * dt;
    ped.y += Math.sin(away) * 170 * dt;
  } else if (ped.idleT > 0) {
    ped.idleT -= dt;
  } else {
    ped.walkT -= dt;
    ped.x += Math.cos(ped.angle) * ped.speed * dt;
    ped.y += Math.sin(ped.angle) * ped.speed * dt;
    if (ped.walkT <= 0) {
      ped.walkT = 2 + G.random() * 4;
      if (G.random() < 0.35) ped.idleT = 1 + G.random() * 2;
      else ped.angle = G.random() * Math.PI * 2;
    }
  }
  if (beach) {
    ped.x = clamp(ped.x, SEA_X + 10, BEACH_X - 6);
    ped.y = clamp(ped.y, 60, WORLD_H - 60);
  } else {
    ped.x = clamp(ped.x, BEACH_X + 10, WORLD_W - 30);
    ped.y = clamp(ped.y, 30, WORLD_H - 30);
    const fixed = collideBuildings(G.city.buildings, ped.x, ped.y, 12);
    ped.x = fixed.x;
    ped.y = fixed.y;
  }
}
