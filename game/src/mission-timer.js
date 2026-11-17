// mission-timer.js — The clock that matters mid-job. Three kinds: a
// countdown (Lena's sunset deadline, the cafe defence), a count-up ALARM
// (how long the city has been screaming since the vault job went loud),
// and the mission header itself — "MISSION 11/12", "Stage 2/2", and a
// preview of the NEXT job waiting after this one.
import { MISSIONS } from './missions.js';

export function createMissionTimer() {
  return { active: false, kind: 'none', label: '', total: 0, left: 0 };
}

export function updateMissionTimer(G, dt) {
  const t = G.missionTimer;
  if (!t.active) return;
  if (t.kind === 'countdown' || t.kind === 'defend') {
    // The defend countdown is owned by missions.js; the Lena countdown lives here.
    if (t.kind === 'countdown') t.left = Math.max(0, t.left - dt);
  } else if (t.kind === 'alarm') {
    t.left += dt;
  }
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

export function missionStageText(G) {
  const m = G.missions;
  const mission = MISSIONS[m.index];
  if (!mission) return { head: '', stage: '', next: '' };
  const head = 'MISSION ' + (m.index + 1) + '/12 — ' + mission.title.toUpperCase();
  const stage = 'Stage ' + (m.step + 1) + '/' + mission.steps.length;
  const next = MISSIONS[m.index + 1]
    ? 'NEXT: ' + MISSIONS[m.index + 1].title + ' — ' + MISSIONS[m.index + 1].giver
    : 'NEXT: The plane out — freedom';
  return { head, stage, next };
}
