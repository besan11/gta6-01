// Porto Verde v6 — the weapon slots: fists always, Tide 9mm from the start,
// Squall SMG after the vault key, Breaker 12 after the cafe stands. Ammo is
// a resource; running dry drops you back to fists.
import { WEAPON_DEFS } from './config.js';

export function createWeapons() {
  const slots = WEAPON_DEFS.map((def) => ({
    key: def.key, name: def.name, ammo: def.ammo, dmg: def.dmg, cd: def.cd,
    auto: !!def.auto, unlockMission: def.unlockMission || 0, unlocked: !def.unlockMission,
  }));
  const w = { slots, selected: 1 };
  w.current = function current() { return slots[w.selected]; };
  w.select = function select(G, index) {
    if (index < 0 || index >= slots.length) return;
    if (!slots[index].unlocked) return;
    w.selected = index;
  };
  w.addAmmo = function addAmmo(G, key, n) {
    for (const s of slots) {
      if (s.key === key && s.ammo !== Infinity) s.ammo += n;
    }
  };
  w.checkUnlocks = function checkUnlocks(G) {
    const done = G.missions.completedCount;
    for (const s of slots) {
      if (s.unlockMission && done >= s.unlockMission && !s.unlocked) {
        s.unlocked = true;
        G.toast = 'New weapon unlocked: ' + s.name;
        G.toastT = 3;
      }
    }
  };
  return w;
}

export function currentWeapon(G) {
  return G.weapons.slots[G.weapons.selected];
}

export function checkUnlocks(G) {
  if (G.weapons) G.weapons.checkUnlocks(G);
}

export function selectWeapon(G, index) {
  if (G.weapons) G.weapons.select(G, index);
}

export function addAmmo(G, key, n) {
  if (G.weapons) G.weapons.addAmmo(G, key, n);
}
