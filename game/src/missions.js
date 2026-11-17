// missions.js — The story of Porto Verde: 12 missions across 3 days.
// Features: a chained mission story (Dario Cruz returns home, works for Mara Solis,
// and earns his way out in three days), mission briefings with dialogue, six
// objective types (go to, drive to, collect, fight, chase, escape/defend), cash
// rewards, day progression, and a mission-complete fanfare. Thugs spawn on open
// ground only (road, sidewalk, plaza, park, beach) — never on a roof or inside
// a building. Original characters,
// original places, original story — nothing from any commercial game.
import { MISSION_REWARDS } from './config.js';
import { dist } from './random.js';
import { collideBuildings, isOpenGround } from './world.js';

// Landmark coordinates (same map as world.js LANDMARKS), snapped to roads, parks,
// the beach and the runway — never inside a building block, so every objective
// is actually reachable on foot or by car.
const MARINA_CAFE = { x: 500, y: 420 };
const HARBOR = { x: 640, y: 1900 };
const GARAGE = { x: 1700, y: 880 };
const DOCKSIDE = { x: 900, y: 1680 };
const VIEWPOINT = { x: 2900, y: 420 };
const PLAZA = { x: 1500, y: 1300 };
const CASINO = { x: 2500, y: 1250 };
const AIRSTRIP = { x: 2750, y: 2005 };
const CITY_HALL = { x: 1300, y: 950 };
const PIER = { x: 300, y: 1100 };

