// The big minimap: 300x210, built on the base minimap, plus a dashed green
// route from Dario to the active objective, a pulsing objective marker,
// traffic as faint dots, and a clear north.
import { WORLD } from './config.js';
import { currentStep } from './missions.js';
import { drawMinimap } from './minimap.js';

export function drawMinimapPlus(ctx, G, x, y, w, h) {
  drawMinimap(ctx, G, x, y, w, h);
  const sx = w / WORLD.w;
  const sy = h / WORLD.h;
  const px = (wx) => x + wx * sx;
  const py = (wy) => y + wy * sy;
  // Route: dashed line from Dario to the active objective.
  const step = currentStep(G);
  const p = G.player;
  const ox = p.car ? p.car.x : p.x;
  const oy = p.car ? p.car.y : p.y;
  if (step && step.x !== undefined && !G.gameWon) {
    ctx.strokeStyle = '#37e0a0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(px(ox), py(oy));
    ctx.lineTo(px(step.x), py(step.y));
    ctx.stroke();
    ctx.setLineDash([]);
    // Pulsing objective marker.
    const pr = 6 + 2.5 * Math.sin(G.time * 4);
    ctx.fillStyle = '#37e0a0';
    ctx.beginPath();
    ctx.arc(px(step.x), py(step.y), pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px(step.x), py(step.y), pr + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Traffic dots, faint.
  ctx.fillStyle = 'rgba(244,241,232,0.5)';
  for (const car of G.traffic) {
    ctx.fillRect(px(car.x) - 1.5, py(car.y) - 1.5, 3, 3);
  }
  // North.
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('N ▲', x + 6, y + 5);
}
