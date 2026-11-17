// minimap.js — The minimap: Porto Verde at a glance, top-right of the HUD.
// Features: live minimap showing the sea, roads, buildings, parks, the player's
// arrow, the mission objective marker (pulsing), police blips, thug blips, pickups
// and the chase target, plus a north marker. Drawn in logical 1280x720 screen space.
import { PALETTE, WORLD } from './config.js';
import { currentStep } from './missions.js';

export function drawMinimap(ctx, G, x, y, w, h) {
  const sx = w / WORLD.width;
  const sy = h / WORLD.height;
  ctx.save();
  ctx.fillStyle = 'rgba(10,14,22,0.85)';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Sea and sand on the west edge.
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(x, y, 260 * sx, h);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(x + 260 * sx, y, 80 * sx, h);
  ctx.fillStyle = '#4a5a3a';
  ctx.fillRect(x + 340 * sx, y, w - 340 * sx, h);
  // Roads.
  ctx.fillStyle = '#5a6068';
  for (const rx of G.roadsX) ctx.fillRect(x + (rx - 48) * sx, y, 96 * sx, h);
  for (const ry of G.roadsY) ctx.fillRect(x, y + (ry - 48) * sy, w, 96 * sy);
  // Parks.
  ctx.fillStyle = PALETTE.park;
  for (const p of G.city.parks) ctx.fillRect(x + p.x * sx, y + p.y * sy, p.w * sx, p.h * sy);
  // Mission pickups.
  ctx.fillStyle = PALETTE.money;
  for (const pk of G.missions.pickups) {
    if (!pk.taken) {
      ctx.beginPath();
      ctx.arc(x + pk.x * sx, y + pk.y * sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Police blips (blue).
  ctx.fillStyle = '#6fa8ff';
  for (const cop of G.police) {
    ctx.beginPath();
    ctx.arc(x + cop.x * sx, y + cop.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thug blips (purple) — the fight you are walking into is on the map too.
  ctx.fillStyle = '#c07fff';
  for (const e of G.enemies) {
    ctx.beginPath();
    ctx.arc(x + e.x * sx, y + e.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Objective marker (pulsing yellow diamond).
  const step = currentStep(G.missions);
  if (step && !G.missions.done) {
    const pulse = 5 + Math.sin(G.time * 5) * 2;
    ctx.fillStyle = PALETTE.marker;
    ctx.beginPath();
    ctx.moveTo(x + step.x * sx, y + step.y * sy - pulse);
    ctx.lineTo(x + step.x * sx + pulse, y + step.y * sy);
    ctx.lineTo(x + step.x * sx, y + step.y * sy + pulse);
    ctx.lineTo(x + step.x * sx - pulse, y + step.y * sy);
    ctx.closePath();
    ctx.fill();
  }
  // Player arrow.
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  const pa = p.car ? p.car.angle : p.angle;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#20242c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + px * sx + Math.cos(pa) * 8, y + py * sy + Math.sin(pa) * 8);
  ctx.lineTo(x + px * sx + Math.cos(pa + 2.5) * 6, y + py * sy + Math.sin(pa + 2.5) * 6);
  ctx.lineTo(x + px * sx + Math.cos(pa - 2.5) * 6, y + py * sy + Math.sin(pa - 2.5) * 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // North marker and label, on a small dark pill inside the map's top-left corner.
  ctx.fillStyle = 'rgba(10,14,22,0.75)';
  ctx.fillRect(x + 4, y + 4, 118, 18);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px ' + 'system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('N  •  PORTO VERDE', x + 8, y + 17);
}
