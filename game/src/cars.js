// Cars: arcade driving, parking, stealing, damage. A car is a box with a
// heading and a speed; the player, traffic and police all share this shape.
import { CAR, CAR_MODELS, COP_MODEL, ROADS_X, ROADS_Y, WORLD } from './config.js';
import { clamp, dist } from './random.js';
import { collideBuildings } from './world.js';

export function createCar(x, y, angle, model, driver) {
  return {
    x, y, angle, speed: 0,
    model: model || CAR_MODELS[0],
    hp: CAR.hp, wrecked: false,
    driver: driver || null, ramT: 0, prevDist: 1e9,
  };
}

export function spawnParkedCars(G, count) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    const vertical = G.random() < 0.5;
    let x; let y; let angle;
    if (vertical) {
      const road = ROADS_X[Math.floor(G.random() * ROADS_X.length)];
      x = road + (G.random() < 0.5 ? -62 : 62);
      y = 120 + G.random() * (WORLD.h - 240);
      angle = G.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      const road = ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
      y = road + (G.random() < 0.5 ? -62 : 62);
      x = 420 + G.random() * (WORLD.w - 540);
      angle = G.random() < 0.5 ? 0 : Math.PI;
    }
    if (dist(x, y, 534, 540) < 120) continue;
    const model = CAR_MODELS[Math.floor(G.random() * CAR_MODELS.length)];
    const car = createCar(x, y, angle, model, null);
    placed.push(car);
  }
  return placed;
}

export function driveCar(G, car, move, dt) {
  if (car.wrecked) { car.speed *= 0.9; return; }
  const top = car.model.top || CAR.maxSpeed;
  if (move.throttle > 0) car.speed += CAR.accel * dt;
  else if (move.throttle < 0) {
    if (car.speed > 5) car.speed -= CAR.brake * dt;
    else car.speed -= CAR.accel * 0.5 * dt;
  }
  car.speed -= car.speed * CAR.drag * dt;
  car.speed = clamp(car.speed, -CAR.reverse, top);
  const steer = move.steer * CAR.turn * dt * clamp(Math.abs(car.speed) / 120, 0, 1);
  car.angle += car.speed >= 0 ? steer : -steer;
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const fixed = collideBuildings(G.city.buildings, car.x, car.y, 26);
  car.x = fixed.x;
  car.y = fixed.y;
  car.x = clamp(car.x, 280, WORLD.w - 16);
  car.y = clamp(car.y, 16, WORLD.h - 16);
}

export function damageCar(G, car, amount) {
  if (!car || car.wrecked) return;
  car.hp -= amount;
  if (car.hp <= 0) {
    car.hp = 0;
    car.wrecked = true;
    car.speed = 0;
    G.effects.push({ x: car.x, y: car.y, t: 0, kind: 'smoke', life: 1.2 });
  }
}

export function enterCar(G) {
  const p = G.player;
  if (!p.onFoot) return false;
  const car = G.nearCar;
  if (!car || car.wrecked) return false;
  if (car.driver === 'traffic') {
    G.wanted.stars = Math.min(5, G.wanted.stars + 1);
    G.wanted.heat = Math.min(100, G.wanted.heat + 20);
    G.wanted.lastCrime = 'stole a car';
    G.wanted.lastCrimeReason = 'stole a car';
    G.toast = 'You stole the car — the PD noticed.';
    G.toastT = 3;
  }
  p.car = car;
  p.onFoot = false;
  car.driver = 'player';
  const idx = G.traffic.indexOf(car);
  if (idx !== -1) G.traffic.splice(idx, 1);
  return true;
}

export function exitCar(G) {
  const p = G.player;
  if (p.onFoot || !p.car) return false;
  const car = p.car;
  car.driver = null;
  car.speed = 0;
  const side = { x: car.x - Math.sin(car.angle) * 44, y: car.y + Math.cos(car.angle) * 44 };
  const fixed = collideBuildings(G.city.buildings, side.x, side.y, 16);
  p.x = clamp(fixed.x, 280, WORLD.w - 16);
  p.y = clamp(fixed.y, 16, WORLD.h - 16);
  p.angle = car.angle;
  p.car = null;
  p.onFoot = true;
  return true;
}

export { COP_MODEL };
