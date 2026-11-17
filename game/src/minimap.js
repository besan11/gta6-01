// minimap.js — The big minimap: 300x210 in the top-right, under the PD
// response panel. Sea and sand on the west, the road grid, the parks, a
// dashed green route to the objective, a pulsing objective marker, blue
// dots for the police, a small yellow dot for the next job, and a clear N.
import { PALETTE, WORLD } from './config.js';
import { drawRoute } from './minimap-plus.js';

export function drawMinimap(ctx, G, x, y, w, h) {
  const sx = w / WORLD.w;
  const sy = h / WORLD.h;
  ctx.save();
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 3.5, y - 3.5, w + 7, h + 7);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Sea, sand, grass.
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(x, y, 260 * sx, h);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(x + 260 * sx, y, 80 * sx, h);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(x + 340 * sx, y, w - 340 * sx, h);
  // Parks.
  ctx.fillStyle = PALETTE.park;
  for (const p of G.city.parks) {
    ctx.fillRect(x + (p.x - p.w / 2) * sx, y + (p.y - p.h / 2) * sy, p.w * sx, p.h * sy);
  }
  // Roads.
  ctx.fillStyle = PALETTE.road;
  for (const rx of G.roadsX) ctx.fillRect(x + (rx - 48) * sx, y, 96 * sx, h);
  for (const ry of G.roadsY) ctx.fillRect(x, y + (ry - 48) * sy, w, 96 * sy);
  // Buildings as faint blocks.
  ctx.fillStyle = 'rgba(232,224,208,0.75)';
  for (const b of G.city.buildings) {
    ctx.fillRect(x + b.x * sx, y + b.y * sy, Math.max(1, b.w * sx), Math.max(1, b.h * sy));
  }
  const toScreen = (wx, wy) => ({ x: x + wx * sx, y: y + wy * sy });
  // Route + pulsing objective (minimap-plus).
  drawRoute(ctx, G, toScreen);
  // Pickups.
  ctx.fillStyle = PALETTE.objective;
  for (const pk of G.missions.pickups) {
    if (pk.taken) continue;
    const s = toScreen(pk.x, pk.y);
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }
  // Police dots.
  ctx.fillStyle = '#5a9dff';
  for (const cop of G.police) {
    const s = toScreen(cop.x, cop.y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Next-mission dot (yellow, small).
  const next = nextMissionPoint(G);
  if (next) {
    const s = toScreen(next.x, next.y);
    ctx.fillStyle = '#e8d44d';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Helicopter.
  if (G.heli && G.heli.active) {
    const s = toScreen(G.heli.x, G.heli.y);
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H', s.x, s.y + 3);
  }
  // Player arrow.
  const ps = toScreen(G.player.x, G.player.y);
  ctx.save();
  ctx.translate(ps.x, ps.y);
  ctx.rotate(G.player.angle);
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // North marker.
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('N ↑', x + 4, y + 4);
  G.drawn.minimap = { w, h };
}

function nextMissionPoint(G) {
  const idx = G.missions.index + 1;
  if (idx >= 12) return null;
  const step = G.missionList ? G.missionList[idx] : null;
  if (!step || !step.steps || !step.steps[0]) return null;
  return { x: step.steps[0].x, y: step.steps[0].y };
}
