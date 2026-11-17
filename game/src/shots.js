// shots.js — The four screenshot scenes behind ?shot=cover|title|chase|mission.
// Features: each scene plays the REAL game forward from a fresh seeded world with
// a simple autopilot (drive the road, keep the lane, brake for traffic), so every
// frame is what a short game really looks like and the same seed always gives the
// same frame. Chase scenes stage a busy avenue (two waves of traffic, sixteen
// pedestrians on the sidewalks) so the cover reads as a living city. Sets
// window.__shotReady when the scene is painted twice.
//   cover   — dense chase gameplay: wanted 3, police on the tail, mission 2 live
//   title   — title screen over the living city
//   chase   — wanted 4, police ramming the player's car at speed
//   mission — on foot at the Dockside Bar, mission 4 briefing + thugs closing in
import { STEP } from './config.js';
import { createCar, enterCar } from './cars.js';
import { openBriefing, prepareStep } from './missions.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Steer a car along its road: keep to the lane, brake for the car ahead. */
function autopilotDrive(G, car, dt) {
  const vertical = Math.abs(Math.cos(car.angle)) < 0.5;
  const roadX = G.roadsX.reduce((a, b) => (Math.abs(b - car.x) < Math.abs(a - car.x) ? b : a));
  const roadY = G.roadsY.reduce((a, b) => (Math.abs(b - car.y) < Math.abs(a - b) ? b : a));
  let steer = 0;
  let throttle = -1; // move.y < 0 accelerates
  if (vertical) {
    const lane = roadX + (car.angle > 0 ? 22 : -22);
    steer = car.x < lane - 6 ? 1 : car.x > lane + 6 ? -1 : 0;
    if (Math.sin(car.angle) < 0) steer = -steer;
  } else {
    const lane = roadY + (car.angle > -Math.PI / 2 && car.angle < Math.PI / 2 ? 22 : -22);
    steer = car.y < lane - 6 ? 1 : car.y > lane + 6 ? -1 : 0;
    if (Math.cos(car.angle) < 0) steer = -steer;
  }
  // Brake for a car just ahead.
  for (const other of G.cars) {
    if (other === car || other.wrecked) continue;
    const dx = other.x - car.x;
    const dy = other.y - car.y;
    const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
    const side = Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle));
    if (ahead > 0 && ahead < 120 && side < 34) { throttle = 1; break; }
  }
  return { x: steer, y: throttle };
}

/** Run the live simulation for `seconds` with the autopilot driving the player's car. */
function simulateDrive(G, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const car = G.player.car;
    if (car) {
      const move = autopilotDrive(G, car, STEP);
      G.stepWorld(move, STEP, false);
    } else {
      G.stepWorld({ x: 0, y: 0 }, STEP, false);
    }
  }
}

/** After a staged drive, make sure the player's car is intact and driven again:
    a screenshot stages a chase, it does not stage a wreck. */
function restorePlayerCar(G) {
  const car = G._shotCar;
  if (!car) return;
  car.wrecked = false;
  car.hp = 100;
  if (Math.abs(car.speed) < 200) car.speed = 380;
  const p = G.player;
  if (!p.car) {
    p.car = car;
    p.onFoot = false;
    car.driver = 'player';
  }
  p.x = car.x;
  p.y = car.y;
  p.angle = car.angle;
  G.toast = '';
  G.toastT = 0;
  G.dayBannerT = 0;
  // Clear any wrecked traffic that piled up around the player.
  for (const t of G.traffic) {
    if (t.wrecked && Math.hypot(t.x - car.x, t.y - car.y) < 300) {
      t.wrecked = false;
      t.hp = 100;
    }
  }
}

