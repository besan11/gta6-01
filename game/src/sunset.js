// Golden-hour Porto Verde: warm light from the west, long shadows, a living beach
// (umbrellas, boats on the swell, a shoreline that breathes with game time).
import { SEA_X, BEACH_X, WORLD_W, WORLD_H } from './config.js';

export function createBoats(random) {
  const boats = [];
  const names = ['Brisa', 'Coral Dawn', 'Tide Runner'];
  for (let i = 0; i < 3; i += 1) {
    boats.push({
      x: 60 + random() * 140, y: 300 + i * 700 + random() * 200,
      phase: random() * Math.PI * 2, speed: 6 + random() * 8, name: names[i],
    });
  }
  return boats;
}

export function createUmbrellas(random) {
  const colors = ['#e2453c', '#ffcf3f', '#3f8fd0', '#7be07b', '#a06a8f'];
  const list = [];
  for (let i = 0; i < 5; i += 1) {
    list.push({
      x: SEA_X + 30 + random() * (BEACH_X - SEA_X - 50),
      y: 200 + random() * (WORLD_H - 400),
      color: colors[i % colors.length],
    });
  }
  return list;
}

export function updateBoats(G, dt) {
  for (const b of G.boats) {
    b.x += Math.sin(G.time * 0.05 + b.phase) * b.speed * dt;
    b.y += Math.cos(G.time * 0.04 + b.phase) * b.speed * 0.5 * dt;
    b.x = Math.max(30, Math.min(SEA_X - 30, b.x));
  }
}

export function drawSunsetOverlay(ctx, G, cam) {
  // Warm wash that deepens toward the west (the sea) and with the evening hour.
  const hour = G.clock.hour + G.clock.minute / 60;
  const warmth = Math.max(0, Math.min(1, (hour - 14) / 8));
  if (warmth <= 0.02) return;
  const grad = ctx.createLinearGradient(0, 0, 1280, 0);
  grad.addColorStop(0, `rgba(255,140,60,${0.16 * warmth})`);
  grad.addColorStop(0.6, `rgba(255,180,90,${0.05 * warmth})`);
  grad.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
}

export function drawBeachLife(ctx, G, cam) {
  // Shoreline: a sine wave that moves with game time, drawn in world space.
  ctx.strokeStyle = 'rgba(244,241,232,0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = -40; y <= 2440; y += 40) {
    const wy = y;
    const wx = SEA_X + 14 + Math.sin(G.time * 0.7 + wy * 0.012) * 8;
    const sx = wx - cam.x;
    const sy = wy - cam.y;
    if (y === -40) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  // Umbrellas.
  for (const u of G.umbrellas) {
    const sx = u.x - cam.x;
    const sy = u.y - cam.y;
    if (sx < -40 || sx > 1320 || sy < -40 || sy > 760) continue;
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#8a6f4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 16);
    ctx.stroke();
  }
  // Boats on the swell.
  for (const b of G.boats) {
    const sx = b.x - cam.x;
    const sy = b.y - cam.y + Math.sin(G.time * 0.9 + b.phase) * 3;
    if (sx < -60 || sx > 1340 || sy < -60 || sy > 780) continue;
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.moveTo(sx - 18, sy);
    ctx.lineTo(sx + 18, sy);
    ctx.lineTo(sx + 10, sy + 9);
    ctx.lineTo(sx - 10, sy + 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e2453c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 20);
    ctx.lineTo(sx + 12, sy - 6);
    ctx.closePath();
    ctx.stroke();
  }
}

export function sunsetShadowOffset(G) {
  // Long shadows lean east as the sun sinks; deterministic from game time.
  const hour = G.clock.hour + G.clock.minute / 60;
  const t = Math.max(0, Math.min(1, (hour - 12) / 10));
  return { x: 10 + t * 22, y: 4 + t * 8 };
}
