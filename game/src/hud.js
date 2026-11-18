// drawHud: every panel in its own rectangle, placed by hud-layout.js.
// Top-left money + clock + district + health, mission panel + REP under it,
// stars + PD response + big minimap top-right, timer top-centre, weapons
// bottom-centre, speed + car + radio bottom-right, dialog above the weapons.
import { PALETTE, MISSION_REWARDS } from './config.js';
import { LAYOUT, minimapY, repY } from './hud-layout.js';
import { drawPdPanel } from './police-response.js';
import { drawMinimapPlus } from './minimap-plus.js';
import { drawRepBar } from './rep.js';
import { drawRadio } from './radio.js';
import { drawWeapons } from './weapons.js';
import { drawMissionTimer } from './mission-timer.js';
import { drawDistrictBanner } from './districts.js';
import { drawDialog } from './dialogue.js';
import { formatMoney } from './money-scale.js';
import { currentMission, currentStep, MISSIONS } from './missions.js';

export function drawHud(ctx, G) {
  const p = G.player;
  ctx.textBaseline = 'alphabetic';
  // ---- Top-left: money, day + clock, district, health.
  ctx.textAlign = 'left';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = PALETTE.money;
  ctx.fillText(formatMoney(p.money), LAYOUT.money.x, LAYOUT.money.y + 26);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = PALETTE.text;
  const hh = String(G.clock.hour).padStart(2, '0');
  const mm = String(G.clock.minute).padStart(2, '0');
  ctx.fillText(`DAY ${G.clock.day} · ${hh}:${mm}  ·  ${G.district.name}`, LAYOUT.money.x, LAYOUT.money.y + 48);
  // Health bar, on its own row below the day line.
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(16, 66, 150, 10);
  ctx.fillStyle = PALETTE.hp;
  ctx.fillRect(16, 66, 150 * Math.max(0, p.hp / 100), 10);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`HP ${Math.round(p.hp)}`, 168, 75);
  // ---- Mission panel.
  const m = currentMission(G);
  const panelY = 84;
  let panelH = 96;
  if (m) {
    const step = currentStep(G);
    const next = MISSIONS[G.missions.index + 1];
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(LAYOUT.missionPanel.x, panelY, LAYOUT.missionPanel.w, panelH);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(LAYOUT.missionPanel.x + 0.5, panelY + 0.5, LAYOUT.missionPanel.w - 1, panelH - 1);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`MISSION ${G.missions.index + 1}/12 — ${m.title.toUpperCase()}`, LAYOUT.missionPanel.x + 10, panelY + 20);
    ctx.fillStyle = PALETTE.objective;
    ctx.font = 'bold 13px sans-serif';
    const stage = step ? `Stage ${G.missions.step + 1}/${m.steps.length}  ·  ` : '';
    ctx.fillText(`${stage}${step ? step.label : ''}`, LAYOUT.missionPanel.x + 10, panelY + 42);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px sans-serif';
    if (next) ctx.fillText(`NEXT: ${next.title} — ${next.giver === 'MARA' ? 'Mara Solis' : next.giver === 'TITO' ? 'Tito Ramos' : 'Lena Voss'}`, LAYOUT.missionPanel.x + 10, panelY + 64);
    const reward = MISSION_REWARDS[G.missions.index] || 0;
    ctx.fillText(`Reward ${formatMoney(reward)}  ·  ${m.giver === 'MARA' ? 'Mara Solis' : m.giver === 'TITO' ? 'Tito Ramos' : 'Lena Voss'}`, LAYOUT.missionPanel.x + 10, panelY + 84);
  }
  // ---- REP bar under the mission panel.
  drawRepBar(ctx, G, 16, repY(panelH), 372);
  // ---- Top-right: wanted stars, PD panel, big minimap.
  ctx.textAlign = 'right';
  ctx.font = 'bold 26px sans-serif';
  let stars = '';
  for (let i = 0; i < 5; i++) stars += i < G.wanted.stars ? '★' : '☆';
  ctx.fillStyle = G.wanted.stars > 0 ? PALETTE.star : 'rgba(244,241,232,0.35)';
  ctx.fillText(stars, 1264, 36);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = G.wanted.stars > 0 ? '#ff8a7a' : PALETTE.muted;
  ctx.fillText(G.wanted.stars > 0 ? `HEAT ${Math.round(G.wanted.heat)}` : 'CLEAN', 1264, 54);
  ctx.textAlign = 'left';
  const pdH = drawPdPanel(ctx, G, LAYOUT.pdPanel.x, LAYOUT.pdPanel.y, LAYOUT.pdPanel.w);
  drawMinimapPlus(ctx, G, LAYOUT.minimap.x, minimapY(pdH), LAYOUT.minimap.w, LAYOUT.minimap.h);
  // ---- Timer top-centre.
  drawMissionTimer(ctx, G, LAYOUT.timer.cx, LAYOUT.timer.y);
  // ---- Toast under the timer.
  if (G.toastT > 0 && G.toast) {
    ctx.font = 'bold 15px sans-serif';
    const w = ctx.measureText(G.toast).width + 24;
    ctx.fillStyle = 'rgba(16,20,28,0.88)';
    ctx.fillRect(LAYOUT.toast.cx - w / 2, LAYOUT.toast.y, w, 30);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.strokeRect(LAYOUT.toast.cx - w / 2 + 0.5, LAYOUT.toast.y + 0.5, w - 1, 29);
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    ctx.fillText(G.toast, LAYOUT.toast.cx, LAYOUT.toast.y + 20);
    ctx.textAlign = 'left';
  }
  // ---- Day banner (big centre flash on a new day).
  if (G.dayBannerT > 0 && G.dayBanner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.dayBannerT);
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcf3f';
    ctx.fillText(G.dayBanner, 640, 300);
    ctx.restore();
    ctx.textAlign = 'left';
  }
  // ---- District banner (mid-lower centre, clear of the dialog).
  drawDistrictBanner(ctx, G, LAYOUT.banner.cx, 440);
  // ---- Dialog above the weapon slots.
  if (G.dialogue) drawDialog(ctx, G, LAYOUT.dialog.cx, LAYOUT.dialog.y, LAYOUT.dialog.w);
  // ---- Weapons bottom-centre.
  drawWeapons(ctx, G, LAYOUT.weapons.cx, LAYOUT.weapons.y);
  // ---- Speed + car bottom-right, radio just beneath it.
  ctx.textAlign = 'right';
  if (p.car) {
    const mph = Math.round(Math.abs(p.car.speed) * 0.24);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`${mph} MPH`, LAYOUT.speed.x, LAYOUT.speed.y);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`${p.car.model.name} · CAR ${Math.max(0, Math.round(p.car.hp))}%`, LAYOUT.speed.x, LAYOUT.speed.y + 20);
  } else {
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('ON FOOT — press E near a car', LAYOUT.speed.x, LAYOUT.speed.y);
  }
  ctx.textAlign = 'left';
  drawRadio(ctx, G, LAYOUT.radio.x, LAYOUT.radio.y);
  // ---- Mute + save hint, tiny, bottom-left.
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(244,241,232,0.6)';
  ctx.fillText('Q save · M mute · P pause · R radio · 1-4 weapons', 16, 708);
}
