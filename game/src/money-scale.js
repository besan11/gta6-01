// money-scale.js — The money in Porto Verde should feel like it grows. The
// base rewards stay exactly as specified, but a job done clean pays extra:
// no heat when the job lands, and a timed job finished with time to spare.
// The cover frame shows a late-game wallet, not a first-morning one.
export function missionBonus(G) {
  let bonus = 0;
  if (G.wanted.stars === 0) bonus += 100;
  const t = G.missionTimer;
  if (t && t.active && t.kind === 'countdown' && t.left > 30) bonus += 200;
  return bonus;
}

export function formatMoney(n) {
  return '$' + Math.floor(n).toLocaleString('en-US');
}
