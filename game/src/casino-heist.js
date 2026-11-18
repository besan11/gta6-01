// Porto Verde v6 — the signature system: the Casino Verde heist. Mission 12
// plays out on a real casino floor — gaming tables, a steel vault, armed
// guards, cash bags — and the getaway is a drive to the airstrip while the
// whole city answers the alarm. The floor is visible in the cover frame.
import { CASINO_VAULT } from './config.js';

export function createCasino(G) {
  return {
    alarm: 0, bagsTaken: 0, guardsDown: 0,
    floor: { x: CASINO_VAULT.x - CASINO_VAULT.floorW / 2, y: CASINO_VAULT.y - CASINO_VAULT.floorH / 2, w: CASINO_VAULT.floorW, h: CASINO_VAULT.floorH },
    vault: { ...CASINO_VAULT.vault },
    tables: CASINO_VAULT.tables.map((t) => ({ ...t })),
    bags: CASINO_VAULT.bags.map((b) => ({ ...b, taken: false })),
  };
}

export function casinoActive(G) {
  return G.missions.index === 11 || (G.missions.index === 10 && G.missions.step === 0);
}

export function updateCasino(G, dt) {
  const c = G.casino;
  if (!c) return;
  if (G.missions.index === 11) {
    c.alarm = Math.min(100, c.alarm + dt * 2.2);
    if (G.wanted.stars < 3) {
      G.wanted.stars = 3;
      G.wanted.heat = Math.max(G.wanted.heat, 80);
    }
  } else if (G.missions.index === 10) {
    c.alarm = Math.min(60, c.alarm + dt * 1.2);
  } else {
    c.alarm = Math.max(0, c.alarm - dt * 5);
  }
  const p = G.player;
  for (const bag of c.bags) {
    if (!bag.taken && G.missions.index === 11 && Math.hypot(p.x - bag.x, p.y - bag.y) < 34) {
      bag.taken = true;
      c.bagsTaken += 1;
    }
  }
}

export function drawCasinoFloor(ctx, G, cam) {
  const c = G.casino;
  if (!c) return;
  const f = c.floor;
  if (f.x > cam.x + cam.w || f.x + f.w < cam.x || f.y > cam.y + cam.h || f.y + f.h < cam.y) return;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  ctx.fillStyle = '#3d1f4d';
  ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3;
  ctx.strokeRect(f.x, f.y, f.w, f.h);
  ctx.fillStyle = '#2a6f4f';
  for (const t of c.tables) {
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, 46, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const v = c.vault;
  ctx.fillStyle = '#8a94a0';
  ctx.fillRect(v.x - v.w / 2, v.y - v.h / 2, v.w, v.h);
  ctx.strokeStyle = '#20242c';
  ctx.lineWidth = 3;
  ctx.strokeRect(v.x - v.w / 2, v.y - v.h / 2, v.w, v.h);
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(v.x, v.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', v.x, v.y - v.h / 2 - 8);
  for (const bag of c.bags) {
    if (bag.taken) continue;
    ctx.fillStyle = '#7be07b';
    ctx.beginPath();
    ctx.arc(bag.x, bag.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20242c';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('$', bag.x, bag.y + 4);
  }
  if (c.alarm > 5) {
    const blink = Math.sin(G.time * 6) > 0;
    ctx.fillStyle = blink ? '#ff5a4e' : '#8a1a12';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ALARM ' + Math.round(c.alarm) + '%', f.x + f.w / 2, f.y + 22);
  }
  ctx.restore();
}
