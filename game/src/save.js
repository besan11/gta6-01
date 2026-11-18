// Porto Verde v6 — save to localStorage, schema v1 exactly, plus rep/weapons
// carried as optional extras with safe defaults on old saves.
import { SAVE_KEY } from './config.js';
import { clamp } from './random.js';

export function saveGame(G) {
  const data = {
    version: 1,
    mission: G.missions.index,
    completed: G.missions.completedCount,
    money: Math.round(G.player.money),
    hp: Math.round(G.player.hp),
    day: G.clock.day,
    hour: G.clock.hour,
    minute: G.clock.minute,
    x: Math.round(G.player.x),
    y: Math.round(G.player.y),
    savedAt: Math.floor(G.time),
    rep: G.rep ? Math.round(G.rep.points) : 0,
    weapon: G.weapons ? G.weapons.selected : 1,
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
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
  G.clock.hour = clamp(data.hour | 0, 0, 23);
  G.clock.minute = clamp(data.minute | 0, 0, 59);
  G.player.x = clamp(data.x | 0, 274, 3184);
  G.player.y = clamp(data.y | 0, 16, 2384);
  if (G.rep && typeof data.rep === 'number') G.rep.points = Math.max(0, data.rep | 0);
  if (G.weapons && typeof data.weapon === 'number') G.weapons.selected = clamp(data.weapon | 0, 0, 3);
}
