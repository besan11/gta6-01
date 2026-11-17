// save.js — Save and Continue, localStorage only. The v1 schema is kept
// exactly ({version:1, mission, completed, money, hp, day, hour, minute,
// x, y, savedAt}) so an old save still loads; REP and the weapon slots ride
// along as extra fields with safe defaults when they are missing.
import { SAVE_KEY, REP_RANKS } from './config.js';
import { clamp } from './random.js';
import { repRankFor } from './rep.js';

export function saveGame(G) {
  const data = {
    version: 1,
    mission: G.missions.index,
    completed: G.missions.completedCount,
    money: Math.floor(G.player.money),
    hp: Math.ceil(G.player.hp),
    day: G.clock.day,
    hour: G.clock.hour,
    minute: G.clock.minute,
    x: Math.round(G.player.x),
    y: Math.round(G.player.y),
    rep: G.rep.total,
    weapons: G.weapons.slots.map((s) => ({ name: s.name, ammo: s.ammo === Infinity ? -1 : s.ammo, unlocked: s.unlocked })),
    savedAt: 0,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable */ }
  return data;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function hasSave() {
  return loadSave() !== null;
}

export function applySave(G, data) {
  if (!data) return;
  G.missions.index = clamp(data.mission || 0, 0, 11);
  G.missions.completedCount = clamp(data.completed || 0, 0, 12);
  G.missions.step = 0;
  G.player.money = data.money || 0;
  G.player.hp = clamp(data.hp || 100, 1, 100);
  G.clock.day = clamp(data.day || 1, 1, 3);
  G.clock.hour = clamp(data.hour || 8, 0, 22);
  G.clock.minute = clamp(data.minute || 0, 0, 59);
  G.player.x = clamp(data.x || 534, 274, 3184);
  G.player.y = clamp(data.y || 540, 16, 2384);
  if (typeof data.rep === 'number') {
    G.rep.total = data.rep;
    G.rep.rank = repRankFor(data.rep);
    G.rep.rankName = REP_RANKS[G.rep.rank].name;
  }
  if (Array.isArray(data.weapons)) {
    for (const saved of data.weapons) {
      const slot = G.weapons.slots.find((s) => s.name === saved.name);
      if (slot) {
        slot.ammo = saved.ammo === -1 ? Infinity : saved.ammo;
        slot.unlocked = !!saved.unlocked;
      }
    }
  }
}
