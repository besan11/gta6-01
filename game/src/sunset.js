// Porto Verde v6 — golden hour over Porto Verde: a warm wash from the west,
// long shadows, beach umbrellas, and boats drifting on the water. All motion
// is a function of game time, so the frame is identical every run.
import { SEA_X, BEACH_X } from './config.js';

export function createBoats(G) {
  const boats = [];
  for (let i = 0; i < 3; i += 1) {
    boats.push({
      x: 60 + G.random() * 150, y: 300 + i * 620 + G.random() * 200,
      speed: 8 + G.random() * 10, phase: G.random() * Math.PI * 2,
      color: ['#f4f1e8', '#ffcf3f', '#e2453c'][i % 3],
    });
  }
  return boats;
}

export function createUmbrellas(G) {
  const umbrellas = [];
  const colors = ['#e2453c', '#ffcf3f', '#2f6fd0', '#e87fb0', '#37e0a0'];
  for (let i = 0; i < 5; i += 1) {
    umbrellas.push({
      x: SEA_X + 34 + G.random() * 56, y: 200 + i * 420 + G.random() * 120,
      color: colors[i % colors.length],
    });
  }
  return umbrellas;
}

export function updateBoats(G, dt) {
  for (const b of G.boats) {
    b.y += Math.sin(G.time * 0.1 + b.phase) * b.speed * dt * 0.2;
    b.x += Math.cos(G.time * 0.07 + b.phase) * 2 * dt;
    if (b.x < 40) b.x = 40;
    if (b.x > 220) b.x = 220;
  }
}

// Warm sunset grade over the whole frame, stronger toward the west (the sea).
export function sunsetGrade(ctx, cam, w, h, G) {
  const hour = G.clock.hour + G.clock.minute / 60;
  const warmth = hour >= 17 ? 0.16 : hour >= 15 ? 0.09 : 0.05;
  if (warmth <= 0) return;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, 'rgba(255,154,61,' + warmth + ')');
  grad.addColorStop(0.6, 'rgba(255,154,61,' + (warmth * 0.4) + ')');
  grad.addColorStop(1, 'rgba(255,154,61,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function shadowOffset(G) {
  const hour = G.clock.hour + G.clock.minute / 60;
  const t = (hour - 8) / 14;
  return { x: -14 + t * 26, y: 10 + t * 6 };
}
