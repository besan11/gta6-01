// HUD: every panel on the 1280x720 frame, placed by hud-layout so nothing overlaps.
// Top-left money/day/district + mission panel, top-right stars/PD/minimap, bottom
// weapons centre, radio + speed bottom-right, timer top-centre, dialogue above slots.
import { PALETTE } from './config.js';
import { MISSIONS } from './missions.js';
import { hudLayout } from './hud-layout.js';
import { drawMinimap } from './minimap.js';
import { drawPolicePanel } from './police-response.js';
import { drawDialoguePanel } from './dialogue.js';
import { drawWeaponSlots } from './weapons.js';
import { drawMissionTimer } from './mission-timer.js';
import { repLine } from './rep.js';
import { radioLine } from './radio.js';
import { moneyLine } from './money-scale.js';
import { currentMission, currentStep } from './missions.js';

export function drawHud(ctx, G) {
  const L = hudLayout(G);
  ctx.textAlign = 'left';
  // --- Top-left: money, day/time, district, REP.
  const ml = L.money;
  panel(ctx, ml.x, ml.y, ml.w, ml.h);
  ctx.fillStyle = PALETTE.money;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(moneyLine(G), ml.x + 12, ml.y + 26);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`DAY ${G.clock.day} — ${String(G.clock.hour).padStart(2, '0')}:${String(G.clock.minute).padStart(2, '0')}`, ml.x + 12, ml.y + 46);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText(G.district.current || 'OLD TOWN', ml.x + 12, ml.y + 64);
  ctx.fillStyle = PALETTE.star;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(repLine(G), ml.x + 150, ml.y + 64);
  // HP bar under the money panel.
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(ml.x, ml.y + ml.h + 4, 150, 12);
  ctx.fillStyle = PALETTE.hp;
  ctx.fillRect(ml.x, ml.y + ml.h + 4, 150 * Math.max(0, G.player.hp / 100), 12);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`HP ${Math.ceil(G.player.hp)}`, ml.x + 156, ml.y + ml.h + 14);

  // --- Mission panel (below money, left).
  const m = currentMission(G);
  if (m) {
    const mp = L.mission;
    panel(ctx, mp.x, mp.y, mp.w, mp.h);
    ctx.fillStyle = PALETTE.money;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`MISSION ${G.missions.index + 1}/12 — ${m.title.toUpperCase()}`, mp.x + 10, mp.y + 20);
    const s = currentStep(G);
    if (s) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = '13px sans-serif';
      const stageText = `Stage ${G.missions.step + 1}/${m.steps.length} — ${s.label}`;
      ctx.fillText(stageText.length > 40 ? stageText.slice(0, 39) + '…' : stageText, mp.x + 10, mp.y + 42);
    }
    const next = MISSIONS[G.missions.index + 1];
    if (next) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText(`NEXT: ${next.title} — ${next.giver}`, mp.x + 10, mp.y + 62);
    }
    ctx.fillStyle = PALETTE.objective;
    ctx.font = '12px sans-serif';
    ctx.fillText(`Contact: ${m.giver} · Day ${m.day}`, mp.x + 10, mp.y + 82);
    if (G.rep && G.rep.lastGainT > 0) {
      ctx.fillStyle = PALETTE.star;
      ctx.fillText(G.rep.lastGain, mp.x + 10, mp.y + 100);
    }
  }

  // --- Top-right: wanted stars.
  const st = L.stars;
  panel(ctx, st.x, st.y, st.w, st.h);
  ctx.font = 'bold 20px sans-serif';
  let starsText = '';
  for (let i = 0; i < 5; i += 1) starsText += i < G.wanted.stars ? '★' : '☆';
  ctx.fillStyle = G.wanted.stars >= 4 ? PALETTE.hp : PALETTE.star;
  ctx.fillText(starsText, st.x + 10, st.y + 25);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText(G.wanted.stars > 0 ? `HEAT ${Math.round(G.wanted.heat)}` : 'CLEAN', st.x + 190, st.y + 24);

  // --- PD response panel, then the minimap beneath it.
  const pdH = drawPolicePanel(ctx, G, L.pdPanel.x, L.pdPanel.y, L.pdPanel.w);
  const mapY = L.pdPanel.y + pdH + 10;
  drawMinimap(ctx, G, L.minimap.x, mapY, L.minimap.w, L.minimap.h);

  // --- Mission timer, top-centre.
  drawMissionTimer(ctx, G, L.timer.x, L.timer.y);

  // --- Toast, under the timer.
  if (G.toastT > 0 && G.toast) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.toastT);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(16,20,28,0.88)';
    const tw = ctx.measureText(G.toast).width + 28;
    ctx.fillRect(640 - tw / 2, 74, tw, 28);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px sans-serif';
    ctx.fillText(G.toast, 640, 93);
    ctx.restore();
  }

  // --- Day banner.
  if (G.dayBannerT > 0 && G.dayBanner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.dayBannerT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(G.dayBanner, 640, 300);
    ctx.restore();
  }

  // --- District banner: centre-bottom, lifted above the dialogue when it is open.
  const dlgActive = !!(G.dialogue && G.dialogue.active);
  if (G.district.bannerT > 0) {
    const by = dlgActive ? 420 : 560;
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.district.bannerT);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(16,20,28,0.72)';
    ctx.fillRect(340, by, 600, 64);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(G.district.name, 640, by + 28);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '15px sans-serif';
    ctx.fillText(G.district.flavor, 640, by + 52);
    ctx.restore();
  }

  // --- Dialogue panel, above the weapon slots.
  if (dlgActive) drawDialoguePanel(ctx, G, L.dialogue.x, L.dialogue.y, L.dialogue.w);
  else if (G.dialogue && G.dialogue.contextual && G.dialogue.contextualT > 0) {
    drawDialoguePanel(ctx, G, L.dialogue.x, L.dialogue.y, L.dialogue.w);
  }

  // --- Weapon slots, bottom-centre.
  drawWeaponSlots(ctx, G, L.weapons.x, L.weapons.y);

  // --- Radio, bottom-right above the speed panel.
  const rp = L.radio;
  panel(ctx, rp.x, rp.y, rp.w, rp.h);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px sans-serif';
  ctx.fillText(radioLine(G), rp.x + 10, rp.y + 21);

  // --- Speed + car, bottom-right.
  const sp = L.speed;
  panel(ctx, sp.x, sp.y, sp.w, sp.h);
  ctx.fillStyle = PALETTE.text;
  if (G.player.car) {
    const mph = Math.round(Math.abs(G.player.car.speed) * 0.45);
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${mph} MPH`, sp.x + 12, sp.y + 32);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`${G.player.car.name} · ${Math.max(0, Math.ceil(G.player.car.hp))}%`, sp.x + 12, sp.y + 52);
  } else {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('ON FOOT', sp.x + 12, sp.y + 30);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    const near = G.nearCar;
    ctx.fillText(near ? `E — steal ${near.name}` : 'Find a car — press E near one', sp.x + 12, sp.y + 52);
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
