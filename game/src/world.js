// The city of Porto Verde: a 3200x2400 grid of road blocks with buildings, parks,
// palms, plazas and landmarks, all placed from the seeded stream.
import { ROADS_X, ROADS_Y, ROAD_W, BEACH_X, SEA_X, WORLD_W, WORLD_H, LANDMARKS, DISTRICTS, ROOF_COLORS } from './config.js';
import { pick } from './random.js';

export function createCity(random) {
  const buildings = [];
  const parks = [
    { x: 1400, y: 1200, w: 200, h: 200, name: 'Central Plaza' },
    { x: 1000, y: 1600, w: 160, h: 160, name: 'Jacaranda Park' },
    { x: 2200, y: 400, w: 180, h: 180, name: 'Palm Court' },
  ];
  const plazas = [{ x: 1500, y: 1300, w: 240, h: 240 }];
  const palms = [];
  const landmarks = {};
  for (const key of Object.keys(LANDMARKS)) landmarks[key] = { ...LANDMARKS[key] };

  // Buildings fill the blocks between roads; nothing spawns on a road, in a park,
  // on the beach, or on top of a landmark.
  const xs = [BEACH_X + 60, ...ROADS_X];
  const ys = [60, ...ROADS_Y];
  const xEnds = [...ROADS_X, WORLD_W - 40];
  const yEnds = [...ROADS_Y, WORLD_H - 40];
  for (let bx = 0; bx < xs.length; bx += 1) {
    for (let by = 0; by < ys.length; by += 1) {
      const x0 = xs[bx] + ROAD_W / 2 + 14;
      const x1 = xEnds[bx] - ROAD_W / 2 - 14;
      const y0 = ys[by] + ROAD_W / 2 + 14;
      const y1 = yEnds[by] - ROAD_W / 2 - 14;
      if (x1 - x0 < 90 || y1 - y0 < 90) continue;
      const count = 1 + Math.floor(random() * 2);
      for (let i = 0; i < count; i += 1) {
        const w = 90 + random() * 90;
        const h = 80 + random() * 80;
        const x = x0 + random() * Math.max(1, x1 - x0 - w);
        const y = y0 + random() * Math.max(1, y1 - y0 - h);
        const rect = { x, y, w, h, roof: pick(random, ROOF_COLORS), variant: Math.floor(random() * 5), seed: random() };
        let blocked = false;
        for (const p of parks) {
          if (x < p.x + p.w / 2 + 20 && x + w > p.x - p.w / 2 - 20 && y < p.y + p.h / 2 + 20 && y + h > p.y - p.h / 2 - 20) { blocked = true; break; }
        }
        if (!blocked) {
          for (const key of Object.keys(landmarks)) {
            const lm = landmarks[key];
            if (Math.abs(lm.x - (x + w / 2)) < w / 2 + 90 && Math.abs(lm.y - (y + h / 2)) < h / 2 + 90) { blocked = true; break; }
          }
        }
        if (!blocked) buildings.push(rect);
      }
    }
  }
  // Palms line the beach and the parks.
  for (let i = 0; i < 46; i += 1) {
    palms.push({ x: BEACH_X + 8 + random() * 60, y: 60 + random() * (WORLD_H - 120), lean: random() * 0.6 - 0.3 });
  }
  for (const p of parks) {
    for (let i = 0; i < 8; i += 1) {
      palms.push({ x: p.x - p.w / 2 + 16 + random() * (p.w - 32), y: p.y - p.h / 2 + 16 + random() * (p.h - 32), lean: random() * 0.6 - 0.3 });
    }
  }
  return { buildings, parks, plazas, palms, landmarks, districts: DISTRICTS, roadsX: ROADS_X, roadsY: ROADS_Y };
}

// Push a circle out of every building it overlaps; returns the corrected position.
export function collideBuildings(buildings, x, y, r) {
  let px = x;
  let py = y;
  for (const b of buildings) {
    const cx = Math.max(b.x, Math.min(px, b.x + b.w));
    const cy = Math.max(b.y, Math.min(py, b.y + b.h));
    const dx = px - cx;
    const dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        px = cx + (dx / d) * r;
        py = cy + (dy / d) * r;
      } else {
        py = b.y - r;
      }
    }
  }
  return { x: px, y: py };
}

export function isOpenGround(buildings, x, y, margin) {
  for (const b of buildings) {
    if (x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin) return false;
  }
  return x > SEA_X + 20 && x < WORLD_W - 20 && y > 20 && y < WORLD_H - 20;
}

export function nearestRoadPoint(x, y) {
  let bestX = ROADS_X[0];
  let bestD = Infinity;
  for (const rx of ROADS_X) {
    const d = Math.abs(rx - x);
    if (d < bestD) { bestD = d; bestX = rx; }
  }
  let bestY = ROADS_Y[0];
  bestD = Infinity;
  for (const ry of ROADS_Y) {
    const d = Math.abs(ry - y);
    if (d < bestD) { bestD = d; bestY = ry; }
  }
  return Math.abs(bestX - x) < Math.abs(bestY - y) ? { x: bestX, y } : { x, y: bestY };
}
