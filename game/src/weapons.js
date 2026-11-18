// Weapon slots: fists are forever, the Tide 9mm starts loaded, the Squall
// SMG opens after mission 8 and the Breaker 12 after mission 10. Ammo is a
// resource — thugs you drop leave some behind.
import { WEAPON_DEFS } from './config.js';

export function createWeapons() {
  return {
    slots: WEAPON_DEFS.map((d) => ({ id: d.id, name: d.name, ammo: d.ammo, afterMission: d.afterMission })),
    selected: 1,
  };
}

export function unlockedSlots(G) {
  const done = G.missions ? G.missions.completedCount : 0;
  return G.weapons.slots.filter((s) => done >= s.afterMission);
}

export function currentWeapon(G) {
  return G.weapons.slots[G.weapons.selected];
}

export function selectWeapon(G, i) {
  const list = unlockedSlots(G);
  if (i >= 0 && i < list.length) {
    const real = G.weapons.slots.indexOf(list[i]);
    G.weapons.selected = real;
    return true;
  }
  return false;
}

export function cycleWeapon(G, dir) {
  const list = unlockedSlots(G);
  if (list.length < 2) return;
  const cur = list.indexOf(currentWeapon(G));
  const next = list[(cur + dir + list.length) % list.length];
  G.weapons.selected = G.weapons.slots.indexOf(next);
}

// Returns false when the current weapon is dry (caller falls back to fists).
export function fireAmmo(G) {
  const w = currentWeapon(G);
  if (!w) return false;
  if (!isFinite(w.ammo)) return true;
  if (w.ammo <= 0) {
    G.weapons.selected = 0;
    return false;
  }
  w.ammo -= 1;
  if (w.ammo <= 0) G.weapons.selected = 0;
  return true;
}

export function addAmmo(G, id, n) {
  if (!G.weapons) return;
  const s = G.weapons.slots.find((x) => x.id === id);
  if (s && isFinite(s.ammo)) s.ammo += n;
}

export function drawWeapons(ctx, G, cx, y) {
  const list = unlockedSlots(G);
  const slotW = 118;
  const w = list.length * slotW + (list.length - 1) * 6;
  let x = cx - w / 2;
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  list.forEach((s, i) => {
    const real = G.weapons.slots.indexOf(s);
    const active = real === G.weapons.selected;
    ctx.fillStyle = active ? 'rgba(255,207,63,0.92)' : 'rgba(16,20,28,0.88)';
    ctx.fillRect(x, y, slotW, 30);
    ctx.strokeStyle = active ? '#20242c' : '#ffcf3f';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, 29);
    ctx.fillStyle = active ? '#20242c' : '#f4f1e8';
    ctx.textAlign = 'left';
    const ammo = isFinite(s.ammo) ? String(s.ammo) : '∞';
    ctx.fillText(`${i + 1} ${s.name} ${ammo}`, x + 8, y + 16);
    x += slotW + 6;
  });
  ctx.textAlign = 'left';
}
