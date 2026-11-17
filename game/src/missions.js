// Twelve missions over three days in Porto Verde. Dario Cruz comes home, Mara Solis
// hands him the jobs, and Kessler's crew keeps getting in the way.
import { MISSION_REWARDS, ROADS_X, ROADS_Y } from './config.js';
import { dist } from './random.js';
import { collideBuildings, isOpenGround, nearestRoadPoint } from './world.js';
import { addWanted } from './wanted.js';
import { addRep } from './rep.js';
import { missionBonus } from './money-scale.js';
import { startMissionTimer } from './mission-timer.js';

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
  { day: 2, title: 'Sunset Run', giver: 'Lena Voss', brief: [
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
  ], steps: [{ type: 'collect', count: 3, label: 'Collect the three envelopes', pts: [[1500, 1300], [360, 1100], [2100, 800]] }] },
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
    { type: 'collect', count: 1, label: 'Take the vault keycard', pts: [[2500, 1190]] },
  ] },
  { day: 3, title: 'High Tide', giver: 'Lena Voss', brief: [
    'LENA: Kessler sent a courier with my contract — he wants me gone from the city.',
    'LENA: The courier is driving a white sedan down the Casino Strip right now.',
    'DARIO: Then I had better catch him before the tide does.',
  ], steps: [{ type: 'chase', x: 2100, y: 900, r: 200, label: 'Chase down the courier on the Casino Strip' }] },
  { day: 3, title: 'Family Business', giver: 'Mara Solis', brief: [
    "MARA: Kessler is sending his crew to burn my cafe tonight. My cafe, Dario.",
    'MARA: Hold the street until they give up. Nobody touches the Marina Cafe.',
    'DARIO: Nobody touches it. That is a promise.',
  ], steps: [{ type: 'defend', x: 500, y: 420, r: 170, seconds: 45, label: 'Defend the Marina Cafe for 45 seconds' }] },
  { day: 3, title: 'The Last Score', giver: 'Mara Solis', brief: [
    'MARA: Tonight we take the casino vault. The keycard, the crew, the plan — all ready.',
    'MARA: Grab the cash bags inside and get out before the alarms bring the whole city.',
    'DARIO: One last score. Then Porto Verde is ours again.',
  ], steps: [
    { type: 'collect', count: 3, label: 'Grab the three cash bags in the casino', pts: [[2500, 1100], [2500, 1400], [2100, 1250]] },
    { type: 'escape', x: 380, y: 1100, r: 100, label: 'Escape to the Sunset Pier' },
  ] },
  { day: 3, title: 'Three Days in the Sun', giver: 'Mara Solis', brief: [
    'MARA: The airstrip. One plane, one pilot who owes me a favour, and the whole city behind us.',
    'MARA: Drive, Dario. Do not stop for anything. Not for Kessler, not for the police, not for the sunset.',
    'DARIO: Three days in Porto Verde. I would not trade them for anything.',
  ], steps: [{ type: 'drive', x: 2750, y: 2005, r: 110, label: 'Drive to the Airstrip and fly out of Porto Verde' }] },
];

export function createMissions() {
  return {
    index: 0, step: 0, done: false, dialog: null, dialogT: 0,
    pickups: [], spawned: 0, killed: 0, timer: 0, chaseCar: null, layLow: 0, completedCount: 0,
  };
}

export function currentMission(G) {
  return MISSIONS[G.missions.index] || null;
}

export function currentStep(G) {
  const m = currentMission(G);
  return m ? m.steps[G.missions.step] || null : null;
}

export function openBriefing(G) {
  const m = currentMission(G);
  if (!m) return;
  G.missions.dialog = { lines: m.brief, line: 0, giver: m.giver, kind: 'briefing' };
  G.missions.dialogT = 0;
  if (G.dialogue) G.dialogue.active = { giver: m.giver, lines: m.brief, line: 0 };
}

export function advanceDialog(G) {
  const d = G.missions.dialog;
  if (!d) return;
  d.line += 1;
  if (G.dialogue) G.dialogue.active.line = d.line;
  if (d.line >= d.lines.length) {
    G.missions.dialog = null;
    if (G.dialogue) G.dialogue.active = null;
    prepareStep(G);
  }
}

function spawnThugOnOpenGround(G, cx, cy) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const angle = G.random() * Math.PI * 2;
    const d = 120 + G.random() * 120;
    let x = cx + Math.cos(angle) * d;
    let y = cy + Math.sin(angle) * d;
    const fixed = collideBuildings(G.city.buildings, x, y, 30);
    x = fixed.x;
    y = fixed.y;
    if (isOpenGround(G.city.buildings, x, y, 26)) return { x, y };
  }
  const road = nearestRoadPoint(cx, cy);
  return { x: road.x, y: road.y };
}

export function spawnThug(G, x, y) {
  const spot = spawnThugOnOpenGround(G, x, y);
  const thug = { x: spot.x, y: spot.y, hp: 60, angle: 0, speed: 150, shootT: 1 + G.random(), meleeT: 0, name: 'Kessler thug' };
  G.enemies.push(thug);
  return thug;
}

