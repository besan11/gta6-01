// Porto Verde v6 — the four staged scenes behind ?shot=cover|title|chase|mission.
// Every scene is a real game state (real rules, real HUD), arranged once from
// the seeded stream so the same seed always paints the same frame. The cover
// is the late-state heist: Day 3, four stars, AIR-1 overhead, the PD panel
// full, Mara on the radio of the dialogue box, and the vault alarm climbing.
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';
import { createCar, enterCar, CAR_MODELS } from './cars.js';
import { createTraffic } from './traffic.js';
import { createPedestrians } from './pedestrians.js';
import { openBriefing, prepareStep, MISSIONS } from './missions.js';
import { openDialogue } from './dialogue.js';
import { spawnCopCar } from './police.js';

function crowdNear(G, cx, cy, cars, peds) {
  for (let i = 0; i < cars; i += 1) {
    const a = (i / Math.max(1, cars)) * Math.PI * 2 + 0.4;
    const d = 180 + (i % 3) * 90;
    const t = G.traffic[i % G.traffic.length];
    if (!t) continue;
    t.x = cx + Math.cos(a) * d;
    t.y = cy + Math.sin(a) * d;
    t.wrecked = false;
  }
  for (let i = 0; i < peds; i += 1) {
    const a = (i / Math.max(1, peds)) * Math.PI * 2 + 0.9;
    const d = 90 + (i % 4) * 55;
    const p = G.peds[i % G.peds.length];
    if (!p) continue;
    p.x = cx + Math.cos(a) * d;
    p.y = cy + Math.sin(a) * d;
    p.beach = false;
  }
}

function putPlayerInCar(G, x, y, modelIdx) {
  const car = createCar(x, y, -0.5, CAR_MODELS[modelIdx || 0], null);
  car.owned = true;
  G.cars.push(car);
  enterCar(G, car);
  return car;
}

function placeCops(G, cx, cy, n) {
  G.police = [];
  G.cars = G.cars.filter((c) => !c.police);
  for (let i = 0; i < n; i += 1) {
    const cop = spawnCopCar(G);
    const a = (i / n) * Math.PI * 2 + 0.7;
    const d = 150 + (i % 2) * 90;
    cop.x = cx + Math.cos(a) * d;
    cop.y = cy + Math.sin(a) * d;
    cop.speed = 260;
    cop.angle = Math.atan2(cy - cop.y, cx - cop.x);
  }
}

function stageCover(G) {
  G.missions.index = 10;
  G.missions.step = 0;
  G.missions.completedCount = 10;
  G.clock.day = 3;
  G.clock.hour = 19;
  G.clock.minute = 42;
  G.player.money = 8450;
  G.rep.points = 1240;
  G.wanted.stars = 4;
  G.wanted.heat = 88;
  G.player.x = 2380;
  G.player.y = 1250;
  putPlayerInCar(G, 2380, 1250, 0);
  G.player.car.speed = 180;
  placeCops(G, 2380, 1250, 4);
  G.heli.active = true;
  G.heli.x = 2260;
  G.heli.y = 1080;
  G.heli.rotor = 1.2;
  if (G.audio) G.audio.setRotor(true);
  openBriefing(G);
  prepareStep(G);
  openDialogue(G, 'Mara Solis', MISSIONS[10].brief);
  G.district = { name: 'CASINO STRIP', flavor: 'Neon and bad decisions', bannerT: 3 };
  G.dayBanner = 'CASINO STRIP';
  G.dayBannerT = 3;
  G.missionTimer.active = true;
  G.missionTimer.remaining = 127;
  G.missionTimer.label = 'ALARM';
  G.radio.station = 0;
  G.radio.track = 0;
  G.weapons.slots[2].unlocked = true;
  G.weapons.selected = 1;
  G.casino.alarm = 64;
  crowdNear(G, 2380, 1250, 6, 10);
  return { screen: SCREEN_PLAY };
}

function stageChase(G) {
  G.missions.index = 6;
  G.missions.step = 0;
  G.missions.completedCount = 6;
  G.clock.day = 2;
  G.clock.hour = 17;
  G.clock.minute = 30;
  G.player.money = 2400;
  G.rep.points = 640;
  G.wanted.stars = 3;
  G.wanted.heat = 62;
  putPlayerInCar(G, 420, 1100, 3);
  G.player.car.speed = 320;
  G.player.car.angle = Math.PI / 2;
  placeCops(G, 420, 1100, 3);
  G.district = { name: 'SUNSET PIER', flavor: 'Fishermen and runaways', bannerT: 3 };
  G.dayBanner = 'SUNSET PIER';
  G.dayBannerT = 3;
  openBriefing(G);
  prepareStep(G);
  G.missionTimer.active = false;
  crowdNear(G, 420, 1100, 4, 8);
  return { screen: SCREEN_PLAY };
}

function stageMission(G) {
  G.missions.index = 3;
  G.missions.step = 0;
  G.missions.completedCount = 3;
  G.clock.day = 1;
  G.clock.hour = 16;
  G.clock.minute = 20;
  G.player.money = 950;
  G.rep.points = 310;
  G.player.x = 900;
  G.player.y = 1550;
  G.player.onFoot = true;
  G.player.car = null;
  G.wanted.stars = 0;
  G.wanted.heat = 0;
  openBriefing(G);
  prepareStep(G);
  const thugSpots = [{ x: 900, y: 1400 }, { x: 900, y: 1450 }, { x: 900, y: 1500 }]; // on the road: guaranteed open ground
  G.enemies.forEach((e, i) => {
    const spot = thugSpots[i % thugSpots.length];
    e.x = spot.x; e.y = spot.y;
  });
  openDialogue(G, 'Mara Solis', MISSIONS[3].brief);
  G.district = { name: 'HARBOR DISTRICT', flavor: "Cranes, crates and Kessler's men", bannerT: 0 };
  crowdNear(G, 900, 1550, 4, 9);
  return { screen: SCREEN_PLAY };
}

export function stageShot(name, G) {
  G.time = 0;
  G.clockAcc = 0;
  if (name === 'cover') return stageCover(G);
  if (name === 'chase') return stageChase(G);
  if (name === 'mission') return stageMission(G);
  return { screen: SCREEN_TITLE };
}
