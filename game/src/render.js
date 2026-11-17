// render.js — Everything the eye sees. The camera follows Dario (or the
// staged cover cluster), the world draws ground first and people last, the
// golden-hour wash falls over the whole frame, and the HUD sits on top.
// Title, pause, busted/wasted, and the win screen are drawn here too.
import { FONT, PALETTE, WORLD, ROADS_X, ROADS_Y, ROAD_W, BEACH_X, SEA_X, SUNSET } from './config.js';
import { drawHud } from './hud.js';
import { currentStep } from './missions.js';
import { drawRoofDetails, drawSignage } from './roofs.js';
import { drawBeachProps, drawSunsetOverlay } from './sunset.js';
import { drawHeli } from './helicopter.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WON = 'won';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return { draw(G, screen) { drawFrame(ctx, G, screen, canvas); } };
}

function cameraFor(G) {
  const zoom = G.camZoom || 1;
  const vw = 1280 / zoom;
  const vh = 720 / zoom;
  const p = G.player;
  let x = p.x - vw / 2;
  let y = p.y - vh / 2;
  x = Math.max(0, Math.min(WORLD.w - vw, x));
  y = Math.max(0, Math.min(WORLD.h - vh, y));
  return { x, y, zoom };
}

function shadow(ctx, sx, sy, rx, zoom) {
  ctx.fillStyle = 'rgba(20,16,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(sx + SUNSET.shadowDx * zoom, sy + SUNSET.shadowDy * zoom, rx, rx * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrame(ctx, G, screen, canvas) {
  G.drawn = {};
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, G);
    return;
  }
  const cam = cameraFor(G);
  drawWorld(ctx, G, cam);
  drawSunsetOverlay(ctx);
  if (screen === SCREEN_PAUSED) {
    drawHud(ctx, G);
    drawPaused(ctx, G);
    return;
  }
  if (screen === SCREEN_OVER) {
    drawHud(ctx, G);
    drawOver(ctx, G);
    return;
  }
  if (screen === SCREEN_WON) {
    drawHud(ctx, G);
    drawWon(ctx, G);
    return;
  }
  drawHud(ctx, G);
}