export function prepareStep(G) {
  const m = currentMission(G);
  const s = currentStep(G);
  if (!m || !s) return;
  const M = G.missions;
  M.pickups = [];
  M.killed = 0;
  M.timer = 0;
  M.layLow = 0;
  if (s.type === 'collect' && s.pts) {
    for (const pt of s.pts) M.pickups.push({ x: pt[0], y: pt[1], taken: false });
  } else if (s.type === 'fight') {
    for (let i = 0; i < (s.count || 2); i += 1) spawnThug(G, s.x, s.y);
    M.spawned = s.count || 2;
  } else if (s.type === 'defend') {
    for (let i = 0; i < 3; i += 1) spawnThug(G, s.x, s.y);
    M.timer = s.seconds || 45;
    startMissionTimer(G, 'DEFEND THE CAFE', s.seconds || 45);
  } else if (s.type === 'chase') {
    let car = null;
    for (const t of G.traffic) {
      if (!t.wrecked && t !== G.player.car) { car = t; break; }
    }
    if (car) {
      car.name = 'Courier Sedan';
      car.color = '#f4f1e8';
      car.topSpeed = 500;
      car.hp = 120;
      car.speed = 200;
      car.x = s.x;
      car.y = s.y;
      car.angle = Math.PI / 2;
      M.chaseCar = car;
    }
  } else if (s.type === 'escape') {
    if (G.missions.index === 6 && G.wanted.stars < 2) {
      G.wanted.stars = 2;
      G.wanted.heat = 60;
      if (G.audio) G.audio.setSiren(true);
    }
    if (G.missions.index === 10 && G.wanted.stars < 3) {
      G.wanted.stars = 3;
      G.wanted.heat = 80;
      if (G.audio) G.audio.setSiren(true);
    }
    if (G.missions.index === 10) startMissionTimer(G, 'ALARM', 0);
  }
  if (G.missions.index === 4 && s.type === 'drive') {
    startMissionTimer(G, 'SUNSET DEADLINE', 150);
  }
  if (G.missions.index === 11) {
    if (G.wanted.stars < 3) {
      G.wanted.stars = 3;
      G.wanted.heat = 80;
    }
  }
}

export function completeMission(G) {
  const M = G.missions;
  const idx = M.index;
  const reward = MISSION_REWARDS[idx] !== undefined ? MISSION_REWARDS[idx] : 500;
  const bonus = missionBonus(G, idx);
  G.player.money += reward + bonus;
  M.completedCount += 1;
  addRep(G, 150, 'mission complete');
  const m = MISSIONS[idx];
  G.toast = `Mission complete: ${m.title} — $${reward.toLocaleString('en-US')}${bonus ? ` + $${bonus} bonus` : ''}`;
  G.toastT = 4;
  if (G.audio) G.audio.fanfare();
  if (G.dialogue) {
    G.dialogue.active = {
      giver: m.giver,
      lines: [`${m.giver.split(' ')[0].toUpperCase()}: Beautiful work, Dario. That is how Porto Verde remembers you.`],
      line: 0,
    };
    G.missions.dialog = { lines: G.dialogue.active.lines, line: 0, giver: m.giver, kind: 'praise' };
  }
  M.index += 1;
  M.step = 0;
  M.pickups = [];
  M.chaseCar = null;
  if (G.missionTimer) { G.missionTimer.active = false; G.missionTimer.seconds = 0; }
  if (M.index >= MISSIONS.length) {
    M.done = true;
    G.gameWon = true;
    return;
  }
  const next = MISSIONS[M.index];
  if (next.day !== m.day) {
    G.clock.day = next.day;
    G.clock.hour = 8;
    G.clock.minute = 0;
    G.dayBanner = `DAY ${next.day}`;
    G.dayBannerT = 4;
  }
  openBriefing(G);
}

export function updateMissions(G, dt) {
  const M = G.missions;
  if (M.done || M.dialog) return;
  const m = currentMission(G);
  const s = currentStep(G);
  if (!m || !s) return;
  const p = G.player;
  let done = false;
  if (s.type === 'goto' || s.type === 'drive') {
    if (dist(p.x, p.y, s.x, s.y) < s.r) done = true;
  } else if (s.type === 'collect') {
    for (const pk of M.pickups) {
      if (!pk.taken && dist(p.x, p.y, pk.x, pk.y) < 30) {
        pk.taken = true;
        if (G.audio) G.audio.coin();
      }
    }
    if (M.pickups.length > 0 && M.pickups.every((pk) => pk.taken)) done = true;
  } else if (s.type === 'fight') {
    if (M.killed >= (s.count || 2)) done = true;
  } else if (s.type === 'chase') {
    const car = M.chaseCar;
    if (car) {
      if (car.hp <= 0) done = true;
      else if (dist(p.x, p.y, car.x, car.y) < 60) {
        M.timer += dt;
        if (M.timer > 1) done = true;
      } else {
        M.timer = 0;
      }
      // The courier flees along the strip.
      if (!done) {
        car.speed = Math.min(car.topSpeed, car.speed + 120 * dt);
        car.x += Math.cos(car.angle) * car.speed * dt;
        car.y += Math.sin(car.angle) * car.speed * dt;
        if (car.y > 2300) car.angle = -Math.PI / 2;
        if (car.y < 100) car.angle = Math.PI / 2;
      }
    } else done = true;
  } else if (s.type === 'escape') {
    if (dist(p.x, p.y, s.x, s.y) < s.r) {
      if (G.wanted.stars === 0) done = true;
      else M.layLow += dt;
    }
  } else if (s.type === 'defend') {
    if (dist(p.x, p.y, s.x, s.y) < s.r) {
      M.timer -= dt;
      if (G.missionTimer) G.missionTimer.seconds = Math.max(0, M.timer);
      if (M.timer <= 0) done = true;
      else if (G.random() < dt * 0.12 && G.enemies.length < 6) spawnThug(G, s.x, s.y);
    }
  }
  if (done) {
    M.step += 1;
    M.timer = 0;
    M.layLow = 0;
    if (M.step >= m.steps.length) completeMission(G);
    else prepareStep(G);
  }
}

export function missionObjective(G) {
  const s = currentStep(G);
  if (!s) return null;
  return { x: s.x, y: s.y, label: s.label, type: s.type };
}
