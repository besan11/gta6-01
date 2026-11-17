// missions.js — Twelve jobs across three days in Porto Verde, from Mara's
// welcome at the Marina Cafe to the plane out on the airstrip. Each mission
// carries its briefing dialogue and its steps; the engine below walks them:
// briefing first, then one step at a time, then the reward and the next job.
// Thugs always spawn on open streets — never inside a building, never on a
// roof — by trying open ground first and falling back to the nearest road.
import { MISSION_REWARDS, MISSION_TIMERS, ROADS_X, ROADS_Y } from './config.js';
import { dist } from './random.js';
import { collideBuildings, isOpenGround } from './world.js';
import { openDialogue, advanceDialogue } from './dialogue.js';
import { addRep } from './rep.js';
import { unlockWeaponsFor } from './weapons.js';
import { missionBonus } from './money-scale.js';
import { REP_PER_MISSION, REP_PER_ESCAPE } from './config.js';

export const MISSIONS = [
  {
    day: 1, title: 'Welcome Home', giver: 'Mara Solis',
    brief: [
      'MARA: Dario! Three years away and you walk in like the tide owes you money.',
      'DARIO: The tide owes me nothing. You do, though — a job, remember?',
      'MARA: One job. Then we talk about the old days. Meet me at the Marina Cafe.',
    ],
    steps: [{ type: 'goto', x: 500, y: 420, r: 70, label: 'Meet Mara at the Marina Cafe' }],
  },
  {
    day: 1, title: 'Cold Cargo', giver: 'Mara Solis',
    brief: [
      'MARA: A refrigerated van is waiting at the pier. It has to reach the harbor warehouse before noon.',
      'MARA: Drive it like your mother is in the back. No police, no scratches.',
      'DARIO: Mothers, police, scratches. Got it.',
    ],
    steps: [{ type: 'drive', x: 640, y: 1900, r: 90, label: 'Drive the van to the Harbor Warehouse' }],
  },
  {
    day: 1, title: 'The Green Van', giver: 'Tito Ramos',
    brief: [
      'TITO: Mara needs a van, and the city has plenty. Borrow one. Permanently.',
      'TITO: There is a green Marina Van parked by the plaza. Bring it to my garage.',
      'DARIO: Borrow. Right. I love this city already.',
    ],
    steps: [
      { type: 'goto', x: 1500, y: 1300, r: 120, label: 'Find the green Marina Van at Central Plaza' },
      { type: 'drive', x: 1700, y: 880, r: 90, label: 'Deliver the van to Verde Garage' },
    ],
  },
  {
    day: 1, title: 'First Blood', giver: 'Mara Solis',
    brief: [
      'MARA: The dock crew that works for Kessler is shaking down my bar tonight.',
      'MARA: Go to the Dockside Bar and remind them whose street that is.',
      'DARIO: Fists or louder? ... Fists first. Louder if they insist.',
    ],
    steps: [{ type: 'fight', x: 900, y: 1680, r: 160, count: 3, label: 'Deal with the dock thugs at the Dockside Bar' }],
  },
  {
    day: 2, title: 'Sunset Run', giver: 'Lena Voss',
    brief: [
      'LENA: I am a singer, darling, and my taxi never showed. Drive me to the Mirador Viewpoint.',
      'LENA: The show starts at sunset. If I am late, the whole city hears about it.',
      'DARIO: Then we had better not be late.',
    ],
    steps: [
      { type: 'goto', x: 1300, y: 950, r: 80, label: 'Pick up Lena at City Hall' },
      { type: 'drive', x: 2900, y: 420, r: 90, label: 'Drive Lena to the Mirador Viewpoint' },
    ],
  },
  {
    day: 2, title: 'Paper Trail', giver: 'Mara Solis',
    brief: [
      'MARA: Three envelopes. Three corners of the city. Nobody opens them, nobody follows you.',
      'MARA: Plaza, pier, casino strip. In that order, if you can manage it.',
      'DARIO: Envelopes. My favourite kind of treasure hunt.',
    ],
    steps: [{
      type: 'collect', count: 3, label: 'Collect the three envelopes',
      pts: [{ x: 1500, y: 1300 }, { x: 360, y: 1100 }, { x: 2100, y: 800 }],
    }],
  },
  {
    day: 2, title: 'Hot Pursuit', giver: 'Tito Ramos',
    brief: [
      'TITO: The job went loud, Dario. The police are coming, and you are holding the bag.',
      'TITO: Lose them. Get to the garage and stay out of sight until the heat dies.',
      'DARIO: Losing police. That is practically my middle name.',
    ],
    steps: [{ type: 'escape', x: 1700, y: 880, r: 100, label: 'Escape the police and reach Verde Garage' }],
  },
  {
    day: 2, title: 'The Vault Key', giver: 'Mara Solis',
    brief: [
      'MARA: Kessler keeps the casino vault key in his office above the strip.',
      'MARA: His guards are not friendly. Take the keycard and walk out like you own the place.',
      'DARIO: I do own the place. As of tonight, anyway.',
    ],
    steps: [
      { type: 'fight', x: 2500, y: 1250, r: 170, count: 2, label: 'Get past the casino guards' },
      { type: 'collect', count: 1, label: 'Take the vault keycard', pts: [{ x: 2500, y: 1190 }] },
    ],
  },
  {
    day: 3, title: 'High Tide', giver: 'Lena Voss',
    brief: [
      'LENA: Kessler sent a courier with my contract — he wants me gone from the city.',
      'LENA: The courier is driving a white sedan down the Casino Strip right now.',
      'DARIO: Then I had better catch him before the tide does.',
    ],
    steps: [{ type: 'chase', x: 2100, y: 900, r: 200, label: 'Chase down the courier on the Casino Strip' }],
  },
  {
    day: 3, title: 'Family Business', giver: 'Mara Solis',
    brief: [
      'MARA: Kessler is sending his crew to burn my cafe tonight. My cafe, Dario.',
      'MARA: Hold the street until they give up. Nobody touches the Marina Cafe.',
      'DARIO: Nobody touches it. That is a promise.',
    ],
    steps: [{ type: 'defend', x: 500, y: 420, r: 170, seconds: 45, label: 'Defend the Marina Cafe for 45 seconds' }],
  },
  {
    day: 3, title: 'The Last Score', giver: 'Mara Solis',
    brief: [
      'MARA: Tonight we take the casino vault. The keycard, the crew, the plan — all ready.',
      'MARA: Grab the cash bags inside and get out before the alarms bring the whole city.',
      'DARIO: One last score. Then Porto Verde is ours again.',
    ],
    steps: [
      {
        type: 'collect', count: 3, label: 'Grab the three cash bags in the casino',
        pts: [{ x: 2500, y: 1100 }, { x: 2500, y: 1400 }, { x: 2100, y: 1250 }],
      },
      { type: 'escape', x: 380, y: 1100, r: 100, label: 'Escape to the Sunset Pier' },
    ],
  },
  {
    day: 3, title: 'Three Days in the Sun', giver: 'Mara Solis',
    brief: [
      'MARA: The airstrip. One plane, one pilot who owes me a favour, and the whole city behind us.',
      'MARA: Drive, Dario. Do not stop for anything. Not for Kessler, not for the police, not for the sunset.',
      'DARIO: Three days in Porto Verde. I would not trade them for anything.',
    ],
    steps: [{ type: 'drive', x: 2750, y: 2005, r: 110, label: 'Drive to the Airstrip and fly out of Porto Verde' }],
  },
];

