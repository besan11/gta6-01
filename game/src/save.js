// save.js — Saving Porto Verde: continue where Dario left off.
// Features: save the mission, money, health, day/time and position to localStorage
// (autosave after every mission, manual save with Q), load it back on Continue,
// and detect whether a save exists for the title screen. Browser-only storage.
import { SAVE_KEY } from './config.js';

/** Write the current progress to localStorage. */
export function saveGame(G) {
  try {
    const p = G.player;
    const data = {
      version: 1,
      mission: G.missions.index,
      completed: G.missions.completedCount,
      money: p.money,
      hp: p.hp,
      day: G.clock.day,
      hour: G.clock.hour,
      minute: G.clock.minute,
      x: p.x,
      y: p.y,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    G.toast = 'Progress saved — see you soon, Dario.';
    G.toastT = 2.5;
    return true;
  } catch {
    return false;
  }
}

/** Read the save, or null when there is none / it is unreadable. */
export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

/** True when a save exists to continue from. */
export function hasSave() {
  return loadSave() !== null;
}

/** Apply a loaded save to a fresh game state. */
export function applySave(G, data) {
  G.missions.index = Math.min(data.mission || 0, 11);
  G.missions.completedCount = data.completed || 0;
  G.player.money = data.money || 0;
  G.player.hp = data.hp || 100;
  G.clock.day = data.day || 1;
  G.clock.hour = data.hour || 8;
  G.clock.minute = data.minute || 0;
  G.player.x = data.x || 660;
  G.player.y = data.y || 470;
  G.player.onFoot = true;
  G.player.car = null;
}