export const MISSIONS = [
  {
    day: 1, title: 'Welcome Home', giver: 'Mara Solis',
    brief: [
      'MARA: Dario! Three years away and you walk in like the tide owes you money.',
      'DARIO: The tide owes me nothing. You do, though — a job, remember?',
      'MARA: One job. Then we talk about the old days. Meet me at the Marina Cafe.',
    ],
    steps: [{ type: 'goto', x: MARINA_CAFE.x, y: MARINA_CAFE.y, r: 70, label: 'Meet Mara at the Marina Cafe' }],
  },
  {
    day: 1, title: 'Cold Cargo', giver: 'Mara Solis',
    brief: [
      'MARA: A refrigerated van is waiting at the pier. It has to reach the harbor warehouse before noon.',
      'MARA: Drive it like your mother is in the back. No police, no scratches.',
      'DARIO: Mothers, police, scratches. Got it.',
    ],
    steps: [{ type: 'drive', x: HARBOR.x, y: HARBOR.y, r: 90, label: 'Drive the van to the Harbor Warehouse' }],
  },
  {
    day: 1, title: 'The Green Van', giver: 'Tito Ramos',
    brief: [
      'TITO: Mara needs a van, and the city has plenty. Borrow one. Permanently.',
      'TITO: There is a green Marina Van parked by the plaza. Bring it to my garage.',
      'DARIO: Borrow. Right. I love this city already.',
    ],
    steps: [
      { type: 'goto', x: PLAZA.x, y: PLAZA.y, r: 120, label: 'Find the green Marina Van at Central Plaza' },
      { type: 'drive', x: GARAGE.x, y: GARAGE.y, r: 90, label: 'Deliver the van to Verde Garage' },
    ],
  },
  {
    day: 1, title: 'First Blood', giver: 'Mara Solis',
    brief: [
      'MARA: The dock crew that works for Kessler is shaking down my bar tonight.',
      'MARA: Go to the Dockside Bar and remind them whose street that is.',
      'DARIO: Fists or louder? ... Fists first. Louder if they insist.',
    ],
    steps: [{ type: 'fight', x: DOCKSIDE.x, y: DOCKSIDE.y, r: 160, count: 3, label: 'Deal with the dock thugs at the Dockside Bar' }],
  },
  {
    day: 2, title: 'Sunset Run', giver: 'Lena Voss',
    brief: [
      'LENA: I am a singer, darling, and my taxi never showed. Drive me to the Mirador Viewpoint.',
      'LENA: The show starts at sunset. If I am late, the whole city hears about it.',
      'DARIO: Then we had better not be late.',
    ],
    steps: [
      { type: 'goto', x: CITY_HALL.x, y: CITY_HALL.y, r: 80, label: 'Pick up Lena at City Hall' },
      { type: 'drive', x: VIEWPOINT.x, y: VIEWPOINT.y, r: 90, label: 'Drive Lena to the Mirador Viewpoint' },
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
      pts: [{ x: PLAZA.x, y: PLAZA.y }, { x: PIER.x + 60, y: PIER.y }, { x: 2100, y: 800 }],
    }],
  },
  {
    day: 2, title: 'Hot Pursuit', giver: 'Tito Ramos',
    brief: [
      'TITO: The job went loud, Dario. The police are coming, and you are holding the bag.',
      'TITO: Lose them. Get to the garage and stay out of sight until the heat dies.',
      'DARIO: Losing police. That is practically my middle name.',
    ],
    steps: [{ type: 'escape', x: GARAGE.x, y: GARAGE.y, r: 100, label: 'Escape the police and reach Verde Garage' }],
  },
  {
    day: 2, title: 'The Vault Key', giver: 'Mara Solis',
    brief: [
      'MARA: Kessler keeps the casino vault key in his office above the strip.',
      'MARA: His guards are not friendly. Take the keycard and walk out like you own the place.',
      'DARIO: I do own the place. As of tonight, anyway.',
    ],
    steps: [
      { type: 'fight', x: CASINO.x, y: CASINO.y, r: 170, count: 2, label: 'Get past the casino guards' },
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
    steps: [{ type: 'defend', x: MARINA_CAFE.x, y: MARINA_CAFE.y, r: 170, seconds: 45, label: 'Defend the Marina Cafe for 45 seconds' }],
  },
  {
    day: 3, title: 'The Last Score', giver: 'Mara Solis',
    brief: [
      'MARA: Tonight we take the casino vault. The keycard, the crew, the plan — all ready.',
      'MARA: Grab the cash bags inside and get out before the alarms bring the whole city.',
      'DARIO: One last score. Then Porto Verde is ours again.',
    ],
    steps: [
      { type: 'collect', count: 3, label: 'Grab the three cash bags in the casino', pts: [{ x: 2500, y: 1100 }, { x: 2500, y: 1400 }, { x: 2100, y: 1250 }] },
      { type: 'escape', x: PIER.x + 80, y: PIER.y, r: 100, label: 'Escape to the Sunset Pier' },
    ],
  },
  {
    day: 3, title: 'Three Days in the Sun', giver: 'Mara Solis',
    brief: [
      'MARA: The airstrip. One plane, one pilot who owes me a favour, and the whole city behind us.',
      'MARA: Drive, Dario. Do not stop for anything. Not for Kessler, not for the police, not for the sunset.',
      'DARIO: Three days in Porto Verde. I would not trade them for anything.',
    ],
    steps: [{ type: 'drive', x: AIRSTRIP.x, y: AIRSTRIP.y, r: 110, label: 'Drive to the Airstrip and fly out of Porto Verde' }],
  },
];

/** Create the mission tracker: mission 0, step 0, briefing dialog open. */
export function createMissions() {
  return {
    index: 0,
    step: 0,
    done: false,
    dialog: null, // {lines, line}
    dialogT: 0,
    pickups: [],
    spawned: 0,
    killed: 0,
    timer: 0,
    chaseCar: null,
    layLow: 0,
    completedCount: 0,
  };
}

export function currentMission(M) {
  return MISSIONS[M.index] || null;
}

export function currentStep(M) {
  const m = currentMission(M);
  return m ? m.steps[M.step] : null;
}

/** Open the briefing dialog for the current mission. */
export function openBriefing(G) {
  const m = currentMission(G.missions);
  if (!m) return;
  G.missions.dialog = { lines: m.brief, line: 0 };
  G.missions.dialogT = 0;
  G.audio.click();
}

