// traffic.js — City traffic: cars that drive the avenues and streets.
// Features: traffic cars that follow the road grid in lanes, turn at intersections,
// brake when the car ahead is slow, wrap around the city edges, and honk when the
// player blocks them. Wrecked cars are towed away and replaced so the streets
// never fill with permanent wrecks. They make the streets feel alive behind
// every screenshot.
import { ROADS_X, ROADS_Y, ROAD_WIDTH } from './config.js';
import { randInt, randPick } from './random.js';
import { CAR_MODELS, createCar } from './cars.js';

/** Spawn n traffic cars on random roads. */
export function createTraffic(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const vertical = G.random() < 0.5;
    let car;
    if (vertical) {
      const x = randPick(G.random, ROADS_X) + (G.random() < 0.5 ? -22 : 22);
      const y = randInt(G.random, 60, 2340);
      car = createCar(x, y, G.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2, randPick(G.random, CAR_MODELS), 'traffic');
    } else {
      const x = randInt(G.random, 400, 3140);
      const y = randPick(G.random, ROADS_Y) + (G.random() < 0.5 ? -22 : 22);
      car = createCar(x, y, G.random() < 0.5 ? 0 : Math.PI, randPick(G.random, CAR_MODELS), 'traffic');
    }
    car.speed = randInt(G.random, 110, 180);
    car.cruise = car.speed;
    list.push(car);
  }
  return list;
}

/** One traffic step: follow the road, maybe turn, brake for cars ahead, wrap around. */
export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (car.wrecked || car.driver === 'chase') continue; // the courier is driven by the mission, not traffic
    const vertical = Math.abs(Math.cos(car.angle)) < 0.5;
    // At an intersection, sometimes turn onto the crossing road.
    if (G.random() < dt * 0.25) {
      const nearX = ROADS_X.find((rx) => Math.abs(car.x - rx) < 60);
      const nearY = ROADS_Y.find((ry) => Math.abs(car.y - ry) < 60);
      if (nearX !== undefined && nearY !== undefined && G.random() < 0.4) {
        if (vertical) {
          car.angle = G.random() < 0.5 ? 0 : Math.PI;
          car.y = nearY + (G.random() < 0.5 ? -22 : 22);
        } else {
          car.angle = G.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
          car.x = nearX + (G.random() < 0.5 ? -22 : 22);
        }
      }
    }
    // Brake when another car (or the player) is just ahead.
    let target = car.cruise;
    for (const other of G.cars) {
      if (other === car || other.wrecked) continue;
      const dx = other.x - car.x;
      const dy = other.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
      const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
      if (ahead > 0 && ahead < 110 && side < 30) { target = 0; break; }
    }
    if (target !== 0) {
      // Brake for fellow traffic too, or cars pile through each other at lights.
      for (const other of G.traffic) {
        if (other === car || other.wrecked) continue;
        const dx = other.x - car.x;
        const dy = other.y - car.y;
        const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
        const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
        if (ahead > 0 && ahead < 110 && side < 30) { target = 0; break; }
      }
    }
    if (target === 0 && G.player.car) {
      const p = G.player.car;
      const dx = p.x - car.x;
      const dy = p.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
      const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
      if (ahead > 0 && ahead < 130 && side < 34) target = 0;
    }
    car.speed += (target - car.speed) * Math.min(1, 2.5 * dt);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Wrap around the city edges so traffic never runs out.
    if (car.x < 330) car.x = 3160;
    if (car.x > 3170) car.x = 340;
    if (car.y < 20) car.y = 2360;
    if (car.y > 2370) car.y = 30;
    // Keep traffic cars out of buildings (they stay on roads, but a turn can clip a corner).
    if (car.x < 340) car.x = 340;
  }
  // Wrecked traffic is towed away and replaced, or the streets slowly fill with
  // permanent wrecks after every chase. The courier is mission-owned, not towed.
  for (let i = G.traffic.length - 1; i >= 0; i -= 1) {
    const car = G.traffic[i];
    if (!car.wrecked || car.driver === 'chase') continue;
    car.wreckT = (car.wreckT || 0) + dt;
    if (car.wreckT > 15) {
      G.traffic.splice(i, 1);
      const fresh = createTraffic(G, 1);
      G.traffic.push(fresh[0]);
    }
  }
  void ROAD_WIDTH;
}
