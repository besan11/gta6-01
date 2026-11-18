// Porto Verde v6 — boot and the one loop. Fixed 1/60 s steps, screens
// TITLE / PLAY / PAUSED / OVER / WON, and the ?shot= staging mode that paints
// a scene twice and raises window.__shotReady for the screenshot runner.
import { createRandom, clamp } from './random.js';
import { createCity } from './world.js';
import { createAudio } from './audio.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WON } from './render.js';
import { createPlayer, updatePlayerOnFoot, nearestCar } from './player.js';
import { createCar, spawnParkedCars, driveCar, enterCar, exitCar, CAR_MODELS } from './cars.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createWanted, updateWanted, addWanted } from './wanted.js';
import { updatePolice } from './police.js';
import { punch, shoot, updateCombat } from './combat.js';
import { createMissions, openBriefing, prepareStep, advanceDialog, updateMissions, currentStep } from './missions.js';
import { createDialogue, dialogueActive, advanceDialogue } from './dialogue.js';
import { createRep } from './rep.js';
import { createRadio, updateRadio, nextStation } from './radio.js';
import { updateDistrict } from './districts.js';
import { createWeapons } from './weapons.js';
import { createMissionTimer } from './mission-timer.js';
import { createHeli, updateHeli } from './helicopter.js';
import { createBoats, createUmbrellas, updateBoats } from './sunset.js';
import { createCasino, updateCasino } from './casino-heist.js';
import { saveGame, loadSave, hasSave, applySave } from './save.js';
import { stageShot } from './shots.js';
import { CLOCK_START_DAY, CLOCK_START_HOUR, DAY_END_HOUR, TRAFFIC_COUNT, PED_COUNT, WORLD_W, WORLD_H } from './config.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);

function createGame() {
  const random = createRandom(seed);
  const G = {
    random, seed,
    city: null, roadsX: [500, 900, 1300, 1700, 2100, 2500, 2900],
    roadsY: [300, 700, 1100, 1500, 1900, 2200],
    carModels: CAR_MODELS, copModel: { name: 'PD Interceptor', color: '#22447f', top: 560, accel: 520 },
    player: null, cars: [], traffic: [], peds: [], police: [], enemies: [],
    bullets: [], effects: [], wanted: null, missions: null,
    clock: { day: CLOCK_START_DAY, hour: CLOCK_START_HOUR, minute: 0 },
    time: 0, clockAcc: 0, toast: '', toastT: 0, dayBanner: '', dayBannerT: 0,
    audio: null, input, busted: false, wasted: false, gameWon: false,
    shotsFired: 0, bustTimer: 0, nearCar: null, hasSaveFlag: hasSave(),
    boats: [], umbrellas: [], heli: null, rep: null, radio: null,
    district: null, weapons: null, missionTimer: null, casino: null,
    dialogue: null, screen: SCREEN_TITLE,
  };
  G.city = createCity(random);
  G.audio = createAudio();
  G.player = createPlayer();
  G.wanted = createWanted();
  G.missions = createMissions();
  G.dialogue = createDialogue();
  G.rep = createRep();
  G.radio = createRadio();
  G.weapons = createWeapons();
  G.missionTimer = createMissionTimer();
  G.heli = createHeli();
  G.boats = createBoats(G);
  G.umbrellas = createUmbrellas(G);
  G.casino = createCasino(G);
  G.district = { name: 'MARINA NORTE', flavor: 'Cafes and old money', bannerT: 0 };
  G.cars = spawnParkedCars(G, 14);
  const starter = createCar(534, 540, 0, CAR_MODELS[0], null);
  starter.parked = true;
  starter.owned = true;
  G.cars.push(starter);
  G.traffic = createTraffic(G, TRAFFIC_COUNT);
  G.peds = createPedestrians(G, PED_COUNT);
  G.saveGame = function save() { return saveGame(G); };
  G.stepWorld = function step(dt, ambient) { stepWorld(G, dt, ambient); };
  G.screenNow = function now() { return G.screen; };
  return G;
}

