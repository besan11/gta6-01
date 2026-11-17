// cars.js — Every car in Porto Verde: the models, the parked cars, the
// driving physics, stealing, and damage. A car is a small plain object so
// traffic, police, the chase courier, and the player's ride all share it.
import { CAR, ROADS_X, ROADS_Y, ROAD_W, WORLD } from './config.js';
import { clamp, dist } from './random.js';

export const CAR_MODELS = [
  { name: 'Coral Coupe', color: '#e2574c', topSpeed: 540, accel: 460 },
  { name: 'Marina Van', color: '#3f8f5f', topSpeed: 470, accel: 380 },
  { name: 'Sunset Sedan', color: '#e8a13c', topSpeed: 510, accel: 420 },
  { name: 'Palm Pickup', color: '#4f7fa0', topSpeed: 490, accel: 400 },
  { name: 'Harbor Taxi', color: '#e8d44d', topSpeed: 500, accel: 410 },
  { name: 'Dune Buggy', color: '#a06a8f', topSpeed: 530, accel: 450 },
  { name: 'Courier Sedan', color: '#f4f1e8', topSpeed: 500, accel: 450 },
];

export function createCar(x, y, angle, model, driver) {
  return {
    x, y, angle, speed: 0,
    model, name: model.name, color: model.color,
    topSpeed: model.topSpeed, accel: model.accel,
    driver: driver || 'none', hp: CAR.hp, wrecked: false,
  };
}

export function spawnParkedCars(G, count) {
  const parked = [];
  for (let i = 0; i < count; i++) {
    const vertical = G.random() < 0.5;
    let x;
    let y;
    let angle;
    if (vertical) {
      const rx = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      // Park on the road's edge, never inside the block (and its buildings).
      x = rx + (G.random() < 0.5 ? -ROAD_W / 2 + 22 : ROAD_W / 2 - 22);
      y = 120 + G.random() * (WORLD.h - 240);
      angle = G.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      const ry = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      x = 420 + G.random() * (WORLD.w - 840);
      y = ry + (G.random() < 0.5 ? -ROAD_W / 2 + 22 : ROAD_W / 2 - 22);
      angle = G.random() < 0.5 ? 0 : Math.PI;
    }
    const model = CAR_MODELS[Math.floor(G.random() * (CAR_MODELS.length - 1))];
    parked.push(createCar(x, y, angle, model, 'none'));
  }
  return parked;
}

// move: {throttle: -1..1, steer: -1..1}; dt in seconds.
export function driveCar(G, car, move, dt) {
  if (car.wrecked) return;
  const top = car.topSpeed || CAR.maxSpeed;
  if (move.throttle > 0) car.speed += car.accel * move.throttle * dt;
  else if (move.throttle < 0) car.speed += CAR.brake * move.throttle * dt;
  else car.speed -= car.speed * CAR.drag * dt * 2;
  car.speed = clamp(car.speed, -CAR.reverse, top);
  if (Math.abs(car.speed) > 4) {
    car.angle += move.steer * CAR.turn * dt * Math.sign(car.speed) * clamp(Math.abs(car.speed) / 200, 0.25, 1);
  }
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const hit = { x: car.x, y: car.y };
  const fixed = { x: hit.x, y: hit.y };
  const pushed = pushOutOfBuildings(G, fixed);
  car.x = pushed.x;
  car.y = pushed.y;
  car.x = clamp(car.x, 24, WORLD.w - 24);
  car.y = clamp(car.y, 24, WORLD.h - 24);
  if (pushed.x !== hit.x || pushed.y !== hit.y) car.speed *= 0.4;
}

function pushOutOfBuildings(G, p) {
  let { x, y } = p;
  for (const b of G.city.buildings) {
    const r = 26;
    if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) {
      const dl = x - (b.x - r);
      const dr = b.x + b.w + r - x;
      const dt = y - (b.y - r);
      const db = b.y + b.h + r - y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) x = b.x - r;
      else if (m === dr) x = b.x + b.w + r;
      else if (m === dt) y = b.y - r;
      else y = b.y + b.h + r;
    }
  }
  return { x, y };
}

export function damageCar(G, car, amount) {
  if (car.wrecked) return;
  car.hp -= amount;
  if (car.hp <= 0) {
    car.hp = 0;
    car.wrecked = true;
    car.speed = 0;
    G.effects.push({ kind: 'smoke', x: car.x, y: car.y, t: 0, life: 1.2 });
  }
}

export function enterCar(G, car) {
  const p = G.player;
  p.car = car;
  p.onFoot = false;
  car.driver = 'player';
  p.x = car.x;
  p.y = car.y;
}

export function exitCar(G) {
  const p = G.player;
  const car = p.car;
  if (!car) return;
  car.driver = 'none';
  const side = { x: car.x - Math.sin(car.angle) * 44, y: car.y + Math.cos(car.angle) * 44 };
  p.x = side.x;
  p.y = side.y;
  p.car = null;
  p.onFoot = true;
}
