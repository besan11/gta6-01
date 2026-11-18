// Porto Verde v6 — twelve missions over three days in the sun. Dario comes home,
// Mara hands him work, Kessler's crew pushes back, and the last night ends in
// the Casino Verde vault. Mission 12 is the heist: clear the guards, take the
// bags, and fly out of Porto Verde before the whole city arrives.
import { MISSION_REWARDS, ROADS_X, ROADS_Y } from './config.js';
import { dist } from './random.js';
import { collideBuildings, isOpenGround } from './world.js';
import { addWanted } from './wanted.js';
import { openDialogue } from './dialogue.js';
import { addRep } from './rep.js';

export const MISSIONS = [
  { day: 1, title: 'Welcome Home', giver: 'Mara Solis', brief: [
    'MARA: Dario! Three years away and you walk in like the tide owes you money.',
    'DARIO: The tide owes me nothing. You do, though — a job, remember?',
    'MARA: One job. Then we talk about the old days. Meet me at the Marina Cafe.',
  ], steps: [{ type: 'goto', x: 500, y: 420, r: 70, label: 'Meet Mara at the Marina Cafe' }] },
  { day: 1, title: 'Cold Cargo', giver: 'Mara Solis', brief: [
    'MARA: A refrigerated van is waiting at the pier. It has to reach the harbor warehouse before noon.',
    'MARA: Drive it like your mother is in the back. No police, no scratches.',
    'DARIO: Mothers, police, scratches. Got it.',
  ], steps: [{ type: 'drive', x: 640, y: 1900, r: 90, label: 'Drive the van to the Harbor Warehouse' }] },
  { day: 1, title: 'The Green Van', giver: 'Tito Ramos', brief: [
    'TITO: Mara needs a van, and the city has plenty. Borrow one. Permanently.',
    'TITO: There is a green Marina Van parked by the plaza. Bring it to my garage.',
    'DARIO: Borrow. Right. I love this city already.',
  ], steps: [
    { type: 'goto', x: 1500, y: 1300, r: 120, label: 'Find the green Marina Van at Central Plaza' },
    { type: 'drive', x: 1700, y: 880, r: 90, label: 'Deliver the van to Verde Garage' },
  ] },
  { day: 1, title: 'First Blood', giver: 'Mara Solis', brief: [
    'MARA: The dock crew that works for Kessler is shaking down my bar tonight.',
    'MARA: Go to the Dockside Bar and remind them whose street that is.',
    'DARIO: Fists or louder? ... Fists first. Louder if they insist.',
  ], steps: [{ type: 'fight', x: 900, y: 1680, r: 160, count: 3, label: 'Deal with the dock thugs at the Dockside Bar' }] },
  { day: 2, title: 'Sunset Run', giver: 'Lena Voss', timer: 150, brief: [
    'LENA: I am a singer, darling, and my taxi never showed. Drive me to the Mirador Viewpoint.',
    'LENA: The show starts at sunset. If I am late, the whole city hears about it.',
    'DARIO: Then we had better not be late.',
  ], steps: [
    { type: 'goto', x: 1300, y: 950, r: 80, label: 'Pick up Lena at City Hall' },
    { type: 'drive', x: 2900, y: 420, r: 90, label: 'Drive Lena to the Mirador Viewpoint' },
  ] },
  { day: 2, title: 'Paper Trail', giver: 'Mara Solis', brief: [
    'MARA: Three envelopes. Three corners of the city. Nobody opens them, nobody follows you.',
    'MARA: Plaza, pier, casino strip. In that order, if you can manage it.',
    'DARIO: Envelopes. My favourite kind of treasure hunt.',
  ], steps: [{ type: 'collect', count: 3, label: 'Collect the three envelopes', pts: [{ x: 1500, y: 1300 }, { x: 360, y: 1100 }, { x: 2100, y: 800 }] }] },
  { day: 2, title: 'Hot Pursuit', giver: 'Tito Ramos', brief: [
    'TITO: The job went loud, Dario. The police are coming, and you are holding the bag.',
    'TITO: Lose them. Get to the garage and stay out of sight until the heat dies.',
    'DARIO: Losing police. That is practically my middle name.',
  ], steps: [{ type: 'escape', x: 1700, y: 880, r: 100, label: 'Escape the police and reach Verde Garage' }] },
  { day: 2, title: 'The Vault Key', giver: 'Mara Solis', brief: [
    'MARA: Kessler keeps the casino vault key in his office above the strip.',
    'MARA: His guards are not friendly. Take the keycard and walk out like you own the place.',
    'DARIO: I do own the place. As of tonight, anyway.',
  ], steps: [
    { type: 'fight', x: 2500, y: 1250, r: 170, count: 2, label: 'Get past the casino guards' },
    { type: 'collect', count: 1, label: 'Take the vault keycard', pts: [{ x: 2500, y: 1190 }] },
  ] },
  { day: 3, title: 'High Tide', giver: 'Lena Voss', brief: [
    'LENA: Kessler sent a courier with my contract — he wants me gone from the city.',
    'LENA: The courier is driving a white sedan down the Casino Strip right now.',
    'DARIO: Then I had better catch him before the tide does.',
  ], steps: [{ type: 'chase', x: 2100, y: 900, r: 200, label: 'Chase down the courier on the Casino Strip' }] },
  { day: 3, title: 'Family Business', giver: 'Mara Solis', brief: [
    'MARA: Kessler is sending his crew to burn my cafe tonight. My cafe, Dario.',
    'MARA: Hold the street until they give up. Nobody touches the Marina Cafe.',
    'DARIO: Nobody touches it. That is a promise.',
  ], steps: [{ type: 'defend', x: 500, y: 420, r: 170, seconds: 45, label: 'Defend the Marina Cafe for 45 seconds' }] },
  { day: 3, title: 'The Last Score', giver: 'Mara Solis', brief: [
    'MARA: Tonight we take the casino vault. The keycard, the crew, the plan — all ready.',
    'MARA: Grab the cash bags inside and get out before the alarms bring the whole city.',
    'DARIO: One last score. Then Porto Verde is ours again.',
  ], steps: [
    { type: 'collect', count: 3, label: 'Grab the three cash bags in the casino', pts: [{ x: 2500, y: 1100 }, { x: 2500, y: 1400 }, { x: 2100, y: 1250 }] },
    { type: 'escape', x: 380, y: 1100, r: 100, label: 'Escape to the Sunset Pier' },
  ] },
  { day: 3, title: 'The Casino Vault', giver: 'Mara Solis', brief: [
    'MARA: The vault, Dario. Kessler keeps everything he stole from this city behind one steel door.',
    'MARA: His guards will not step aside. The bags are inside — take them all, and do not stop running.',
    'DARIO: Three days in Porto Verde. I would not trade them for anything.',
  ], steps: [
    { type: 'fight', x: 2500, y: 1250, r: 170, count: 3, label: 'Clear the vault guards on the casino floor' },
    { type: 'collect', count: 3, label: 'Take the three vault bags', pts: [{ x: 2440, y: 1120 }, { x: 2500, y: 1160 }, { x: 2560, y: 1120 }] },
    { type: 'drive', x: 2750, y: 2005, r: 110, label: 'Escape to the Airstrip and fly out of Porto Verde' },
  ] },
];

