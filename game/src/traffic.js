// traffic.js — The city's own drivers: cars that cruise along the road grid,
// slow down for the car ahead, and wrap around the far side of the map.
import { ROADS_X, ROADS_Y, WORLD, CAR } from './config.js';
import { CAR_MODELS, createCar } from './cars.js';
import { dist } from './random.js';

export function createTraffic(G, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const vertical = G.random() < 0.5;
    let x;
    let y;
    let angle;
    if (vertical) {
      const rx = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      const lane = G.random() < 0.5 ? -20 : 20;
      x = rx + lane;
      y = 80 + G.random() * (WORLD.h - 160);
      angle = lane < 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      const ry = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      const lane = G.random() < 0.5 ? -20 : 20;
      x = 400 + G.random() * (WORLD.w - 800);
      y = ry + lane;
      angle = lane < 0 ? 0 : Math.PI;
    }
    const model = CAR_MODELS[Math.floor(G.random() * (CAR_MODELS.length - 1))];
    const car = createCar(x, y, angle, model, 'traffic');
    car.speed = 140 + G.random() * 120;
    car.cruise = car.speed;
    list.push(car);
  }
  return list;
}

export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (car.wrecked) continue;
    let blocked = false;
    for (const other of G.cars) {
      if (other === car || other.wrecked) continue;
      const ahead = (other.x - car.x) * Math.cos(car.angle) + (other.y - car.y) * Math.sin(car.angle);
      if (ahead > 0 && ahead < 110 && dist(car.x, car.y, other.x, other.y) < 90) {
        blocked = true;
        break;
      }
    }
    const target = blocked ? 0 : car.cruise;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    if (car.x < 300) car.x = WORLD.w - 60;
    if (car.x > WORLD.w - 40) car.x = 320;
    if (car.y < 40) car.y = WORLD.h - 60;
    if (car.y > WORLD.h - 40) car.y = 60;
    // A traffic car that the player smashes into gets wrecked, not deleted.
    for (const other of G.cars) {
      if (other === car || other.wrecked) continue;
      if (dist(car.x, car.y, other.x, other.y) < 52 && Math.abs(car.speed) + Math.abs(other.speed) > 260) {
        car.hp = 0;
        car.wrecked = true;
        car.speed = 0;
      }
    }
  }
}
