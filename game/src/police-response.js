// PORTO VERDE PD RESPONSE — the panel the police radio reads from: every active unit,
// its officer, its distance in metres and what it is doing right now.
import { PD_UNITS, HELI_NAME } from './config.js';
import { dist } from './random.js';

export function policeResponseLines(G) {
  if (!G.wanted || G.wanted.stars < 1) return [];
  const p = G.player;
  const lines = [];
  for (let i = 0; i < G.police.length && i < 4; i += 1) {
    const cop = G.police[i];
    const unit = PD_UNITS[i % PD_UNITS.length];
    const metres = Math.round(dist(cop.x, cop.y, p.x, p.y) / 2);
    const d = dist(cop.x, cop.y, p.x, p.y);
    let status = 'en route';
    if (d < 90) status = 'RAMMING';
    else if (cop.speed > 200) status = 'pursuing';
    lines.push({ unit: unit.unit, officer: unit.officer, metres, status, close: d < 200 });
  }
  if (G.heli && G.heli.active) {
    lines.push({ unit: `${HELI_NAME} (air)`, officer: 'Lt. Ines Duarte', metres: Math.round(dist(G.heli.x, G.heli.y, p.x, p.y) / 2), status: 'overhead', close: false });
  }
  return lines;
}

export function drawPolicePanel(ctx, G, x, y, w) {
  const lines = policeResponseLines(G);
  if (lines.length === 0) return 0;
  const rowH = 24;
  const h = 30 + lines.length * rowH;
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PORTO VERDE PD RESPONSE', x + 10, y + 19);
  ctx.font = '12px sans-serif';
  for (let i = 0; i < lines.length; i += 1) {
    const ln = lines[i];
    const ly = y + 30 + i * rowH + 14;
    const shortOfficer = ln.officer.replace(/^(Ofc\.|Sgt\.|Lt\.)\s*/, '').split(' ').pop();
    ctx.fillStyle = ln.status === 'RAMMING' ? '#ff5a4e' : '#f4f1e8';
    ctx.fillText(`${ln.unit} — ${shortOfficer}`, x + 10, ly);
    ctx.textAlign = 'right';
    ctx.fillStyle = ln.close ? '#ff5a4e' : '#9aa3ad';
    ctx.fillText(`${ln.metres}m · ${ln.status}`, x + w - 10, ly);
    ctx.textAlign = 'left';
  }
  return h;
}
