// Money scale: the base rewards stay as written, but clean work pays extra —
// finishing a mission with no heat at all, and finishing a timed mission
// with time to spare. Late-game covers should read like a career, not a start.
export function missionBonus(G) {
  let bonus = 0;
  if (G.wanted && G.wanted.stars === 0) bonus += 100;
  const left = G.missions ? (G.missions.timerLeft || 0) : 0;
  if (left > 30) bonus += 200;
  return bonus;
}

export function formatMoney(n) {
  const s = String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${s}`;
}