let G = createGame();
window.__pv = G;
// Test hooks (used by playtest.mjs only): staging helpers for scripted checks.
window.__pvDebug = {
  openBriefing: () => openBriefing(G),
  prepareStep: () => prepareStep(G),
  setMission: (index) => { G.missions.index = index; G.missions.step = 0; },
  addWanted: (n, reason) => addWanted(G, n, reason),
};

function mouseWorld(G) {
  const camX = Math.max(0, Math.min(WORLD_W - 1280, G.player.x - 640));
  const camY = Math.max(0, Math.min(WORLD_H - 720, G.player.y - 360));
  return { x: input.mouse.x + camX, y: input.mouse.y + camY };
}

function stepWorld(G, dt, ambient) {
  G.time += dt;
  G.clockAcc += dt;
  while (G.clockAcc >= 1) {
    G.clockAcc -= 1;
    G.clock.minute += 1;
    if (G.clock.minute >= 60) {
      G.clock.minute = 0;
      G.clock.hour += 1;
      if (G.clock.hour >= DAY_END_HOUR && G.clock.day < 3) {
        G.clock.day += 1;
        G.clock.hour = 8;
        G.dayBanner = 'DAY ' + G.clock.day + ' — PORTO VERDE';
        G.dayBannerT = 4;
      }
    }
  }
  if (G.toastT > 0) { G.toastT -= dt; if (G.toastT <= 0) G.toast = ''; }
  if (G.dayBannerT > 0) G.dayBannerT -= dt;
  if (G.dialogue.contextT > 0) G.dialogue.contextT -= dt;
  G.effects = G.effects.filter((fx) => (fx.t += dt) < fx.ttl);

  const move = input.direction();
  const running = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  const mw = mouseWorld(G);
  if (G.player.onFoot) {
    updatePlayerOnFoot(G, dt, move, running, mw);
  } else if (G.player.car && !G.player.car.wrecked) {
    driveCar(G, G.player.car, move, dt);
    G.player.x = G.player.car.x;
    G.player.y = G.player.car.y;
    G.player.angle = G.player.car.angle;
  }
  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  if (!ambient) {
    updatePolice(G, dt);
    updateWanted(G, dt);
    updateMissions(G, dt);
  }
  updateCombat(G, dt);
  const chase = G.missions.chaseCar;
  if (chase && !chase.wrecked && !ambient) {
    const p = G.player;
    const d = Math.hypot(chase.x - p.x, chase.y - p.y);
    const away = Math.atan2(chase.y - p.y, chase.x - p.x);
    chase.angle += clamp(away - chase.angle, -1.8 * dt, 1.8 * dt);
    chase.speed = Math.min(500, chase.speed + 120 * dt);
    chase.x += Math.cos(chase.angle) * chase.speed * dt;
    chase.y += Math.sin(chase.angle) * chase.speed * dt;
    chase.x = clamp(chase.x, 300, 3150);
    chase.y = clamp(chase.y, 60, 2340);
    if (d > 900) { chase.x = p.x + 300; chase.y = p.y; chase.speed = 200; }
  }
  updateHeli(G, dt);
  updateRadio(G, dt);
  updateDistrict(G, dt);
  updateBoats(G, dt);
  updateCasino(G, dt);
  if (G.audio) {
    const driving = !!G.player.car && Math.abs(G.player.car.speed) > 10;
    G.audio.setEngine(driving, driving ? Math.abs(G.player.car.speed) / 520 : 0);
  }
  if (G.player.hp <= 0 && !G.wasted) {
    G.wasted = true;
    if (G.audio) G.audio.wasted();
  }
}

function announce(message) {
  if (status) status.textContent = message;
}

