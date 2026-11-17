// weapons.js — The four weapon slots on the HUD. Fists never run dry; the
// Tide 9mm starts loaded; the Squall SMG opens after mission 8 and the
// Breaker 12 after mission 10. Keys 1-4 (or the wheel) switch slots, and
// an empty magazine drops Dario back to his fists.
import { WEAPON_DEFS } from './config.js';

export function createWeapons() {
  return {
    slots: WEAPON_DEFS.map((d) => ({ key: d.key, name: d.name, ammo: d.ammo, dmg: d.dmg, unlockMission: d.unlockMission, unlocked: d.unlockMission === 0 })),
    selected: 1,
  };
}

export function unlockWeaponsFor(G) {
  const done = G.missions.completedCount;
  for (const s of G.weapons.slots) {
    if (!s.unlocked && done >= s.unlockMission) {
      s.unlocked = true;
      G.toast = 'New weapon: ' + s.name;
      G.toastT = 2.5;
    }
  }
}

export function selectWeapon(G, index) {
  const w = G.weapons;
  if (index < 0 || index >= w.slots.length) return;
  if (!w.slots[index].unlocked) return;
  w.selected = index;
}

export function cycleWeapon(G, dir) {
  const w = G.weapons;
  let next = w.selected;
  for (let i = 0; i < w.slots.length; i++) {
    next = (next + dir + w.slots.length) % w.slots.length;
    if (w.slots[next].unlocked) break;
  }
  w.selected = next;
}

export function selectedWeapon(G) {
  return G.weapons.slots[G.weapons.selected];
}
