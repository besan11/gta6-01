// police-response.js — The "PORTO VERDE PD RESPONSE" panel: one row per
// active cruiser with its unit name, its officer, its distance to Dario in
// meters (1 meter is about 2 world pixels), and what it is doing right now:
// pursuing when the gap closes, en route while it closes in, RAMMING when
// it is on top of him. AIR-1 joins the list while the helicopter is up.
import { PD_UNITS, PD_AIR_UNIT } from './config.js';
import { dist } from './random.js';

export function pdRows(G) {
  const rows = [];
  const p = G.player;
  G.police.forEach((cop, i) => {
    const def = PD_UNITS[i % PD_UNITS.length];
    const d = Math.round(dist(cop.x, cop.y, p.x, p.y) / 2);
    let status = 'en route';
    if (cop.ramming) status = 'RAMMING';
    else if (cop.distToPlayer !== undefined && cop.prevDist !== undefined && cop.distToPlayer < cop.prevDist) status = 'pursuing';
    rows.push({ unit: def.unit, officer: def.officer, meters: d, status });
    cop.prevDist = cop.distToPlayer;
  });
  if (G.heli && G.heli.active) {
    rows.push({ unit: PD_AIR_UNIT.unit, officer: PD_AIR_UNIT.officer, meters: Math.round(dist(G.heli.x, G.heli.y, p.x, p.y) / 2), status: 'overhead' });
  }
  return rows.slice(0, 5);
}

export function drawPdPanel(ctx, G, x, y, w) {
  const rows = pdRows(G);
  if (G.wanted.stars < 1 || rows.length === 0) return 0;
  const rowH = 20;
  const h = 24 + rows.length * rowH;
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PORTO VERDE PD RESPONSE', x + 8, y + 12);
  ctx.font = '12px system-ui, sans-serif';
  rows.forEach((row, i) => {
    const ry = y + 24 + i * rowH + rowH / 2;
    ctx.fillStyle = '#f4f1e8';
    ctx.fillText(row.unit + ' — ' + row.officer, x + 8, ry);
    const right = row.meters + 'm · ' + row.status;
    ctx.fillStyle = row.status === 'RAMMING' ? '#ff5a4e' : '#9aa3ad';
    ctx.textAlign = 'right';
    ctx.fillText(right, x + w - 8, ry);
    ctx.textAlign = 'left';
  });
  G.drawn.pdPanel = rows.length;
  return h;
}