export function createMissions() {
  return {
    index: 0, step: 0, done: false, dialog: null, dialogT: 0,
    pickups: [], spawned: 0, killed: 0, timer: 0, chaseCar: null,
    layLow: 0, completedCount: 0, chaseHoldT: 0, defendLeft: 0, missionT: 0,
  };
}

export function currentMission(G) {
  return MISSIONS[G.missions.index] || null;
}

export function currentStep(G) {
  const m = currentMission(G);
  return m ? m.steps[G.missions.step] : null;
}

export function openBriefing(G) {
  const m = currentMission(G);
  if (!m) return;
  openDialogue(G, m.giver, m.brief);
  G.missions.dialog = { lines: m.brief, line: 0 };
  if (m.timer) {
    G.missionTimer.remaining = m.timer;
    G.missionTimer.label = 'SUNSET';
    G.missionTimer.active = true;
  }
  if (G.missions.index === 11 && G.wanted.stars < 3) {
    G.wanted.stars = 3;
    G.wanted.heat = 80;
    if (G.audio) G.audio.setSiren(true);
  }
}

export function advanceDialog(G) {
  const m = G.missions;
  if (!m.dialog) return;
  m.dialog.line += 1;
  if (m.dialog.line >= m.dialog.lines.length) m.dialog = null;
}

function spawnThugAt(G, cx, cy) {
  let x = cx;
  let y = cy;
  for (let tries = 0; tries < 8; tries += 1) {
    const a = G.random() * Math.PI * 2;
    const d = 120 + G.random() * 120;
    let tx = cx + Math.cos(a) * d;
    let ty = cy + Math.sin(a) * d;
    const fixed = collideBuildings(G.city.buildings, tx, ty, 26);
    tx = fixed.x; ty = fixed.y;
    if (isOpenGround(G.city.buildings, tx, ty, 26)) { x = tx; y = ty; break; }
    if (tries === 7) {
      let bestX = ROADS_X[0];
      let bestD = 1e9;
      for (const rx of ROADS_X) { const dd = Math.abs(rx - cx); if (dd < bestD) { bestD = dd; bestX = rx; } }
      let bestY = ROADS_Y[0];
      bestD = 1e9;
      for (const ry of ROADS_Y) { const dd = Math.abs(ry - cy); if (dd < bestD) { bestD = dd; bestY = ry; } }
      x = bestX; y = bestY;
    }
  }
  const thug = {
    x, y, hp: 60, angle: 0, speed: 150,
    shootT: 1 + G.random() * 1.5, meleeT: 0, name: 'Kessler thug',
  };
  G.enemies.push(thug);
  return thug;
}

