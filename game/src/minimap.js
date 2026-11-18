// Porto Verde v6 — the minimap: 300x210, north up, the player centred in gold,
// the objective pulsing on a dashed green route, cops in blue, the next
// mission in yellow. Drawn from game state only.
import { WORLD_W, WORLD_H, ROADS_X, ROADS_Y, ROAD_W, SEA_X } from './config.js';
import { currentStep } from './missions.js';

export function drawMinimap(ctx, G, x, y, w, h) {
  const sx = w / WORLD_W;
  const sy = h / WORLD_H;
  ctx.save();
  ctx.fillStyle = 'rgba(16,20,28,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#1f7fb8';
  ctx.fillRect(x, y, SEA_X * sx, h);
  ctx.fillStyle = '#7fae62';
  ctx.fillRect(x + SEA_X * sx, y, w - SEA_X * sx, h);
  ctx.fillStyle = '#3a3f4a';
  for (const rx of ROADS_X) ctx.fillRect(x + (rx - ROAD_W / 2) * sx, y, ROAD_W * sx, h);
  for (const ry of ROADS_Y) ctx.fillRect(x, y + (ry - ROAD_W / 2) * sy, w, ROAD_W * sy);
  let step = currentStep(G);
  if (step && step.x === undefined && G.missions.pickups.length > 0) {
    const pk = G.missions.pickups.find((p) => !p.taken) || G.missions.pickups[0];
    step = { x: pk.x, y: pk.y };
  }
  if (step && step.x !== undefined) {
    ctx.strokeStyle = '#37e0a0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x + G.player.x * sx, y + G.player.y * sy);
    ctx.lineTo(x + step.x * sx, y + step.y * sy);
    ctx.stroke();
    ctx.setLineDash([]);
    const pulse = 6 + Math.sin(G.time * 4) * 2.5;
    ctx.fillStyle = '#37e0a0';
    ctx.beginPath();
    ctx.arc(x + step.x * sx, y + step.y * sy, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#2f6fd0';
  for (const cop of G.police) {
    ctx.beginPath();
    ctx.arc(x + cop.x * sx, y + cop.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(x + G.player.x * sx, y + G.player.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#20242c';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('N', x + 6, y + 14);
  ctx.fillStyle = '#ffcf3f';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 26);
  ctx.lineTo(x + 6, y + 18);
  ctx.lineTo(x + 14, y + 18);
  ctx.closePath();
  ctx.fill();
}