/** Spawn the pickups for a collect step. */
function spawnPickups(G, step) {
  G.missions.pickups = step.pts.map((p) => ({ x: p.x, y: p.y, taken: false }));
}

/**
 * Spawn thugs near a point for a fight/defend step — on open ground only.
 * Candidates are sampled on a ring around the objective and accepted only when
 * they sit on a road, sidewalk, plaza, park or beach, well clear of every
 * building footprint, so no thug ever spawns on a roof or in a doorway. When
 * the ring around an objective has no open ground (a courtyard objective), the
 * fallback walks outward from the objective along the sampled direction until
 * open ground is found instead of settling for a pushed-out roof edge.
 */
function spawnThugs(G, x, y, count) {
  for (let i = 0; i < count; i += 1) {
    let placed = null;
    for (let attempt = 0; attempt < 14 && !placed; attempt += 1) {
      const a = G.random() * Math.PI * 2;
      const d = 120 + G.random() * 120;
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d;
      if (isOpenGround(G.city, cx, cy, 26)) placed = { x: cx, y: cy };
    }
    if (!placed) {
      // No open ground on the ring: step outward from the objective until there is.
      const a = G.random() * Math.PI * 2;
      let px = x;
      let py = y;
      for (let step = 0; step < 12; step += 1) {
        px = x + Math.cos(a) * (120 + step * 30);
        py = y + Math.sin(a) * (120 + step * 30);
        if (isOpenGround(G.city, px, py, 26)) break;
      }
      const safe = collideBuildings(G.city.buildings, px, py, 26);
      placed = { x: safe.x, y: safe.y };
    }
    G.enemies.push({
      x: placed.x, y: placed.y,
      hp: 60, angle: 0, speed: 150, shootT: 1 + G.random(),
      meleeT: 0, name: 'Kessler thug',
    });
  }
  G.missions.spawned += count;
}

/** Prepare the current step (spawn pickups, thugs, or the chase car). */
export function prepareStep(G) {
  const M = G.missions;
  const step = currentStep(M);
  if (!step) return;
  M.pickups = [];
  M.killed = 0;
  M.timer = 0;
  M.layLow = 0;
  if (step.type === 'collect') spawnPickups(G, step);
  if (step.type === 'fight') spawnThugs(G, step.x, step.y, step.count);
  if (step.type === 'defend') spawnThugs(G, step.x, step.y, 3);
  if (step.type === 'chase') {
    const car = G.traffic.find((c) => !c.wrecked) || null;
    if (car) {
      car.driver = 'chase';
      car.model = { name: 'Courier Sedan', color: '#f2f2f2', topSpeed: 500, accel: 450 };
      car.color = '#f2f2f2';
      car.hp = 120;
      car.x = step.x;
      car.y = step.y;
      car.angle = 0;
      car.speed = 200;
      M.chaseCar = car;
    }
  }
  if (step.type === 'escape') {
    // The job went loud: the police are already coming.
    if (G.wanted.stars < 2) {
      G.wanted.stars = 2;
      G.wanted.heat = 60;
      G.wanted.lastCrime = G.time;
      G.audio.setSiren(true);
    }
  }
}

/** Advance the dialog line, or close it when the last line was shown. */
export function advanceDialog(G) {
  const d = G.missions.dialog;
  if (!d) return;
  d.line += 1;
  G.missions.dialogT = 0;
  if (d.line >= d.lines.length) G.missions.dialog = null;
  else G.audio.click();
}

