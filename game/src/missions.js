// The campaign: 12 missions over 3 days in Porto Verde. Dario Cruz is back
// after three years away; Mara Solis has the jobs, Kessler has the city.
import { MISSION_REWARDS, ROADS_X, ROADS_Y } from './config.js';
import { dist } from './random.js';
import { collideBuildings, isOpenGround } from './world.js';
import { addWanted } from './wanted.js';
import { missionBonus } from './money-scale.js';
import { startMissionTimer, stopMissionTimer } from './mission-timer.js';
import { fanfare } from './audio.js';

export const MISSIONS = [
  { day: 1, title: 'Welcome Home', giver: 'MARA', brief: [
    'MARA: Dario! Three years away and you walk in like the tide owes you money.',
    'DARIO: The tide owes me nothing. You do, though — a job, remember?',
    'MARA: One job. Then we talk about the old days. Meet me at the Marina Cafe.',
  ], steps: [
    { type: 'goto', x: 500, y: 420, r: 70, label: 'Meet Mara at the Marina Cafe' },
  ] },
  { day: 1, title: 'Cold Cargo', giver: 'MARA', brief: [
    'MARA: A refrigerated van is waiting at the pier. It has to reach the harbor warehouse before noon.',
    'MARA: Drive it like your mother is in the back. No police, no scratches.',
    'DARIO: Mothers, police, scratches. Got it.',
  ], steps: [
    { type: 'drive', x: 640, y: 1900, r: 90, label: 'Drive the van to the Harbor Warehouse' },
  ] },
  { day: 1, title: 'The Green Van', giver: 'TITO', brief: [
    'TITO: Mara needs a van, and the city has plenty. Borrow one. Permanently.',
    'TITO: There is a green Marina Van parked by the plaza. Bring it to my garage.',
    'DARIO: Borrow. Right. I love this city already.',
  ], steps: [
    { type: 'goto', x: 1500, y: 1300, r: 120, label: 'Find the green Marina Van at Central Plaza' },
    { type: 'drive', x: 1700, y: 880, r: 90, label: 'Deliver the van to Verde Garage' },
  ] },
  { day: 1, title: 'First Blood', giver: 'MARA', brief: [
    'MARA: The dock crew that works for Kessler is shaking down my bar tonight.',
    'MARA: Go to the Dockside Bar and remind them whose street that is.',
    'DARIO: Fists or louder? ... Fists first. Louder if they insist.',
  ], steps: [
    { type: 'fight', x: 900, y: 1680, r: 160, count: 3, label: 'Deal with the dock thugs at the Dockside Bar' },
  ] },
  { day: 2, title: 'Sunset Run', giver: 'LENA', brief: [
    'LENA: I am a singer, darling, and my taxi never showed. Drive me to the Mirador Viewpoint.',
    'LENA: The show starts at sunset. If I am late, the whole city hears about it.',
    'DARIO: Then we had better not be late.',
  ], steps: [
    { type: 'goto', x: 1300, y: 950, r: 80, label: 'Pick up Lena at City Hall' },
    { type: 'drive', x: 2900, y: 420, r: 90, label: 'Drive Lena to the Mirador Viewpoint' },
  ] },
  { day: 2, title: 'Paper Trail', giver: 'MARA', brief: [
    'MARA: Three envelopes. Three corners of the city. Nobody opens them, nobody follows you.',
    'MARA: Plaza, pier, casino strip. In that order, if you can manage it.',
    'DARIO: Envelopes. My favourite kind of treasure hunt.',
  ], steps: [
    { type: 'collect', count: 3, pts: [[1500, 1300], [360, 1100], [2100, 800]], label: 'Collect the three envelopes' },
  ] },
  { day: 2, title: 'Hot Pursuit', giver: 'TITO', brief: [
    'TITO: The job went loud, Dario. The police are coming, and you are holding the bag.',
    'TITO: Lose them. Get to the garage and stay out of sight until the heat dies.',
    'DARIO: Losing police. That is practically my middle name.',
  ], steps: [
    { type: 'escape', x: 1700, y: 880, r: 100, label: 'Escape the police and reach Verde Garage' },
  ] },
  { day: 2, title: 'The Vault Key', giver: 'MARA', brief: [
    'MARA: Kessler keeps the casino vault key in his office above the strip.',
    'MARA: His guards are not friendly. Take the keycard and walk out like you own the place.',
    'DARIO: I do own the place. As of tonight, anyway.',
  ], steps: [
    { type: 'fight', x: 2500, y: 1250, r: 170, count: 2, label: 'Get past the casino guards' },
    { type: 'collect', count: 1, pts: [[2500, 1190]], label: 'Take the vault keycard' },
  ] },
  { day: 3, title: 'High Tide', giver: 'LENA', brief: [
    'LENA: Kessler sent a courier with my contract — he wants me gone from the city.',
    'LENA: The courier is driving a white sedan down the Casino Strip right now.',
    'DARIO: Then I had better catch him before the tide does.',
  ], steps: [
    { type: 'chase', x: 2100, y: 900, r: 200, label: 'Chase down the courier on the Casino Strip' },
  ] },
  { day: 3, title: 'Family Business', giver: 'MARA', brief: [
    'MARA: Kessler is sending his crew to burn my cafe tonight. My cafe, Dario.',
    'MARA: Hold the street until they give up. Nobody touches the Marina Cafe.',
    'DARIO: Nobody touches it. That is a promise.',
  ], steps: [
    { type: 'defend', x: 500, y: 420, r: 170, seconds: 45, label: 'Defend the Marina Cafe for 45 seconds' },
  ] },
  { day: 3, title: 'The Last Score', giver: 'MARA', brief: [
    'MARA: Tonight we take the casino vault. The keycard, the crew, the plan — all ready.',
    'MARA: Grab the cash bags inside and get out before the alarms bring the whole city.',
    'DARIO: One last score. Then Porto Verde is ours again.',
  ], steps: [
    { type: 'collect', count: 3, pts: [[2500, 1100], [2500, 1400], [2100, 1250]], label: 'Grab the three cash bags in the casino' },
    { type: 'escape', x: 380, y: 1100, r: 100, label: 'Escape to the Sunset Pier' },
  ] },
  { day: 3, title: 'Three Days in the Sun', giver: 'MARA', brief: [
    'MARA: The airstrip. One plane, one pilot who owes me a favour, and the whole city behind us.',
    'MARA: Drive, Dario. Do not stop for anything. Not for Kessler, not for the police, not for the sunset.',
    'DARIO: Three days in Porto Verde. I would not trade them for anything.',
  ], steps: [
    { type: 'drive', x: 2750, y: 2005, r: 110, label: 'Drive to the Airstrip and fly out of Porto Verde' },
  ] },
];

