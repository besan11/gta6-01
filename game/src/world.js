// Porto Verde v6 — the city itself: blocks, buildings, parks, palms, landmarks.
// Built once from the seeded random stream, so seed 7 always builds the same streets.
import { ROADS_X, ROADS_Y, ROAD_W, PARKS, LANDMARKS, ROOF_COLORS, SEA_X, BEACH_X, WORLD_W, WORLD_H } from './config.js';
import { pick } from './random.js';

function overlapsPark(x, y, w, h) {
  for (const p of PARKS) {
    if (x < p.x + p.w / 2 + 24 && x + w > p.x - p.w / 2 - 24 && y < p.y + p.h / 2 + 24 && y + h > p.y - p.h / 2 - 24) return true;
  }
  return false;
}

function nearLandmark(x, y, w, h) {
  for (const lm of LANDMARKS) {
    if (x < lm.x + 90 && x + w > lm.x - 90 && y < lm.y + 90 && y + h > lm.y - 90) return true;
  }
  return false;
}

export function createCity(random) {
  const buildings = [];
  const xEdges = [BEACH_X, ...ROADS_X.flatMap((c) => [c - ROAD_W / 2, c + ROAD_W / 2]), WORLD_W];
  const yEdges = [0, ...ROADS_Y.flatMap((c) => [c - ROAD_W / 2, c + ROAD_W / 2]), WORLD_H];
  let id = 0;
  for (let xi = 0; xi < xEdges.length - 1; xi += 2) {
    for (let yi = 0; yi < yEdges.length - 1; yi += 2) {
      const bx0 = xEdges[xi] + 14;
      const bx1 = xEdges[xi + 1] - 14;
      const by0 = yEdges[yi] + 14;
      const by1 = yEdges[yi + 1] - 14;
      const bw = bx1 - bx0;
      const bh = by1 - by0;
      if (bw < 70 || bh < 70) continue;
      const wide = bw > 260 && bh > 200;
      const spots = wide
        ? [{ x: bx0, y: by0, w: bw * 0.46, h: bh * 0.46 }, { x: bx0 + bw * 0.54, y: by0 + bh * 0.54, w: bw * 0.42, h: bh * 0.42 }]
        : [{ x: bx0, y: by0, w: bw, h: bh }];
      for (const s of spots) {
        if (overlapsPark(s.x, s.y, s.w, s.h) || nearLandmark(s.x, s.y, s.w, s.h)) continue;
        if (random() < 0.08) continue;
        buildings.push({
          id: id++, x: s.x, y: s.y, w: s.w, h: s.h,
          roof: pick(random, ROOF_COLORS),
          tall: random() < 0.22, garden: random() < 0.14, helipad: false, antenna: random() < 0.2,
        });
      }
    }
  }
  const casino = buildings.find((b) => b.x < 2620 && b.x + b.w > 2380 && b.y < 1400 && b.y + b.h > 1100);
  if (casino) casino.helipad = true;

  const palms = [];
  for (let i = 0; i < 90; i += 1) {
    const onBeach = random() < 0.55;
    palms.push({
      x: onBeach ? SEA_X + 30 + random() * 70 : 360 + random() * (WORLD_W - 420),
      y: onBeach ? 60 + random() * (WORLD_H - 120) : pick(random, ROADS_Y) + (random() < 0.5 ? -58 : 58),
      lean: random() * 0.6 - 0.3, size: 0.85 + random() * 0.4,
    });
  }
  const plazas = PARKS.map((p) => ({ ...p }));
  return { buildings, parks: plazas, palms, landmarks: LANDMARKS, districts: [] };
}

// Push a circle out of every building it overlaps; returns the corrected point.
export function collideBuildings(buildings, x, y, r) {
  for (let pass = 0; pass < 3; pass += 1) {
    for (const b of buildings) {
      const nx = Math.max(b.x, Math.min(x, b.x + b.w));
      const ny = Math.max(b.y, Math.min(y, b.y + b.h));
      const dx = x - nx;
      const dy = y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        x = nx + (dx / d) * r;
        y = ny + (dy / d) * r;
      } else {
        const left = x - (b.x - r);
        const right = b.x + b.w + r - x;
        const top = y - (b.y - r);
        const bottom = b.y + b.h + r - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = b.x - r;
        else if (m === right) x = b.x + b.w + r;
        else if (m === top) y = b.y - r;
        else y = b.y + b.h + r;
      }
    }
  }
  return { x, y };
}

export function isOpenGround(buildings, x, y, margin) {
  for (const b of buildings) {
    if (x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin) return false;
  }
  return true;
}
