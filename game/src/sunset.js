// Golden hour over Porto Verde: a warm wash from the west, long shadows,
// and a beach that is alive — umbrellas, strollers on the sand, boats
// drifting offshore on a slow deterministic swell.
import { BEACH_X, SEA_X } from './config.js';

export function createSunset(G) {
  const boats = [];
  for (let i = 0; i < 3; i++) {
    boats.push({
      bx: 40 + G.random() * 160,
      by: 300 + i * 640 + G.random() * 220,
      phase: G.random() * Math.PI * 2,
      speed: 0.05 + G.random() * 0.06,
    });
  }
  const umbrellas = [];
  for (let i = 0; i < 5; i++) {
    umbrellas.push({
      x: 268 + G.random() * 56,
      y: 200 + i * 420 + G.random() * 160,
      color: ['#e2453c', '#3fa7c9', '#d9a441', '#a06a8f', '#7be07b'][i % 5],
    });
  }
  return { boats, umbrellas };
}

// Boats drift with G.time only — same time, same sea, every run.
export function updateSunset(G, dt) {
  void dt;
  for (const b of G.sunset.boats) {
    b.x = b.bx + Math.sin(G.time * b.speed + b.phase) * 46;
    b.y = b.by + Math.cos(G.time * b.speed * 0.7 + b.phase) * 18;
  }
}

export function drawBeachLife(ctx, G, cam) {
  // Umbrellas on the sand.
  for (const u of G.sunset.umbrellas) {
    const sx = u.x - cam.x;
    const sy = u.y - cam.y;
    if (sx < -60 || sx > 1340 || sy < -60 || sy > 780) continue;
    ctx.strokeStyle = '#8a6f4d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 22);
    ctx.stroke();
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.arc(sx, sy - 22, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(sx, sy - 22, 20, Math.PI * 1.25, Math.PI * 1.6);
    ctx.fill();
  }
  // Boats offshore, bobbing on the swell.
  for (const b of G.sunset.boats) {
    const sx = (b.x || b.bx) - cam.x;
    const sy = (b.y || b.by) - cam.y;
    if (sx < -80 || sx > 1340 || sy < -80 || sy > 780) continue;
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.moveTo(sx - 22, sy);
    ctx.lineTo(sx + 22, sy);
    ctx.lineTo(sx + 14, sy + 10);
    ctx.lineTo(sx - 14, sy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e2453c';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 26);
    ctx.lineTo(sx + 16, sy);
    ctx.closePath();
    ctx.fill();
  }
  // Shoreline surf: a sine of game time, never of the wall clock.
  ctx.strokeStyle = 'rgba(244,241,232,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 0; y <= 2400; y += 40) {
    const x = SEA_X + 8 + Math.sin(G.time * 0.9 + y * 0.02) * 7;
    const sx = x - cam.x;
    const sy = y - cam.y;
    if (y === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  void BEACH_X;
}

export function drawSunsetWash(ctx, G) {
  // Warm golden-hour gradient from the west edge + long soft shadows.
  const grad = ctx.createLinearGradient(0, 0, 1280, 0);
  grad.addColorStop(0, 'rgba(255,166,66,0.16)');
  grad.addColorStop(0.35, 'rgba(255,166,66,0.05)');
  grad.addColorStop(1, 'rgba(255,120,80,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  const hour = G.clock.hour + G.clock.minute / 60;
  const dusk = Math.max(0, Math.min(1, (hour - 17) / 5));
  if (dusk > 0) {
    ctx.fillStyle = `rgba(20,16,48,${(dusk * 0.22).toFixed(3)})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
}