function startGame(fresh) {
  const oldInput = input;
  const oldAudio = G.audio;
  G = createGame();
  G.audio = oldAudio;
  G.input = oldInput;
  window.__pv = G;
  G.screen = SCREEN_PLAY;
  const saved = fresh ? null : loadSave();
  if (saved && !fresh) {
    applySave(G, saved);
    G.missions.step = 0;
    openBriefing(G);
    prepareStep(G);
    announce('Continued. Mission ' + (G.missions.index + 1) + ' of 12.');
  } else {
    openBriefing(G);
    prepareStep(G);
    announce('Playing. Dario is home.');
  }
  G.audio.unlock();
  G.audio.startMusic();
  G.audio.startEngine();
}

function endGame() {
  G.screen = G.gameWon ? SCREEN_WON : SCREEN_OVER;
  announce(G.gameWon ? 'You won. Porto Verde is yours.' : G.busted ? 'Busted by the police.' : 'Wasted.');
}

function handleActions() {
  // Edge-triggered keys are read BEFORE takeActions drains the queue.
  if (input.pressed('KeyC') && G.screen === SCREEN_TITLE && hasSave()) {
    startGame(false);
    return;
  }
  if (input.pressed('KeyT') && (G.screen === SCREEN_PAUSED || G.screen === SCREEN_OVER || G.screen === SCREEN_WON)) {
    G.screen = SCREEN_TITLE;
    return;
  }
  if (input.pressed('KeyR') && G.screen === SCREEN_PLAY) nextStation(G);
  for (let i = 0; i < 4; i += 1) {
    if (input.pressed('Digit' + (i + 1)) && G.screen === SCREEN_PLAY) G.weapons.select(G, i);
  }
  const actions = input.takeActions();
  if (actions & ACTION_CONFIRM) {
    if (G.screen === SCREEN_TITLE) { startGame(true); return; }
    if (G.screen === SCREEN_OVER || G.screen === SCREEN_WON) { startGame(true); return; }
    if (G.screen === SCREEN_PAUSED) { G.screen = SCREEN_PLAY; return; }
    if (dialogueActive(G)) { advanceDialogue(G); advanceDialog(G); return; }
  }
  if (actions & ACTION_PAUSE) {
    if (G.screen === SCREEN_PLAY) G.screen = SCREEN_PAUSED;
    else if (G.screen === SCREEN_PAUSED) G.screen = SCREEN_PLAY;
    return;
  }
  if (G.screen !== SCREEN_PLAY) return;
  if (actions & ACTION_ENTER_CAR) {
    if (G.player.onFoot) {
      const car = nearestCar(G, 90);
      if (car) {
        const stolen = !car.owned;
        enterCar(G, car);
        if (stolen) addWanted(G, 1, 'car stolen');
      }
    } else {
      exitCar(G);
    }
  }
  if (actions & ACTION_PUNCH) punch(G);
  if (actions & ACTION_SAVE) {
    if (saveGame(G)) { G.toast = 'Game saved'; G.toastT = 2; }
  }
  if (actions & ACTION_MUTE) {
    G.audio.setMuted(!G.audio.isMuted());
    G.toast = G.audio.isMuted() ? 'Muted' : 'Sound on';
    G.toastT = 1.5;
  }
  if (input.takeClick() && G.screen === SCREEN_PLAY) {
    const mw = mouseWorld(G);
    shoot(G, mw.x, mw.y);
  } else if (input.mouse.down && G.screen === SCREEN_PLAY && G.weapons.current().auto) {
    const mw = mouseWorld(G);
    shoot(G, mw.x, mw.y);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!frame.last) frame.last = now;
  let acc = Math.min((now - frame.last) / 1000, MAX_FRAME);
  frame.last = now;
  handleActions();
  if (G.screen === SCREEN_TITLE) {
    while (acc >= STEP) { stepWorld(G, STEP, true); acc -= STEP; }
  } else if (G.screen === SCREEN_PLAY) {
    while (acc >= STEP) {
      stepWorld(G, STEP, false);
      acc -= STEP;
      if (G.wasted || G.busted || G.gameWon) { endGame(); break; }
    }
  }
  renderer.draw(G, G.screen);
}

function runShot(name) {
  const scene = stageShot(name, G);
  G.screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(G, G.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) {
  runShot(shot);
} else {
  requestAnimationFrame(frame);
}
