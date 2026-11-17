// Screenshot scenes: each one stages the real game at a fixed late state with seed 7,
// steps it forward a fixed number of ticks, and returns the screen to paint.
// Cover is the densest chase frame: mission 11, Day 3, four stars, AIR-1 overhead.
import { STEP } from './config.js';
import { openBriefing, prepareStep, currentMission } from './missions.js';
import { spawnCopCar } from './police.js';
import { startMissionTimer } from './mission-timer.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

function settle(G, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    G.stepWorld(STEP, false);
    if (G.wasted || G.busted) break;
  }
}

function placeCopsAround(G, count, radius) {
  G.police = [];
  for (let i = 0; i < count; i += 1) {
    const cop = spawnCopCar(G);
    const angle = (i / count) * Math.PI * 2 + 0.5;
    cop.x = G.player.x + Math.cos(angle) * radius;
    cop.y = G.player.y + Math.sin(angle) * radius * 0.7;
    cop.speed = 320;
    cop.angle = Math.atan2(G.player.y - cop.y, G.player.x - cop.x);
  }
}

function pullTrafficNear(G, cx, cy) {
  let placed = 0;
  for (const t of G.traffic) {
    if (placed >= 4) break;
    if (Math.abs(t.x - cx) < 500 && Math.abs(t.y - cy) < 400) continue;
    t.x = cx - 420 + placed * 260;
    t.y = cy - 160 + (placed % 2) * 320;
    t.angle = placed % 2 === 0 ? 0 : Math.PI;
    t.speed = 200;
    placed += 1;
  }
}

export function stageShot(name, G) {
  if (name === 'title') {
    G.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'chase') {
    // Hot pursuit down the beach road: wanted 4, three units, AIR-1, sunset light.
    G.missions.index = 6;
    G.missions.step = 0;
    G.missions.completedCount = 6;
    G.player.money = 3200;
    G.player.x = 500;
    G.player.y = 1100;
    G.player.onFoot = false;
    const car = G.cars[0];
    car.x = 500;
    car.y = 1100;
    car.angle = Math.PI / 2;
    car.speed = 300;
    G.player.car = car;
    G.clock.day = 2;
    G.clock.hour = 17;
    G.clock.minute = 30;
    G.wanted.stars = 4;
    G.wanted.heat = 82;
    placeCopsAround(G, 3, 320);
    G.heli.active = true;
    G.heli.x = G.player.x - 60;
    G.heli.y = G.player.y - 130;
    G.rep.points = 940;
    G.district.current = 'SUNSET PIER';
    G.district.name = 'SUNSET PIER';
    G.district.flavor = 'Fishermen and runaways';
    G.district.bannerT = 3;
    prepareStep(G);
    settle(G, 1.2);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    // First Blood: Mara's briefing on screen, three thugs at the Dockside Bar.
    G.missions.index = 3;
    G.missions.step = 0;
    G.missions.completedCount = 3;
    G.player.money = 900;
    G.player.x = 900;
    G.player.y = 1560;
    G.clock.day = 1;
    G.clock.hour = 15;
    G.clock.minute = 20;
    G.rep.points = 320;
    G.district.current = 'HARBOR DISTRICT';
    G.district.name = 'HARBOR DISTRICT';
    G.district.flavor = "Cranes, crates and Kessler's men";
    G.district.bannerT = 3;
    openBriefing(G);
    prepareStep(G);
    settle(G, 0.5);
    // Re-open the briefing after the settle so the portrait dialog is on screen.
    openBriefing(G);
    return { screen: SCREEN_PLAY };
  }
  // Default: cover — mission 11, The Last Score, Day 3 evening, four stars.
  G.missions.index = 10;
  G.missions.step = 0;
  G.missions.completedCount = 10;
  G.player.money = 8450;
  G.player.x = 2380;
  G.player.y = 1250;
  G.player.onFoot = true;
  G.player.car = null;
  G.clock.day = 3;
  G.clock.hour = 19;
  G.clock.minute = 42;
  G.wanted.stars = 4;
  G.wanted.heat = 88;
  G.rep.points = 1240;
  G.weapons.current = 1;
  G.weapons.slots[1].ammo = 90;
  G.weapons.slots[2].ammo = 160;
  G.district.current = 'CASINO STRIP';
  G.district.name = 'CASINO STRIP';
  G.district.flavor = 'Neon and bad decisions';
  G.district.bannerT = 3;
  startMissionTimer(G, 'ALARM', 45);
  placeCopsAround(G, 4, 260);
  pullTrafficNear(G, 2380, 1250);
  G.heli.active = true;
  G.heli.x = G.player.x - 40;
  G.heli.y = G.player.y - 120;
  openBriefing(G);
  prepareStep(G);
  // Keep the briefing open on the cover: re-open after prepareStep.
  openBriefing(G);
  settle(G, 0.8);
  openBriefing(G);
  void currentMission;
  return { screen: SCREEN_PLAY };
}
