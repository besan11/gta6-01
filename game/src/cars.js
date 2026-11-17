// cars.js — Cars of Porto Verde: models, parked cars, driving and stealing.
// Features: eight original car models with their own colours and speed, parked cars
// scattered along the roads, arcade driving physics (accelerate, brake, reverse,
// handbrake drift), car health and wrecks, stealing a parked car (raises wanted),
// entering and exiting with E. No licensed or real-world cars: all names are invented.
import { CAR, ROADS_X, ROADS_Y } from './config.js';
import { clamp, randInt, randPick } from './random.js';
import { collideBuildings, hitsBuilding, isOnRoad } from './world.js';
import { addWanted } from './wanted.js';

export const CAR_MODELS = [
  { name: 'Azul GT Coupe', color: '#2f8fd0', topSpeed: 560, accel: 470 },
  { name: 'Palmera Sedan', color: '#c94f42', topSpeed: 470, accel: 400 },
  { name: 'Verde Pickup', color: '#5f8f4f', topSpeed: 450, accel: 390 },
  { name: 'Costa Taxi', color: '#e8b73a', topSpeed: 480, accel: 410 },
  { name: 'Marina Van', color: '#e8e4da', topSpeed: 400, accel: 330 },
  { name: 'Sol Taxi Cab', color: '#e8b73a', topSpeed: 480, accel: 410 },
  { name: 'Breeze Convertible', color: '#d06fa0', topSpeed: 530, accel: 450 },
  { name: 'Harbor Truck', color: '#7d8ba0', topSpeed: 380, accel: 300 },
  { name: 'Palm Cruiser', color: '#3fbf9f', topSpeed: 500, accel: 430 },
];

/** Create one car at a position. driver: 'none' (parked), 'player', 'traffic', 'police'. */
export function createCar(x, y, angle, model, driver) {
  return {
    x, y, angle, speed: 0, hp: CAR.hp, model, color: model.color,
    driver, parked: driver === 'none', wrecked: false,
    siren: driver === 'police', skid: 0, honk: 0,
  };
}

/** Scatter parked cars along the roads of the city. */
export function spawnParkedCars(G, count) {
  const random = G.random;
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < count * 40) {
    guard += 1;
    const vertical = random() < 0.5;
    let x;
    let y;
    let angle;
    if (vertical) {
      x = randPick(random, ROADS_X) + (random() < 0.5 ? -34 : 34);
      y = randInt(random, 120, 2280);
      angle = random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      x = randInt(random, 420, 3080);
      y = randPick(random, ROADS_Y) + (random() < 0.5 ? -34 : 34);
      angle = random() < 0.5 ? 0 : Math.PI;
    }
    if (hitsBuilding(G.city.buildings, x, y, 40)) continue;
    if (isOnRoad(x, y) === false) continue;
    G.cars.push(createCar(x, y, angle, randPick(random, CAR_MODELS), 'none'));
    placed += 1;
  }
}

/** Drive a car for one step from the player's input (move.y = throttle, move.x = steer). */
export function driveCar(G, car, move, dt) {
  if (car.wrecked) return;
  const top = car.model.topSpeed;
  if (move.y < 0) car.speed += car.model.accel * dt; // W / up: accelerate
  else if (move.y > 0) car.speed -= CAR.brake * dt; // S / down: brake / reverse
  else {
    // Coast: gentle drag toward a stop.
    car.speed -= car.speed * CAR.drag * dt;
    if (Math.abs(car.speed) < 4) car.speed = 0;
  }
  if (G.input && G.input.handbrake()) {
    car.speed -= car.speed * 2.2 * dt;
    car.skid = Math.max(car.skid, 0.4);
  }
  car.speed = clamp(car.speed, -CAR.reverseSpeed, top);
  const steer = move.x * CAR.turnRate * dt * (car.speed >= 0 ? 1 : -1) * Math.min(1, Math.abs(car.speed) / 120 + 0.25);
  car.angle += steer;
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const fixed = collideBuildings(G.city.buildings, nx, ny, 26);
  const hitWall = Math.abs(fixed.x - nx) > 0.5 || Math.abs(fixed.y - ny) > 0.5;
  car.x = clamp(fixed.x, 30, 3170);
  car.y = clamp(fixed.y, 30, 2370);
  if (hitWall) {
    if (Math.abs(car.speed) > 200) {
      damageCar(G, car, 8);
      G.audio.crash();
      G.effects.push({ kind: 'crash', x: car.x, y: car.y, t: 0.4 });
    }
    car.speed *= 0.4;
  }
  if (car.skid > 0) car.skid -= dt;
}

/** Damage a car; returns true when it becomes a wreck. */
export function damageCar(G, car, amount) {
  if (car.wrecked) return true;
  car.hp -= amount;
  if (car.hp <= 0) {
    car.hp = 0;
    car.wrecked = true;
    car.speed = 0;
    G.effects.push({ kind: 'explosion', x: car.x, y: car.y, t: 0.8 });
    G.audio.crash();
    return true;
  }
  return false;
}

/** Put the player into a car (stealing it if it was parked). */
export function enterCar(G, car) {
  const p = G.player;
  if (car.parked) {
    car.parked = false;
    addWanted(G, 1, 'Stole a ' + car.model.name);
    G.audio.wantedUp();
  }
  car.driver = 'player';
  p.car = car;
  p.onFoot = false;
  p.x = car.x;
  p.y = car.y;
}

/** Put the player back on foot beside the car. */
export function exitCar(G) {
  const p = G.player;
  if (!p.car) return;
  const car = p.car;
  car.driver = 'none';
  car.parked = false;
  car.speed = 0;
  p.car = null;
  p.onFoot = true;
  p.x = car.x - Math.cos(car.angle) * 44;
  p.y = car.y - Math.sin(car.angle) * 44;
  const fixed = collideBuildings(G.city.buildings, p.x, p.y, 14);
  p.x = fixed.x;
  p.y = fixed.y;
}
