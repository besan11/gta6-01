// Porto Verde v6 — money that reads like progress: thousands by day three,
// with clean-work and fast-finish bonuses on top of the mission rewards.
import { MISSION_REWARDS } from './config.js';

export function missionBonus(G) {
  let bonus = 0;
  if (G.wanted.stars === 0) bonus += 100;
  const mission = G.missions ? null : null;
  return bonus;
}

export function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function expectedMoneyAfter(missionIndex) {
  let sum = 120;
  for (let i = 0; i <= missionIndex && i < MISSION_REWARDS.length; i += 1) sum += MISSION_REWARDS[i];
  return sum;
}
