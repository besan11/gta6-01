// hud.js — Everything on top of the world: money and the clock, the mission
// panel with its stage and next-job preview, REP with its progress bar,
// the wanted stars, the PD response panel, the big minimap, speed and the
// car, the weapon slots, the radio, the mission timer, the district
// banner, and the dialogue panel with its portrait. Positions come from
// hud-layout.js so nothing ever stacks on anything else.
import { FONT, PALETTE } from './config.js';
import { districtAt } from './world.js';
import { currentMission, currentStep, objectiveText } from './missions.js';
import { drawMinimap } from './minimap.js';
import { drawPdPanel } from './police-response.js';
import { repProgress } from './rep.js';
import { currentSong, currentStation } from './radio.js';
import { formatMoney } from './money-scale.js';
import { formatClock, missionStageText } from './mission-timer.js';
import { drawPortrait } from './dialogue.js';
import { LAYOUT } from './hud-layout.js';

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawHud(ctx, G) {
  const p = G.player;
  ctx.save();
  ctx.textBaseline = 'middle';

  // --- Top left: money, day + clock, district, health.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.money;
  ctx.font = FONT.big;
  ctx.fillText(formatMoney(p.money), LAYOUT.money.x, LAYOUT.money.y + 12);
  ctx.fillStyle = PALETTE.text;
  ctx.font = FONT.ui;
  const hh = String(G.clock.hour).padStart(2, '0');
  const mm = String(G.clock.minute).padStart(2, '0');
  ctx.fillText('DAY ' + G.clock.day + ' — ' + hh + ':' + mm, LAYOUT.money.x, LAYOUT.money.y + 38);
  const dist = districtAt(p.x, p.y);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = FONT.small;
  ctx.fillText(dist.name, LAYOUT.money.x, LAYOUT.money.y + 58);
  // Health bar.
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(LAYOUT.money.x, LAYOUT.money.y + 70, 200, 12);
  ctx.fillStyle = PALETTE.hp;
  ctx.fillRect(LAYOUT.money.x, LAYOUT.money.y + 70, 200 * Math.max(0, p.hp) / 100, 12);
  ctx.fillStyle = PALETTE.text;
  ctx.font = FONT.tiny;
  ctx.fillText('HP ' + Math.ceil(p.hp), LAYOUT.money.x + 206, LAYOUT.money.y + 76);

  // --- Mission panel (below the money block).
  const mission = currentMission(G);
  if (mission) {
    const mp = LAYOUT.missionPanel;
    const stage = missionStageText(G);
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(mp.x, mp.y, mp.w, 118);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(mp.x + 0.5, mp.y + 0.5, mp.w - 1, 117);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.ui;
    ctx.fillText(stage.head, mp.x + 10, mp.y + 14);
    ctx.fillStyle = PALETTE.objective;
    ctx.font = FONT.small;
    ctx.fillText(stage.stage + '  ·  ' + objectiveText(G), mp.x + 10, mp.y + 34);
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(stage.next, mp.x + 10, mp.y + 52);
    const rep = repProgress(G.rep.total);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.small;
    ctx.fillText('REP ' + rep.rank + ' · ' + rep.name + ' · ' + rep.cur.toLocaleString('en-US') + '/' + rep.next.toLocaleString('en-US'), mp.x + 10, mp.y + 74);
    ctx.fillStyle = 'rgba(244,241,232,0.2)';
    ctx.fillRect(mp.x + 10, mp.y + 88, mp.w - 20, 8);
    ctx.fillStyle = PALETTE.marker;
    ctx.fillRect(mp.x + 10, mp.y + 88, (mp.w - 20) * rep.frac, 8);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = FONT.tiny;
    ctx.fillText(mission.giver + '  ·  ' + mission.title, mp.x + 10, mp.y + 108);
    G.drawn.rep = true;
  }

  // --- Top right: wanted stars + heat.
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < G.wanted.stars ? '★' : '☆';
  ctx.fillStyle = G.wanted.stars > 0 ? PALETTE.star : 'rgba(244,241,232,0.35)';
  ctx.fillText(stars, LAYOUT.stars.x, LAYOUT.stars.y + 10);
  if (G.wanted.stars > 0) {
    ctx.fillStyle = 'rgba(16,20,28,0.88)';
    ctx.fillRect(LAYOUT.stars.x - 120, LAYOUT.stars.y + 24, 120, 6);
    ctx.fillStyle = '#ff8a3c';
    ctx.fillRect(LAYOUT.stars.x - 120, LAYOUT.stars.y + 24, 120 * G.wanted.heat / 100, 6);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = FONT.tiny;
    ctx.fillText('HEAT ' + Math.round(G.wanted.heat), LAYOUT.stars.x, LAYOUT.stars.y + 40);
  }

  // --- PD response panel, then the minimap under it.
  const pdH = drawPdPanel(ctx, G, LAYOUT.pdPanel.x, LAYOUT.pdPanel.y, LAYOUT.pdPanel.w);
  const mapY = LAYOUT.pdPanel.y + pdH + 10;
  drawMinimap(ctx, G, LAYOUT.minimap.x, mapY, LAYOUT.minimap.w, LAYOUT.minimap.h);

  // --- Mission timer, top centre, when a timed job is running.
  if (G.missionTimer.active) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.panel;
    const tw = 220;
    ctx.fillRect(LAYOUT.timer.x - tw / 2, LAYOUT.timer.y, tw, 44);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.strokeRect(LAYOUT.timer.x - tw / 2 + 0.5, LAYOUT.timer.y + 0.5, tw - 1, 43);
    ctx.fillStyle = '#ffcf3f';
    ctx.font = FONT.big;
    ctx.fillText(G.missionTimer.label + ' ' + formatClock(G.missionTimer.left), LAYOUT.timer.x, LAYOUT.timer.y + 22);
    G.drawn.timer = true;
  }

  // --- Toast, centre.
  if (G.toastT > 0 && G.toast) {
    ctx.textAlign = 'center';
    ctx.font = FONT.ui;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(G.toast, LAYOUT.toast.x, LAYOUT.toast.y);
  }

  // --- Day banner.
  if (G.dayBannerT > 0 && G.dayBanner) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.title;
    ctx.fillText(G.dayBanner, 640, 300);
  }

  // --- District banner, lower centre, 3 seconds. Above the dialogue panel
  // while a briefing is open, otherwise clear of the weapon slots.
  if (G.district.bannerT > 0) {
    const bannerY = G.dialogue.active ? 420 : 580;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.big;
    ctx.fillText(G.district.banner.name, LAYOUT.districtBanner.x, bannerY);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = FONT.ui;
    ctx.fillText(G.district.banner.flavor, LAYOUT.districtBanner.x, bannerY + 26);
    G.drawn.district = G.district.banner.name;
  }

  // --- Dialogue panel with portrait, bottom centre above the weapon slots.
  if (G.dialogue.active) {
    const d = G.dialogue;
    const line = d.lines[d.line] || '';
    const px = LAYOUT.dialog.x - 280;
    const py = LAYOUT.dialog.y;
    const pw = 560;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(px, py, pw, 108);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, 107);
    drawPortrait(ctx, d.speaker, px + 12, py + 12, 84);
    ctx.fillStyle = PALETTE.marker;
    ctx.font = FONT.ui;
    ctx.fillText(d.speaker.toUpperCase(), px + 108, py + 18);
    ctx.fillStyle = PALETTE.text;
    ctx.font = FONT.ui;
    const body = line.replace(/^[A-Z]+: /, '');
    const lines = wrapText(ctx, body, pw - 128);
    lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, px + 108, py + 44 + i * 20));
    ctx.fillStyle = PALETTE.muted;
    ctx.font = FONT.tiny;
    ctx.fillText('Enter — continue', px + 108, py + 96);
    G.drawn.portrait = d.speaker;
  }

  // --- Weapon slots, bottom centre.
  const w = G.weapons;
  const slotW = 150;
  const slotH = 34;
  const totalW = w.slots.length * slotW + (w.slots.length - 1) * 8;
  let sx = LAYOUT.weapons.x - totalW / 2;
  const sy = LAYOUT.weapons.y - slotH;
  let visible = 0;
  w.slots.forEach((s, i) => {
    ctx.fillStyle = 'rgba(16,20,28,0.88)';
    ctx.fillRect(sx, sy, slotW, slotH);
    ctx.strokeStyle = i === w.selected ? PALETTE.panelEdge : 'rgba(244,241,232,0.3)';
    ctx.lineWidth = i === w.selected ? 2 : 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, slotW - 1, slotH - 1);
    ctx.textAlign = 'left';
    ctx.font = FONT.small;
    if (!s.unlocked) {
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(s.key + ' ' + s.name + '  —', sx + 8, sy + 17);
    } else {
      ctx.fillStyle = PALETTE.text;
      const ammo = s.ammo === Infinity ? '∞' : String(s.ammo);
      ctx.fillText(s.key + ' ' + s.name + '  ' + ammo, sx + 8, sy + 17);
      visible += 1;
    }
    sx += slotW + 8;
  });
  G.drawn.weapons = visible;

  // --- Speed + car, bottom right (above the radio).
  ctx.textAlign = 'right';
  const speed = p.car ? Math.round(Math.abs(p.car.speed) * 0.22) : 0;
  const carName = p.car ? p.car.name : 'On foot';
  const cond = p.car ? ' · ' + Math.max(0, Math.round(p.car.hp)) + '%' : '';
  ctx.fillStyle = PALETTE.text;
  ctx.font = FONT.ui;
  ctx.fillText(speed + ' mph · ' + carName + cond, LAYOUT.speed.x, LAYOUT.speed.y - 8);

  // --- Radio, bottom right.
  const st = currentStation(G);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = FONT.small;
  ctx.fillText('♪ ' + st.name + ' — ' + currentSong(G), LAYOUT.radio.x, LAYOUT.radio.y);
  G.drawn.radio = true;

  // --- Objective compass hint, bottom left.
  const step = currentStep(G);
  if (step && (step.type === 'goto' || step.type === 'drive' || step.type === 'escape')) {
    const d = Math.round(Math.sqrt((step.x - p.x) ** 2 + (step.y - p.y) ** 2) / 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.objective;
    ctx.font = FONT.small;
    ctx.fillText('◈ ' + d + 'm to objective', 16, 700);
  }
  ctx.restore();
}
