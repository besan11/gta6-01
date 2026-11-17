// Save / continue: one small schema, kept exactly as v1 wrote it, plus REP and
// weapons with safe defaults so old saves still load.
export const SAVE_KEY = 'porto-verde.save.v1';

export function saveGame(G) {
  const p = G.player;
  const data = {
    version: 1,
    mission: G.missions.index,
    completed: G.missions.completedCount,
    money: p.money,
    hp: p.hp,
    day: G.clock.day,
    hour: G.clock.hour,
    minute: G.clock.minute,
    x: Math.round(p.x),
    y: Math.round(p.y),
    rep: G.rep ? G.rep.points : 0,
    weapon: G.weapons ? G.weapons.current : 0,
    savedAt: `Day ${G.clock.day} ${String(G.clock.hour).padStart(2, '0')}:${String(G.clock.minute).padStart(2, '0')}`,
  };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* storage can be off */ }
  G.hasSaveFlag = true;
  G.toast = 'Game saved.';
  G.toastT = 2;
  return data;
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasSave() {
  try {
    return window.localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function applySave(G, data) {
  const clampNum = (v, lo, hi, fallback) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, n));
  };
  G.missions.index = clampNum(data.mission, 0, 11, 0);
  G.missions.completedCount = clampNum(data.completed, 0, 12, 0);
  G.player.money = clampNum(data.money, 0, 999999, 0);
  G.player.hp = clampNum(data.hp, 1, 100, 100);
  G.clock.day = clampNum(data.day, 1, 3, 1);
  G.clock.hour = clampNum(data.hour, 0, 22, 8);
  G.clock.minute = clampNum(data.minute, 0, 59, 0);
  G.player.x = clampNum(data.x, 274, 3184, 534);
  G.player.y = clampNum(data.y, 16, 2384, 540);
  if (G.rep) G.rep.points = clampNum(data.rep, 0, 99999, 0);
  if (G.weapons) G.weapons.current = clampNum(data.weapon, 0, 3, 0);
  G.missions.step = 0;
  G.missions.dialog = null;
  if (G.dialogue) G.dialogue.active = null;
  prepareStepSafe(G);
  G.toast = 'Save loaded. Welcome back to Porto Verde.';
  G.toastT = 3;
}

function prepareStepSafe(G) {
  try {
    // Lazy import avoided: missions.prepareStep is wired by main.js through G.prepareStep.
    if (typeof G.prepareStep === 'function') G.prepareStep();
  } catch { /* a bad save never crashes the game */ }
}
