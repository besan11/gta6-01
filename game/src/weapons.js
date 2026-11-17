// Weapon slots: fists, pistol, SMG and shotgun, with ammo that matters.
// Keys 1-4 switch; running dry drops you back to fists automatically.
import { WEAPON_DEFS } from './config.js';

export function createWeapons() {
  return {
    slots: WEAPON_DEFS.map((d) => ({ key: d.key, name: d.name, ammo: d.ammo, unlock: d.unlock })),
    current: 0,
  };
}

export function unlockedSlots(G) {
  const done = G.missions ? G.missions.completedCount : 0;
  return G.weapons.slots.filter((s) => done >= s.unlock);
}

export function switchWeapon(G, index) {
  const w = G.weapons;
  const done = G.missions ? G.missions.completedCount : 0;
  if (index < 0 || index >= w.slots.length) return;
  const slot = w.slots[index];
  if (done < slot.unlock) {
    G.toast = `${slot.name} unlocks after mission ${slot.unlock + 1}.`;
    G.toastT = 2;
    return;
  }
  w.current = index;
}

export function addAmmo(G, pistol, smg, shotgun) {
  const w = G.weapons;
  if (!w) return;
  if (Number.isFinite(w.slots[1].ammo)) w.slots[1].ammo += pistol;
  if (Number.isFinite(w.slots[2].ammo)) w.slots[2].ammo += smg;
  if (Number.isFinite(w.slots[3].ammo)) w.slots[3].ammo += shotgun;
}

export function drawWeaponSlots(ctx, G, x, y) {
  const w = G.weapons;
  const done = G.missions ? G.missions.completedCount : 0;
  const slotW = 148;
  const h = 46;
  ctx.textAlign = 'left';
  for (let i = 0; i < w.slots.length; i += 1) {
    const s = w.slots[i];
    const sx = x + i * (slotW + 8);
    const locked = done < s.unlock;
    ctx.fillStyle = i === w.current ? 'rgba(255,207,63,0.92)' : 'rgba(16,20,28,0.88)';
    ctx.fillRect(sx, y, slotW, h);
    ctx.strokeStyle = i === w.current ? '#20242c' : '#ffcf3f';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, y + 0.5, slotW - 1, h - 1);
    ctx.fillStyle = i === w.current ? '#20242c' : '#f4f1e8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${s.key} ${s.name}`, sx + 8, y + 19);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = i === w.current ? '#20242c' : '#9aa3ad';
    if (locked) ctx.fillText(`unlocks mission ${s.unlock + 1}`, sx + 8, y + 36);
    else if (s.ammo === Infinity) ctx.fillText('∞ ammo', sx + 8, y + 36);
    else ctx.fillText(`${s.ammo} ammo`, sx + 8, y + 36);
  }
  return slotW * 4 + 24;
}
