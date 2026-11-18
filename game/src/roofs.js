// Porto Verde v6 — roofs that are not clones: AC boxes, water tanks, antennas,
// a rooftop garden here, a helipad on the casino. Every variation is keyed to
// the building's own position, so it never changes between runs.
import { hash2 } from './random.js';

export function roofExtras(b) {
  const h = hash2(b.x, b.y);
  const h2 = hash2(b.y, b.x);
  return {
    ac: h < 0.55,
    tank: h2 < 0.3,
    garden: b.garden,
    antenna: b.antenna,
    helipad: b.helipad,
  };
}

export function drawRoofExtras(ctx, b) {
  const e = roofExtras(b);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.save();
  if (e.helipad) {
    ctx.fillStyle = '#2c303a';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(b.w, b.h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcf3f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(b.w, b.h) * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H', cx, cy + 6);
  } else {
    if (e.ac) {
      ctx.fillStyle = '#9aa3ad';
      ctx.fillRect(b.x + 10, b.y + 10, 22, 14);
      ctx.fillRect(b.x + b.w - 32, b.y + b.h - 24, 22, 14);
    }
    if (e.tank) {
      ctx.fillStyle = '#5f8f7b';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a5f4f';
      ctx.fillRect(cx - 2, cy - 20, 4, 10);
    }
    if (e.garden) {
      ctx.fillStyle = '#6da054';
      ctx.fillRect(b.x + 8, b.y + b.h - 20, b.w - 16, 12);
      ctx.fillStyle = '#3f8f4f';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(b.x + 18 + i * ((b.w - 36) / 3), b.y + b.h - 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (e.antenna) {
      ctx.strokeStyle = '#2c303a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w - 14, b.y + 12);
      ctx.lineTo(b.x + b.w - 14, b.y - 16);
      ctx.stroke();
      ctx.fillStyle = '#ff5a4e';
      ctx.beginPath();
      ctx.arc(b.x + b.w - 14, b.y - 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
