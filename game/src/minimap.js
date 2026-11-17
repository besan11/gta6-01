// Minimap: the whole city at a glance — roads, sea, beach, the player, police dots,
// the objective and the next mission's dot, plus the dashed green route.
import { PALETTE } from './config.js';
import { drawRoute, drawPulseMarker } from './minimap-plus.js';
import { currentMission } from './missions.js';

export function drawMinimap(ctx, G, x, y, w, h) {
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const sx = (wx) => x + (wx / 3200) * w;
  const sy = (wy) => y + (wy / 2400) * h;
  // Sea + sand on the west edge.
  ctx.fillStyle = '#14608f';
  ctx.fillRect(x, y, (260 / 3200) * w, h);
  ctx.fillStyle = '#d9c184';
  ctx.fillRect(x + (260 / 3200) * w, y, (80 / 3200) * w, h);
  // Roads.
  ctx.strokeStyle = '#5a6270';
  ctx.lineWidth = 3;
  for (const rx of G.city.roadsX) {
    ctx.beginPath();
    ctx.moveTo(sx(rx), y);
    ctx.lineTo(sx(rx), y + h);
    ctx.stroke();
  }
  for (const ry of G.city.roadsY) {
    ctx.beginPath();
    ctx.moveTo(x, sy(ry));
    ctx.lineTo(x + w, sy(ry));
    ctx.stroke();
  }
  // Parks.
  ctx.fillStyle = '#6da054';
  for (const p of G.city.parks) {
    ctx.fillRect(sx(p.x - p.w / 2), sy(p.y - p.h / 2), (p.w / 3200) * w, (p.h / 2400) * h);
  }
  // Route + objective pulse.
  drawRoute(ctx, G, x, y, w, h, 1);
  drawPulseMarker(ctx, G, x, y, w, h);
  // Next mission's landmark as a small yellow dot.
  const m = currentMission(G);
  if (m && G.missions.index + 1 < 12) {
    const lm = G.city.landmarks.PLAZA;
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(sx(lm.x), sy(lm.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Police dots.
  ctx.fillStyle = '#2f6fd0';
  for (const cop of G.police) {
    ctx.beginPath();
    ctx.arc(sx(cop.x), sy(cop.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (G.heli && G.heli.active) {
    ctx.fillStyle = '#9fd4ff';
    ctx.beginPath();
    ctx.arc(sx(G.heli.x), sy(G.heli.y), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Player arrow.
  const px = sx(G.player.x);
  const py = sy(G.player.y);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(G.player.angle);
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // North + label.
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('N ↑', x + 6, y + 14);
  ctx.textAlign = 'right';
  ctx.fillText('PORTO VERDE', x + w - 6, y + 14);
  ctx.textAlign = 'left';
}