export function createMissions() {
  return {
    index: 0, step: 0, done: false,
    dialog: null, dialogT: 0, briefing: false,
    pickups: [], spawned: 0, killed: 0, timer: 0,
    chaseCar: null, chaseCloseT: 0, layLow: 0, completedCount: 0,
  };
}

export function currentMission(G) {
  return MISSIONS[G.missions.index] || null;
}

export function currentStep(G) {
  const m = currentMission(G);
  return m ? m.steps[G.missions.step] : null;
}

export function objectiveText(G) {
  const step = currentStep(G);
  return step ? step.label : 'Free roam';
}

export function openBriefing(G) {
  const m = currentMission(G);
  if (!m) return;
  G.missions.dialog = { lines: m.brief.slice(), line: 0 };
  G.missions.dialogT = 0;
  G.missions.briefing = true;
  openDialogue(G, m.giver, m.brief);
  if (G.missions.index === 11 && G.wanted.stars < 3) {
    G.wanted.stars = 3;
    G.wanted.heat = Math.max(G.wanted.heat, 70);
  }
  if (G.missions.index === 4) {
    G.missionTimer.active = true;
    G.missionTimer.kind = 'countdown';
    G.missionTimer.label = 'SUNSET';
    G.missionTimer.total = MISSION_TIMERS.lenaSeconds;
    G.missionTimer.left = MISSION_TIMERS.lenaSeconds;
  }
}

