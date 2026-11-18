// Save / load through localStorage. Schema v1 is kept exactly, with rep and
// weapon ammo riding along as optional fields with safe defaults.
import { SAVE_KEY } from './config.js';
import { clamp } from './random.js';

export function saveGame(G) {
  try {
    const data = {
      version: 1,
      mission: G.missions.index,
      completed: G.missions.completedCount,
      money: G.player.money,
      hp: G.player.hp,
      day: G.clock.day,
      hour: G.clock.hour,
      minute: G.clock.minute,
      x: G.player.x,
      y: G.player.y,
      savedAt: G.time,
      rep: G.rep ? G.rep.points : 0,
      ammo: G.weapons ? G.weapons.slots.map((s) => s.ammo) : [],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    G.toast = 'Game saved.';
    G.toastT = 2;
    return true;
  } catch { return false; }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch { return null; }
}

export function hasSave() {
  return loadSave() !== null;
}

export function applySave(G, data) {
  G.missions.index = clamp(data.mission | 0, 0, 11);
  G.missions.completedCount = clamp(data.completed | 0, 0, 12);
  G.player.money = Math.max(0, data.money | 0);
  G.player.hp = clamp(data.hp | 0, 1, 100);
  G.clock.day = clamp(data.day | 0, 1, 3);
  G.clock.hour = clamp(data.hour | 0, 0, 22);
  G.clock.minute = clamp(data.minute | 0, 0, 59);
  G.player.x = clamp(data.x || 534, 274, 3184);
  G.player.y = clamp(data.y || 540, 16, 2384);
  if (G.rep && typeof data.rep === 'number') G.rep.points = Math.max(0, data.rep);
  if (G.weapons && Array.isArray(data.ammo)) {
    data.ammo.forEach((a, i) => {
      if (G.weapons.slots[i] && typeof a === 'number' && isFinite(a)) G.weapons.slots[i].ammo = a;
    });
  }
  G.missions.step = 0;
  G.missions.dialog = null;
  G.dialogue = null;
}
