// sunset.js — Golden hour over Porto Verde. A warm wash from the west, long
// shadows thrown the same way every frame, and a living beach: umbrellas in
// bright colours, boats drifting on the sea on a sine of game time, and a
// shoreline that breathes. Everything here is a function of G.time, so the
// picture is identical on every deterministic run.
import { SEA_X, BEACH_X, WORLD, SUNSET } from './config.js';

export function createBoats(random) {
  const boats = [];
  for (let i = 0; i < SUNSET.boats; i++) {
    boats.push({
      x: 60 + random() * 140,
      y: 300 + random() * (WORLD.h - 600),
      phase: random() * Math.PI * 2,
      speed: 0.05 + random() * 0.05,
      color: ['#f4f1e8', '#e8a13c', '#4f7fa0'][i % 3],
    });
  }
  return boats;
}

export function createUmbrellas(random) {
  const list = [];
  const colors = ['#e2453c', '#e8a13c', '#37e0a0', '#ffcf3f', '#7a3fd0'];
  for (let i = 0; i < SUNSET.umbrellas; i++) {
    list.push({
      x: SEA_X + 30 + random() * (BEACH_X - SEA_X - 50),
      y: 240 + i * 380 + random() * 120,
      color: colors[i % colors.length],
    });
  }
  return list;
}

export function updateBoats(G, dt) {
  for (const b of G.boats) {
    b.y += Math.sin(G.time * b.speed + b.phase) * 6 * dt;
    b.x += Math.cos(G.time * 0.03 + b.phase) * 2 * dt;
    if (b.y < 120) b.y = 120;
    if (b.y > WORLD.h - 120) b.y = WORLD.h - 120;
  }
}

export function drawBeachProps(ctx, G, cam) {
  for (const u of G.umbrellas) {
    const sx = (u.x - cam.x) * cam.zoom;
    const sy = (u.y - cam.y) * cam.zoom;
    if (sx < -60 || sx > 1340 || sy < -60 || sy > 780) continue;
    ctx.fillStyle = 'rgba(20,16,10,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + 6, sy + 10, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6f4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 18);
    ctx.stroke();
    ctx.fillStyle = u.color;
    ctx.beginPath();
    ctx.arc(sx, sy - 18, 16, Math.PI, 0);
    ctx.fill();
  }
  for (const b of G.boats) {
    const sx = (b.x - cam.x) * cam.zoom;
    const sy = (b.y - cam.y) * cam.zoom;
    if (sx < -80 || sx > 1360 || sy < -80 || sy > 800) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(sx - 22, sy);
    ctx.lineTo(sx + 22, sy);
    ctx.lineTo(sx + 14, sy + 10);
    ctx.lineTo(sx - 14, sy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6f4d';
    ctx.fillRect(sx - 1, sy - 22, 2, 22);
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 22);
    ctx.lineTo(sx, sy - 4);
    ctx.lineTo(sx + 14, sy - 4);
    ctx.closePath();
    ctx.fill();
  }
  // Breathing shoreline: a sine wave of foam along the sand's edge.
  ctx.strokeStyle = 'rgba(244,241,232,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 0; y <= WORLD.h; y += 60) {
    const wx = SEA_X + 6 + Math.sin(G.time * 0.8 + y * 0.01) * 8;
    const sx = (wx - cam.x) * cam.zoom;
    const sy = (y - cam.y) * cam.zoom;
    if (y === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
}

// Warm golden-hour wash over the whole frame, strongest at the west edge,
// plus a low sun glow. Drawn in screen space, after the world.
export function drawSunsetOverlay(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 1280, 0);
  grad.addColorStop(0, SUNSET.glowWest);
  grad.addColorStop(0.55, SUNSET.glowWarm);
  grad.addColorStop(1, 'rgba(255,190,90,0.03)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  const sun = ctx.createRadialGradient(60, 640, 10, 60, 640, 260);
  sun.addColorStop(0, 'rgba(255,170,70,0.28)');
  sun.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 380, 320, 340);
}
