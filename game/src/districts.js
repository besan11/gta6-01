// Districts: Porto Verde is six neighbourhoods with their own flavour.
// Crossing into a new one raises a banner for three seconds, then it fades.
import { DISTRICTS } from './config.js';

export function createDistrict() {
  return { name: 'MARINA NORTE', flavor: 'Cafes and old money', bannerT: 0 };
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  }
  return { name: 'PORTO VERDE', flavor: 'Three days in the sun' };
}

export function updateDistrict(G, dt) {
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  const d = districtAt(px, py);
  if (d.name !== G.district.name) {
    G.district.name = d.name;
    G.district.flavor = d.flavor;
    G.district.bannerT = 3;
  }
  if (G.district.bannerT > 0) G.district.bannerT -= dt;
}

export function drawDistrictBanner(ctx, G, cx, y) {
  if (G.district.bannerT <= 0) return;
  const alpha = Math.min(1, G.district.bannerT);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = 'rgba(16,20,28,0.75)';
  const w = ctx.measureText(G.district.name).width + 48;
  ctx.fillRect(cx - w / 2, y - 26, w, 52);
  ctx.fillStyle = '#ffcf3f';
  ctx.fillText(G.district.name, cx, y - 8);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#f4f1e8';
  ctx.fillText(G.district.flavor, cx, y + 14);
  ctx.restore();
  ctx.textAlign = 'left';
}
