// REP: the city's memory of Dario. Missions pay the most, losing the cops
// pays well, and every thug put down adds a little. Ranks gate the story.
import { REP_RANKS } from './config.js';

export function createRep() {
  return { points: 0 };
}

export function repRank(points) {
  let level = 0;
  for (let i = 0; i < REP_RANKS.length; i++) {
    if (points >= REP_RANKS[i].min) level = i;
  }
  const cur = REP_RANKS[level];
  const next = REP_RANKS[level + 1] || null;
  return { level, name: cur.name, next: next ? next.min : null };
}

export function addRep(G, n) {
  if (!G.rep) return;
  G.rep.points = Math.max(0, G.rep.points + n);
}

export function formatRep(points) {
  const r = repRank(points);
  const next = r.next === null ? 'MAX' : String(r.next).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const pts = String(points).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `REP ${r.level} · ${r.name} · ${pts}/${next}`;
}

export function drawRepBar(ctx, G, x, y, w) {
  const r = repRank(G.rep.points);
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, 34);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 33);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatRep(G.rep.points), x + 10, y + 11);
  const span = r.next === null ? 1 : (r.next - REP_RANKS[r.level].min);
  const prog = r.next === null ? 1 : (G.rep.points - REP_RANKS[r.level].min) / span;
  ctx.fillStyle = '#37e0a0';
  ctx.fillRect(x + 10, y + 23, Math.max(2, (w - 20) * Math.min(1, prog)), 5);
}
