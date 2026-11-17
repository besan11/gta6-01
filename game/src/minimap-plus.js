// Minimap plus: the big 300x210 map with a dashed route to the active objective,
// a pulsing objective marker, police dots and the next mission's dot.
import { dist } from './random.js';
import { missionObjective } from './missions.js';

export function pulseRadius(G) {
  return 7 + Math.sin(G.time * 4) * 3;
}

export function routePoints(G) {
  const obj = missionObjective(G);
  if (!obj) return [];
  return [{ x: G.player.x, y: G.player.y }, { x: obj.x, y: obj.y }];
}

export function drawRoute(ctx, G, x, y, w, h, scale) {
  const obj = missionObjective(G);
  if (!obj) return;
  const px = x + (G.player.x / 3200) * w;
  const py = y + (G.player.y / 2400) * h;
  const ox = x + (obj.x / 3200) * w;
  const oy = y + (obj.y / 2400) * h;
  ctx.strokeStyle = '#37e0a0';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ox, oy);
  ctx.stroke();
  ctx.setLineDash([]);
  void scale;
  void dist;
}

export function drawPulseMarker(ctx, G, x, y, w, h) {
  const obj = missionObjective(G);
  if (!obj) return;
  const ox = x + (obj.x / 3200) * w;
  const oy = y + (obj.y / 2400) * h;
  ctx.fillStyle = 'rgba(55,224,160,0.35)';
  ctx.beginPath();
  ctx.arc(ox, oy, pulseRadius(G) + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#37e0a0';
  ctx.beginPath();
  ctx.arc(ox, oy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f4f1e8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
