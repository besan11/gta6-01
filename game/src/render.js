// Renderer: one canvas, one camera, everything drawn in world order —
// ground, roads, beach life, buildings with roofs and signs, then the
// living things, then the helicopter, the golden-hour wash, and the HUD.
import { WORLD, ROADS_X, ROADS_Y, ROAD_W, SEA_X, BEACH_X, PALETTE } from './config.js';
import { clamp } from './random.js';
import { drawHud } from './hud.js';
import { drawHelicopter } from './helicopter.js';
import { drawBeachLife, drawSunsetWash } from './sunset.js';
import { drawRoofDetails, drawSignage } from './roofs.js';
import { hasSave } from './save.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, draw(G, screen) { drawFrame(ctx, G, screen); } };
}

function cameraFor(G) {
  const p = G.player;
  const cx = p.car ? p.car.x : p.x;
  const cy = p.car ? p.car.y : p.y;
  return {
    x: clamp(cx - 640, 0, WORLD.w - 1280),
    y: clamp(cy - 360, 0, WORLD.h - 720),
  };
}

function drawCarShape(ctx, G, car, cam) {
  const sx = car.x - cam.x;
  const sy = car.y - cam.y;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(car.angle);
  ctx.fillStyle = car.wrecked ? '#3a3f4a' : car.model.color;
  ctx.fillRect(-32, -16, 64, 32);
  ctx.fillStyle = 'rgba(20,24,32,0.85)';
  ctx.fillRect(-8, -13, 18, 26);
  ctx.fillStyle = car.wrecked ? '#555' : '#e8e0d0';
  ctx.fillRect(20, -12, 8, 24);
  if (car.driver === 'police' && !car.wrecked) {
    ctx.fillStyle = Math.floor(G.time * 3) % 2 === 0 ? '#ff5a4e' : '#2f6fd0';
    ctx.fillRect(-14, -16, 10, 5);
    ctx.fillRect(4, -16, 10, 5);
  }
  ctx.restore();
  if (car.wrecked) {
    ctx.strokeStyle = 'rgba(244,241,232,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 20, sy - 18);
    ctx.lineTo(sx + 20, sy + 18);
    ctx.moveTo(sx + 20, sy - 18);
    ctx.lineTo(sx - 20, sy + 18);
    ctx.stroke();
  }
}

function drawGround(ctx, G, cam) {
  // Sea, sand, grass.
  ctx.fillStyle = PALETTE.seaDeep;
  ctx.fillRect(0, 0, Math.max(0, SEA_X - cam.x), 720);
  ctx.fillStyle = PALETTE.sea;
  ctx.fillRect(Math.max(0, SEA_X - cam.x), 0, Math.max(0, BEACH_X - SEA_X), 720);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(Math.max(0, BEACH_X - cam.x), 0, 1280, 720);
  // Roads.
  ctx.fillStyle = PALETTE.road;
  for (const r of ROADS_X) ctx.fillRect(r - ROAD_W / 2 - cam.x, -cam.y, ROAD_W, WORLD.h);
  for (const r of ROADS_Y) ctx.fillRect(-cam.x, r - ROAD_W / 2 - cam.y, WORLD.w, ROAD_W);
  // Lane dashes, deterministic from world position.
  ctx.fillStyle = PALETTE.lane;
  for (const r of ROADS_X) {
    for (let y = 0; y < WORLD.h; y += 80) {
      ctx.fillRect(r - 2 - cam.x, y - cam.y, 4, 36);
    }
  }
  for (const r of ROADS_Y) {
    for (let x = 360; x < WORLD.w; x += 80) {
      ctx.fillRect(x - cam.x, r - 2 - cam.y, 36, 4);
    }
  }
  // Parks.
  for (const p of G.city.parks) {
    ctx.fillStyle = PALETTE.park;
    ctx.fillRect(p.x - p.w / 2 - cam.x, p.y - p.h / 2 - cam.y, p.w, p.h);
    ctx.strokeStyle = PALETTE.palm;
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x - p.w / 2 - cam.x + 1.5, p.y - p.h / 2 - cam.y + 1.5, p.w - 3, p.h - 3);
  }
}

