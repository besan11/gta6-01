// Mission timer: the big clock at the top of the screen for timed jobs — the cafe
// defence counting down, the sunset deadline for Lena, the alarm on the last score.
export function createMissionTimer() {
  return { active: false, label: '', seconds: 0, total: 0, failed: false };
}

export function startMissionTimer(G, label, seconds) {
  G.missionTimer.active = true;
  G.missionTimer.label = label;
  G.missionTimer.seconds = seconds;
  G.missionTimer.total = seconds;
  G.missionTimer.failed = false;
}

export function stopMissionTimer(G) {
  G.missionTimer.active = false;
  G.missionTimer.seconds = 0;
}

export function updateMissionTimer(G, dt) {
  const t = G.missionTimer;
  if (!t.active) return;
  if (t.label === 'SUNSET DEADLINE' || t.label === 'ALARM') {
    // These count up / hold; the defend timer is driven by missions.updateMissions.
    if (t.label === 'SUNSET DEADLINE') {
      t.seconds -= dt;
      if (t.seconds <= 0) {
        t.seconds = 0;
        t.failed = true;
        t.active = false;
        G.toast = 'Too late — Lena missed her show. The mission restarts.';
        G.toastT = 4;
        if (G.missions) {
          G.missions.step = 0;
          G.missions.pickups = [];
        }
      }
    }
  }
}

export function formatTimer(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, '0')}`;
}

export function drawMissionTimer(ctx, G, cx, y) {
  const t = G.missionTimer;
  if (!t.active || t.seconds <= 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  const w = 220;
  ctx.fillRect(cx - w / 2, y, w, 52);
  ctx.strokeStyle = t.seconds < 15 ? '#ff5a4e' : '#ffcf3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - w / 2 + 0.5, y + 0.5, w - 1, 51);
  ctx.fillStyle = '#9aa3ad';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(t.label, cx, y + 18);
  ctx.fillStyle = t.seconds < 15 ? '#ff5a4e' : '#f4f1e8';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(formatTimer(t.seconds), cx, y + 44);
  ctx.restore();
}
