// REP: street reputation. Missions, clean getaways and thugs taken down all raise it;
// the rank is the progression the HUD never stops showing.
import { REP_RANKS } from './config.js';

export function createRep() {
  return { points: 0, rank: 0, lastGain: '', lastGainT: 0 };
}

export function repRank(points) {
  let rank = 0;
  for (let i = 0; i < REP_RANKS.length; i += 1) {
    if (points >= REP_RANKS[i].min) rank = i;
  }
  return rank;
}

export function repNextAt(points) {
  const rank = repRank(points);
  if (rank >= REP_RANKS.length - 1) return REP_RANKS[rank].min;
  return REP_RANKS[rank + 1].min;
}

export function repName(points) {
  return REP_RANKS[repRank(points)].name;
}

export function addRep(G, n, reason) {
  if (!G.rep) return;
  const before = repRank(G.rep.points);
  G.rep.points += n;
  G.rep.lastGain = `+${n} REP — ${reason}`;
  G.rep.lastGainT = 3;
  const after = repRank(G.rep.points);
  if (after > before) {
    G.toast = `REP UP — you are now ${REP_RANKS[after].name}!`;
    G.toastT = 4;
  }
}

export function repLine(G) {
  const pts = G.rep.points;
  const rank = repRank(pts);
  const next = repNextAt(pts);
  const prev = REP_RANKS[rank].min;
  const shown = rank >= REP_RANKS.length - 1 ? pts : pts;
  return `REP ${rank} · ${REP_RANKS[rank].name} · ${shown.toLocaleString('en-US')}/${next.toLocaleString('en-US')}`;
}
