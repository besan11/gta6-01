// police.js — The Porto Verde Police Department: patrol cars and foot cops.
// Features: police cars that spawn when wanted, chase the player through the
// streets, ram the player's car, and BUST the player on foot when they corner him;
// foot cops who chase on foot. The more stars, the more units respond.
import { POLICE } from './config.js';
import { angleDiff, clamp, dist } from './random.js';
import { collideBuildings } from './world.js';
import { createCar, damageCar } from './cars.js';
import { hurtPlayer } from './player.js';

const COP_MODEL = { name: 'PVPD Interceptor', color: '#22447f', topSpeed: 560, accel: 520 };

/** How many police cars respond to each wanted level. */
export function copsWanted(stars) {
  return stars <= 0 ? 0 : Math.min(4, stars + 1);
}

/** Spawn one police car on a road near the player. */
function spawnCopCar(G) {
  const p = G.player;
  const angle = G.random() * Math.PI * 2;
  // Land on a road near the player, never inside a building: a cop that spawns
  // on a roof would slide off it and look broken for its first seconds.
  const raw = {
    x: clamp(p.x + Math.cos(angle) * POLICE.spawnDistance, 400, 3100),
    y: clamp(p.y + Math.sin(angle) * POLICE.spawnDistance, 80, 2320),
  };
  const spot = collideBuildings(G.city.buildings, raw.x, raw.y, 26);
  const car = createCar(spot.x, spot.y, angle, COP_MODEL, 'police');
  car.siren = true;
  G.police.push(car);
  G.cars.push(car);
  return car;
}

/** One police step: keep the right number of units, chase, ram, and bust. */
export function updatePolice(G, dt) {
  const stars = G.wanted.stars;
  const want = copsWanted(stars);
  // Spawn missing units, remove extras when the heat falls.
  while (G.police.length < want) spawnCopCar(G);
  while (G.police.length > want) {
    const car = G.police.pop();
    const i = G.cars.indexOf(car);
    if (i >= 0) G.cars.splice(i, 1);
  }
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  for (const cop of G.police) {
    if (cop.wrecked || cop.driver === 'player') continue; // a stolen police car is the player's now
    const targetAngle = Math.atan2(py - cop.y, px - cop.x);
    const turn = angleDiff(cop.angle, targetAngle);
    cop.angle += clamp(turn, -2.8 * dt, 2.8 * dt);
    cop.speed = Math.min(cop.speed + POLICE.accel * dt, POLICE.maxSpeed);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    const fixed = collideBuildings(G.city.buildings, nx, ny, 26);
    cop.x = clamp(fixed.x, 30, 3170);
    cop.y = clamp(fixed.y, 30, 2370);
    // Ram: damage the player's car, or hurt and corner the player on foot.
    // A ram lands at most once per 0.8 s per unit, so a chase is a chase, not a shredder.
    const d = dist(cop.x, cop.y, px, py);
    cop.ramT = Math.max(0, (cop.ramT || 0) - dt);
    if (d < 58) {
      if (p.car) {
        if (cop.ramT <= 0) {
          cop.ramT = 0.8;
          damageCar(G, p.car, POLICE.ramDamage);
          cop.speed *= 0.92;
          G.audio.crash();
        }
      } else if (p.hp > 0) {
        // Cornered on foot: the cop STOPS on the player and holds him there.
        // A cop that just drives through at 560 never holds the 1.6 s of
        // contact a bust needs, so BUSTED could never happen at all.
        cop.speed = 0;
        G.bustTimer = (G.bustTimer || 0) + dt;
        if (G.bustTimer > POLICE.bustTime) {
          G.busted = true;
          G.audio.busted();
        }
        // A cornered player can be beaten to zero here: the hurt must count as
        // WASTED, or the player would sit at 0 HP, neither busted nor wasted.
        if (hurtPlayer(G, 6 * dt)) G.wasted = true;
      }
    } else {
      G.bustTimer = Math.max(0, (G.bustTimer || 0) - dt * 2);
    }
  }
  // Wrecked cop cars stop responding and are towed away after a while.
  for (let i = G.police.length - 1; i >= 0; i -= 1) {
    const cop = G.police[i];
    if (cop.wrecked) {
      cop.wreckT = (cop.wreckT || 0) + dt;
      if (cop.wreckT > 12) {
        G.police.splice(i, 1);
        const j = G.cars.indexOf(cop);
        if (j >= 0) G.cars.splice(j, 1);
      }
    }
  }
}
