// Combat: fists up close, bullets toward the mouse, thugs that shoot back.
// Kills feed REP and drop ammo; hitting bystanders raises the heat.
import { PLAYER } from './config.js';
import { dist } from './random.js';
import { hurtPlayer } from './player.js';
import { collideBuildings } from './world.js';
import { addWanted } from './wanted.js';
import { addRep } from './rep.js';
import { addAmmo } from './weapons.js';

export function punch(G) {
  const p = G.player;
  if (!p.onFoot || p.punchCd > 0) return false;
  p.punchCd = PLAYER.punchCd;
  if (G.audio) G.audio.punch();
  let hit = false;
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    if (dist(p.x, p.y, e.x, e.y) < PLAYER.punchRange + 14) {
      e.hp -= PLAYER.punchDmg;
      hit = true;
      G.effects.push({ x: e.x, y: e.y, t: 0.25, kind: 'hit' });
      if (e.hp <= 0) onEnemyDown(G, e);
    }
  }
  if (!hit) {
    for (const ped of G.peds) {
      if (dist(p.x, p.y, ped.x, ped.y) < PLAYER.punchRange + 10) {
        ped.flee = 2;
        addWanted(G, 1, 'hit a pedestrian');
        G.toast = 'That was a bystander! The PD noticed.';
        G.toastT = 2;
        break;
      }
    }
  }
  return hit;
}

export function shoot(G, targetX, targetY) {
  const p = G.player;
  if (p.shootCd > 0) return false;
  const w = G.weapons;
  const slot = w.slots[w.current];
  if (slot.name !== 'Fists' && slot.ammo <= 0) {
    w.current = 0;
    G.toast = 'Out of ammo — back to fists.';
    G.toastT = 2;
    return false;
  }
  p.shootCd = PLAYER.shootCd;
  G.shotsFired += 1;
  if (slot.name !== 'Fists') slot.ammo -= 1;
  const fromX = p.car ? p.car.x : p.x;
  const fromY = p.car ? p.car.y : p.y;
  const angle = Math.atan2(targetY - fromY, targetX - fromX);
  const count = slot.name === 'Breaker 12' ? 5 : 1;
  for (let i = 0; i < count; i += 1) {
    const spread = slot.name === 'Breaker 12' ? (i - 2) * 0.09 : 0;
    G.bullets.push({
      x: fromX + Math.cos(angle) * 24, y: fromY + Math.sin(angle) * 24,
      vx: Math.cos(angle + spread) * PLAYER.bulletSpeed,
      vy: Math.sin(angle + spread) * PLAYER.bulletSpeed,
      life: 0.9, dmg: slot.name === 'Squall SMG' ? 22 : PLAYER.bulletDmg, fromPlayer: true,
    });
  }
  if (G.audio) G.audio.shot();
  addWanted(G, 2, 'fired a gun');
  return true;
}

export function onEnemyDown(G, enemy) {
  if (enemy.counted) return;
  enemy.counted = true;
  addRep(G, 10, 'thug down');
  addAmmo(G, 12, 30, 6);
  if (G.missions) G.missions.killed += 1;
  G.effects.push({ x: enemy.x, y: enemy.y, t: 0.5, kind: 'down' });
  if (G.audio) G.audio.coin();
}

export function updateCombat(G, dt) {
  const p = G.player;
  p.shootCd = Math.max(0, p.shootCd - dt);
  // Bullets fly, hit thugs, cops, cars and walls.
  for (const b of G.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  G.bullets = G.bullets.filter((b) => b.life > 0 && b.x > 0 && b.x < 3200 && b.y > 0 && b.y < 2400);
  for (const b of G.bullets) {
    if (!b.fromPlayer) continue;
    for (const e of G.enemies) {
      if (e.hp <= 0) continue;
      if (dist(b.x, b.y, e.x, e.y) < 20) {
        e.hp -= b.dmg;
        b.life = 0;
        G.effects.push({ x: e.x, y: e.y, t: 0.2, kind: 'hit' });
        if (e.hp <= 0) onEnemyDown(G, e);
        break;
      }
    }
    if (b.life <= 0) continue;
    for (const cop of G.police) {
      if (dist(b.x, b.y, cop.x, cop.y) < 30) {
        b.life = 0;
        addWanted(G, 1, 'shot at the police');
        break;
      }
    }
  }
  // Thugs advance, punch close up, shoot from range.
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(e.x, e.y, p.x, p.y);
    e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (d > 34) {
      e.x += Math.cos(e.angle) * e.speed * dt;
      e.y += Math.sin(e.angle) * e.speed * dt;
      const fixed = collideBuildings(G.city.buildings, e.x, e.y, 28);
      e.x = fixed.x;
      e.y = fixed.y;
    }
    e.meleeT = Math.max(0, e.meleeT - dt);
    e.shootT -= dt;
    if (d < 40 && e.meleeT <= 0) {
      e.meleeT = 0.9;
      hurtPlayer(G, 9);
    } else if (d > 120 && d < 520 && e.shootT <= 0) {
      e.shootT = 1.4 + G.random() * 0.8;
      G.bullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(e.angle) * 520, vy: Math.sin(e.angle) * 520,
        life: 1.1, dmg: 7, fromPlayer: false,
      });
    }
  }
  for (const b of G.bullets) {
    if (b.fromPlayer) continue;
    if (dist(b.x, b.y, p.x, p.y) < 16) {
      b.life = 0;
      hurtPlayer(G, b.dmg);
    }
  }
  G.enemies = G.enemies.filter((e) => e.hp > 0 || !e.counted);
  G.enemies = G.enemies.filter((e) => e.hp > 0);
  for (const fx of G.effects) fx.t -= dt;
  G.effects = G.effects.filter((fx) => fx.t > 0);
}
