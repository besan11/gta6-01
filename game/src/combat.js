// Porto Verde v6 — combat: fists up close, bullets at range, thugs who fight back.
// Thugs spawn only on open ground (never on a roof) — missions.js enforces that.
import { PUNCH_DMG, PUNCH_RANGE, PUNCH_CD, BULLET_SPEED, BULLET_DMG } from './config.js';
import { dist } from './random.js';
import { hurtPlayer } from './player.js';
import { addWanted } from './wanted.js';

export function punch(G) {
  const p = G.player;
  if (p.punchT > 0 || !p.onFoot) return;
  p.punchT = PUNCH_CD;
  if (G.audio) G.audio.noise(0.08, 0.1, 600);
  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    if (dist(e.x, e.y, p.x, p.y) < PUNCH_RANGE + 14) {
      e.hp -= PUNCH_DMG;
      e.x += Math.cos(p.angle) * 18;
      e.y += Math.sin(p.angle) * 18;
      G.effects.push({ kind: 'hit', x: e.x, y: e.y, t: 0, ttl: 0.3 });
      if (e.hp <= 0) onThugDown(G, e);
    }
  }
}

export function shoot(G, targetX, targetY) {
  const p = G.player;
  const w = G.weapons ? G.weapons.current() : null;
  if (!w || w.key === 'fists') { punch(G); return; }
  if (p.shootT > 0) return;
  if (w.ammo <= 0) {
    if (G.weapons) G.weapons.select(G, 0);
    G.toast = 'Out of ammo — back to fists';
    G.toastT = 2;
    return;
  }
  p.shootT = w.cd;
  w.ammo -= 1;
  G.shotsFired += 1;
  const angle = Math.atan2(targetY - p.y, targetX - p.x);
  G.bullets.push({
    x: p.x + Math.cos(angle) * 22, y: p.y + Math.sin(angle) * 22,
    vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED,
    dmg: w.dmg, fromPlayer: true, t: 0,
  });
  if (G.audio) G.audio.noise(0.07, 0.16, 2400);
  if (G.wanted.stars < 2) addWanted(G, 1, 'shots fired');
}

export function onThugDown(G, e) {
  G.effects.push({ kind: 'down', x: e.x, y: e.y, t: 0, ttl: 1.2 });
  if (G.rep) G.rep.add(G, 10, 'thug down');
  if (G.weapons) G.weapons.addAmmo(G, 'tide', 12);
  if (G.missions) G.missions.killed += 1;
}

export function updateCombat(G, dt) {
  const p = G.player;
  for (const b of G.bullets) {
    b.t += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  G.bullets = G.bullets.filter((b) => b.t < 1.6 && b.x > 240 && b.x < 3200 && b.y > 0 && b.y < 2400);
  for (const b of [...G.bullets]) {
    if (!b.fromPlayer) {
      if (dist(b.x, b.y, p.x, p.y) < 16) {
        hurtPlayer(G, b.dmg);
        b.t = 99;
      }
      continue;
    }
    for (const e of G.enemies) {
      if (e.hp <= 0) continue;
      if (dist(b.x, b.y, e.x, e.y) < 18) {
        e.hp -= b.dmg;
        b.t = 99;
        G.effects.push({ kind: 'hit', x: e.x, y: e.y, t: 0, ttl: 0.3 });
        if (e.hp <= 0) onThugDown(G, e);
        break;
      }
    }
    if (b.t < 90) {
      for (const car of G.cars) {
        if (car === p.car || car.wrecked) continue;
        if (Math.abs(b.x - car.x) < 34 && Math.abs(b.y - car.y) < 22) {
          car.hp -= b.dmg;
          b.t = 99;
          if (car.hp <= 0 && !car.wrecked) {
            car.wrecked = true;
            car.speed = 0;
            G.effects.push({ kind: 'boom', x: car.x, y: car.y, t: 0, ttl: 0.7 });
          }
          break;
        }
      }
    }
    if (b.t < 90 && G.missions.chaseCar && !G.missions.chaseCar.wrecked) {
      const c = G.missions.chaseCar;
      if (Math.abs(b.x - c.x) < 34 && Math.abs(b.y - c.y) < 22) {
        c.hp -= b.dmg;
        b.t = 99;
        if (c.hp <= 0) { c.wrecked = true; c.speed = 0; }
      }
    }
  }
  G.bullets = G.bullets.filter((b) => b.t < 90);

  for (const e of G.enemies) {
    if (e.hp <= 0) continue;
    const d = dist(e.x, e.y, p.x, p.y);
    const wantAngle = Math.atan2(p.y - e.y, p.x - e.x);
    e.angle = wantAngle;
    if (d > 60) {
      e.x += Math.cos(wantAngle) * e.speed * dt;
      e.y += Math.sin(wantAngle) * e.speed * dt;
    } else if (d < 34) {
      e.meleeT -= dt;
      if (e.meleeT <= 0) {
        e.meleeT = 1.1;
        hurtPlayer(G, 9);
      }
    }
    e.shootT -= dt;
    if (d < 420 && d > 90 && e.shootT <= 0) {
      e.shootT = 1.6 + G.random() * 0.8;
      G.bullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(wantAngle) * 520, vy: Math.sin(wantAngle) * 520,
        dmg: 8, fromPlayer: false, t: 0,
      });
      if (G.audio) G.audio.noise(0.06, 0.08, 1800);
    }
  }
  G.enemies = G.enemies.filter((e) => e.hp > 0 || (e.deadT = (e.deadT || 0) + dt) < 1.5);
}
