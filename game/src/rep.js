// rep.js — Street reputation. Missions, clean getaways, and thugs taken down
// all build REP; the rank ladder is NOBODY → HUSTLER → PLAYER → SHOT CALLER
// → BAY LEGEND, with a progress bar toward the next rank on the HUD.
import { REP_RANKS } from './config.js';

export function createRep() {
  return { total: 0, rank: 0, rankName: REP_RANKS[0].name };
}

export function repRankFor(total) {
  let rank = 0;
  for (let i = 0; i < REP_RANKS.length; i++) {
    if (total >= REP_RANKS[i].min) rank = i;
  }
  return rank;
}

export function repProgress(total) {
  const rank = repRankFor(total);
  const cur = REP_RANKS[rank];
  const next = REP_RANKS[rank + 1];
  if (!next) return { rank, name: cur.name, cur: total, next: total, frac: 1 };
  return { rank, name: cur.name, cur: total, next: next.min, frac: (total - cur.min) / (next.min - cur.min) };
}

export function addRep(G, amount) {
  const r = G.rep;
  const before = repRankFor(r.total);
  r.total += amount;
  const after = repRankFor(r.total);
  r.rank = after;
  r.rankName = REP_RANKS[after].name;
  if (after > before) {
    G.toast = 'REP UP — now ' + r.rankName;
    G.toastT = 3;
  }
}
