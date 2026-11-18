// The city of Porto Verde: blocks of buildings between the road grid, three
// parks, palms along the beach, and named landmarks on open ground.
import { ROADS_X, ROADS_Y, ROAD_W, PARKS, LANDMARKS, DISTRICTS, ROOF_COLORS } from './config.js';
import { dist } from './random.js';

function overlapsPark(x, y, w, h) {
  for (const p of PARKS) {
    if (x < p.x + p.w / 2 + 24 && x + w > p.x - p.w / 2 - 24 &&
        y < p.y + p.h / 2 + 24 && y + h > p.y - p.h / 2 - 24) return true;
  }
  return false;
}

function nearLandmark(x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  for (const k of Object.keys(LANDMARKS)) {
    const lm = LANDMARKS[k];
    if (dist(cx, cy, lm.x, lm.y) < 150) return true;
  }
  return false;
}

export function createCity(random) {
  const buildings = [];
  const xEdges = [340];
  for (const r of ROADS_X) xEdges.push(r - ROAD_W / 2, r + ROAD_W / 2);
  xEdges.push(3200);
  const yEdges = [40];
  for (const r of ROADS_Y) yEdges.push(r - ROAD_W / 2, r + ROAD_W / 2);
  yEdges.push(2400);
  // Blocks are the gaps between consecutive road edges.
  for (let bi = 0; bi + 1 < xEdges.length; bi += 2) {
    const bx0 = xEdges[bi];
    const bx1 = xEdges[bi + 1];
    if (bx1 - bx0 < 130) continue;
    for (let bj = 0; bj + 1 < yEdges.length; bj += 2) {
      const by0 = yEdges[bj];
      const by1 = yEdges[bj + 1];
      if (by1 - by0 < 130) continue;
      const count = 1 + Math.floor(random() * 2);
      for (let n = 0; n < count; n++) {
        const w = 90 + random() * 90;
        const h = 80 + random() * 90;
        const x = bx0 + 14 + random() * Math.max(1, bx1 - bx0 - w - 28);
        const y = by0 + 14 + random() * Math.max(1, by1 - by0 - h - 28);
        if (overlapsPark(x, y, w, h)) continue;
        if (nearLandmark(x, y, w, h)) continue;
        let clash = false;
        for (const b of buildings) {
          if (x < b.x + b.w + 18 && x + w + 18 > b.x && y < b.y + b.h + 18 && y + h + 18 > b.y) { clash = true; break; }
        }
        if (clash) continue;
        buildings.push({
          x, y, w, h,
          roof: ROOF_COLORS[Math.floor(random() * ROOF_COLORS.length)],
          variant: Math.floor(random() * 6),
          seed: random(),
        });
      }
    }
  }
  // Palms: a loose line along the beach and a few near parks.
  const palms = [];
  for (let i = 0; i < 46; i++) {
    palms.push({ x: 292 + random() * 42, y: 60 + random() * 2280, s: 0.8 + random() * 0.5 });
  }
  for (const p of PARKS) {
    for (let i = 0; i < 6; i++) {
      palms.push({ x: p.x + (random() - 0.5) * (p.w + 60), y: p.y + (random() - 0.5) * (p.h + 60), s: 0.8 + random() * 0.5 });
    }
  }
  return {
    buildings,
    parks: PARKS,
    palms,
    plazas: PARKS.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
    landmarks: LANDMARKS,
    districts: DISTRICTS,
  };
}

// Push a circle out of every building it overlaps. Returns a fresh point.
export function collideBuildings(buildings, x, y, r) {
  for (const b of buildings) {
    const nx = Math.max(b.x, Math.min(x, b.x + b.w));
    const ny = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - nx;
    const dy = y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 0.01) {
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

// True when the point sits on open ground: inside no building, margin px clear.
export function isOpenGround(buildings, x, y, margin) {
  for (const b of buildings) {
    if (x > b.x - margin && x < b.x + b.w + margin && y > b.y - margin && y < b.y + b.h + margin) return false;
  }
  return x > 300 && x < 3180 && y > 20 && y < 2380;
}
