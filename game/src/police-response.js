// Police response panel: every active PD unit on one line — unit name,
// officer name, distance in metres, and what it is doing right now.
// Status is read off behaviour: closing fast is RAMMING, closing is
// pursuing, anything else is en route. AIR-1 joins at four stars.
import { PD_UNITS } from './config.js';
import { dist } from './random.js';

export function pdRows(G) {
  const rows = [];
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  let shown = 0;
  for (const cop of G.police) {
    if (cop.wrecked || shown >= 4) continue;
    shown++;
    const u = PD_UNITS[(shown - 1) % PD_UNITS.length];
    const d = dist(cop.x, cop.y, px, py);
    const closing = cop.dist !== undefined && cop.prevDist !== undefined && cop.dist < cop.prevDist - 2;
    let status = 'en route';
    if (d < 90) status = 'RAMMING';
    else if (closing) status = 'pursuing';
    rows.push({ unit: u.unit, officer: u.officer, meters: Math.round(d / 2), status });
  }
  if (G.heli && G.heli.active) {
    const hd = dist(G.heli.x, G.heli.y, px, py);
    rows.push({ unit: 'AIR-1 Helo', officer: 'Ofc. June Park', meters: Math.round(hd / 2), status: 'spotlight' });
  }
  return rows.slice(0, 5);
}

export function drawPdPanel(ctx, G, x, y, w) {
  const rows = pdRows(G);
  if (G.wanted.stars < 1 && rows.length === 0) return 0;
  const h = 26 + rows.length * 22;
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2f6fd0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#9aa3ad';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PORTO VERDE PD RESPONSE', x + 10, y + 13);
  ctx.font = '12px sans-serif';
  rows.forEach((r, i) => {
    const ry = y + 26 + i * 22 + 9;
    ctx.fillStyle = '#f4f1e8';
    ctx.fillText(`${r.unit} — ${r.officer}`, x + 10, ry);
    ctx.fillStyle = r.status === 'RAMMING' ? '#ff5a4e' : '#7be07b';
    ctx.textAlign = 'right';
    ctx.fillText(`${r.meters}m · ${r.status}`, x + w - 10, ry);
    ctx.textAlign = 'left';
  });
  return h;
}
