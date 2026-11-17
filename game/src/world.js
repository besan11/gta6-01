// world.js — The city of Porto Verde: map generation, collision and lookups.
// Features: a 3200x2400 coastal grid city (sea + beach on the west, six avenues and
// six streets, named districts, parks, plazas, palm trees), building collision,
// road/sidewalk tests used by traffic, pedestrians and the minimap. No drawing here.
import { BEACH_X, PALETTE, ROADS_X, ROADS_Y, ROAD_WIDTH, SEA_X, WORLD } from './config.js';
import { randInt, randPick } from './random.js';

export const DISTRICTS = [
  { name: 'Marina West', x: 340, y: 0, w: 560, h: 700 },
  { name: 'Old Town', x: 900, y: 0, w: 800, h: 700 },
  { name: 'Palm Heights', x: 1700, y: 0, w: 1500, h: 700 },
  { name: 'Market Row', x: 340, y: 700, w: 1360, h: 800 },
  { name: 'Casino Strip', x: 1700, y: 700, w: 1500, h: 800 },
  { name: 'Harbor South', x: 340, y: 1500, w: 1360, h: 900 },
  { name: 'Airstrip Flats', x: 1700, y: 1500, w: 1500, h: 900 },
];

export const LANDMARKS = [
  { name: 'Marina Cafe', x: 620, y: 420 },
  { name: 'Harbor Warehouse', x: 640, y: 2050 },
  { name: 'Verde Garage', x: 1520, y: 880 },
  { name: 'Dockside Bar', x: 760, y: 1680 },
  { name: 'Mirador Viewpoint', x: 2830, y: 420 },
  { name: 'Central Plaza', x: 1500, y: 1300 },
  { name: 'Grand Casino Verde', x: 2350, y: 1250 },
  { name: 'Airstrip', x: 2750, y: 2050 },
  { name: 'City Hall', x: 1150, y: 950 },
  { name: 'Sunset Pier', x: 300, y: 1100 },
];

/** True when the point is on a road (asphalt). */
export function isOnRoad(x, y) {
  for (const rx of ROADS_X) if (Math.abs(x - rx) <= ROAD_WIDTH / 2) return true;
  for (const ry of ROADS_Y) if (Math.abs(y - ry) <= ROAD_WIDTH / 2) return true;
  return false;
}

/** True when the point is on a sidewalk (the strip beside a road). */
export function isOnSidewalk(x, y) {
  const m = ROAD_WIDTH / 2 + 16;
  for (const rx of ROADS_X) if (Math.abs(x - rx) <= m && Math.abs(x - rx) > ROAD_WIDTH / 2) return true;
  for (const ry of ROADS_Y) if (Math.abs(y - ry) <= m && Math.abs(y - ry) > ROAD_WIDTH / 2) return true;
  return false;
}

/** The district name at a point, for the HUD location line. */
export function districtAt(x, y) {
  if (x < BEACH_X) return 'Sunset Beach';
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  }
  return 'Porto Verde';
}

/** Circle-vs-rectangle push-out: returns corrected {x, y} for a circle of radius r. */
export function collideBuildings(buildings, x, y, r) {
  for (const b of buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      y = cy + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      // Centre inside the rectangle: push out along the shortest side.
      const left = x - b.x;
      const right = b.x + b.w - x;
      const top = y - b.y;
      const bottom = b.y + b.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = b.x - r;
      else if (m === right) x = b.x + b.w + r;
      else if (m === top) y = b.y - r;
      else y = b.y + b.h + r;
    }
  }
  return { x, y };
}

/** True when a circle overlaps any building. */
export function hitsBuilding(buildings, x, y, r) {
  for (const b of buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

/** Build the whole city from a seeded random function. */
export function createCity(random) {
  const buildings = [];
  const parks = [];
  const palms = [];
  const plazas = [];

  // Parks: one big central plaza block and two green squares.
  parks.push({ x: 1400, y: 1200, w: 200, h: 200, name: 'Central Plaza' });
  parks.push({ x: 1000, y: 1600, w: 160, h: 160, name: 'Jacaranda Park' });
  parks.push({ x: 2200, y: 400, w: 180, h: 180, name: 'Palm Court' });
  plazas.push({ x: 1400, y: 1200, w: 200, h: 200 });

  // Buildings fill every block between roads, except park blocks and the airstrip.
  const xs = [BEACH_X + 40, ...ROADS_X, WORLD.width];
  const ys = [0, ...ROADS_Y, WORLD.height];
  for (let ix = 0; ix < xs.length - 1; ix += 1) {
    for (let iy = 0; iy < ys.length - 1; iy += 1) {
      const bx0 = xs[ix] + ROAD_WIDTH / 2 + 24;
      const by0 = ys[iy] + ROAD_WIDTH / 2 + 24;
      const bx1 = xs[ix + 1] - ROAD_WIDTH / 2 - 24;
      const by1 = ys[iy + 1] - ROAD_WIDTH / 2 - 24;
      if (bx1 - bx0 < 90 || by1 - by0 < 90) continue;
      // Skip the park blocks and the airstrip runway block.
      let skip = false;
      for (const p of parks) {
        if (bx0 < p.x + p.w && bx1 > p.x && by0 < p.y + p.h && by1 > p.y) { skip = true; break; }
      }
      if (skip) continue;
      if (bx0 > 2600 && by0 > 1900) continue; // airstrip runway, kept clear
      const cols = randInt(random, 1, 2);
      const rows = randInt(random, 1, 2);
      const cw = (bx1 - bx0) / cols;
      const ch = (by1 - by0) / rows;
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const w = cw * (0.62 + random() * 0.28);
          const h = ch * (0.62 + random() * 0.28);
          const x = bx0 + c * cw + (cw - w) / 2;
          const y = by0 + r * ch + (ch - h) / 2;
          buildings.push({
            x, y, w, h,
            color: randPick(random, PALETTE.buildingRoof),
            tall: random() < 0.22,
          });
        }
      }
    }
  }

  // Palm trees line the beach and the central plaza.
  for (let y = 60; y < WORLD.height - 60; y += 130) {
    palms.push({ x: 300 + random() * 26, y });
  }
  for (let i = 0; i < 26; i += 1) {
    palms.push({ x: 1420 + random() * 160, y: 1220 + random() * 160 });
  }
  for (let i = 0; i < 40; i += 1) {
    const rx = randPick(random, ROADS_X);
    const ry = randPick(random, ROADS_Y);
    palms.push({ x: rx + (random() < 0.5 ? -1 : 1) * (ROAD_WIDTH / 2 + 26), y: ry + randInt(random, -180, 180) });
  }

  return { buildings, parks, palms, plazas, landmarks: LANDMARKS, districts: DISTRICTS };
}
