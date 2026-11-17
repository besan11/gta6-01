// world.js — Porto Verde itself: the road grid, the blocks between the roads,
// the buildings that fill them, the parks, the palms, and the landmarks.
// Buildings never sit on a road, in a park, on the beach, or on a landmark.
// District lookup lives here too, driven by the boxes in config.js.
import { ROADS_X, ROADS_Y, ROAD_W, BEACH_X, SEA_X, PARKS, LANDMARKS, DISTRICTS, WORLD, ROOF_COLORS } from './config.js';
import { dist } from './random.js';

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function blockSpans(roads, half, lo, hi) {
  const spans = [];
  let cursor = lo;
  for (const road of roads) {
    spans.push([cursor, road - half]);
    cursor = road + half;
  }
  spans.push([cursor, hi]);
  return spans.filter(([a, b]) => b - a > 60);
}

export function createCity(random) {
  const half = ROAD_W / 2;
  const xSpans = blockSpans(ROADS_X, half, BEACH_X + 20, WORLD.w);
  const ySpans = blockSpans(ROADS_Y, half, 0, WORLD.h);
  const buildings = [];
  const variants = ['plain', 'ac', 'tank', 'antenna', 'garden', 'plain', 'ac'];
  for (const [x0, x1] of xSpans) {
    for (const [y0, y1] of ySpans) {
      const bw = x1 - x0;
      const bh = y1 - y0;
      if (bw < 110 || bh < 110) continue;
      const count = random() < 0.45 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const w = 90 + random() * Math.min(150, bw - 110);
        const h = 80 + random() * Math.min(130, bh - 100);
        const x = x0 + 10 + random() * Math.max(1, bw - w - 20);
        const y = y0 + 10 + random() * Math.max(1, bh - h - 20);
        const rect = { x, y, w, h };
        const inPark = PARKS.some((p) => rectsOverlap(rect, { x: p.x - p.w / 2 - 16, y: p.y - p.h / 2 - 16, w: p.w + 32, h: p.h + 32 }));
        if (inPark) continue;
        const nearLandmark = Object.values(LANDMARKS).some((lm) => dist(lm.x, lm.y, x + w / 2, y + h / 2) < 150);
        if (nearLandmark) continue;
        const clashes = buildings.some((b) => rectsOverlap(rect, { x: b.x - 14, y: b.y - 14, w: b.w + 28, h: b.h + 28 }));
        if (clashes) continue;
        buildings.push({
          x, y, w, h,
          roof: ROOF_COLORS[Math.floor(random() * ROOF_COLORS.length)],
          variant: variants[Math.floor(random() * variants.length)],
          seed: random(),
        });
      }
    }
  }
  // The casino gets the one helipad in town.
  const casino = buildings.reduce((best, b) => {
    const d = dist(LANDMARKS.CASINO.x, LANDMARKS.CASINO.y, b.x + b.w / 2, b.y + b.h / 2);
    return !best || d < best.d ? { b, d } : best;
  }, null);
  if (casino && casino.d < 420) casino.b.variant = 'helipad';

  const palms = [];
  for (let i = 0; i < 46; i++) {
    palms.push({ x: SEA_X + 24 + random() * (BEACH_X - SEA_X - 30), y: 40 + random() * (WORLD.h - 80), s: 0.8 + random() * 0.5 });
  }
  for (const park of PARKS) {
    for (let i = 0; i < 8; i++) {
      palms.push({
        x: park.x - park.w / 2 + 20 + random() * (park.w - 40),
        y: park.y - park.h / 2 + 20 + random() * (park.h - 40),
        s: 0.8 + random() * 0.5,
      });
    }
  }
  for (let i = 0; i < 30; i++) {
    const vertical = random() < 0.5;
    if (vertical) {
      const rx = ROADS_X[Math.floor(random() * ROADS_X.length)];
      palms.push({ x: rx + (random() < 0.5 ? -62 : 62), y: 60 + random() * (WORLD.h - 120), s: 0.7 + random() * 0.5 });
    } else {
      const ry = ROADS_Y[Math.floor(random() * ROADS_Y.length)];
      palms.push({ x: BEACH_X + 60 + random() * (WORLD.w - BEACH_X - 120), y: ry + (random() < 0.5 ? -62 : 62), s: 0.7 + random() * 0.5 });
    }
  }

  const landmarks = Object.entries(LANDMARKS).map(([name, p]) => ({ name, x: p.x, y: p.y }));
  const plazas = PARKS.map((p) => ({ ...p }));
  return { buildings, parks: plazas, palms, plazas, landmarks, districts: DISTRICTS };
}

// Push a circle out of every building it overlaps; also clamp to the world.
export function collideBuildings(buildings, x, y, r) {
  let px = x;
  let py = y;
  for (const b of buildings) {
    const left = b.x - r;
    const right = b.x + b.w + r;
    const top = b.y - r;
    const bottom = b.y + b.h + r;
    if (px > left && px < right && py > top && py < bottom) {
      const dl = px - left;
      const dr = right - px;
      const dt = py - top;
      const db = bottom - py;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) px = left;
      else if (m === dr) px = right;
      else if (m === dt) py = top;
      else py = bottom;
    }
  }
  px = Math.max(16, Math.min(WORLD.w - 16, px));
  py = Math.max(16, Math.min(WORLD.h - 16, py));
  return { x: px, y: py };
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  }
  return DISTRICTS[DISTRICTS.length - 1];
}

// True when the point is on walkable open ground: inside the world, clear of
// every building by at least `margin`, and not in the sea.
export function isOpenGround(city, x, y, margin) {
  if (x < SEA_X + margin || x > WORLD.w - margin || y < margin || y > WORLD.h - margin) return false;
  for (const b of city.buildings) {
    if (x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin) return false;
  }
  return true;
}
