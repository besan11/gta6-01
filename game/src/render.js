// Porto Verde v6 — the renderer: one camera over the city, everything drawn
// from game state, then the HUD. Title, pause, busted and won are overlays.
import { PALETTE, ROADS_X, ROADS_Y, ROAD_W, SEA_X, BEACH_X, WORLD_W, WORLD_H } from './config.js';
import { drawHud } from './hud.js';
import { drawRoofExtras } from './roofs.js';
import { sunsetGrade, shadowOffset } from './sunset.js';
import { drawCasinoFloor } from './casino-heist.js';
import { hasSave } from './save.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_WON = 4;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = 1280;
    canvas.height = 720;
  }
  resize();

  function camera(G) {
    return {
      x: Math.max(0, Math.min(WORLD_W - 1280, G.player.x - 640)),
      y: Math.max(0, Math.min(WORLD_H - 720, G.player.y - 360)),
      w: 1280, h: 720,
    };
  }

  function drawGround(ctx, G, cam) {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = PALETTE.seaDeep;
    ctx.fillRect(cam.x < SEA_X ? -cam.x : -9999, 0, 0, 0);
    const seaX0 = Math.max(0, SEA_X - 260 - cam.x);
    if (SEA_X - cam.x > 0) {
      ctx.fillStyle = PALETTE.sea;
      ctx.fillRect(0, 0, Math.min(1280, SEA_X - cam.x), 720);
      ctx.fillStyle = PALETTE.seaDeep;
      for (let i = 0; i < 5; i += 1) {
        const wy = ((i * 173 + G.time * 22) % 760) - 20;
        ctx.fillRect(0, wy, Math.max(0, SEA_X - cam.x - 30), 3);
      }
    }
    if (BEACH_X - cam.x > 0) {
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(Math.max(0, SEA_X - cam.x), 0, Math.min(1280, BEACH_X - cam.x) - Math.max(0, SEA_X - cam.x), 720);
    }
    for (const park of G.city.parks) {
      ctx.fillStyle = PALETTE.park;
      ctx.fillRect(park.x - park.w / 2 - cam.x, park.y - park.h / 2 - cam.y, park.w, park.h);
    }
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_W / 2 - cam.x, -cam.y, ROAD_W, WORLD_H);
    for (const ry of ROADS_Y) ctx.fillRect(-cam.x, ry - ROAD_W / 2 - cam.y, WORLD_W, ROAD_W);
    ctx.strokeStyle = PALETTE.lane;
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 16]);
    for (const rx of ROADS_X) {
      ctx.beginPath();
      ctx.moveTo(rx - cam.x, -cam.y);
      ctx.lineTo(rx - cam.x, WORLD_H - cam.y);
      ctx.stroke();
    }
    for (const ry of ROADS_Y) {
      ctx.beginPath();
      ctx.moveTo(-cam.x, ry - cam.y);
      ctx.lineTo(WORLD_W - cam.x, ry - cam.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawBuildings(ctx, G, cam) {
    const sh = shadowOffset(G);
    for (const b of G.city.buildings) {
      if (b.x > cam.x + 1280 || b.x + b.w < cam.x || b.y > cam.y + 720 || b.y + b.h < cam.y) continue;
      ctx.fillStyle = 'rgba(20,20,26,0.25)';
      ctx.fillRect(b.x - cam.x + sh.x, b.y - cam.y + sh.y, b.w, b.h);
      ctx.fillStyle = PALETTE.buildingWall;
      ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x - cam.x + 6, b.y - cam.y + 6, b.w - 12, b.h - 12);
      if (b.tall) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(b.x - cam.x + 6, b.y - cam.y + 6, b.w - 12, 10);
      }
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      drawRoofExtras(ctx, b);
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.darkText;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    for (const lm of G.city.landmarks) {
      if (lm.x < cam.x - 80 || lm.x > cam.x + 1360 || lm.y < cam.y - 40 || lm.y > cam.y + 760) continue;
      ctx.fillStyle = 'rgba(244,241,232,0.9)';
      const w = ctx.measureText(lm.sign).width + 14;
      ctx.fillRect(lm.x - cam.x - w / 2, lm.y - cam.y - 52, w, 20);
      ctx.fillStyle = PALETTE.darkText;
      ctx.fillText(lm.sign, lm.x - cam.x, lm.y - cam.y - 38);
    }
    ctx.textAlign = 'left';
  }

  function drawCar(ctx, G, car, cam, isPlayer) {
    ctx.save();
    ctx.translate(car.x - cam.x, car.y - cam.y);
    ctx.rotate(car.angle);
    if (car.wrecked) ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'rgba(20,20,26,0.3)';
    ctx.fillRect(-30, -14, 62, 34);
    ctx.fillStyle = car.model.color;
    ctx.fillRect(-32, -16, 64, 32);
    ctx.fillStyle = '#20242c';
    ctx.fillRect(-8, -14, 18, 28);
    ctx.fillStyle = '#9fd8ef';
    ctx.fillRect(14, -12, 10, 24);
    if (car.police) {
      const blink = Math.sin(G.time * 11) > 0;
      ctx.fillStyle = blink ? '#ff5a4e' : '#2f6fd0';
      ctx.fillRect(-30, -16, 10, 6);
      ctx.fillStyle = blink ? '#2f6fd0' : '#ff5a4e';
      ctx.fillRect(-30, 10, 10, 6);
    }
    ctx.restore();
    if (isPlayer) {
      ctx.strokeStyle = PALETTE.marker;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(car.x - cam.x, car.y - cam.y, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawPerson(ctx, x, y, angle, shirt, cam, r) {
    ctx.save();
    ctx.translate(x - cam.x, y - cam.y);
    ctx.fillStyle = 'rgba(20,20,26,0.25)';
    ctx.beginPath();
    ctx.ellipse(4, 5, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b48c';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 4, Math.sin(angle) * 4, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWorld(ctx, G) {
    const cam = camera(G);
    drawGround(ctx, G, cam);
    for (const u of G.umbrellas || []) {
      if (u.x < cam.x - 40 || u.x > cam.x + 1320 || u.y < cam.y - 40 || u.y > cam.y + 760) continue;
      ctx.fillStyle = u.color;
      ctx.beginPath();
      ctx.arc(u.x - cam.x, u.y - cam.y, 16, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(u.x - cam.x, u.y - cam.y);
      ctx.lineTo(u.x - cam.x, u.y - cam.y + 14);
      ctx.stroke();
    }
    for (const b of G.boats || []) {
      if (b.x < cam.x - 60 || b.x > cam.x + 1340 || b.y < cam.y - 40 || b.y > cam.y + 760) continue;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x - cam.x, b.y - cam.y, 26, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20242c';
      ctx.fillRect(b.x - cam.x - 2, b.y - cam.y - 22, 3, 16);
    }
    drawBuildings(ctx, G, cam);
    drawCasinoFloor(ctx, G, cam);
    for (const palm of G.city.palms) {
      if (palm.x < cam.x - 30 || palm.x > cam.x + 1310 || palm.y < cam.y - 30 || palm.y > cam.y + 750) continue;
      ctx.strokeStyle = PALETTE.palmTrunk;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(palm.x - cam.x, palm.y - cam.y);
      ctx.lineTo(palm.x - cam.x + palm.lean * 14, palm.y - cam.y - 18 * palm.size);
      ctx.stroke();
      ctx.fillStyle = PALETTE.palm;
      ctx.beginPath();
      ctx.arc(palm.x - cam.x + palm.lean * 14, palm.y - cam.y - 20 * palm.size, 11 * palm.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const pk of G.missions.pickups) {
      if (pk.taken) continue;
      const pulse = 10 + Math.sin(G.time * 5) * 3;
      ctx.fillStyle = PALETTE.objective;
      ctx.beginPath();
      ctx.arc(pk.x - cam.x, pk.y - cam.y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20242c';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', pk.x - cam.x, pk.y - cam.y + 4);
      ctx.textAlign = 'left';
    }
    for (const car of G.traffic) {
      if (!car.wrecked) drawCar(ctx, G, car, cam, false);
    }
    for (const car of G.cars) {
      if (car.driver === 'traffic') continue;
      drawCar(ctx, G, car, cam, car === G.player.car);
    }
    for (const ped of G.peds) drawPerson(ctx, ped.x, ped.y, ped.angle, ped.shirt, cam, 9);
    for (const e of G.enemies) {
      if (e.hp <= 0) continue;
      drawPerson(ctx, e.x, e.y, e.angle, PALETTE.thug, cam, 12);
      ctx.fillStyle = '#20242c';
      ctx.fillRect(e.x - cam.x - 14, e.y - cam.y - 26, 28, 4);
      ctx.fillStyle = PALETTE.hp;
      ctx.fillRect(e.x - cam.x - 14, e.y - cam.y - 26, 28 * Math.max(0, e.hp / 60), 4);
    }
    if (G.player.onFoot) {
      drawPerson(ctx, G.player.x, G.player.y, G.player.angle, PALETTE.playerShirt, cam, 14);
      ctx.strokeStyle = PALETTE.marker;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(G.player.x - cam.x, G.player.y - cam.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd94d';
    for (const b of G.bullets) {
      ctx.beginPath();
      ctx.arc(b.x - cam.x, b.y - cam.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const fx of G.effects) {
      const a = 1 - fx.t / fx.ttl;
      if (fx.kind === 'boom') {
        ctx.fillStyle = 'rgba(255,120,40,' + a + ')';
        ctx.beginPath();
        ctx.arc(fx.x - cam.x, fx.y - cam.y, 26 * (1 + (1 - a)), 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.kind === 'smoke') {
        ctx.fillStyle = 'rgba(120,120,120,' + (a * 0.6) + ')';
        ctx.beginPath();
        ctx.arc(fx.x - cam.x, fx.y - cam.y, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.kind === 'hit') {
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦', fx.x - cam.x, fx.y - cam.y);
        ctx.textAlign = 'left';
      } else if (fx.kind === 'down') {
        ctx.fillStyle = 'rgba(122,63,208,' + a + ')';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DOWN', fx.x - cam.x, fx.y - cam.y - 10);
        ctx.textAlign = 'left';
      }
    }
    if (G.heli && G.heli.active) {
      const hx = G.heli.x - cam.x;
      const hy = G.heli.y - cam.y;
      const px = G.player.x - cam.x;
      const py = G.player.y - cam.y;
      ctx.fillStyle = 'rgba(255,240,180,0.22)';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(px - 70, py + 40);
      ctx.lineTo(px + 70, py + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(20,20,26,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + 26, py + 34, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = '#2c303a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(14, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 3;
      const ra = G.heli.rotor;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * -34, Math.sin(ra) * -8);
      ctx.lineTo(Math.cos(ra) * 34, Math.sin(ra) * 8);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#f4f1e8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AIR-1', hx, hy - 22);
      ctx.textAlign = 'left';
    }
    const step = G.missions ? null : null;
    void step;
    sunsetGrade(ctx, cam, 1280, 720, G);
    return cam;
  }

  function drawTitle(ctx, G) {
    ctx.fillStyle = '#141821';
    ctx.fillRect(0, 0, 1280, 720);
    const grad = ctx.createLinearGradient(0, 0, 0, 720);
    grad.addColorStop(0, 'rgba(255,154,61,0.25)');
    grad.addColorStop(0.55, 'rgba(20,24,33,0)');
    grad.addColorStop(1, 'rgba(20,24,33,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = PALETTE.star;
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORTO VERDE', 640, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Three Days in the Sun', 640, 192);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Dario Cruz is home after three years away. Mara Solis has work for him,', 640, 232);
    ctx.fillText('Kessler owns the streets, and the city remembers everything.', 640, 256);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '15px sans-serif';
    const controls = [
      'WASD / Arrows — move & drive      E — enter / exit car      F — punch      Mouse — shoot',
      'Q — save      M — mute      R — radio      1-4 — weapons      Shift — run      P / Esc — pause',
      '12 missions across 3 days — finish them all before the city finishes you.',
    ];
    controls.forEach((line, i) => ctx.fillText(line, 640, 320 + i * 26));
    if (hasSave()) {
      ctx.fillStyle = PALETTE.objective;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Press C to Continue — your save is waiting', 640, 430);
    }
    ctx.fillStyle = PALETTE.star;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Press ENTER to start', 640, 480);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px sans-serif';
    ctx.fillText('An original open-world crime game. No Rockstar content — Porto Verde is its own city.', 640, 660);
    ctx.textAlign = 'left';
  }

  function drawOverlay(ctx, title, lines, color) {
    ctx.fillStyle = 'rgba(10,12,18,0.72)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = color;
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 640, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, 640, 350 + i * 30));
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px sans-serif';
    ctx.fillText('Press ENTER to play again — T for title', 640, 520);
    ctx.textAlign = 'left';
  }

  return {
    draw(G, screen) {
      ctx.clearRect(0, 0, 1280, 720);
      if (screen === SCREEN_TITLE) {
        drawWorld(ctx, G);
        ctx.fillStyle = 'rgba(10,12,18,0.45)';
        ctx.fillRect(0, 0, 1280, 720);
        drawTitle(ctx, G);
        return;
      }
      drawWorld(ctx, G);
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, G);
      if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(10,12,18,0.6)';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = PALETTE.text;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', 640, 300);
        ctx.font = '16px sans-serif';
        ctx.fillText('WASD move · E car · F punch · Mouse shoot · Q save · M mute · R radio · 1-4 weapons', 640, 350);
        ctx.fillText('P / Esc resume · T title', 640, 380);
        ctx.textAlign = 'left';
      } else if (screen === SCREEN_OVER) {
        drawOverlay(ctx, G.busted ? 'BUSTED' : 'WASTED', [
          G.busted ? 'The Porto Verde PD finally caught up with Dario.' : 'Dario went down in the streets of Porto Verde.',
          'Missions completed: ' + G.missions.completedCount + ' / 12',
        ], G.busted ? '#2f6fd0' : PALETTE.hp);
      } else if (screen === SCREEN_WON) {
        drawOverlay(ctx, 'PORTO VERDE IS YOURS', [
          'All 12 missions complete. Three days in the sun — and the city remembers.',
          'Final REP: ' + (G.rep ? G.rep.points : 0) + '   ·   Money: $' + Math.round(G.player.money).toLocaleString('en-US'),
        ], PALETTE.objective);
      }
    },
  };
}