export function createMissions() {
  return {
    index: 0, step: 0, done: false,
    dialog: null, dialogT: 0,
    pickups: [], spawned: 0, killed: 0,
    timer: 0, chaseCar: null, layLow: 0,
    completedCount: 0, chaseT: 0,
  };
}

export function currentMission(G) { return MISSIONS[G.missions.index] || null; }
export function currentStep(G) {
  const m = currentMission(G);
  return m ? m.steps[G.missions.step] : null;
}

export function openBriefing(G) {
  const m = currentMission(G);
  if (!m) return;
  G.missions.dialog = { lines: m.brief, line: 0, giver: m.giver };
  G.missions.dialogT = 0;
  G.dialogue = { who: m.giver, lines: m.brief, line: 0 };
}

export function advanceDialog(G) {
  const d = G.missions.dialog;
  if (!d) return;
  d.line++;
  if (G.dialogue) G.dialogue.line = d.line;
  if (d.line >= d.lines.length) {
    G.missions.dialog = null;
    G.dialogue = null;
    prepareStep(G);
  }
}

// Thugs always spawn on open ground: try a ring around the point, shove out
// of buildings, verify open ground, fall back to the nearest road.
export function spawnThug(G, x, y) {
  let px = x;
  let py = y;
  for (let i = 0; i < 8; i++) {
    const a = G.random() * Math.PI * 2;
    const d = 120 + G.random() * 120;
    let cx = x + Math.cos(a) * d;
    let cy = y + Math.sin(a) * d;
    const fixed = collideBuildings(G.city.buildings, cx, cy, 26);
    cx = fixed.x;
    cy = fixed.y;
    if (isOpenGround(G.city.buildings, cx, cy, 26)) { px = cx; py = cy; break; }
    px = cx; py = cy;
  }
  if (!isOpenGround(G.city.buildings, px, py, 26)) {
    let bestX = ROADS_X[0];
    let bestD = 1e9;
    for (const r of ROADS_X) { const d = Math.abs(r - x); if (d < bestD) { bestD = d; bestX = r; } }
    let bestY = ROADS_Y[0];
    bestD = 1e9;
    for (const r of ROADS_Y) { const d = Math.abs(r - y); if (d < bestD) { bestD = d; bestY = r; } }
    if (Math.abs(bestX - x) < Math.abs(bestY - y)) { px = bestX; py = y; }
    else { px = x; py = bestY; }
  }
  const thug = { x: px, y: py, hp: 60, angle: 0, speed: 150, shootT: 1 + G.random(), meleeT: 0, name: 'Kessler thug' };
  G.enemies.push(thug);
  return thug;
}