function drawWorld(ctx, G, cam) {
  const z = cam.zoom;
  const toX = (wx) => (wx - cam.x) * z;
  const toY = (wy) => (wy - cam.y) * z;
  const vis = (wx, wy, m) => toX(wx) > -m && toX(wx) < 1280 + m && toY(wy) > -m && toY(wy) < 720 + m;

  // Ground: sea, sand, grass.
  ctx.fillStyle = PALETTE.seaDeep;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(toX(0), toY(0), SEA_X * z, 2400 * z);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(toX(SEA_X), toY(0), (BEACH_X - SEA_X) * z, 2400 * z);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(toX(BEACH_X), toY(0), (WORLD.w - BEACH_X) * z, 2400 * z);

  // Roads with edges and centre dashes.
  ctx.fillStyle = PALETTE.roadEdge;
  for (const rx of ROADS_X) ctx.fillRect(toX(rx - ROAD_W / 2 - 4), toY(0), (ROAD_W + 8) * z, 2400 * z);
  for (const ry of ROADS_Y) ctx.fillRect(toX(0), toY(ry - ROAD_W / 2 - 4), 3200 * z, (ROAD_W + 8) * z);
  ctx.fillStyle = PALETTE.road;
  for (const rx of ROADS_X) ctx.fillRect(toX(rx - ROAD_W / 2), toY(0), ROAD_W * z, 2400 * z);
  for (const ry of ROADS_Y) ctx.fillRect(toX(0), toY(ry - ROAD_W / 2), 3200 * z, ROAD_W * z);
  ctx.fillStyle = PALETTE.lane;
  for (const rx of ROADS_X) {
    for (let y = 0; y < WORLD.h; y += 90) {
      if (vis(rx, y, 60)) ctx.fillRect(toX(rx) - 2 * z, toY(y), 4 * z, 40 * z);
    }
  }
  for (const ry of ROADS_Y) {
    for (let x = BEACH_X; x < WORLD.w; x += 90) {
      if (vis(x, ry, 60)) ctx.fillRect(toX(x), toY(ry) - 2 * z, 40 * z, 4 * z);
    }
  }

  // Parks and plazas.
  for (const park of G.city.parks) {
    ctx.fillStyle = PALETTE.park;
    ctx.fillRect(toX(park.x - park.w / 2), toY(park.y - park.h / 2), park.w * z, park.h * z);
    ctx.strokeStyle = PALETTE.sidewalk;
    ctx.lineWidth = 3 * z;
    ctx.strokeRect(toX(park.x - park.w / 2), toY(park.y - park.h / 2), park.w * z, park.h * z);
  }

  // Beach life: umbrellas, boats, breathing shoreline.
  drawBeachProps(ctx, G, cam);

  // Buildings and their roofs.
  for (const b of G.city.buildings) {
    if (!vis(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h))) continue;
    ctx.fillStyle = 'rgba(20,16,10,0.25)';
    ctx.fillRect(toX(b.x) + 6 * z, toY(b.y) + 8 * z, b.w * z, b.h * z);
    ctx.fillStyle = PALETTE.buildingWall;
    ctx.fillRect(toX(b.x), toY(b.y), b.w * z, b.h * z);
    ctx.fillStyle = b.roof;
    ctx.fillRect(toX(b.x) + 4 * z, toY(b.y) + 4 * z, (b.w - 8) * z, (b.h - 8) * z);
    ctx.strokeStyle = 'rgba(20,24,32,0.4)';
    ctx.lineWidth = 2 * z;
    ctx.strokeRect(toX(b.x) + 4 * z, toY(b.y) + 4 * z, (b.w - 8) * z, (b.h - 8) * z);
    drawRoofDetails(ctx, b, cam);
  }

  // Palms.
  for (const palm of G.city.palms) {
    if (!vis(palm.x, palm.y, 40)) continue;
    const sx = toX(palm.x);
    const sy = toY(palm.y);
    ctx.strokeStyle = PALETTE.palmTrunk;
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 4 * z, sy - 12 * z);
    ctx.stroke();
    ctx.fillStyle = PALETTE.palm;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + palm.s;
      ctx.beginPath();
      ctx.ellipse(sx + 4 * z + Math.cos(a) * 10 * z, sy - 12 * z + Math.sin(a) * 6 * z, 10 * z, 4 * z, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Landmark signs.
  drawSignage(ctx, G, cam);

  // Objective beacon: a pulsing ring on the current step target.
  const step = currentStep(G);
  if (step && step.x !== undefined) {
    const sx = toX(step.x);
    const sy = toY(step.y);
    const pr = (18 + Math.sin(G.time * 3) * 5) * z;
    ctx.strokeStyle = PALETTE.objective;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.objective;
    ctx.beginPath();
    ctx.arc(sx, sy, 5 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pickups.
  for (const pk of G.missions.pickups) {
    if (pk.taken) continue;
    const sx = toX(pk.x);
    const sy = toY(pk.y);
    const pulse = 1 + Math.sin(G.time * 4) * 0.15;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.objective;
    ctx.fillRect(-8 * pulse, -8 * pulse, 16 * pulse, 16 * pulse);
    ctx.restore();
  }

  // Cars: parked, traffic, police, the courier.
  for (const car of G.cars) {
    if (!vis(car.x, car.y, 80)) continue;
    const sx = toX(car.x);
    const sy = toY(car.y);
    shadow(ctx, sx, sy, 26 * z, z);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(car.angle);
    ctx.fillStyle = car.wrecked ? '#2c303a' : car.color;
    ctx.fillRect(-32 * z, -16 * z, 64 * z, 32 * z);
    ctx.fillStyle = car.wrecked ? '#1c1f26' : 'rgba(20,24,32,0.55)';
    ctx.fillRect(-12 * z, -13 * z, 22 * z, 26 * z);
    if (car.driver === 'police' && !car.wrecked) {
      const flash = Math.sin(G.time * 6) > 0;
      ctx.fillStyle = flash ? '#ff5a4e' : '#2f6fd0';
      ctx.fillRect(-6 * z, -16 * z, 12 * z, 6 * z);
      ctx.fillStyle = flash ? '#2f6fd0' : '#ff5a4e';
      ctx.fillRect(-6 * z, 10 * z, 12 * z, 6 * z);
    }
    if (car.courier) {
      ctx.fillStyle = '#20242c';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COURIER', 0, 0);
    }
    ctx.restore();
  }

  // Pedestrians.
  for (const ped of G.peds) {
    if (!vis(ped.x, ped.y, 30)) continue;
    const sx = toX(ped.x);
    const sy = toY(ped.y);
    shadow(ctx, sx, sy, 9 * z, z);
    ctx.fillStyle = ped.skin;
    ctx.beginPath();
    ctx.arc(sx, sy, 8 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ped.shirt;
    ctx.beginPath();
    ctx.arc(sx, sy + 3 * z, 6 * z, 0, Math.PI);
    ctx.fill();
  }

  // Thugs.
  for (const e of G.enemies) {
    if (e.hp <= 0 || !vis(e.x, e.y, 40)) continue;
    const sx = toX(e.x);
    const sy = toY(e.y);
    shadow(ctx, sx, sy, 11 * z, z);
    ctx.fillStyle = '#7a3fd0';
    ctx.beginPath();
    ctx.arc(sx, sy, 12 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(sx, sy - 3 * z, 6 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(e.angle) * 20 * z, sy + Math.sin(e.angle) * 20 * z);
    ctx.stroke();
  }

  // Dario on foot.
  const p = G.player;
  if (p.onFoot) {
    const sx = toX(p.x);
    const sy = toY(p.y);
    shadow(ctx, sx, sy, 12 * z, z);
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(sx, sy, 14 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.playerShirt;
    ctx.beginPath();
    ctx.arc(sx, sy + 2 * z, 9 * z, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath();
    ctx.arc(sx, sy - 2 * z, 6 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(p.angle) * 22 * z, sy + Math.sin(p.angle) * 22 * z);
    ctx.stroke();
  }

  // Bullets.
  ctx.fillStyle = '#ffe98a';
  for (const b of G.bullets) {
    const sx = toX(b.x);
    const sy = toY(b.y);
    ctx.beginPath();
    ctx.arc(sx, sy, 3 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  // Effects.
  for (const ef of G.effects) {
    const sx = toX(ef.x);
    const sy = toY(ef.y);
    const k = ef.t / ef.life;
    if (ef.kind === 'hit' || ef.kind === 'muzzle') {
      ctx.fillStyle = ef.kind === 'hit' ? 'rgba(255,90,78,' + (1 - k) + ')' : 'rgba(255,233,138,' + (1 - k) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, (ef.kind === 'hit' ? 12 : 9) * (1 + k), 0, Math.PI * 2);
      ctx.fill();
    } else if (ef.kind === 'swing') {
      ctx.strokeStyle = 'rgba(244,241,232,' + (1 - k) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 22, -0.8 + k, 0.8 + k);
      ctx.stroke();
    } else if (ef.kind === 'smoke') {
      ctx.fillStyle = 'rgba(120,120,120,' + (0.5 * (1 - k)) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, 18 + k * 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (ef.kind === 'down') {
      ctx.strokeStyle = 'rgba(122,63,208,' + (1 - k) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 10, sy - 10);
      ctx.lineTo(sx + 10, sy + 10);
      ctx.moveTo(sx + 10, sy - 10);
      ctx.lineTo(sx - 10, sy + 10);
      ctx.stroke();
    }
  }

  // Helicopter (shadow, spotlight, body, rotor).
  drawHeli(ctx, G, cam);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(10,12,18,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
}

function drawTitle(ctx, G) {
  ctx.fillStyle = '#16233a';
  ctx.fillRect(0, 0, 1280, 720);
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, 'rgba(255,140,50,0.35)');
  grad.addColorStop(0.5, 'rgba(255,190,90,0.08)');
  grad.addColorStop(1, 'rgba(20,96,143,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('A THREE-DAY OPEN-WORLD CRIME STORY', 640, 92);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.title;
  ctx.fillText('PORTO VERDE', 640, 152);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('Three Days in the Sun', 640, 192);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.ui;
  ctx.fillText('Dario Cruz is back after three years away. Mara Solis has work for him.', 640, 236);
  ctx.fillText('Twelve jobs, three days, one plane out — if Kessler and the PD let him leave.', 640, 262);
  ctx.fillStyle = '#9aa3ad';
  ctx.font = FONT.small;
  const controls = [
    'WASD / Arrows — move    Shift — run    Mouse — aim, click — shoot',
    'E — enter / exit car    F — punch    1-4 — weapons    R — radio',
    'Q — save    M — mute    P / Esc — pause    C — continue (with save)',
  ];
  controls.forEach((line, i) => ctx.fillText(line, 640, 320 + i * 24));
  ctx.fillStyle = '#7be07b';
  ctx.font = FONT.big;
  ctx.fillText('Press ENTER to start', 640, 440);
  if (G.hasSaveFlag) {
    ctx.fillStyle = '#ffcf3f';
    ctx.font = FONT.ui;
    ctx.fillText('Press C to Continue your saved game', 640, 476);
  }
  ctx.fillStyle = '#9aa3ad';
  ctx.font = FONT.tiny;
  ctx.fillText('Free roam, traffic, pedestrians, police heat, and a living beach — all original, all yours.', 640, 680);
}

function drawPaused(ctx, G) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.title;
  ctx.fillText('PAUSED', 640, 260);
  ctx.fillStyle = '#9aa3ad';
  ctx.font = FONT.ui;
  ctx.fillText('WASD move · E car · F punch · Click shoot · 1-4 weapons · R radio', 640, 320);
  ctx.fillText('Q save · M mute · P resume · T title screen', 640, 350);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = FONT.big;
  ctx.fillText('P — resume', 640, 410);
}

function drawOver(ctx, G) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5a4e';
  ctx.font = FONT.title;
  ctx.fillText(G.busted ? 'BUSTED' : 'WASTED', 640, 300);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.ui;
  ctx.fillText(G.busted ? 'The Porto Verde PD caught up with Dario.' : 'Dario went down in the streets of Porto Verde.', 640, 350);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = FONT.big;
  ctx.fillText('ENTER — try again', 640, 420);
}

function drawWon(ctx, G) {
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7be07b';
  ctx.font = FONT.title;
  ctx.fillText('PORTO VERDE IS YOURS', 640, 280);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.ui;
  ctx.fillText('Twelve jobs. Three days. One plane out — and the city behind him.', 640, 330);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = FONT.big;
  ctx.fillText('Money: $' + Math.floor(G.player.money).toLocaleString('en-US') + '   ·   REP: ' + G.rep.total, 640, 380);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = FONT.ui;
  ctx.fillText('ENTER — play again', 640, 440);
}