export function advanceDialog(G) {
  const m = G.missions;
  if (!m.briefing) return;
  const still = advanceDialogue(G);
  if (m.dialog) m.dialog.line = G.dialogue.line;
  if (!still) {
    m.briefing = false;
    m.dialog = null;
  }
}

function nearestRoadPoint(x, y) {
  let best = { x, y };
  let bestD = Infinity;
  for (const rx of ROADS_X) {
    const d = Math.abs(x - rx);
    if (d < bestD) { bestD = d; best = { x: rx, y }; }
  }
  for (const ry of ROADS_Y) {
    const d = Math.abs(y - ry);
    if (d < bestD) { bestD = d; best = { x, y: ry }; }
  }
  return best;
}

export function spawnThugAt(G, x, y) {
  for (let i = 0; i < 8; i++) {
    const a = G.random() * Math.PI * 2;
    const d = 120 + G.random() * 120;
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d;
    const fixed = collideBuildings(G.city.buildings, px, py, 16);
    if (isOpenGround(G.city, fixed.x, fixed.y, 26)) {
      return { x: fixed.x, y: fixed.y, hp: 60, angle: 0, speed: 150, shootT: 1 + G.random(), meleeT: 0, name: 'Kessler thug', t: 0 };
    }
  }
  const road = nearestRoadPoint(x, y);
  return { x: road.x, y: road.y, hp: 60, angle: 0, speed: 150, shootT: 1 + G.random(), meleeT: 0, name: 'Kessler thug', t: 0 };
}

export function prepareStep(G) {
  const m = G.missions;
  const step = currentStep(G);
  if (!step) return;
  m.pickups = [];
  m.killed = 0;
  m.spawned = 0;
  m.timer = 0;
  m.chaseCloseT = 0;
  if (step.type === 'collect') {
    m.pickups = (step.pts || []).map((pt) => ({ x: pt.x, y: pt.y, taken: false }));
  } else if (step.type === 'fight') {
    for (let i = 0; i < (step.count || 1); i++) {
      G.enemies.push(spawnThugAt(G, step.x, step.y));
      m.spawned += 1;
    }
  } else if (step.type === 'defend') {
    m.timer = step.seconds || MISSION_TIMERS.defendSeconds;
    for (let i = 0; i < 3; i++) {
      G.enemies.push(spawnThugAt(G, step.x, step.y));
      m.spawned += 1;
    }
    G.missionTimer.active = true;
    G.missionTimer.kind = 'defend';
    G.missionTimer.label = 'DEFEND';
    G.missionTimer.total = m.timer;
    G.missionTimer.left = m.timer;
  } else if (step.type === 'chase') {
    const car = G.traffic.find((c) => !c.wrecked) || null;
    if (car) {
      car.name = 'Courier Sedan';
      car.color = '#f4f1e8';
      car.topSpeed = 500;
      car.accel = 450;
      car.hp = 120;
      car.speed = 200;
      car.x = step.x;
      car.y = step.y;
      car.angle = G.random() * Math.PI * 2;
      car.courier = true;
      m.chaseCar = car;
    }
  } else if (step.type === 'escape') {
    if (G.missions.index === 6) {
      if (G.wanted.stars < 2) {
        G.wanted.stars = 2;
        G.wanted.heat = Math.max(G.wanted.heat, 60);
      }
    }
    if (G.missions.index === 10) {
      if (G.wanted.stars < 3) G.wanted.stars = 3;
      G.wanted.heat = Math.max(G.wanted.heat, 80);
    }
    G.missionTimer.active = true;
    G.missionTimer.kind = 'alarm';
    G.missionTimer.label = 'ALARM';
    G.missionTimer.total = 0;
    G.missionTimer.left = 0;
  }
}

