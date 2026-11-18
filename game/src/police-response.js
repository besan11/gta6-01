// Porto Verde v6 — the PD response panel: every active unit by name, officer,
// distance in metres and live status. Empty when the heat is off.
import { PD_UNITS } from './config.js';
import { dist } from './random.js';

export function policePanel(G) {
  if (G.wanted.stars < 1) return [];
  const rows = [];
  const p = G.player;
  G.police.forEach((cop, i) => {
    if (cop.wrecked) return;
    const def = PD_UNITS[i % PD_UNITS.length];
    const d = dist(cop.x, cop.y, p.x, p.y);
    const closing = cop.speed > 200;
    const status = d < 90 ? 'RAMMING' : closing ? 'pursuing' : 'en route';
    rows.push({ unit: def.unit, officer: def.officer, distM: Math.round(d / 2), status });
  });
  if (G.heli && G.heli.active) {
    rows.push({ unit: 'AIR-1', officer: 'Pilot R. Cale', distM: Math.round(dist(G.heli.x, G.heli.y, p.x, p.y) / 2), status: 'spotlight' });
  }
  return rows.slice(0, 5);
}
