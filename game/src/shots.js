// shots.js — The four screenshot scenes behind ?shot=cover|title|chase|mission.
// Each one stages a real, playable frame of the game — late state for the
// cover (mission 11, four stars, the helicopter overhead, Mara on the line),
// the title screen, a beach-road pursuit, and a live mission with thugs.
// The frame loop paints twice and then raises window.__shotReady.
import { enterCar } from './cars.js';
import { openBriefing, prepareStep } from './missions.js';
import { showDistrictBanner } from './districts.js';
import { repRankFor } from './rep.js';
import { unlockWeaponsFor } from './weapons.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { spawnCopCar } from './police.js';
import { REP_RANKS } from './config.js';

function placeCops(G, spots) {
  for (const spot of spots) {
    const cop = spawnCopCar(G);
    cop.x = spot.x;
    cop.y = spot.y;
    cop.angle = Math.atan2(G.player.y - spot.y, G.player.x - spot.x);
    cop.speed = 180;
    cop.distToPlayer = Math.sqrt((spot.x - G.player.x) ** 2 + (spot.y - G.player.y) ** 2);
    cop.prevDist = cop.distToPlayer + 40;
    G.police.push(cop);
    G.cars.push(cop);
  }
}

function gatherPeds(G, cx, cy, count, radius) {
  let placed = 0;
  for (const ped of G.peds) {
    if (placed >= count) break;
    const a = (placed / count) * Math.PI * 2;
    const d = radius * (0.5 + (placed % 3) * 0.25);
    ped.x = cx + Math.cos(a) * d;
    ped.y = cy + Math.sin(a) * d;
    ped.angle = a + Math.PI;
    placed += 1;
  }
  return placed;
}

function gatherTraffic(G, spots) {
  for (let i = 0; i < spots.length && i < G.traffic.length; i++) {
    G.traffic[i].x = spots[i].x;
    G.traffic[i].y = spots[i].y;
    G.traffic[i].angle = spots[i].angle || 0;
    G.traffic[i].speed = spots[i].speed || 0;
  }
}

export function stageShot(name, G) {
  G.camZoom = 1;
  G.dialogue.active = false;
  G.missions.briefing = false;
  // Staged frames hold still: the police and the mission engine pause so
  // the cluster, the dialogue, and the HUD stay exactly as composed while
  // the screenshot is taken. The live game is unaffected.
  G.ambient = true;
  // The staged hero does not take damage while the frame is composed.
  G.player.invuln = 9999;
  if (name === 'title') {
    G.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  if (name === 'chase') {
    const p = G.player;
    p.x = 420;
    p.y = 1100;
    p.angle = 0;
    p.money = 1200;
    p.hp = 100;
    G.clock.day = 2;
    G.clock.hour = 17;
    G.clock.minute = 30;
    G.wanted.stars = 4;
    G.wanted.heat = 70;
    G.wanted.decayTimer = 0;
    const starter = G.cars.find((c) => c.name === 'Coral Coupe');
    if (starter) {
      starter.x = 420;
      starter.y = 1100;
      starter.angle = 0;
      enterCar(G, starter);
    }
    placeCops(G, [
      { x: 300, y: 980 },
      { x: 320, y: 1230 },
      { x: 560, y: 1010 },
    ]);
    G.heli.active = true;
    G.heli.x = p.x - 120;
    G.heli.y = p.y - 180;
    G.missions.index = 6;
    G.missions.step = 0;
    prepareStep(G);
    gatherPeds(G, 420, 1100, 6, 260);
    gatherTraffic(G, [{ x: 700, y: 1100, angle: 0, speed: 120 }]);
    G.screen = SCREEN_PLAY;
    return SCREEN_PLAY;
  }
  if (name === 'mission') {
    const p = G.player;
    p.x = 820;
    p.y = 1600;
    p.angle = Math.PI / 4;
    p.money = 700;
    p.hp = 100;
    G.clock.day = 1;
    G.clock.hour = 20;
    G.clock.minute = 15;
    G.wanted.stars = 0;
    G.wanted.heat = 0;
    G.missions.index = 3;
    G.missions.step = 0;
    G.missions.killed = 0;
    openBriefing(G);
    prepareStep(G);
    gatherPeds(G, 900, 1680, 8, 300);
    gatherTraffic(G, [
      { x: 900, y: 1500, angle: Math.PI / 2, speed: 0 },
      { x: 1100, y: 1680, angle: 0, speed: 60 },
    ]);
    G.screen = SCREEN_PLAY;
    return SCREEN_PLAY;
  }
  // Default: the cover — mission 11, late state, everything at once.
  const p = G.player;
  p.x = 2100;
  p.y = 1250;
  p.angle = -Math.PI / 2;
  p.money = 8450;
  p.hp = 100;
  p.onFoot = true;
  p.car = null;
  G.clock.day = 3;
  G.clock.hour = 19;
  G.clock.minute = 42;
  G.wanted.stars = 4;
  G.wanted.heat = 85;
  G.wanted.decayTimer = 0;
  G.missions.index = 10;
  G.missions.step = 1;
  G.missions.completedCount = 10;
  G.missions.killed = 0;
  openBriefing(G);
  prepareStep(G);
  placeCops(G, [
    { x: 1950, y: 1150 },
    { x: 2250, y: 1150 },
    { x: 1950, y: 1400 },
    { x: 2280, y: 1380 },
  ]);
  G.heli.active = true;
  G.heli.x = p.x - 140;
  G.heli.y = p.y - 200;
  G.rep.total = 1240;
  G.rep.rank = repRankFor(1240);
  G.rep.rankName = REP_RANKS[G.rep.rank].name;
  unlockWeaponsFor(G);
  const pistol = G.weapons.slots.find((s) => s.name === 'Tide 9mm');
  if (pistol) pistol.ammo = 90;
  const smg = G.weapons.slots.find((s) => s.name === 'Squall SMG');
  if (smg) smg.ammo = 160;
  const shotgun = G.weapons.slots.find((s) => s.name === 'Breaker 12');
  if (shotgun) shotgun.ammo = 24;
  G.weapons.selected = 1;
  showDistrictBanner(G, 'CASINO STRIP');
  gatherPeds(G, 2100, 1250, 10, 320);
  gatherTraffic(G, [
    { x: 2350, y: 1250, angle: 0, speed: 80 },
    { x: 1900, y: 1100, angle: Math.PI, speed: 60 },
  ]);
  G.camZoom = 0.55;
  G.screen = SCREEN_PLAY;
  return SCREEN_PLAY;
}