function drawWorld(ctx, G, cam) {
  drawGround(ctx, G, cam);
  drawBeachLife(ctx, G, cam);
  // Buildings: wall, coloured roof, roof furniture.
  for (const b of G.city.buildings) {
    const x = b.x - cam.x;
    const y = b.y - cam.y;
    if (x > 1300 || x + b.w < -20 || y > 740 || y + b.h < -20) continue;
    ctx.fillStyle = PALETTE.buildingWall;
    ctx.fillRect(x, y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(x + 6, y + 6, b.w - 12, b.h - 12);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6.5, y + 6.5, b.w - 13, b.h - 13);
    drawRoofDetails(ctx, b, cam);
  }
  // Palms.
  for (const palm of G.city.palms) {
    const x = palm.x - cam.x;
    const y = palm.y - cam.y;
    if (x < -30 || x > 1310 || y < -30 || y > 750) continue;
    ctx.strokeStyle = PALETTE.palmTrunk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4 * palm.s, y - 16 * palm.s);
    ctx.stroke();
    ctx.fillStyle = PALETTE.palm;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + palm.s;
      ctx.beginPath();
      ctx.ellipse(x + 4 * palm.s + Math.cos(a) * 12 * palm.s, y - 16 * palm.s + Math.sin(a) * 6 * palm.s, 12 * palm.s, 4 * palm.s, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Landmark signs.
  for (const k of Object.keys(G.city.landmarks)) {
    drawSignage(ctx, G.city.landmarks[k], cam);
  }
}

function drawEntities(ctx, G, cam) {
  // Pickups: envelopes and cash bags glow green.
  for (const pk of G.missions.pickups) {
    if (pk.taken) continue;
    const sx = pk.x - cam.x;
    const sy = pk.y - cam.y;
    const pr = 12 + 3 * Math.sin(G.time * 5);
    ctx.fillStyle = '#37e0a0';
    ctx.beginPath();
    ctx.arc(sx, sy, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20242c';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', sx, sy);
    ctx.textAlign = 'left';
  }
  // Objective marker from the active mission step.
  const objective = G.objectiveNow ? G.objectiveNow() : null;
  if (objective) {
    const sx = objective.x - cam.x;
    const sy = objective.y - cam.y;
    const pr = 26 + 6 * Math.sin(G.time * 4);
    ctx.strokeStyle = '#37e0a0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#37e0a0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(objective.label, sx, sy - 34);
    ctx.textAlign = 'left';
  }
  // Pedestrians.
  for (const ped of G.peds) {
    const sx = ped.x - cam.x;
    const sy = ped.y - cam.y;
    if (sx < -20 || sx > 1300 || sy < -20 || sy > 740) continue;
    ctx.fillStyle = ped.shirt;
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(sx, sy - 3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Parked + traffic + police cars.
  for (const car of G.cars) drawCarShape(ctx, G, car, cam);
  for (const car of G.traffic) drawCarShape(ctx, G, car, cam);
  for (const car of G.police) drawCarShape(ctx, G, car, cam);
  // Thugs.
  for (const e of G.enemies) {
    const sx = e.x - cam.x;
    const sy = e.y - cam.y;
    ctx.fillStyle = PALETTE.thug;
    ctx.beginPath();
    ctx.arc(sx, sy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20242c';
    ctx.fillRect(sx - 10, sy - 24, 20, 4);
    ctx.fillStyle = '#ff5a4e';
    ctx.fillRect(sx - 10, sy - 24, 20 * Math.max(0, e.hp / 60), 4);
    ctx.fillStyle = '#f4f1e8';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THUG', sx, sy - 28);
    ctx.textAlign = 'left';
  }
  // Player on foot.
  const p = G.player;
  if (p.onFoot) {
    const sx = p.x - cam.x;
    const sy = p.y - cam.y;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.playerShirt;
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(p.angle) * 20, sy + Math.sin(p.angle) * 20);
    ctx.stroke();
    if (p.invuln > 0) {
      ctx.strokeStyle = 'rgba(255,207,63,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Bullets.
  ctx.fillStyle = '#ffd94d';
  for (const b of G.bullets) {
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Effects.
  for (const fx of G.effects) {
    const sx = fx.x - cam.x;
    const sy = fx.y - cam.y;
    const a = 1 - fx.t / fx.life;
    if (fx.kind === 'smoke') {
      ctx.fillStyle = `rgba(120,120,120,${(a * 0.6).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 + fx.t * 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (fx.kind === 'spark' || fx.kind === 'hit') {
      ctx.fillStyle = `rgba(255,217,77,${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  drawHelicopter(ctx, G, cam);
}

function drawTitle(ctx, G) {
  ctx.fillStyle = 'rgba(10,14,22,0.82)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('PORTO VERDE', 640, 130);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('THREE DAYS IN THE SUN', 640, 172);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#d8d3c4';
  ctx.fillText('Dario Cruz is back after three years away. Mara Solis has the jobs.', 640, 214);
  ctx.fillText('Kessler has the city. Twelve missions. Three days. One way out.', 640, 240);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffcf3f';
  ctx.fillText('CONTROLS', 640, 292);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#f4f1e8';
  const lines = [
    'WASD / Arrows — move · Shift — run · Mouse — aim · Click — shoot',
    'E — enter / exit car · F — punch · Q — save · M — mute · R — radio',
    '1-4 — weapons · P / Esc — pause · Enter — confirm · C — continue',
  ];
  lines.forEach((l, i) => ctx.fillText(l, 640, 320 + i * 24));
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#37e0a0';
  if (hasSave()) ctx.fillText('Press ENTER to start  ·  C to continue your save', 640, 420);
  else ctx.fillText('Press ENTER to start', 640, 420);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#9aa3ad';
  ctx.fillText('A fully original open-world crime game — Porto Verde, Dario Cruz, Mara Solis.', 640, 660);
  ctx.fillText('12 missions · wanted levels · police chases · REP · radio · save & continue.', 640, 682);
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, title, sub, hint) {
  ctx.fillStyle = 'rgba(10,14,22,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = title === 'WASTED' ? '#ff5a4e' : '#ffcf3f';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(title, 640, 300);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = '20px sans-serif';
  ctx.fillText(sub, 640, 350);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#9aa3ad';
  ctx.fillText(hint, 640, 400);
  ctx.textAlign = 'left';
}

function drawFrame(ctx, G, screen) {
  const cam = cameraFor(G);
  G.cam = cam;
  if (screen === 'title') {
    drawWorld(ctx, G, cam);
    drawSunsetWash(ctx, G);
    drawTitle(ctx, G);
    return;
  }
  drawWorld(ctx, G, cam);
  drawEntities(ctx, G, cam);
  drawSunsetWash(ctx, G);
  if (screen === 'play' || screen === 'paused') drawHud(ctx, G);
  if (screen === 'paused') {
    drawOverlay(ctx, 'PAUSED', 'Porto Verde waits for no one — except now.', 'P resume · T title · Q save');
  } else if (screen === 'over') {
    drawOverlay(ctx, G.busted ? 'BUSTED' : 'WASTED', G.busted ? 'The PD finally caught up with Dario.' : 'Dario went down in the streets of Porto Verde.', 'Press ENTER to try again');
  } else if (screen === 'won') {
    const total = G.player.money;
    drawOverlay(ctx, 'THREE DAYS IN THE SUN', `Dario flew out of Porto Verde with $${total} and his name on every street.`, 'Press ENTER to play again');
  }
}
