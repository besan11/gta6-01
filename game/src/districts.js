// Porto Verde v6 — districts: the city names itself as you drive through it.
// A big banner names the new district for three seconds, then fades.
import { DISTRICTS } from './config.js';

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d;
  }
  return { name: 'PORTO VERDE', flavor: 'Three days in the sun' };
}

export function updateDistrict(G, dt) {
  const d = districtAt(G.player.x, G.player.y);
  if (!G.district || G.district.name !== d.name) {
    G.district = { name: d.name, flavor: d.flavor, bannerT: 3 };
    G.dayBanner = d.name;
    G.dayBannerT = 3;
  } else if (G.district.bannerT > 0) {
    G.district.bannerT -= dt;
  }
}
