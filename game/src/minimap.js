// The base minimap: the whole city shrunk into a corner — sea, sand, roads,
// parks, buildings, police dots and Dario's arrow. The plus version layers
// the route and the pulsing objective on top of this.
import { WORLD, ROADS_X, ROADS_Y, SEA_X, PALETTE } from './config.js';

export function drawMinimap(ctx, G, x, y, w, h) {
  const sx = w / WORLD.w;
  const sy = h / WORLD.h;
  const px = (wx) => x + wx * sx;
  const py = (wy) => y + wy * sy;
  ctx.fillStyle = 'rgba(16,20,28,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(x, y, SEA_X * sx, h);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(x + SEA_X * sx, y, (340 - SEA_X) * sx, h);
  ctx.fillStyle = '#5d7a4a';
  ctx.fillRect(x + 340 * sx, y, w - 340 * sx, h);
  ctx.fillStyle = PALETTE.park;
  for (const p of G.city.parks) ctx.fillRect(px(p.x - p.w / 2), py(p.y - p.h / 2), p.w * sx, p.h * sy);
  ctx.fillStyle = '#8a8f99';
  for (const r of ROADS_X) ctx.fillRect(px(r - 48), y, 96 * sx, h);
  for (const r of ROADS_Y) ctx.fillRect(x, py(r - 48), w, 96 * sy);
  ctx.fillStyle = 'rgba(232,224,208,0.55)';
  for (const b of G.city.buildings) ctx.fillRect(px(b.x), py(b.y), Math.max(1, b.w * sx), Math.max(1, b.h * sy));
  ctx.fillStyle = '#2f6fd0';
  for (const cop of G.police) {
    if (cop.wrecked) continue;
    ctx.beginPath();
    ctx.arc(px(cop.x), py(cop.y), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = G.player;
  const ox = p.car ? p.car.x : p.x;
  const oy = p.car ? p.car.y : p.y;
  ctx.save();
  ctx.translate(px(ox), py(oy));
  ctx.rotate(p.angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
