// Money scale: the base rewards stay as specified, and clean, fast play earns
// bonuses — so a late-game frame shows thousands, not hundreds.
export function missionBonus(G, missionIndex) {
  let bonus = 0;
  // Clean job: finished with no wanted level.
  if (G.wanted && G.wanted.stars === 0) bonus += 100;
  // Fast timed job: more than 30 seconds left on the clock.
  if (G.missionTimer && G.missionTimer.seconds > 30) bonus += 200;
  void missionIndex;
  return bonus;
}

export function moneyLine(G) {
  return `$${G.player.money.toLocaleString('en-US')}`;
}
