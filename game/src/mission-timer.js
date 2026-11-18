// Porto Verde v6 — mission timers: the sunset deadline, the 45-second defence,
// the alarm climbing while you run. One small state object, drawn big.
export function createMissionTimer() {
  return { active: false, remaining: 0, label: '', mode: 'countdown' };
}

export function missionTimerText(G) {
  const t = G.missionTimer;
  if (!t.active) return null;
  const total = Math.max(0, t.remaining);
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  const text = mins + ':' + String(secs).padStart(2, '0');
  return { text, label: t.label || 'TIMER' };
}