export function prepareStep(G) {
  const m = currentMission(G);
  if (!m) return;
  const s = currentStep(G);
  if (!s) return;
  const M = G.missions;
  M.pickups = [];
  M.killed = 0;
  M.timer = 0;
  M.chaseT = 0;
  M.layLow = 0;
  if (s.type === 'collect') {
    for (const pt of s.pts) M.pickups.push({ x: pt[0], y: pt[1], taken: false });
  } else if (s.type === 'fight') {
    M.spawned = 0;
    for (let i = 0; i < s.count; i++) { spawnThug(G, s.x, s.y); M.spawned++; }
  } else if (s.type === 'defend') {
    for (let i = 0; i < 3; i++) spawnThug(G, s.x, s.y);
    M.timer = s.seconds;
    startMissionTimer(G, 'HOLD THE STREET', s.seconds, false);
  } else if (s.type === 'chase') {
    let best = null;
    for (const car of G.traffic) { if (!car.wrecked) { best = car; break; } }
    if (best) {
      const idx = G.traffic.indexOf(best);
      if (idx !== -1) G.traffic.splice(idx, 1);
      best.model = { name: 'Courier Sedan', color: '#f4f1e8', top: 500 };
      best.hp = 120;
      best.speed = 200;
      best.x = s.x;
      best.y = s.y;
      best.angle = 0;
      M.chaseCar = best;
      G.cars.push(best);
    }
  } else if (s.type === 'escape') {
    if (G.missions.index === 6) {
      if (G.wanted.stars < 2) addWanted(G, 2 - G.wanted.stars, 'the job went loud');
      G.wanted.heat = Math.max(G.wanted.heat, 60);
    }
    if (G.missions.index === 10) {
      if (G.wanted.stars < 3) addWanted(G, 3 - G.wanted.stars, 'the vault alarm');
      G.wanted.heat = Math.max(G.wanted.heat, 80);
    }
  }
  if (G.missions.index === 4 && G.missions.step === 0) {
    // Mission 5: get Lena to the viewpoint before sunset — 150 seconds.
    startMissionTimer(G, 'SUNSET DEADLINE', 150, false);
  }
  if (G.missions.index === 11) {
    if (G.wanted.stars < 3) addWanted(G, 3 - G.wanted.stars, 'the whole city is behind you');
  }
}

function stepDone(G) {
  const M = G.missions;
  const m = currentMission(G);
  if (!m) return;
  M.step++;
  G.missions.timerLeft = G.missionTimer ? G.missionTimer.seconds : 0;
  stopMissionTimer(G);
  if (M.step >= m.steps.length) completeMission(G);
  else prepareStep(G);
}

export function completeMission(G) {
  const M = G.missions;
  const idx = M.index;
  const reward = MISSION_REWARDS[idx] !== undefined ? MISSION_REWARDS[idx] : 500;
  const bonus = missionBonus(G);
  const total = reward + bonus;
  G.player.money += total;
  M.completedCount++;
  if (G.rep) G.rep.points += 150;
  if (G.audio) fanfare(G.audio);
  G.toast = `Mission complete: ${MISSIONS[idx].title}  +$${total}`;
  G.toastT = 4;
  const giver = MISSIONS[idx].giver;
  G.dialogue = { who: giver, lines: [`${giver}: Clean work, Dario. Porto Verde is starting to remember your name.`], line: 0, sticky: 3 };
  M.index++;
  M.step = 0;
  M.chaseCar = null;
  if (M.index >= MISSIONS.length) {
    M.done = true;
    G.gameWon = true;
    return;
  }
  openBriefing(G);
}

export function updateMissions(G, dt) {
  const M = G.missions;
  if (M.done || G.gameWon) return;
  if (M.dialog) return;
  const m = currentMission(G);
  const s = currentStep(G);
  if (!m || !s) return;
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  if (s.type === 'goto' || s.type === 'drive') {
    if (dist(px, py, s.x, s.y) < s.r) stepDone(G);
  } else if (s.type === 'collect') {
    for (const pk of M.pickups) {
      if (!pk.taken && dist(px, py, pk.x, pk.y) < 30) pk.taken = true;
    }
    if (M.pickups.length > 0 && M.pickups.every((pk) => pk.taken)) stepDone(G);
  } else if (s.type === 'fight') {
    if (M.killed >= s.count) stepDone(G);
  } else if (s.type === 'chase') {
    const c = M.chaseCar;
    if (!c) { stepDone(G); return; }
    if (c.hp <= 0) { stepDone(G); return; }
    if (dist(px, py, c.x, c.y) < 60) {
      M.chaseT += dt;
      if (M.chaseT > 1) stepDone(G);
    } else M.chaseT = 0;
    // The courier keeps running down the strip.
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    if (c.x > 3100) { c.angle = Math.PI; }
    if (c.x < 400) { c.angle = 0; }
  } else if (s.type === 'escape') {
    if (dist(px, py, s.x, s.y) < s.r) {
      if (G.wanted.stars === 0) stepDone(G);
      else {
        M.layLow += dt;
        G.toast = 'Lay low — lose the heat before you stop here.';
        G.toastT = 1.5;
      }
    }
  } else if (s.type === 'defend') {
    if (dist(px, py, s.x, s.y) < s.r) {
      M.timer -= dt;
      if (M.timer <= 0) stepDone(G);
    }
    // Waves keep coming while the timer runs.
    if (G.enemies.length < 3 && M.timer > 0 && G.random() < dt * 0.5) spawnThug(G, s.x, s.y);
  }
  // Mission 5 sunset deadline: fail restarts the mission from step 0.
  if (G.missions.index === 4 && G.missionTimer && G.missionTimer.active && G.missionTimer.seconds <= 0) {
    G.toast = 'Too late — Lena missed the show. Try the run again.';
    G.toastT = 4;
    M.step = 0;
    M.timer = 0;
    openBriefing(G);
  }
}