export function prepareStep(G) {
  const m = G.missions;
  const step = currentStep(G);
  if (!step) return;
  m.pickups = [];
  m.killed = 0;
  m.chaseHoldT = 0;
  m.layLow = 0;
  if (step.type === 'collect') {
    for (const pt of step.pts || []) m.pickups.push({ x: pt.x, y: pt.y, taken: false });
  } else if (step.type === 'fight') {
    for (let i = 0; i < (step.count || 1); i += 1) spawnThugAt(G, step.x, step.y);
    m.spawned = step.count || 1;
  } else if (step.type === 'defend') {
    m.defendLeft = step.seconds || 45;
    for (let i = 0; i < 3; i += 1) spawnThugAt(G, step.x, step.y);
    m.spawned = 3;
    G.missionTimer.remaining = step.seconds || 45;
    G.missionTimer.label = 'DEFEND';
    G.missionTimer.active = true;
  } else if (step.type === 'chase') {
    let car = null;
    for (const t of G.traffic) {
      if (!t.wrecked) { car = t; break; }
    }
    if (car) {
      car.name = 'Courier Sedan';
      car.model = { name: 'Courier Sedan', color: '#f4f1e8', top: 500, accel: 450 };
      car.hp = 120;
      car.x = step.x; car.y = step.y;
      car.speed = 200;
      m.chaseCar = car;
    }
  } else if (step.type === 'escape') {
    const need = G.missions.index === 10 ? 3 : 2;
    if (G.wanted.stars < need) {
      G.wanted.stars = need;
      G.wanted.heat = need === 3 ? 80 : 60;
      if (G.audio) G.audio.setSiren(true);
    }
    G.missionTimer.label = 'ALARM';
    G.missionTimer.active = true;
    G.missionTimer.remaining = 0;
  }
}

function stepDone(G, step, dt) {
  const m = G.missions;
  const p = G.player;
  const d = dist(p.x, p.y, step.x, step.y);
  if (step.type === 'goto' || step.type === 'drive') return d < step.r;
  if (step.type === 'collect') {
    for (const pk of m.pickups) {
      if (!pk.taken && dist(p.x, p.y, pk.x, pk.y) < 30) pk.taken = true;
    }
    return m.pickups.length > 0 && m.pickups.every((pk) => pk.taken);
  }
  if (step.type === 'fight') return m.killed >= (step.count || 1);
  if (step.type === 'chase') {
    const c = m.chaseCar;
    if (!c) return false;
    if (c.wrecked || c.hp <= 0) return true;
    if (dist(p.x, p.y, c.x, c.y) < 60) {
      m.chaseHoldT += dt;
      return m.chaseHoldT > 1;
    }
    m.chaseHoldT = 0;
    return false;
  }
  if (step.type === 'escape') {
    if (d < step.r && G.wanted.stars === 0) return true;
    if (d < step.r && G.wanted.stars > 0) m.layLow += dt;
    return false;
  }
  if (step.type === 'defend') {
    if (d < step.r) {
      m.defendLeft -= dt;
      if (m.defendLeft <= 0) return true;
      if (G.enemies.length < 3 && G.random() < dt * 0.5) spawnThugAt(G, step.x, step.y);
    }
    return false;
  }
  return false;
}

export function completeMission(G) {
  const m = G.missions;
  const idx = m.index;
  const reward = MISSION_REWARDS[idx] || 500;
  let bonus = 0;
  if (G.wanted.stars === 0) bonus += 100;
  const mission = MISSIONS[idx];
  if (mission.timer && G.missionTimer.remaining > 30) bonus += 200;
  G.player.money += reward + bonus;
  m.completedCount += 1;
  addRep(G, 150, 'mission');
  if (G.weapons) G.weapons.checkUnlocks(G);
  G.toast = 'MISSION COMPLETE — ' + mission.title + '  +$' + (reward + bonus);
  G.toastT = 4;
  if (G.audio) G.audio.fanfare();
  if (G.dialogue) G.dialogue.contextLine(G, 'praise');
  G.missionTimer.active = false;
  m.index += 1;
  m.step = 0;
  if (m.index >= MISSIONS.length) {
    m.done = true;
    G.gameWon = true;
    return;
  }
  const next = MISSIONS[m.index];
  G.clock.day = next.day;
  openBriefing(G);
  prepareStep(G);
}

export function updateMissions(G, dt) {
  const m = G.missions;
  if (m.done || !currentMission(G)) return;
  m.missionT += dt;
  const step = currentStep(G);
  if (!step) return;
  const mission = currentMission(G);
  if (mission.timer && G.missionTimer.active) {
    G.missionTimer.remaining -= dt;
    if (G.missionTimer.remaining <= 0) {
      G.missionTimer.remaining = 0;
      G.missionTimer.active = false;
      m.step = 0;
      m.missionT = 0;
      G.toast = 'Too late — the show started without Lena. Try again.';
      G.toastT = 4;
      prepareStep(G);
      return;
    }
  }
  if (step.type === 'escape' && G.missionTimer.active) {
    G.missionTimer.remaining += dt;
  }
  if (stepDone(G, step, dt)) {
    m.step += 1;
    if (m.step >= mission.steps.length) completeMission(G);
    else prepareStep(G);
  }
}