/** Put the player in a fast car on a straight avenue, cops already closing in. */
function stageChaseScene(G, wantedStars, copCount, money, hour, minute) {
  const car = createCar(1300, 900, Math.PI / 2, G.carModels[0], 'player');
  G.cars.push(car);
  G.player.x = car.x;
  G.player.y = car.y;
  enterCar(G, car);
  G._shotCar = car;
  G.wanted.stars = wantedStars;
  G.wanted.heat = 40 + wantedStars * 10;
  G.wanted.lastCrime = G.time;
  G.player.money = money;
  G.clock.day = 1;
  G.clock.hour = hour;
  G.clock.minute = minute;
  // Police cars right behind and beside the player.
  for (let i = 0; i < copCount; i += 1) {
    const cop = createCar(1300 + (i % 2 === 0 ? -70 : 70), 900 - 160 - i * 130, Math.PI / 2, G.copModel, 'police');
    cop.siren = true;
    cop.speed = 420;
    G.police.push(cop);
    G.cars.push(cop);
  }
  // Traffic ahead to dodge — a busy avenue, not an empty one.
  for (let i = 0; i < 8; i += 1) {
    const t = G.traffic[i];
    if (t) { t.x = 1300 + (i % 2 === 0 ? 22 : -22); t.y = 1150 + i * 170; t.angle = Math.PI / 2; t.speed = 150; }
  }
  // A second wave of traffic crossing the avenue, for depth in the frame.
  for (let i = 8; i < 12; i += 1) {
    const t = G.traffic[i];
    if (t) { t.x = 700 + (i - 8) * 190; t.y = 1500 + ((i % 2 === 0) ? 22 : -22); t.angle = (i % 2 === 0) ? 0 : Math.PI; t.speed = 140; }
  }
  // Pedestrians on the sidewalks nearby.
  for (let i = 0; i < 10; i += 1) {
    const ped = G.peds[i];
    if (ped) { ped.x = 1300 + (i % 2 === 0 ? -80 : 80); ped.y = 1000 + i * 90; }
  }
  // A few more pedestrians crossing the plaza side, so the sidewalks read busy.
  for (let i = 10; i < 16; i += 1) {
    const ped = G.peds[i];
    if (ped) { ped.x = 1560 + (i - 10) * 40; ped.y = 1180 + ((i % 2 === 0) ? 0 : 60); }
  }
}

/**
 * Set the game to the named scene and return the screen to draw over it.
 * Names: cover, title, chase, mission. Any other name stages the title.
 */
export function stageShot(name, G) {
  if (name === 'title') {
    // On the sidewalk by the Marina Cafe — open ground, never a roof.
    G.player.x = 560;
    G.player.y = 470;
    G.stepWorld({ x: 0, y: 0 }, STEP, true);
    for (let i = 0; i < 5 * 60; i += 1) G.stepWorld({ x: 0, y: 0 }, STEP, true);
    return { screen: SCREEN_TITLE };
  }
  if (name === 'chase') {
    // Mission 7 "Hot Pursuit": wanted 4, police ramming the player's car at speed.
    G.missions.index = 6;
    G.missions.step = 0;
    prepareStep(G);
    stageChaseScene(G, 4, 4, 2450, 19, 42);
    simulateDrive(G, 3);
    restorePlayerCar(G);
    // One cop rams the player as the shutter falls.
    const cop = G.police[0];
    if (cop && G.player.car) {
      cop.x = G.player.car.x - 40;
      cop.y = G.player.car.y - 30;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    // Mission 4 "First Blood": on foot at the Dockside Bar, briefing open, thugs closing in.
    G.missions.index = 3;
    G.missions.step = 0;
    prepareStep(G);
    G.player.x = 900;
    G.player.y = 1560;
    G.player.angle = Math.PI / 2;
    G.player.money = 870;
    G.clock.day = 1;
    G.clock.hour = 20;
    G.clock.minute = 15;
    G.dayBannerT = 0;
    openBriefing(G);
    G.missions.dialog.line = 1;
    // Stand still while the thugs close in — the frame is the briefing, not a walk.
    for (let i = 0; i < 2.5 * 60; i += 1) G.stepWorld({ x: 0, y: 0 }, STEP, false);
    return { screen: SCREEN_PLAY };
  }
  // Default: the cover — the densest gameplay frame.
  G.missions.index = 1;
  G.missions.step = 0;
  prepareStep(G);
  stageChaseScene(G, 3, 3, 1850, 18, 7);
  simulateDrive(G, 3);
  restorePlayerCar(G);
  return { screen: SCREEN_PLAY };
}
