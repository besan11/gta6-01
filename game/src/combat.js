// combat.js — Combat in Porto Verde: fists, pistol, bullets and thugs.
// Features: punch attacks (F) with range and facing, mouse-aimed pistol shots,
// bullets that stop at buildings and damage enemies, cars and the player, thug AI
// that chases the player and shoots or punches, car ramming that hurts pedestrians,
// and muzzle-flash + hit effects. Crime from shooting raises the wanted level.
import { PLAYER } from './config.js';
import { angleDiff, clamp, dist } from './random.js';
import { hitsBuilding, collideBuildings } from './world.js';
import { damageCar } from './cars.js';
import { hurtPlayer } from './player.js';
import { addWanted } from './wanted.js';

/** Punch: hit the nearest enemy or pedestrian in front of the player. */
export function punch(G) {
  const p = G.player;
  if (!p.onFoot || p.punchCooldown > 0) return;
  p.punchCooldown = PLAYER.punchCooldown;
  G.audio.punch();
  G.effects.push({ kind: 'punch', x: p.x + Math.cos(p.angle) * 30, y: p.y + Math.sin(p.angle) * 30, t: 0.2 });
  for (const e of G.enemies) {
    const d = dist(p.x, p.y, e.x, e.y);
    const facing = Math.cos(angleDiff(p.angle, Math.atan2(e.y - p.y, e.x - p.x)));
    if (d < PLAYER.punchRange && facing > 0.3) {
      e.hp -= PLAYER.punchDamage;
      G.audio.hit();
    }
  }
  // Hitting a pedestrian is a crime.
  for (const ped of G.peds) {
    const d = dist(p.x, p.y, ped.x, ped.y);
    const facing = Math.cos(angleDiff(p.angle, Math.atan2(ped.y - p.y, ped.x - p.x)));
    if (d < PLAYER.punchRange && facing > 0.3) {
      ped.flee = 3;
      addWanted(G, 1, 'Assaulted a pedestrian');
    }
  }
}

/** Shoot the pistol toward the mouse (on foot) or the car's heading (driving). */
export function shoot(G, targetX, targetY) {
  const p = G.player;
  if (p.shootCooldown > 0) return;
  p.shootCooldown = PLAYER.shootCooldown;
  const ox = p.car ? p.car.x : p.x;
  const oy = p.car ? p.car.y : p.y;
  const angle = Math.atan2(targetY - oy, targetX - ox);
  G.bullets.push({
    x: ox + Math.cos(angle) * 30, y: oy + Math.sin(angle) * 30,
    angle, speed: PLAYER.bulletSpeed, from: 'player', damage: PLAYER.bulletDamage, life: 1.2,
  });
  G.shotsFired = 1.5;
  G.audio.shoot();
  G.effects.push({ kind: 'muzzle', x: ox + Math.cos(angle) * 34, y: oy + Math.sin(angle) * 34, t: 0.08 });
  addWanted(G, 1, 'Shots fired in public');
}

/** One combat step: move bullets, resolve hits, run thug AI, clean up the dead. */
export function updateCombat(G, dt) {
  const p = G.player;
  if (G.shotsFired > 0) G.shotsFired -= dt;
  // Bullets fly, stop at buildings, and hit what they touch.
  for (let i = G.bullets.length - 1; i >= 0; i -= 1) {
    const b = G.bullets[i];
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;
    let dead = b.life <= 0 || hitsBuilding(G.city.buildings, b.x, b.y, 2);
    if (!dead && b.from === 'player') {
      for (const e of G.enemies) {
        if (dist(b.x, b.y, e.x, e.y) < 20) { e.hp -= b.damage; dead = true; G.audio.hit(); break; }
      }
      if (!dead) {
        for (const car of G.cars) {
          if (car.driver === 'player' || car.wrecked) continue;
          if (Math.abs(b.x - car.x) < 36 && Math.abs(b.y - car.y) < 22) {
            damageCar(G, car, b.damage);
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        // The mission courier (a traffic car with driver 'chase') can be shot too.
        for (const car of G.traffic) {
          if (car.driver !== 'chase' || car.wrecked) continue;
          if (Math.abs(b.x - car.x) < 36 && Math.abs(b.y - car.y) < 22) {
            damageCar(G, car, b.damage);
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        for (const cop of G.police) {
          if (Math.abs(b.x - cop.x) < 36 && Math.abs(b.y - cop.y) < 22) {
            damageCar(G, cop, b.damage);
            addWanted(G, 1, 'Shot at the police');
            dead = true;
            break;
          }
        }
      }
    }
    if (!dead && b.from === 'enemy') {
      const px = p.car ? p.car.x : p.x;
      const py = p.car ? p.car.y : p.y;
      if (dist(b.x, b.y, px, py) < (p.car ? 34 : 16)) {
        if (p.car) damageCar(G, p.car, b.damage);
        else if (hurtPlayer(G, b.damage)) G.wasted = true;
        dead = true;
      }
    }
    if (dead) G.bullets.splice(i, 1);
  }
  // Thug AI: chase the player, punch up close, shoot from mid-range.
  for (const e of G.enemies) {
    const px = p.car ? p.car.x : p.x;
    const py = p.car ? p.car.y : p.y;
    const d = dist(e.x, e.y, px, py);
    e.angle = Math.atan2(py - e.y, px - e.x);
    if (d > 46) {
      const nx = e.x + Math.cos(e.angle) * e.speed * dt;
      const ny = e.y + Math.sin(e.angle) * e.speed * dt;
      const fixed = collideBuildings(G.city.buildings, nx, ny, 12);
      e.x = fixed.x;
      e.y = fixed.y;
    } else if (e.meleeT <= 0) {
      e.meleeT = 1.1;
      if (!p.car && hurtPlayer(G, 10)) G.wasted = true;
      else if (p.car) damageCar(G, p.car, 6);
      G.audio.punch();
    }
    e.meleeT -= dt;
    e.shootT -= dt;
    if (d > 140 && d < 520 && e.shootT <= 0) {
      e.shootT = 1.6 + G.random() * 1.2;
      G.bullets.push({
        x: e.x, y: e.y, angle: e.angle + (G.random() - 0.5) * 0.2,
        speed: 620, from: 'enemy', damage: 9, life: 1.4,
      });
      G.audio.shoot();
    }
  }
  // Remove dead thugs, count the kills toward the mission.
  for (let i = G.enemies.length - 1; i >= 0; i -= 1) {
    if (G.enemies[i].hp <= 0) {
      G.effects.push({ kind: 'down', x: G.enemies[i].x, y: G.enemies[i].y, t: 0.7 });
      G.enemies.splice(i, 1);
      G.missions.killed += 1;
      G.player.money += 20;
    }
  }
  // A speeding player car that hits a pedestrian is a crime.
  if (p.car && Math.abs(p.car.speed) > 260) {
    for (const ped of G.peds) {
      if (dist(ped.x, ped.y, p.car.x, p.car.y) < 40) {
        ped.flee = 4;
        addWanted(G, 1, 'Hit a pedestrian');
        G.audio.crash();
        p.car.speed *= 0.7;
      }
    }
  }
  void clamp;
}
