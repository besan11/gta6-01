// Combat: fists up close, bullets at range. Thugs fight back — they close
// in to swing and shoot when they have distance. Kills feed REP and ammo.
import { PLAYER } from './config.js';
import { dist } from './random.js';
import { collideBuildings } from './world.js';
import { damageCar } from './cars.js';
import { hurtPlayer } from './player.js';
import { addWanted } from './wanted.js';
import { fireAmmo, addAmmo } from './weapons.js';

export function punch(G) {
  const p = G.player;
  if (!p.onFoot || p.punchT > 0) return false;
  p.punchT = PLAYER.punchCd;
  let hit = false;
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < PLAYER.punchRange + 14) {
      e.hp -= PLAYER.punchDmg;
      hit = true;
      G.effects.push({ x: e.x, y: e.y, t: 0, kind: 'hit', life: 0.3 });
      if (e.hp <= 0) onKill(G, e);
    }
  }
  return hit;
}

export function shoot(G, targetX, targetY) {
  const p = G.player;
  if (p.shootT > 0) return false;
  if (!fireAmmo(G)) return false;
  p.shootT = PLAYER.shootCd;
  const ox = p.car ? p.car.x : p.x;
  const oy = p.car ? p.car.y : p.y;
  const angle = Math.atan2(targetY - oy, targetX - ox);
  const spread = (G.random() - 0.5) * 0.06;
  G.bullets.push({
    x: ox + Math.cos(angle) * 24, y: oy + Math.sin(angle) * 24,
    angle: angle + spread, speed: PLAYER.bulletSpeed, dmg: PLAYER.bulletDmg,
    life: 1.1, fromPlayer: true,
  });
  G.shotsFired++;
  if (G.wanted.stars < 2) addWanted(G, 2, 'fired a weapon');
  for (const ped of G.peds) {
    if (dist(ox, oy, ped.x, ped.y) < 300) ped.fleeing = 3;
  }
  return true;
}

function onKill(G, e) {
  G.missions.killed++;
  if (G.rep) G.rep.points += 10;
  addAmmo(G, 'tide', 12);
  addAmmo(G, 'squall', 30);
  addAmmo(G, 'breaker', 6);
  G.effects.push({ x: e.x, y: e.y, t: 0, kind: 'down', life: 0.8 });
}

export function updateCombat(G, dt) {
  // Bullets fly, hit thugs, cop cars and parked cars, die on walls.
  for (const b of G.bullets) {
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;
    const hit = collideBuildings(G.city.buildings, b.x, b.y, 2);
    if (hit.x !== b.x || hit.y !== b.y) b.life = 0;
    if (b.life <= 0) continue;
    if (b.fromPlayer) {
      for (const e of G.enemies) {
        if (e.hp > 0 && dist(b.x, b.y, e.x, e.y) < 20) {
          e.hp -= b.dmg;
          b.life = 0;
          G.effects.push({ x: e.x, y: e.y, t: 0, kind: 'hit', life: 0.3 });
          if (e.hp <= 0) onKill(G, e);
          break;
        }
      }
      if (b.life > 0) {
        for (const cop of G.police) {
          if (!cop.wrecked && dist(b.x, b.y, cop.x, cop.y) < 30) {
            damageCar(G, cop, b.dmg);
            b.life = 0;
            break;
          }
        }
      }
      if (b.life > 0) {
        for (const car of G.cars) {
          if (!car.wrecked && car.driver !== 'player' && dist(b.x, b.y, car.x, car.y) < 30) {
            damageCar(G, car, b.dmg);
            b.life = 0;
            break;
          }
        }
      }
    } else {
      const p = G.player;
      const px = p.car ? p.car.x : p.x;
      const py = p.car ? p.car.y : p.y;
      if (dist(b.x, b.y, px, py) < (p.car ? 34 : 16)) {
        if (p.car) damageCar(G, p.car, b.dmg);
        else hurtPlayer(G, Math.round(b.dmg / 2));
        b.life = 0;
      }
    }
  }
  G.bullets = G.bullets.filter((b) => b.life > 0);
  G.enemies = G.enemies.filter((e) => e.hp > 0);
  // Thug AI: close in, swing up close, shoot from mid range.
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  for (const e of G.enemies) {
    e.shootT -= dt;
    e.meleeT -= dt;
    const d = dist(e.x, e.y, px, py);
    const a = Math.atan2(py - e.y, px - e.x);
    e.angle = a;
    if (d > 34) {
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      const fixed = collideBuildings(G.city.buildings, e.x, e.y, 12);
      e.x = fixed.x;
      e.y = fixed.y;
    }
    if (d < 40 && e.meleeT <= 0) {
      e.meleeT = 1.0;
      if (p.car) damageCar(G, p.car, 8);
      else hurtPlayer(G, 8);
    } else if (d > 180 && d < 460 && e.shootT <= 0) {
      e.shootT = 1 + G.random() * 1.2;
      G.bullets.push({
        x: e.x, y: e.y, angle: a + (G.random() - 0.5) * 0.22,
        speed: 620, dmg: 12, life: 1.0, fromPlayer: false,
      });
    }
  }
}
