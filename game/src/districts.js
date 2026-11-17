// districts.js — Where in Porto Verde are you? The district under Dario's
// feet comes from world.districtAt; crossing into a new one raises a big
// banner at the bottom of the screen for three seconds, then lets it fade.
import { districtAt } from './world.js';

export function createDistrictTracker(G) {
  const d = districtAt(G.player.x, G.player.y);
  return { current: d, banner: d, bannerT: 0 };
}

export function updateDistrict(G, dt) {
  const tr = G.district;
  const now = districtAt(G.player.x, G.player.y);
  if (now.name !== tr.current.name) {
    tr.current = now;
    tr.banner = now;
    tr.bannerT = 3;
    G.toast = now.name + ' — ' + now.flavor;
    G.toastT = 2;
  }
  if (tr.bannerT > 0) tr.bannerT -= dt;
}

export function showDistrictBanner(G, name) {
  const d = G.city.districts.find((q) => q.name === name) || G.district.current;
  G.district.banner = d;
  G.district.bannerT = 3;
}
