// combat.js — Fists, bullets, and the thugs who answer them. Punching is a
// short arc in front of Dario; shooting spends one round of the selected
// weapon and sends a fast tracer. Thugs close in, swing, and shoot back.
// A thug who goes down drops ammo for the weapon Dario is carrying.
import { PLAYER, AMMO_DROP, REP_PER_THUG } from './config.js';
import { dist } from './random.js';
import { damageCar } from './cars.js';
import { addRep } from './rep.js';

export function punch(G) {
  const p = G.player;
  if (p.punchT > 0 || !p.onFoot) return;
  p.punchT = PLAYER.punchCd;
  G.shotsFired += 1;
  G.effects.push({ kind: 'swing', x: p.x + Math.cos(p.angle) * 30, y: p.y + Math.sin(p.angle) * 30, t: 0, life: 0.25 });
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < PLAYER.punchRange + 14) {
      e.hp -= PLAYER.punchDmg;
      G.effects.push({ kind: 'hit', x: e.x, y: e.y, t: 0, life: 0.35 });
      if (e.hp <= 0) onThugDown(G, e);
    }
  }
}

export function shoot(G, targetX, targetY) {
  const p = G.player;
  if (p.shootT > 0 || !p.onFoot) return;
  const w = G.weapons;
  const slot = w.slots[w.selected];
  if (!slot || slot.name === 'Fists') return;
  if (slot.ammo <= 0) {
    w.selected = 0;
    return;
  }
  slot.ammo -= 1;
  if (slot.ammo <= 0) w.selected = 0;
  p.shootT = PLAYER.shootCd;
  G.shotsFired += 1;
  const a = Math.atan2(targetY - p.y, targetX - p.x);
  p.angle = a;
  G.bullets.push({
    x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22,
    vx: Math.cos(a) * PLAYER.bulletSpeed, vy: Math.sin(a) * PLAYER.bulletSpeed,
    life: 1.1, owner: 'player', dmg: slot.dmg || PLAYER.bulletDmg,
  });
  G.effects.push({ kind: 'muzzle', x: p.x + Math.cos(a) * 26, y: p.y + Math.sin(a) * 26, t: 0, life: 0.12 });
  if (G.audio) G.audio.shoot();
}

export function onThugDown(G, e) {
  G.missions.killed += 1;
  addRep(G, REP_PER_THUG);
  const w = G.weapons;
  const pistol = w.slots.find((s) => s.name === 'Tide 9mm');
  if (pistol) pistol.ammo += AMMO_DROP.pistol;
  const smg = w.slots.find((s) => s.name === 'Squall SMG');
  if (smg) smg.ammo += AMMO_DROP.smg;
  const shotgun = w.slots.find((s) => s.name === 'Breaker 12');
  if (shotgun) shotgun.ammo += AMMO_DROP.shotgun;
  G.effects.push({ kind: 'down', x: e.x, y: e.y, t: 0, life: 0.8 });
  G.toast = 'Thug down — REP +' + REP_PER_THUG;
  G.toastT = 2;
}

export function updateCombat(G, dt) {
  const p = G.player;
  // Bullets fly and hit thugs, cars, and (only by accident) the scenery.
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.x > 3200 || b.y < 0 || b.y > 2400;
    if (!dead && b.owner === 'player') {
      for (const e of G.enemies) {
        if (e.hp > 0 && dist(b.x, b.y, e.x, e.y) < 18) {
          e.hp -= b.dmg;
          G.effects.push({ kind: 'hit', x: e.x, y: e.y, t: 0, life: 0.3 });
          if (e.hp <= 0) onThugDown(G, e);
          dead = true;
          break;
        }
      }
      if (!dead) {
        for (const car of G.cars) {
          if (car.driver === 'player' || car.wrecked) continue;
          if (dist(b.x, b.y, car.x, car.y) < 34) {
            damageCar(G, car, b.dmg);
            G.effects.push({ kind: 'hit', x: b.x, y: b.y, t: 0, life: 0.25 });
            dead = true;
            break;
          }
        }
      }
    }
    if (!dead && b.owner === 'enemy') {
      if (dist(b.x, b.y, p.x, p.y) < 16) {
        hurtPlayerLocal(G, b.dmg);
        dead = true;
      }
    }
    if (dead) G.bullets.splice(i, 1);
  }
  // Thugs: walk at Dario, swing up close, shoot from a little further out.
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(e.x, e.y, p.x, p.y);
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    e.angle = a;
    e.shootT -= dt;
    e.meleeT -= dt;
    if (d > 60) {
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      const fixed = { x: e.x, y: e.y };
      const pushed = pushOut(G, fixed);
      e.x = pushed.x;
      e.y = pushed.y;
    } else if (e.meleeT <= 0) {
      e.meleeT = 0.9;
      hurtPlayerLocal(G, 10);
      G.effects.push({ kind: 'swing', x: p.x, y: p.y, t: 0, life: 0.25 });
    }
    if (d > 120 && d < 420 && e.shootT <= 0) {
      e.shootT = 1.4 + G.random() * 1.2;
      G.bullets.push({
        x: e.x + Math.cos(a) * 20, y: e.y + Math.sin(a) * 20,
        vx: Math.cos(a) * 520, vy: Math.sin(a) * 520,
        life: 1.2, owner: 'enemy', dmg: 8,
      });
      G.effects.push({ kind: 'muzzle', x: e.x + Math.cos(a) * 24, y: e.y + Math.sin(a) * 24, t: 0, life: 0.12 });
    }
  }
  G.enemies = G.enemies.filter((e) => e.hp > 0 || e.t < 0.5);
  for (const e of G.enemies) if (e.hp <= 0) e.t = (e.t || 0) + dt;
  // Effects age out.
  for (let i = G.effects.length - 1; i >= 0; i--) {
    G.effects[i].t += dt;
    if (G.effects[i].t > G.effects[i].life) G.effects.splice(i, 1);
  }
}

function pushOut(G, p) {
  let { x, y } = p;
  for (const b of G.city.buildings) {
    const r = 14;
    if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) {
      const dl = x - (b.x - r);
      const dr = b.x + b.w + r - x;
      const dt = y - (b.y - r);
      const db = b.y + b.h + r - y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) x = b.x - r;
      else if (m === dr) x = b.x + b.w + r;
      else if (m === dt) y = b.y - r;
      else y = b.y + b.h + r;
    }
  }
  return { x, y };
}

function hurtPlayerLocal(G, amount) {
  // Same as player.hurtPlayer but without a circular import.
  const p = G.player;
  if (p.invuln > 0 || G.wasted || G.busted) return;
  p.hp -= amount;
  p.invuln = 0.6;
  G.effects.push({ kind: 'hit', x: p.x, y: p.y, t: 0, life: 0.4 });
  if (p.hp <= 0) {
    p.hp = 0;
    G.wasted = true;
  }
}
