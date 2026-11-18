// Porto Verde v6 — REP: the city remembers. Missions, clean getaways and thugs
// down all build it; the rank and the progress bar are always on the HUD.
import { REP_RANKS } from './config.js';

export function createRep() {
  const rep = { points: 0, escaped: 0, thugsDown: 0 };
  rep.add = function add(G, n, reason) {
    rep.points += n;
    if (reason === 'thug down') rep.thugsDown += 1;
    if (reason === 'escaped') rep.escaped += 1;
  };
  return rep;
}

export function repRank(points) {
  let cur = REP_RANKS[0];
  for (const r of REP_RANKS) {
    if (points >= r.min) cur = r;
  }
  return cur;
}

export function repProgress(points) {
  const rank = repRank(points);
  const next = REP_RANKS[Math.min(rank.level + 1, REP_RANKS.length - 1)];
  const span = Math.max(1, next.min - rank.min);
  const into = points - rank.min;
  return { rank, into, span, pct: Math.min(1, into / span), nextMin: next.min };
}

export function addRep(G, n, reason) {
  if (G.rep) G.rep.add(G, n, reason);
}
