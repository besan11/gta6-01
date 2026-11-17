// hud.js — The heads-up display: money, health, wanted stars, clock, missions.
// Features: top-left money + day/time + district + wanted stars + HEAT bar,
// mission panel (mission number, giver, objective, distance), dialog box with the
// story briefing, toast messages, day banners, car speed + health while driving,
// controls hint, and the minimap (see minimap.js). All in logical 1280x720 space.
import { FONT, PALETTE } from './config.js';
import { districtAt } from './world.js';
import { currentMission, currentStep, objectiveText } from './missions.js';
import { drawMinimap } from './minimap.js';

export function drawHud(ctx, G) {
  const p = G.player;
  ctx.textBaseline = 'alphabetic';
  // --- Top-left: money, day/time, district, wanted stars, heat ---
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(14, 12, 300, 96);
  ctx.strokeStyle = 'rgba(255,207,63,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 12, 300, 96);
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px ' + FONT;
  ctx.fillStyle = PALETTE.money;
  ctx.fillText('$' + p.money.toLocaleString('en-US'), 26, 44);
  ctx.font = '16px ' + FONT;
  ctx.fillStyle = PALETTE.text;
  const hh = String(G.clock.hour).padStart(2, '0');
  const mm = String(G.clock.minute).padStart(2, '0');
  ctx.fillText('DAY ' + G.clock.day + '  ' + hh + ':' + mm + '  •  ' + districtAt(p.x, p.y), 26, 68);
  // Wanted stars.
  for (let i = 0; i < 5; i += 1) {
    ctx.font = '22px ' + FONT;
    ctx.fillStyle = i < G.wanted.stars ? PALETTE.star : 'rgba(255,255,255,0.22)';
    ctx.fillText('★', 26 + i * 26, 98);
  }
  // Heat bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(160, 84, 140, 8);
  ctx.fillStyle = G.wanted.heat > 60 ? '#ff5a4e' : PALETTE.star;
  ctx.fillRect(160, 84, 140 * (G.wanted.heat / 100), 8);
  ctx.font = '11px ' + FONT;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('HEAT ' + Math.round(G.wanted.heat), 160, 80);

  // --- Minimap top-right ---
  drawMinimap(ctx, G, 1280 - 234, 16, 220, 152);

  // --- Health bar under the minimap ---
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(1280 - 234, 176, 220, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(1280 - 226, 185, 150, 9);
  ctx.fillStyle = PALETTE.hp;
  ctx.fillRect(1280 - 226, 185, 150 * (p.hp / 100), 9);
  ctx.font = 'bold 13px ' + FONT;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('HP ' + Math.ceil(p.hp), 1280 - 66, 194);

  // --- Mission panel (left, under the stats) ---
  const m = currentMission(G.missions);
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(14, 120, 300, 86);
  ctx.strokeStyle = 'rgba(55,224,160,0.6)';
  ctx.strokeRect(14, 120, 300, 86);
  if (m) {
    ctx.font = 'bold 15px ' + FONT;
    ctx.fillStyle = PALETTE.objective;
    ctx.fillText('MISSION ' + (G.missions.index + 1) + '/12 — ' + m.title.toUpperCase(), 26, 144);
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(m.giver + '  •  Day ' + m.day, 26, 164);
    ctx.font = '14px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    wrapText(ctx, objectiveText(G), 26, 186, 276, 16);
    const step = currentStep(G.missions);
    if (step) {
      const px = p.car ? p.car.x : p.x;
      const py = p.car ? p.car.y : p.y;
      const d = Math.round(Math.hypot(step.x - px, step.y - py));
      ctx.font = 'bold 12px ' + FONT;
      ctx.fillStyle = PALETTE.marker;
      ctx.textAlign = 'right';
      ctx.fillText(d + 'm', 300, 144);
      ctx.textAlign = 'left';
    }
  } else {
    ctx.font = 'bold 15px ' + FONT;
    ctx.fillStyle = PALETTE.objective;
    ctx.fillText('ALL MISSIONS COMPLETE', 26, 150);
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('Porto Verde is yours, Dario.', 26, 174);
  }

  // --- Driving readout bottom-right ---
  if (p.car) {
    const car = p.car;
    const mph = Math.round(Math.abs(car.speed) * 0.12);
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(1280 - 234, 720 - 78, 220, 64);
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(mph + ' MPH', 1280 - 222, 720 - 44);
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(car.model.name, 1280 - 222, 720 - 24);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(1280 - 110, 720 - 56, 90, 9);
    ctx.fillStyle = car.hp > 40 ? PALETTE.money : PALETTE.hp;
    ctx.fillRect(1280 - 110, 720 - 56, 90 * (car.hp / 100), 9);
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('CAR ' + Math.ceil(car.hp) + '%', 1280 - 110, 720 - 34);
  } else {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(14, 720 - 64, 330, 50);
    ctx.font = '13px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('WASD move  •  Shift run  •  E enter car', 26, 720 - 42);
    ctx.fillText('F punch  •  Click shoot  •  Q save  •  P pause', 26, 720 - 24);
  }

  // --- Toast (centre-top) ---
  if (G.toastT > 0 && G.toast) {
    ctx.font = 'bold 18px ' + FONT;
    const w = ctx.measureText(G.toast).width + 36;
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect((1280 - w) / 2, 12, w, 36);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.strokeRect((1280 - w) / 2, 12, w, 36);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.marker;
    ctx.fillText(G.toast, 640, 36);
    ctx.textAlign = 'left';
  }

  // --- Day banner (centre) ---
  if (G.dayBannerT > 0 && G.dayBanner) {
    ctx.globalAlpha = Math.min(1, G.dayBannerT);
    ctx.font = 'bold 44px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 12;
    ctx.fillText(G.dayBanner, 640, 300);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // --- Mission dialog box (bottom centre) ---
  const d = G.missions.dialog;
  if (d) {
    const line = d.lines[d.line] || '';
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(240, 720 - 150, 800, 84);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(240, 720 - 150, 800, 84);
    ctx.font = 'bold 14px ' + FONT;
    ctx.fillStyle = PALETTE.marker;
    ctx.fillText(m ? m.giver.toUpperCase() + '  —  ' + m.title.toUpperCase() : '', 260, 720 - 122);
    ctx.font = '16px ' + FONT;
    ctx.fillStyle = PALETTE.text;
    wrapText(ctx, line, 260, 720 - 96, 760, 20);
    ctx.font = '12px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Enter / click to continue  (' + (d.line + 1) + '/' + d.lines.length + ')', 260, 720 - 76);
  }
}

/** Wrap text to a width, drawing up to two lines. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      if (lines >= 2) return;
      line = word;
    } else {
      line = test;
    }
  }
  if (lines < 2) ctx.fillText(line, x, y + lines * lineHeight);
}
