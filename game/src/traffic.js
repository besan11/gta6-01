// Street traffic: cars cruising the road grid on fixed lanes, wrapping at
// the city edge. They are stealable — taking one in front of a cop is a crime.
import { ROADS_X, ROADS_Y, CAR_MODELS, WORLD } from './config.js';
import { createCar } from './cars.js';

export function createTraffic(G, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const vertical = G.random() < 0.5;
    let car;
    if (vertical) {
      const road = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      const dir = G.random() < 0.5 ? 1 : -1;
      car = createCar(road + (dir > 0 ? 24 : -24), 80 + G.random() * (WORLD.h - 160),
        dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        CAR_MODELS[Math.floor(G.random() * CAR_MODELS.length)], 'traffic');
      car.speed = 120 + G.random() * 80;
    } else {
      const road = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      const dir = G.random() < 0.5 ? 1 : -1;
      car = createCar(420 + G.random() * (WORLD.w - 840), road + (dir > 0 ? 24 : -24),
        dir > 0 ? 0 : Math.PI,
        CAR_MODELS[Math.floor(G.random() * CAR_MODELS.length)], 'traffic');
      car.speed = 120 + G.random() * 80;
    }
    list.push(car);
  }
  return list;
}

export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (car.wrecked) continue;
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Wrap around the city edge so the streets never run dry.
    if (car.x < 300) car.x = WORLD.w - 40;
    if (car.x > WORLD.w - 20) car.x = 320;
    if (car.y < 40) car.y = WORLD.h - 40;
    if (car.y > WORLD.h - 20) car.y = 60;
  }
}
