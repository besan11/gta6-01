// Porto Verde v6 — cars: models, parking, arcade driving, entering and leaving.
import { CAR_LEN, CAR_WID, CAR_ACCEL, CAR_BRAKE, CAR_MAX, CAR_REVERSE, CAR_TURN, CAR_DRAG, CAR_HP, ROADS_X, ROADS_Y } from './config.js';
import { clamp } from './random.js';
import { collideBuildings } from './world.js';

export const CAR_MODELS = [
  { name: 'Azul GT Coupe', color: '#e2453c', top: 520, accel: 430 },
  { name: 'Marina Van', color: '#4f9f5f', top: 430, accel: 360 },
  { name: 'Coral Sedan', color: '#e8e0d0', top: 480, accel: 400 },
  { name: 'Palma Taxi', color: '#ffcf3f', top: 470, accel: 390 },
  { name: 'Courier Sedan', color: '#f4f1e8', top: 500, accel: 450 },
  { name: 'Verde Pickup', color: '#2f6f8f', top: 460, accel: 380 },
];

export function createCar(x, y, angle, model, driver) {
  return {
    x, y, angle, speed: 0, driver: driver || null,
    model: model || CAR_MODELS[0], wrecked: false, hp: CAR_HP,
    name: (model || CAR_MODELS[0]).name, police: false,
  };
}

export function spawnParkedCars(G, count) {
  const spots = [];
  for (let i = 0; i < count; i += 1) {
    const vertical = G.random() < 0.5;
    const road = vertical
      ? ROADS_X[Math.floor(G.random() * ROADS_X.length)]
      : ROADS_Y[Math.floor(G.random() * ROADS_Y.length)];
    const along = 120 + G.random() * 2100;
    const side = G.random() < 0.5 ? -38 : 38;
    const x = vertical ? road + side : along;
    const y = vertical ? along : road + side;
    const model = CAR_MODELS[Math.floor(G.random() * (CAR_MODELS.length - 2))];
    const car = createCar(x, y, vertical ? Math.PI / 2 : 0, model, null);
    car.parked = true;
    spots.push(car);
  }
  return spots;
}

export function driveCar(G, car, move, dt) {
  if (car.wrecked) return;
  const top = car.model.top || CAR_MAX;
  if (move.y < 0) car.speed += CAR_ACCEL * dt;
  else if (move.y > 0) car.speed -= CAR_BRAKE * dt;
  else {
    const drag = Math.exp(-CAR_DRAG * dt);
    car.speed *= drag;
    if (Math.abs(car.speed) < 4) car.speed = 0;
  }
  car.speed = clamp(car.speed, -CAR_REVERSE, top);
  const turning = car.speed >= 0 ? 1 : -1;
  car.angle += move.x * CAR_TURN * turning * dt * Math.min(1, Math.abs(car.speed) / 160 + 0.25);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  car.x = clamp(car.x, 280, 3190);
  car.y = clamp(car.y, 20, 2380);
  const fixed = collideBuildings(G.city.buildings, car.x, car.y, CAR_LEN / 2);
  if (fixed.x !== car.x || fixed.y !== car.y) {
    car.x = fixed.x; car.y = fixed.y;
    car.speed *= 0.4;
    if (Math.abs(car.speed) > 240) damageCar(G, car, 8);
  }
}

export function damageCar(G, car, dmg) {
  car.hp -= dmg;
  if (car.hp <= 0 && !car.wrecked) {
    car.wrecked = true;
    car.speed = 0;
    G.effects.push({ kind: 'smoke', x: car.x, y: car.y, t: 0, ttl: 2.5 });
    G.effects.push({ kind: 'boom', x: car.x, y: car.y, t: 0, ttl: 0.7 });
    if (G.audio) G.audio.noise(0.4, 0.2, 900);
  }
}

export function enterCar(G, car) {
  const p = G.player;
  p.car = car;
  p.onFoot = false;
  car.driver = p;
  car.parked = false;
  p.x = car.x; p.y = car.y;
  if (G.audio) G.audio.startEngine();
}

export function exitCar(G) {
  const p = G.player;
  const car = p.car;
  if (!car) return;
  car.driver = null;
  car.speed = 0;
  const side = { x: car.x - Math.sin(car.angle) * 46, y: car.y + Math.cos(car.angle) * 46 };
  const fixed = collideBuildings(G.city.buildings, side.x, side.y, 16);
  p.x = clamp(fixed.x, 274, 3184);
  p.y = clamp(fixed.y, 16, 2384);
  p.car = null;
  p.onFoot = true;
  p.angle = car.angle;
  if (G.audio) G.audio.setEngine(false, 0);
}