function nextStep(G) {
  const m = G.missions;
  const mission = currentMission(G);
  m.step += 1;
  if (m.step >= mission.steps.length) {
    completeMission(G);
  } else {
    prepareStep(G);
  }
}

export function completeMission(G) {
  const m = G.missions;
  const idx = m.index;
  const mission = MISSIONS[idx];
  const reward = MISSION_REWARDS[idx] !== undefined ? MISSION_REWARDS[idx] : 500;
  const bonus = missionBonus(G);
  G.player.money += reward + bonus;
  m.completedCount += 1;
  m.index += 1;
  m.step = 0;
  m.chaseCar = null;
  G.missionTimer.active = false;
  addRep(G, REP_PER_MISSION);
  unlockWeaponsFor(G);
  if (G.audio) G.audio.fanfare();
  G.toast = mission.title + ' complete — $' + (reward + bonus) + (bonus > 0 ? ' (incl. $' + bonus + ' bonus)' : '');
  G.toastT = 3.5;
  if (m.index >= MISSIONS.length) {
    m.done = true;
    G.gameWon = true;
    return;
  }
  openBriefing(G);
  prepareStep(G);
}

export function updateMissions(G, dt) {
  const m = G.missions;
  if (m.done || m.briefing) return;
  const mission = currentMission(G);
  if (!mission) return;
  const step = currentStep(G);
  if (!step) return;
  const p = G.player;

  // Lena's sunset deadline: out of time means the mission restarts, not game over.
  if (m.index === 4 && G.missionTimer.active && G.missionTimer.kind === 'countdown' && G.missionTimer.left <= 0) {
    m.step = 0;
    m.killed = 0;
    m.chaseCar = null;
    G.enemies = [];
    G.missionTimer.left = MISSION_TIMERS.lenaSeconds;
    G.toast = 'Too late — Lena missed her show. Try again.';
    G.toastT = 3;
    prepareStep(G);
    return;
  }

  if (step.type === 'goto' || step.type === 'drive') {
    if (dist(p.x, p.y, step.x, step.y) < step.r) nextStep(G);
  } else if (step.type === 'collect') {
    for (const pk of m.pickups) {
      if (!pk.taken && dist(p.x, p.y, pk.x, pk.y) < 30) {
        pk.taken = true;
        G.toast = 'Picked up (' + m.pickups.filter((q) => q.taken).length + '/' + m.pickups.length + ')';
        G.toastT = 1.5;
        if (G.audio) G.audio.click();
      }
    }
    if (m.pickups.length > 0 && m.pickups.every((pk) => pk.taken)) nextStep(G);
  } else if (step.type === 'fight') {
    if (m.killed >= (step.count || 1)) nextStep(G);
  } else if (step.type === 'chase') {
    const car = m.chaseCar;
    if (!car || car.hp <= 0) {
      nextStep(G);
    } else if (dist(p.x, p.y, car.x, car.y) < 60) {
      m.chaseCloseT += dt;
      if (m.chaseCloseT > 1) nextStep(G);
    } else {
      m.chaseCloseT = 0;
    }
  } else if (step.type === 'escape') {
    const here = dist(p.x, p.y, step.x, step.y) < step.r;
    if (here && G.wanted.stars === 0) {
      addRep(G, REP_PER_ESCAPE);
      nextStep(G);
    } else if (here) {
      m.layLow += dt;
      G.toast = 'Lay low until the heat dies…';
      G.toastT = 1;
    }
  } else if (step.type === 'defend') {
    const inside = dist(p.x, p.y, step.x, step.y) < step.r;
    if (inside) {
      m.timer -= dt;
      G.missionTimer.left = Math.max(0, m.timer);
      const alive = G.enemies.filter((e) => e.hp > 0).length;
      if (alive < 3 && m.spawned < 9) {
        G.enemies.push(spawnThugAt(G, step.x, step.y));
        m.spawned += 1;
      }
      if (m.timer <= 0) nextStep(G);
    } else {
      G.missionTimer.left = Math.max(0, m.timer);
    }
  }
}
