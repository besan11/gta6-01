// Porto Verde v6 — the HUD: every system visible in one frame, each in its own
// place (see hud-layout.js). Money and day top-left, PD response and minimap
// top-right, weapons bottom-centre, radio bottom-right, dialogue above that.
import { PALETTE, MAX_STARS } from './config.js';
import { HUD_LAYOUT, panelRect } from './hud-layout.js';
import { drawMinimap } from './minimap.js';
import { currentMission, currentStep } from './missions.js';
import { policePanel } from './police-response.js';
import { currentTrack } from './radio.js';
import { repProgress } from './rep.js';
import { missionTimerText } from './mission-timer.js';
import { formatMoney } from './money-scale.js';
import { drawPortrait, dialogueActive } from './dialogue.js';

function starsRow(ctx, x, y, stars) {
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i < MAX_STARS; i += 1) {
    ctx.fillStyle = i < stars ? PALETTE.star : 'rgba(244,241,232,0.25)';
    ctx.fillText('★', x - i * 26, y);
  }
  ctx.textAlign = 'left';
}

export function drawHud(ctx, G) {
  const L = HUD_LAYOUT;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Top-left: money, clock, district, REP.
  ctx.fillStyle = PALETTE.money;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatMoney(G.player.money), L.money.x, L.money.y + 10);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 16px sans-serif';
  const hh = String(G.clock.hour).padStart(2, '0');
  const mm = String(G.clock.minute).padStart(2, '0');
  ctx.fillText('DAY ' + G.clock.day + '  ' + hh + ':' + mm, L.clock.x, L.clock.y + 10);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px sans-serif';
  ctx.fillText(G.district ? G.district.name : 'PORTO VERDE', L.districtLine.x, L.districtLine.y + 8);
  const rp = repProgress(G.rep.points);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('REP ' + rp.rank.level + ' · ' + rp.rank.name + ' · ' + rp.into.toLocaleString('en-US') + '/' + rp.span.toLocaleString('en-US'), L.rep.x, L.rep.y + 8);
  ctx.fillStyle = '#2c303a';
  ctx.fillRect(L.rep.x, L.rep.y + 14, L.rep.w, 7);
  ctx.fillStyle = PALETTE.star;
  ctx.fillRect(L.rep.x, L.rep.y + 14, L.rep.w * rp.pct, 7);

  // Mission panel, left under REP.
  const mission = currentMission(G);
  const step = currentStep(G);
  if (mission && step) {
    panelRect(ctx, L.missionPanel.x, L.missionPanel.y, L.missionPanel.w, L.missionPanel.h);
    ctx.fillStyle = PALETTE.objective;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('MISSION ' + (G.missions.index + 1) + '/12 — ' + mission.title.toUpperCase(), L.missionPanel.x + 10, L.missionPanel.y + 22);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px sans-serif';
    ctx.fillText(step.label, L.missionPanel.x + 10, L.missionPanel.y + 44);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px sans-serif';
    ctx.fillText('Stage ' + (G.missions.step + 1) + '/' + mission.steps.length + '   ·   ' + mission.giver, L.missionPanel.x + 10, L.missionPanel.y + 64);
    const next = G.missions.index + 1 < 12 ? null : null;
    const following = (typeof window !== 'undefined' && G._nextTitle) ? G._nextTitle : null;
    const nextTitle = G.missions.index + 1 < 12
      ? (['Welcome Home', 'Cold Cargo', 'The Green Van', 'First Blood', 'Sunset Run', 'Paper Trail', 'Hot Pursuit', 'The Vault Key', 'High Tide', 'Family Business', 'The Last Score', 'The Casino Vault'][G.missions.index + 1])
      : null;
    if (nextTitle) {
      ctx.fillStyle = PALETTE.star;
      ctx.fillText('NEXT: ' + nextTitle, L.missionPanel.x + 10, L.missionPanel.y + 82);
    }
  }

  // Wanted stars + PD response, top-right.
  starsRow(ctx, L.wanted.x, L.wanted.y + 16, G.wanted.stars);
  const rows = policePanel(G);
  if (rows.length > 0) {
    const h = 26 + rows.length * 20;
    panelRect(ctx, L.pdPanel.x, L.pdPanel.y, L.pdPanel.w, h);
    ctx.fillStyle = PALETTE.star;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('PORTO VERDE PD RESPONSE', L.pdPanel.x + 10, L.pdPanel.y + 18);
    ctx.font = '12px sans-serif';
    rows.forEach((r, i) => {
      const yy = L.pdPanel.y + 38 + i * 20;
      ctx.fillStyle = r.status === 'RAMMING' ? PALETTE.hp : PALETTE.text;
      ctx.fillText(r.unit + ' — ' + r.officer, L.pdPanel.x + 10, yy);
      ctx.textAlign = 'right';
      ctx.fillText(r.distM + 'm · ' + r.status, L.pdPanel.x + L.pdPanel.w - 10, yy);
      ctx.textAlign = 'left';
    });
  }

  // Minimap, right under the PD panel.
  drawMinimap(ctx, G, L.minimap.x, L.minimap.y, L.minimap.w, L.minimap.h);

  // Mission timer, top-centre, big.
  const mt = missionTimerText(G);
  if (mt) {
    ctx.fillStyle = 'rgba(16,20,28,0.88)';
    const tw = 190;
    ctx.fillRect(L.timer.x - tw / 2, L.timer.y, tw, 52);
    ctx.strokeStyle = PALETTE.hp;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(L.timer.x - tw / 2 + 0.5, L.timer.y + 0.5, tw - 1, 51);
    ctx.fillStyle = PALETTE.hp;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mt.text, L.timer.x, L.timer.y + 28);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(mt.label, L.timer.x, L.timer.y + 44);
    ctx.textAlign = 'left';
  }

  // Toast, under the timer.
  if (G.toast && G.toastT > 0) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.toast, L.toast.x, L.toast.y);
    ctx.textAlign = 'left';
  }

  // District banner, centre-bottom, fades with dayBannerT.
  if (G.dayBanner && G.dayBannerT > 0) {
    ctx.globalAlpha = Math.min(1, G.dayBannerT);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.dayBanner, L.districtBanner.x, L.districtBanner.y);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px sans-serif';
    const d = G.district;
    if (d) ctx.fillText(d.flavor, L.districtBanner.x, L.districtBanner.y + 22);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Context line from a contact, above the dialogue panel.
  const d = G.dialogue;
  if (d.context && d.contextT > 0) {
    ctx.fillStyle = PALETTE.star;
    ctx.font = 'italic 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.context, L.contextLine.x, L.contextLine.y);
    ctx.textAlign = 'left';
  }

  // Dialogue panel with portrait.
  if (dialogueActive(G)) {
    panelRect(ctx, L.dialog.x, L.dialog.y, L.dialog.w, L.dialog.h);
    drawPortrait(ctx, d.speaker, L.dialog.x + 12, L.dialog.y + 12, 72);
    ctx.fillStyle = PALETTE.star;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(d.speaker, L.dialog.x + 96, L.dialog.y + 24);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '14px sans-serif';
    const line = d.lines[d.line] || '';
    wrapText(ctx, line, L.dialog.x + 96, L.dialog.y + 46, L.dialog.w - 112, 18);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText('Enter ▸', L.dialog.x + L.dialog.w - 56, L.dialog.y + L.dialog.h - 10);
  }

  // Weapon slots, bottom-centre.
  const slots = G.weapons.slots;
  const sw = 74;
  const totalW = slots.length * sw;
  const sx0 = L.weapons.x + (L.weapons.w - totalW) / 2;
  slots.forEach((s, i) => {
    const x = sx0 + i * sw;
    const y = L.weapons.y;
    ctx.fillStyle = i === G.weapons.selected ? 'rgba(255,207,63,0.25)' : 'rgba(16,20,28,0.88)';
    ctx.fillRect(x, y, sw - 4, 36);
    ctx.strokeStyle = i === G.weapons.selected ? PALETTE.panelEdge : '#555c66';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, sw - 5, 35);
    ctx.fillStyle = s.unlocked ? PALETTE.text : PALETTE.muted;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText((i + 1) + ' ' + s.name, x + 5, y + 14);
    ctx.font = '11px sans-serif';
    ctx.fillText(s.unlocked ? (s.ammo === Infinity ? '∞' : String(s.ammo)) : 'locked', x + 5, y + 29);
  });

  // Radio, bottom-right.
  const track = currentTrack(G);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('♪ ' + track.station.name + ' — ' + track.track, L.radio.x, L.radio.y + 12);
  ctx.textAlign = 'left';

  // Speed + car, right side above radio.
  if (G.player.car) {
    const mph = Math.round(Math.abs(G.player.car.speed) * 0.12);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(mph + ' MPH', L.speed.x, L.speed.y);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(G.player.car.name + '  ·  HP ' + Math.max(0, Math.round(G.player.car.hp)), L.speed.x, L.speed.y + 18);
    ctx.textAlign = 'left';
  }

  // Health bar, bottom-left.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('HP ' + Math.max(0, Math.round(G.player.hp)), L.health.x, L.health.y + 10);
  ctx.fillStyle = '#2c303a';
  ctx.fillRect(L.health.x, L.health.y + 16, L.health.w, 8);
  ctx.fillStyle = G.player.hp > 30 ? PALETTE.hp : '#ff9a3d';
  ctx.fillRect(L.health.x, L.health.y + 16, L.health.w * Math.max(0, G.player.hp / 100), 8);
  if (G.wanted.stars > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px sans-serif';
    ctx.fillText('HEAT ' + Math.round(G.wanted.heat), L.health.x, L.health.y + 42);
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
