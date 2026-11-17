// pedestrians.js — The people of Porto Verde walking the sidewalks.
// Features: pedestrians who stroll the sidewalks, turn at intersections, wait at
// crossings, chat in place, and FLEE when a gunshot or a speeding car comes near.
// Hitting one is a crime (wanted +1). They give the city its street life.
import { ROADS_X, ROADS_Y, ROAD_WIDTH } from './config.js';
import { clamp, dist, randInt, randPick } from './random.js';
import { collideBuildings, isOnRoad } from './world.js';

const PED_COLORS = ['#e8e4da', '#d06fa0', '#3fbf9f', '#e8b73a', '#7d8ba0', '#c96f4a', '#5f8f7b', '#a06a8f'];
const PED_NAMES = ['Ana', 'Bruno', 'Celia', 'Diego', 'Elena', 'Felix', 'Gabi', 'Hugo', 'Ines', 'Jorge', 'Kira', 'Leo', 'Mia', 'Nico', 'Olga', 'Pablo'];

/** Spawn n pedestrians on sidewalks near the roads. */
export function createPedestrians(G, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const vertical = G.random() < 0.5;
    let x;
    let y;
    if (vertical) {
      x = randPick(G.random, ROADS_X) + (G.random() < 0.5 ? -1 : 1) * (ROAD_WIDTH / 2 + 14);
      y = randInt(G.random, 80, 2320);
    } else {
      x = randInt(G.random, 400, 3120);
      y = randPick(G.random, ROADS_Y) + (G.random() < 0.5 ? -1 : 1) * (ROAD_WIDTH / 2 + 14);
    }
    list.push({
      x, y, angle: G.random() * Math.PI * 2, speed: randInt(G.random, 35, 70),
      color: randPick(G.random, PED_COLORS), name: randPick(G.random, PED_NAMES),
      flee: 0, wait: G.random() * 3, bob: G.random() * 6,
    });
  }
  return list;
}

/** One pedestrian step: stroll, turn at intersections, flee from danger. */
export function updatePedestrians(G, dt) {
  const p = G.player;
  for (const ped of G.peds) {
    ped.bob += dt * 6;
    // Flee from gunfire near the player or a fast car.
    let danger = false;
    if (G.shotsFired > 0 && dist(ped.x, ped.y, p.x, p.y) < 420) danger = true;
    if (p.car && Math.abs(p.car.speed) > 300 && dist(ped.x, ped.y, p.car.x, p.car.y) < 260) danger = true;
    if (danger) ped.flee = 2.5;
    if (ped.flee > 0) {
      ped.flee -= dt;
      const dx = ped.x - p.x;
      const dy = ped.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      // Fleeing straight away from the player used to run peds through walls
      // and into the sea; slide along buildings instead.
      const fixed = collideBuildings(G.city.buildings, ped.x + (dx / d) * 190 * dt, ped.y + (dy / d) * 190 * dt, 12);
      ped.x = fixed.x;
      ped.y = fixed.y;
      ped.angle = Math.atan2(dy, dx);
    } else {
      if (ped.wait > 0) {
        ped.wait -= dt;
      } else {
        ped.x += Math.cos(ped.angle) * ped.speed * dt;
        ped.y += Math.sin(ped.angle) * ped.speed * dt;
        // Turn at intersections; never walk into the sea or a building.
        const nearX = ROADS_X.find((rx) => Math.abs(ped.x - rx) < 70);
        const nearY = ROADS_Y.find((ry) => Math.abs(ped.y - ry) < 70);
        if ((nearX !== undefined || nearY !== undefined) && G.random() < dt * 0.8) {
          ped.angle = Math.floor(G.random() * 4) * (Math.PI / 2);
          ped.wait = G.random() * 2;
        }
        if (ped.x < 350 || isOnRoad(ped.x, ped.y)) {
          ped.angle += Math.PI / 2;
        }
      }
    }
    ped.x = clamp(ped.x, 345, 3180);
    ped.y = clamp(ped.y, 20, 2380);
  }
}
