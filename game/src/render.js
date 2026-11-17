// Renderer: the camera, the city, every entity, the sunset wash and the screens.
// Deterministic: everything animates from G.time, never from the wall clock.
import { PALETTE, VIEW_W, VIEW_H, WORLD_W, WORLD_H, BEACH_X, SEA_X, ROADS_X, ROADS_Y, ROAD_W } from './config.js';
import { clamp } from './random.js';
import { drawHud } from './hud.js';
import { drawRoof, drawHelipad, drawSignage, signageFor } from './roofs.js';
import { drawHeli, drawHeliShadow } from './helicopter.js';
import { drawSunsetOverlay, drawBeachLife, sunsetShadowOffset } from './sunset.js';
import { missionObjective } from './missions.js';

export const SCREEN_TITLE = 'TITLE';
export const SCREEN_PLAY = 'PLAY';
export const SCREEN_PAUSED = 'PAUSED';
export const SCREEN_OVER = 'OVER';
export const SCREEN_WON = 'WON';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;

  function cameraFor(G) {
    const focus = G.player.car || G.player;
    const cx = clamp(focus.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    const cy = clamp(focus.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
    return { x: cx, y: cy };
  }

  function drawGround(G, cam) {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Sea and sand on the west.
    const seaX = SEA_X - cam.x;
    if (seaX > -260) {
      ctx.fillStyle = PALETTE.sea;
      ctx.fillRect(0, 0, Math.min(VIEW_W, seaX), VIEW_H);
      ctx.fillStyle = PALETTE.seaDeep;
      ctx.fillRect(0, 0, Math.min(VIEW_W, seaX - 40), VIEW_H);
    }
    const sandX0 = SEA_X - cam.x;
    const sandX1 = BEACH_X - cam.x;
    if (sandX1 > 0 && sandX0 < VIEW_W) {
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(Math.max(0, sandX0), 0, Math.min(VIEW_W, sandX1) - Math.max(0, sandX0), VIEW_H);
    }
    // Roads.
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) {
      const x = rx - cam.x - ROAD_W / 2;
      if (x > -ROAD_W && x < VIEW_W) ctx.fillRect(x, 0, ROAD_W, VIEW_H);
    }
    for (const ry of ROADS_Y) {
      const y = ry - cam.y - ROAD_W / 2;
      if (y > -ROAD_W && y < VIEW_H) ctx.fillRect(0, y, VIEW_W, ROAD_W);
    }
    // Lane dashes.
    ctx.strokeStyle = PALETTE.lane;
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 30]);
    for (const rx of ROADS_X) {
      const x = rx - cam.x;
      if (x > 0 && x < VIEW_W) {
        ctx.beginPath();
        ctx.moveTo(x, -10);
        ctx.lineTo(x, VIEW_H + 10);
        ctx.stroke();
      }
    }
    for (const ry of ROADS_Y) {
      const y = ry - cam.y;
      if (y > 0 && y < VIEW_H) {
        ctx.beginPath();
        ctx.moveTo(-10, y);
        ctx.lineTo(VIEW_W + 10, y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    // Parks.
    for (const p of G.city.parks) {
      const x = p.x - p.w / 2 - cam.x;
      const y = p.y - p.h / 2 - cam.y;
      if (x > -p.w && x < VIEW_W && y > -p.h && y < VIEW_H) {
        ctx.fillStyle = PALETTE.park;
        ctx.fillRect(x, y, p.w, p.h);
        ctx.strokeStyle = '#5a8a48';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, p.w, p.h);
      }
    }
  }

  function drawBuildings(G, cam) {
    const shadow = sunsetShadowOffset(G);
    for (const b of G.city.buildings) {
      const x = b.x - cam.x;
      const y = b.y - cam.y;
      if (x > VIEW_W || y > VIEW_H || x + b.w < 0 || y + b.h < 0) continue;
      // Long sunset shadow.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + shadow.x, y + shadow.y, b.w, b.h);
      ctx.fillStyle = PALETTE.buildingWall;
      ctx.fillRect(x, y, b.w, b.h);
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      drawRoof(ctx, b);
      ctx.restore();
    }
    // Casino helipad.
    const casino = G.city.landmarks.CASINO;
    drawHelipad(ctx, casino.x - cam.x, casino.y - 90 - cam.y);
  }

  function drawPalms(G, cam) {
    for (const p of G.city.palms) {
      const x = p.x - cam.x;
      const y = p.y - cam.y;
      if (x < -30 || x > VIEW_W + 30 || y < -30 || y > VIEW_H + 30) continue;
      ctx.strokeStyle = PALETTE.palmTrunk;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + p.lean * 20, y - 26);
      ctx.stroke();
      ctx.fillStyle = PALETTE.palm;
      ctx.beginPath();
      ctx.arc(x + p.lean * 20, y - 28, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLandmarkLabels(G, cam) {
    for (const key of Object.keys(G.city.landmarks)) {
      const lm = G.city.landmarks[key];
      const x = lm.x - cam.x;
      const y = lm.y - cam.y;
      if (x < -120 || x > VIEW_W + 120 || y < -60 || y > VIEW_H + 60) continue;
      ctx.fillStyle = '#e2453c';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4f1e8';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawSignage(ctx, signageFor(key), x, y - 22);
    }
  }

  function drawCarShape(ctx, x, y, angle, color, name, wrecked, police, blink) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (wrecked) ctx.globalAlpha = 0.6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-32, -16, 64, 32, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(-6, -13, 22, 26);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(20, -12, 6, 5);
    ctx.fillRect(20, 7, 6, 5);
    if (police) {
      ctx.fillStyle = blink ? '#ff5a4e' : '#2f6fd0';
      ctx.fillRect(-14, -16, 12, 6);
      ctx.fillStyle = blink ? '#2f6fd0' : '#ff5a4e';
      ctx.fillRect(2, -16, 12, 6);
    }
    ctx.restore();
    if (name && !wrecked) {
      ctx.fillStyle = 'rgba(16,20,28,0.75)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y + 30);
      ctx.textAlign = 'left';
    }
  }

  function drawPerson(ctx, x, y, angle, shirt, radius, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 6, radius, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b48c';
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * 3, y + Math.sin(angle) * 3, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    if (label) {
      ctx.fillStyle = '#f4f1e8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y - radius - 6);
      ctx.textAlign = 'left';
    }
  }

  function drawEntities(G, cam) {
    // Pickups (envelopes / keycard / cash bags).
    for (const pk of G.missions.pickups) {
      if (pk.taken) continue;
      const x = pk.x - cam.x;
      const y = pk.y - cam.y;
      const bob = Math.sin(G.time * 3 + pk.x) * 3;
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(x, y + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#20242c';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', x, y + bob + 4);
      ctx.textAlign = 'left';
    }
    // Objective marker.
    const obj = missionObjective(G);
    if (obj && !G.missions.done) {
      const x = obj.x - cam.x;
      const y = obj.y - cam.y;
      const pulse = 18 + Math.sin(G.time * 4) * 5;
      ctx.strokeStyle = '#37e0a0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#37e0a0';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const t of G.traffic) {
      if (t.wrecked || G.player.car === t) continue;
      const x = t.x - cam.x;
      const y = t.y - cam.y;
      if (x < -80 || x > VIEW_W + 80 || y < -80 || y > VIEW_H + 80) continue;
      drawCarShape(ctx, x, y, t.angle, t.color, '', false, false);
    }
    for (const car of G.cars) {
      const x = car.x - cam.x;
      const y = car.y - cam.y;
      if (x < -80 || x > VIEW_W + 80 || y < -80 || y > VIEW_H + 80) continue;
      drawCarShape(ctx, x, y, car.angle, car.color, car.wrecked ? '' : car.name, car.wrecked, false);
    }
    for (const cop of G.police) {
      const x = cop.x - cam.x;
      const y = cop.y - cam.y;
      drawCarShape(ctx, x, y, cop.angle, '#22447f', '', false, true, Math.floor(G.time * 3) % 2 === 0);
    }
    for (const ped of G.peds) {
      const x = ped.x - cam.x;
      const y = ped.y - cam.y;
      if (x < -30 || x > VIEW_W + 30 || y < -30 || y > VIEW_H + 30) continue;
      drawPerson(ctx, x, y, ped.angle, ped.shirt, 9);
    }
    for (const bg of G.beachgoers || []) {
      const x = bg.x - cam.x;
      const y = bg.y - cam.y;
      if (x < -30 || x > VIEW_W + 30 || y < -30 || y > VIEW_H + 30) continue;
      drawPerson(ctx, x, y, bg.angle, bg.shirt, 9);
    }
    for (const e of G.enemies) {
      const x = e.x - cam.x;
      const y = e.y - cam.y;
      drawPerson(ctx, x, y, e.angle, '#7a3fd0', 12, 'Kessler thug');
      ctx.fillStyle = '#20242c';
      ctx.fillRect(x - 14, y - 24, 28, 5);
      ctx.fillStyle = '#ff5a4e';
      ctx.fillRect(x - 14, y - 24, 28 * Math.max(0, e.hp / 60), 5);
    }
    for (const b of G.bullets) {
      const x = b.x - cam.x;
      const y = b.y - cam.y;
      ctx.fillStyle = b.fromPlayer ? '#ffd94d' : '#ff5a4e';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const fx of G.effects) {
      const x = fx.x - cam.x;
      const y = fx.y - cam.y;
      ctx.fillStyle = fx.kind === 'boom' ? '#ff8c3c' : '#ffd94d';
      ctx.globalAlpha = Math.min(1, fx.t * 3);
      ctx.beginPath();
      ctx.arc(x, y, 14 + (0.5 - fx.t) * 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The player, on foot or in the car.
    const p = G.player;
    if (p.car) {
      drawCarShape(ctx, p.car.x - cam.x, p.car.y - cam.y, p.car.angle, p.car.color, '', p.car.wrecked, false);
    } else {
      drawPerson(ctx, p.x - cam.x, p.y - cam.y, p.angle, '#e2453c', 14, 'DARIO');
    }
    drawHeliShadow(ctx, G, cam);
    drawHeli(ctx, G, cam);
  }

  function drawWorld(G) {
    const cam = cameraFor(G);
    G.camera = cam;
    drawGround(G, cam);
    drawBeachLife(ctx, G, cam);
    drawBuildings(G, cam);
    drawPalms(G, cam);
    drawLandmarkLabels(G, cam);
    drawEntities(G, cam);
    drawSunsetOverlay(ctx, G, cam);
  }

  function drawTitle(G) {
    drawWorld(G);
    ctx.fillStyle = 'rgba(10,14,22,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('PORTO VERDE', 640, 130);
    ctx.fillStyle = '#f4f1e8';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('THREE DAYS IN THE SUN', 640, 170);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#f4f1e8';
    ctx.fillText('Dario Cruz is home after three years away. Mara Solis has twelve jobs for him,', 640, 216);
    ctx.fillText('Kessler owns the docks, and the Porto Verde PD owns the streets. Three days. One city.', 640, 238);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '14px sans-serif';
    const lines = [
      'WASD / Arrows — move & drive      E — enter / steal car      F — punch      Mouse click — shoot',
      '1-4 — weapons      R — radio station      Q — save      M — mute      Shift — run      P / Esc — pause',
      'C — Continue (when a save exists)      T — back to title from pause',
      '12 missions over 3 days. Finish them all to win. WASTED or BUSTED ends the run.',
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, 640, 290 + i * 24));
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 20px sans-serif';
    if (G.hasSaveFlag) ctx.fillText('Press C to CONTINUE your saved game — or ENTER to start fresh', 640, 420);
    else ctx.fillText('Press ENTER to start', 640, 420);
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '13px sans-serif';
    ctx.fillText('An original open-world crime game. No Rockstar content. Porto Verde is fictional.', 640, 470);
    ctx.textAlign = 'left';
  }

  function drawPaused(G) {
    drawWorld(G);
    ctx.fillStyle = 'rgba(10,14,22,0.66)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('PAUSED', 640, 300);
    ctx.fillStyle = '#f4f1e8';
    ctx.font = '16px sans-serif';
    ctx.fillText('P / Esc — resume      Q — save      T — back to title      M — mute', 640, 350);
    ctx.textAlign = 'left';
  }

  function drawOver(G, won) {
    drawWorld(G);
    ctx.fillStyle = won ? 'rgba(20,40,20,0.72)' : 'rgba(40,10,10,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = '#7be07b';
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText('PORTO VERDE IS YOURS', 640, 300);
      ctx.fillStyle = '#f4f1e8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`12 missions in 3 days. $${G.player.money.toLocaleString('en-US')} banked. ${repText(G)}`, 640, 350);
    } else {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(G.busted ? 'BUSTED' : 'WASTED', 640, 300);
      ctx.fillStyle = '#f4f1e8';
      ctx.font = '18px sans-serif';
      ctx.fillText(G.busted ? 'The Porto Verde PD caught you.' : 'Dario Cruz went down in Porto Verde.', 640, 350);
      ctx.fillText(`Missions finished: ${G.missions.completedCount}/12 · $${G.player.money.toLocaleString('en-US')}`, 640, 380);
    }
    ctx.fillStyle = '#ffcf3f';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press ENTER to play again', 640, 430);
    ctx.textAlign = 'left';
  }

  function repText(G) {
    return G.rep ? `REP ${G.rep.points.toLocaleString('en-US')}` : '';
  }

  return {
    draw(G, screen) {
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      if (screen === SCREEN_TITLE) drawTitle(G);
      else if (screen === SCREEN_PAUSED) drawPaused(G);
      else if (screen === SCREEN_OVER) drawOver(G, false);
      else if (screen === SCREEN_WON) drawOver(G, true);
      else {
        drawWorld(G);
        drawHud(ctx, G);
      }
    },
  };
}
