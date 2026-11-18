// Mission timer: the big countdown (or count-up alarm) at the top of the
// screen for timed missions — defend the cafe, beat the sunset, outrun the
// vault alarm. One timer at a time, driven by game time.
export function createMissionTimer() {
  return { label: '', seconds: 0, active: false, countUp: false };
}

export function startMissionTimer(G, label, seconds, countUp) {
  G.missionTimer.label = label;
  G.missionTimer.seconds = seconds;
  G.missionTimer.active = true;
  G.missionTimer.countUp = !!countUp;
}

export function stopMissionTimer(G) {
  G.missionTimer.active = false;
}

export function updateMissionTimer(G, dt) {
  const t = G.missionTimer;
  if (!t.active) return;
  if (t.countUp) t.seconds += dt;
  else {
    t.seconds -= dt;
    if (t.seconds < 0) t.seconds = 0;
  }
}

export function formatTimer(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function drawMissionTimer(ctx, G, cx, y) {
  const t = G.missionTimer;
  if (!t.active) return;
  const label = `${t.label}  ${formatTimer(t.seconds)}`;
  ctx.font = 'bold 26px sans-serif';
  const w = ctx.measureText(label).width + 28;
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(cx - w / 2, y, w, 40);
  ctx.strokeStyle = t.seconds < 15 && !t.countUp ? '#ff5a4e' : '#ffcf3f';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2 + 1, y + 1, w - 2, 38);
  ctx.fillStyle = t.seconds < 15 && !t.countUp ? '#ff5a4e' : '#f4f1e8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + 21);
  ctx.textAlign = 'left';
}