/** Complete the current mission: pay out, fanfare, and open the next briefing. */
function completeMission(G) {
  const M = G.missions;
  const reward = MISSION_REWARDS[M.index] || 500;
  G.player.money += reward;
  M.completedCount += 1;
  G.audio.missionComplete();
  G.audio.cash();
  G.toast = 'MISSION COMPLETE — ' + MISSIONS[M.index].title + '  +$' + reward;
  G.toastT = 4;
  M.index += 1;
  M.step = 0;
  // Save AFTER advancing, so the save opens on the next mission, not the one just finished.
  G.saveGame();
  if (M.index >= MISSIONS.length) {
    M.done = true;
    G.gameWon = true;
    return;
  }
  // New day banner when the day changes.
  const prev = MISSIONS[M.index - 1];
  const next = MISSIONS[M.index];
  if (next.day !== prev.day) {
    G.dayBanner = 'DAY ' + next.day + ' — ' + (next.day === 2 ? 'The Heat Rises' : 'The Last Score');
    G.dayBannerT = 4;
    G.clock.day = next.day;
  }
  prepareStep(G);
  openBriefing(G);
}

function advanceStep(G) {
  const M = G.missions;
  M.step += 1;
  const m = currentMission(M);
  if (!m) return;
  if (M.step >= m.steps.length) {
    completeMission(G);
  } else {
    prepareStep(G);
  }
}

/** One mission step: check the current objective and advance it when done. */
export function updateMissions(G, dt) {
  const M = G.missions;
  if (M.done) return;
  // Dialog auto-advances after a few seconds so a staged screenshot still plays.
  if (M.dialog) {
    M.dialogT += dt;
    if (M.dialogT > 5) advanceDialog(G);
  }
  const step = currentStep(M);
  if (!step) return;
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  if (step.type === 'goto' || step.type === 'drive') {
    if (dist(px, py, step.x, step.y) < step.r) {
      if (step.type === 'drive' && !p.car) return; // must arrive by car
      advanceStep(G);
    }
  } else if (step.type === 'collect') {
    for (const pk of M.pickups) {
      if (!pk.taken && dist(px, py, pk.x, pk.y) < 56) {
        pk.taken = true;
        G.audio.pickup();
        G.player.money += 25;
      }
    }
    if (M.pickups.length > 0 && M.pickups.every((pk) => pk.taken)) advanceStep(G);
  } else if (step.type === 'fight') {
    if (M.killed >= step.count && G.enemies.length === 0) advanceStep(G);
  } else if (step.type === 'escape') {
    if (dist(px, py, step.x, step.y) < step.r && G.wanted.stars > 0) {
      M.layLow += dt;
      if (M.layLow > 5) {
        // Lay low long enough: the heat dies and the step completes.
        G.wanted.stars = 0;
        G.wanted.heat = 0;
        G.audio.setSiren(false);
        advanceStep(G);
      }
    } else {
      M.layLow = 0;
    }
  } else if (step.type === 'chase') {
    const car = M.chaseCar;
    if (car && car.wrecked) {
      G.player.money += 100;
      advanceStep(G);
    } else if (car && dist(px, py, car.x, car.y) > 1400) {
      // Lost him: respawn the courier nearer the player.
      car.x = px + 500;
      car.y = py + 200;
    }
  } else if (step.type === 'defend') {
    M.timer += dt;
    // Reinforcements trickle in while the defence holds.
    if (M.timer > 15 && M.spawned < 6) {
      spawnThugs(G, step.x, step.y, 3);
    }
    if (M.timer >= step.seconds && G.enemies.length === 0) advanceStep(G);
  }
}

/** The mission objective text for the HUD panel. */
export function objectiveText(G) {
  const m = currentMission(G.missions);
  if (!m) return 'All missions complete — Porto Verde is yours.';
  const step = currentStep(G.missions);
  if (!step) return m.title;
  let extra = '';
  if (step.type === 'fight') extra = '  (' + Math.min(G.missions.killed, step.count) + '/' + step.count + ')';
  if (step.type === 'collect') {
    const got = G.missions.pickups.filter((pk) => pk.taken).length;
    extra = '  (' + got + '/' + step.count + ')';
  }
  if (step.type === 'defend') extra = '  (' + Math.floor(G.missions.timer) + 's / ' + step.seconds + 's)';
  if (step.type === 'escape' && G.missions.layLow > 0) extra = '  (lay low… ' + Math.ceil(5 - G.missions.layLow) + 's)';
  return step.label + extra;
}
