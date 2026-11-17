// Districts: six named quarters of Porto Verde. Crossing into a new one raises a
// big banner with its name and flavour, then it fades after three seconds.
import { DISTRICTS } from './config.js';

export function createDistrict() {
  return { current: '', name: '', flavor: '', bannerT: 0, bannerShown: '' };
}

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  }
  return DISTRICTS[2];
}

export function updateDistrict(G, dt) {
  const d = G.district;
  const here = districtAt(G.player.x, G.player.y);
  if (here.name !== d.current) {
    d.current = here.name;
    d.name = here.name;
    d.flavor = here.flavor;
    d.bannerT = 3;
    d.bannerShown = here.name;
  }
  if (d.bannerT > 0) d.bannerT -= dt;
}

export function drawDistrictBanner(ctx, G) {
  const d = G.district;
  if (!d.bannerT || d.bannerT <= 0) return;
  const alpha = Math.min(1, d.bannerT);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(16,20,28,0.72)';
  ctx.fillRect(340, 560, 600, 64);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(d.name, 640, 588);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = '15px sans-serif';
  ctx.fillText(d.flavor, 640, 612);
  ctx.restore();
}
