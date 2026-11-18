// Porto Verde v6 — pedestrians: shoppers, joggers and beach strollers who make
// the city feel lived in. A few always linger on the sand near the water.
import { BEACH_X, SEA_X, WORLD_W, WORLD_H } from './config.js';
import { clamp } from './random.js';

const SHIRTS = ['#e2453c', '#2f6fd0', '#ffcf3f', '#7a3fd0', '#4f9f5f', '#e87fb0', '#f4f1e8', '#37e0a0'];

export function createPedestrians(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const beach = G.random() < 0.25;
    list.push({
      x: beach ? SEA_X + 24 + G.random() * (BEACH_X - SEA_X - 30) : 360 + G.random() * (WORLD_W - 420),
      y: beach ? 80 + G.random() * (WORLD_H - 160) : 60 + G.random() * (WORLD_H - 120),
      angle: G.random() * Math.PI * 2,
      speed: beach ? 18 + G.random() * 22 : 45 + G.random() * 55,
      shirt: SHIRTS[Math.floor(G.random() * SHIRTS.length)],
      beach, wanderT: 1 + G.random() * 3, scared: 0,
    });
  }
  return list;
}

export function updatePedestrians(G, dt) {
  const p = G.player;
  for (const ped of G.peds) {
    ped.wanderT -= dt;
    const dPlayer = Math.hypot(ped.x - p.x, ped.y - p.y);
    if (dPlayer < 130 && G.wanted.stars >= 1) ped.scared = 2.5;
    if (ped.scared > 0) {
      ped.scared -= dt;
      ped.angle = Math.atan2(ped.y - p.y, ped.x - p.x);
      ped.x += Math.cos(ped.angle) * 190 * dt;
      ped.y += Math.sin(ped.angle) * 190 * dt;
    } else if (ped.wanderT <= 0) {
      ped.wanderT = 1.5 + G.random() * 3;
      ped.angle = G.random() * Math.PI * 2;
    } else {
      ped.x += Math.cos(ped.angle) * ped.speed * dt;
      ped.y += Math.sin(ped.angle) * ped.speed * dt;
    }
    if (ped.beach) {
      ped.x = clamp(ped.x, SEA_X + 16, BEACH_X - 8);
    } else {
      ped.x = clamp(ped.x, 350, WORLD_W - 20);
    }
    ped.y = clamp(ped.y, 20, WORLD_H - 20);
  }
}
