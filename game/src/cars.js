// Cars: original Porto Verde models, parked cars, arcade driving, stealing, damage.
import { CAR, ROADS_X, ROADS_Y } from './config.js';
import { clamp, dist, pick } from './random.js';
import { collideBuildings } from './world.js';
import { addWanted } from './wanted.js';

export const CAR_MODELS = [
  { name: 'Azul GT Coupe', color: '#3f8fd0', topSpeed: 520 },
  { name: 'Marina Van', color: '#5f8f7b', topSpeed: 430 },
  { name: 'Coral Sedan', color: '#e07b4f', topSpeed: 470 },
  { name: 'Palma Pickup', color: '#d9a441', topSpeed: 450 },
  { name: 'Brisa Hatch', color: '#7a3fd0', topSpeed: 490 },
  { name: 'Sol Taxi', color: '#ffcf3f', topSpeed: 460 },
];

export function createCar(x, y, angle, model, driver) {
  return {
    x, y, angle: angle || 0, speed: 0, model,
    color: model.color, name: model.name, topSpeed: model.topSpeed || CAR.maxSpeed,
    driver: driver || null, hp: CAR.hp, wrecked: false, stolen: false,
  };
}

export function spawnParkedCars(G, count) {
  for (let i = 0; i < count; i += 1) {
    const rx = pick(G.random, ROADS_X);
    const vertical = G.random() < 0.5;
    const x = vertical ? rx + (G.random() < 0.5 ? -58 : 58) : ROADS_X[Math.floor(G.random() * ROADS_X.length)] + (G.random() - 0.5) * 60;
    const y = vertical ? ROADS_Y[Math.floor(G.random() * ROADS_Y.length)] + (G.random() - 0.5) * 60 : pick(G.random, ROADS_Y) + (G.random() < 0.5 ? -58 : 58);
    const fixed = collideBuildings(G.city.buildings, x, y, 36);
    G.cars.push(createCar(fixed.x, fixed.y, vertical ? Math.PI / 2 : 0, pick(G.random, CAR_MODELS), null));
  }
}

export function driveCar(G, car, move, dt) {
  if (car.wrecked) return;
  const forward = move.y < 0 ? 1 : move.y > 0 ? -0.45 : 0;
  if (forward > 0) car.speed += CAR.accel * dt;
  else if (forward < 0) car.speed -= CAR.brake * dt * 0.6;
  else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), CAR.drag * 260 * dt);
  car.speed = clamp(car.speed, -CAR.reverse, car.topSpeed);
  if (Math.abs(car.speed) > 20) {
    const steer = move.x * CAR.turn * dt * (car.speed >= 0 ? 1 : -1);
    car.angle += steer * clamp(Math.abs(car.speed) / 200, 0.3, 1);
  }
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const fixed = collideBuildings(G.city.buildings, car.x, car.y, 30);
  if (fixed.x !== car.x || fixed.y !== car.y) {
    car.x = fixed.x;
    car.y = fixed.y;
    car.speed *= 0.4;
    car.hp -= 2;
    if (car.hp <= 0 && !car.wrecked) {
      car.wrecked = true;
      G.effects.push({ x: car.x, y: car.y, t: 0.5, kind: 'boom' });
    }
  }
  car.x = clamp(car.x, 40, 3160);
  car.y = clamp(car.y, 40, 2360);
}

export function damageCar(G, car, amount) {
  car.hp -= amount;
  if (car.hp <= 0 && !car.wrecked) {
    car.wrecked = true;
    G.effects.push({ x: car.x, y: car.y, t: 0.5, kind: 'boom' });
  }
}

export function enterCar(G, car) {
  const p = G.player;
  if (car.wrecked) return false;
  if (car.driver === 'traffic') {
    // Stealing a moving car: the driver bails, the heat rises.
    car.driver = null;
    addWanted(G, 1, 'stole a car');
    G.toast = `Stole the ${car.name}! The PD is on you.`;
    G.toastT = 2.5;
  } else if (!car.stolen) {
    car.stolen = true;
    addWanted(G, 1, 'stole a car');
    G.toast = `Stole the ${car.name}!`;
    G.toastT = 2;
  }
  p.car = car;
  p.onFoot = false;
  p.x = car.x;
  p.y = car.y;
  if (G.audio) G.audio.startEngine();
  return true;
}

export function exitCar(G) {
  const p = G.player;
  if (!p.car) return;
  const car = p.car;
  p.car = null;
  p.onFoot = true;
  const side = car.angle + Math.PI / 2;
  p.x = car.x + Math.cos(side) * 44;
  p.y = car.y + Math.sin(side) * 44;
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, 16);
  p.x = fixed.x;
  p.y = fixed.y;
  if (G.audio) G.audio.setEngine(false, 0);
}

export function nearestDriveableCar(G, range) {
  let best = null;
  let bestD = range;
  for (const car of G.cars) {
    if (car.wrecked) continue;
    const d = dist(G.player.x, G.player.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  for (const t of G.traffic) {
    if (t.wrecked) continue;
    const d = dist(G.player.x, G.player.y, t.x, t.y);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}
