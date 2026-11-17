// Traffic: ordinary Porto Verde drivers cruising the road grid, stopping for nothing.
import { ROADS_X, ROADS_Y, CAR } from './config.js';
import { clamp, pick } from './random.js';
import { CAR_MODELS } from './cars.js';

export function createTraffic(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const vertical = G.random() < 0.5;
    const road = vertical ? pick(G.random, ROADS_X) : pick(G.random, ROADS_Y);
    const along = vertical ? 80 + G.random() * 2240 : 360 + G.random() * 2640;
    const car = {
      x: vertical ? road + (G.random() < 0.5 ? -24 : 24) : along,
      y: vertical ? along : road + (G.random() < 0.5 ? -24 : 24),
      angle: vertical ? (G.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (G.random() < 0.5 ? 0 : Math.PI),
      speed: 140 + G.random() * 120,
      model: pick(G.random, CAR_MODELS),
      color: '', name: '', topSpeed: 300, driver: 'traffic', hp: CAR.hp, wrecked: false, stolen: false,
      vertical,
    };
    car.color = car.model.color;
    car.name = car.model.name;
    list.push(car);
  }
  return list;
}

export function updateTraffic(G, dt) {
  for (const t of G.traffic) {
    if (t.wrecked) continue;
    if (G.player.car === t) continue;
    t.x += Math.cos(t.angle) * t.speed * dt;
    t.y += Math.sin(t.angle) * t.speed * dt;
    // Wrap around the edge of the map on the same road.
    if (t.vertical) {
      if (t.y < 40) t.y = 2360;
      if (t.y > 2360) t.y = 40;
    } else {
      if (t.x < 300) t.x = 3160;
      if (t.x > 3160) t.x = 300;
    }
    t.x = clamp(t.x, 280, 3180);
    t.y = clamp(t.y, 30, 2370);
    // Gentle avoidance: slow down when another car is right ahead.
    for (const other of G.traffic) {
      if (other === t || other.wrecked) continue;
      const dx = other.x - t.x;
      const dy = other.y - t.y;
      const ahead = dx * Math.cos(t.angle) + dy * Math.sin(t.angle);
      const side = Math.abs(-dx * Math.sin(t.angle) + dy * Math.cos(t.angle));
      if (ahead > 0 && ahead < 90 && side < 40) { t.speed = Math.max(60, t.speed - 200 * dt); break; }
    }
  }
}
