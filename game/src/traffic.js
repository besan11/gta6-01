// Porto Verde v6 — traffic: ordinary Porto Verde drivers cruising the grid.
// They keep to the roads, wrap around the map edges, and never enter buildings.
import { ROADS_X, ROADS_Y } from './config.js';
import { CAR_MODELS } from './cars.js';
import { pick } from './random.js';

export function createTraffic(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const vertical = G.random() < 0.5;
    const road = vertical ? pick(G.random, ROADS_X) : pick(G.random, ROADS_Y);
    const along = 100 + G.random() * 2200;
    const dir = G.random() < 0.5 ? 1 : -1;
    const model = pick(G.random, CAR_MODELS);
    const car = {
      x: vertical ? road : along, y: vertical ? along : road,
      angle: vertical ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI),
      speed: 140 + G.random() * 90, driver: 'traffic', model,
      wrecked: false, hp: 100, police: false, name: model.name,
      vertical, dir, road,
    };
    list.push(car);
  }
  return list;
}

export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (car.wrecked) continue;
    if (car.vertical) {
      car.y += car.dir * car.speed * dt;
      if (car.y > 2380) car.y = 40;
      if (car.y < 40) car.y = 2380;
    } else {
      car.x += car.dir * car.speed * dt;
      if (car.x > 3180) car.x = 300;
      if (car.x < 300) car.x = 3180;
    }
  }
}
