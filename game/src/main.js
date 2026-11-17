// Boot and the one loop: Porto Verde runs in fixed 1/60 s steps, the camera follows
// Dario, and the game moves between title, play, paused, over and won screens.
// ?seed=N fixes the world. ?shot=cover|title|chase|mission (with &seed=7) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { STEP, TRAFFIC_COUNT, PED_COUNT, CLOCK, WORLD_W, WORLD_H } from './config.js';
import { createRandom, clamp } from './random.js';
import { createCity } from './world.js';
import { createAudio } from './audio.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE, ACTION_RADIO, ACTION_WEAPON1, ACTION_WEAPON2, ACTION_WEAPON3, ACTION_WEAPON4, ACTION_CONTINUE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WON } from './render.js';
import { createPlayer, updatePlayerOnFoot, nearestCar } from './player.js';
import { createCar, spawnParkedCars, driveCar, enterCar, exitCar, CAR_MODELS } from './cars.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, createBeachgoers, updatePedestrians } from './pedestrians.js';
import { createWanted, updateWanted } from './wanted.js';
import { updatePolice } from './police.js';
import { createMissions, openBriefing, advanceDialog, prepareStep, updateMissions } from './missions.js';
import { punch, shoot, updateCombat } from './combat.js';
import { createHeli, updateHeli } from './helicopter.js';
import { createRep } from './rep.js';
import { createRadio, updateRadio, nextStation } from './radio.js';
import { createDistrict, updateDistrict } from './districts.js';
import { createWeapons, switchWeapon } from './weapons.js';
import { createMissionTimer, updateMissionTimer } from './mission-timer.js';
import { createBoats, createUmbrellas, updateBoats } from './sunset.js';
import { createDialogue } from './dialogue.js';
import { saveGame, loadSave, hasSave, applySave } from './save.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;

const canvas = document.getElementById('game');
const status = document.getElementById('status');

function createGame(seedValue) {
  const random = createRandom(seedValue);
  const G = {
    random, seed: seedValue, time: 0, clockAcc: 0,
    clock: { day: CLOCK.startDay, hour: CLOCK.startHour, minute: 0 },
    city: null, player: null, cars: [], traffic: [], peds: [], beachgoers: [],
    police: [], enemies: [], bullets: [], effects: [],
    wanted: null, missions: null, audio: null, input: null,
    toast: '', toastT: 0, dayBanner: '', dayBannerT: 0,
    busted: false, wasted: false, gameWon: false, shotsFired: 0,
    bustTimer: 0, nearCar: null, hasSaveFlag: false, camera: { x: 0, y: 0 },
    heli: null, rep: null, radio: null, district: null, weapons: null,
    missionTimer: null, boats: [], umbrellas: [], dialogue: null,
    screen: SCREEN_TITLE,
  };
  G.city = createCity(random);
  G.player = createPlayer();
  G.wanted = createWanted();
  G.missions = createMissions();
  G.heli = createHeli();
  G.rep = createRep();
  G.radio = createRadio();
  G.district = createDistrict();
  G.weapons = createWeapons();
  G.missionTimer = createMissionTimer();
  G.dialogue = createDialogue();
  G.boats = createBoats(random);
  G.umbrellas = createUmbrellas(random);
  G.traffic = createTraffic(G, TRAFFIC_COUNT);
  G.peds = createPedestrians(G, PED_COUNT);
  G.beachgoers = createBeachgoers(G, 7);
  spawnParkedCars(G, 14);
  // Starter car: the Azul GT Coupe by the Marina Cafe.
  const starter = createCar(534, 540, 0, CAR_MODELS[0], null);
  G.cars.push(starter);
  G.audio = createAudio();
  G.saveGame = () => saveGame(G);
  G.prepareStep = () => prepareStep(G);
  G.stepWorld = (dt, ambient) => stepWorld(G, dt, ambient);
  G.screenNow = () => G.screen;
  G.hasSaveFlag = hasSave();
  return G;
}

function stepWorld(G, dt, ambient) {
  G.time += dt;
  // Clock: one real second is one game minute; the day ends at 22:00.
  G.clockAcc += dt;
  while (G.clockAcc >= CLOCK.secondsPerMinute) {
    G.clockAcc -= CLOCK.secondsPerMinute;
    G.clock.minute += 1;
    if (G.clock.minute >= 60) {
      G.clock.minute = 0;
      G.clock.hour += 1;
      if (G.clock.hour >= CLOCK.endHour) {
        G.clock.day = Math.min(3, G.clock.day + 1);
        G.clock.hour = 8;
        G.clock.minute = 0;
        G.dayBanner = `DAY ${G.clock.day}`;
        G.dayBannerT = 4;
      }
    }
  }
  if (G.toastT > 0) G.toastT -= dt;
  if (G.dayBannerT > 0) G.dayBannerT -= dt;
  if (G.rep.lastGainT > 0) G.rep.lastGainT -= dt;
  if (G.dialogue.contextualT > 0) {
    G.dialogue.contextualT -= dt;
    if (G.dialogue.contextualT <= 0) G.dialogue.contextual = null;
  }
  const move = G.input ? G.input.move() : { x: 0, y: 0 };
  const running = G.input ? G.input.running() : false;
  const mouse = G.input ? G.input.mouse() : { x: 640, y: 360, down: false };
  const mouseWorld = { x: mouse.x + G.camera.x, y: mouse.y + G.camera.y };
  if (G.player.car) {
    driveCar(G, G.player.car, move, dt);
    G.player.x = G.player.car.x;
    G.player.y = G.player.car.y;
    G.player.angle = G.player.car.angle;
    if (G.audio) G.audio.setEngine(true, Math.abs(G.player.car.speed) / 520);
  } else {
    updatePlayerOnFoot(G, dt, move, running, mouseWorld);
    if (G.audio) G.audio.setEngine(false, 0);
  }
  G.nearCar = G.player.onFoot ? nearestCar(G, 90) : null;
  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  if (!ambient) {
    updatePolice(G, dt);
    updateWanted(G, dt);
    updateMissions(G, dt);
    updateCombat(G, dt);
  }
  // New systems, wired after combat in one place.
  updateHeli(G, dt);
  updateRadio(G, dt);
  updateDistrict(G, dt);
  updateMissionTimer(G, dt);
  updateBoats(G, dt);
  if (G.player.car && G.player.car.wrecked) {
    G.player.car = null;
    G.player.onFoot = true;
  }
  if (G.wasted || G.busted) {
    if (G.audio) G.audio.setEngine(false, 0);
  }
}

let G = createGame(seed);
G.input = createInput(canvas);
window.__pv = G;
const renderer = createRenderer(canvas);

function announce(message) {
  status.textContent = message;
}

function startGame(fresh) {
  const input = G.input;
  const audio = G.audio;
  const next = createGame(seed);
  const keepInput = input;
  const keepAudio = audio;
  for (const key of Object.keys(next)) G[key] = next[key];
  G.input = keepInput;
  G.audio = keepAudio;
  // Rebind the closures to the live object, not the throwaway fresh copy.
  G.saveGame = () => saveGame(G);
  G.prepareStep = () => prepareStep(G);
  G.stepWorld = (dt, ambient) => stepWorld(G, dt, ambient);
  G.screenNow = () => G.screen;
  G.screen = SCREEN_PLAY;
  window.__pv = G;
  if (fresh) openBriefing(G);
  announce('Playing Porto Verde. Mission 1: Welcome Home.');
  if (G.audio) { G.audio.unlock(); G.audio.startMusic(); }
}

function endGame() {
  if (G.gameWon) {
    G.screen = SCREEN_WON;
    announce('You won. Porto Verde is yours.');
  } else {
    G.screen = SCREEN_OVER;
    announce(G.busted ? 'Busted by the police.' : 'Wasted.');
  }
  if (G.audio) G.audio.setEngine(false, 0);
}

function handleActions() {
  const actions = G.input.takeActions();
  const clicked = G.input.takeClick();
  if (G.screen === SCREEN_TITLE) {
    if (actions & ACTION_CONFIRM) startGame(true);
    else if ((actions & ACTION_CONTINUE) && G.hasSaveFlag) {
      startGame(false);
      const data = loadSave();
      if (data) applySave(G, data);
    }
    return;
  }
  if (G.screen === SCREEN_OVER || G.screen === SCREEN_WON) {
    if (actions & ACTION_CONFIRM) {
      G.screen = SCREEN_TITLE;
      announce('Porto Verde. Press Enter to start.');
    }
    return;
  }
  if (G.screen === SCREEN_PAUSED) {
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
      G.screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (G.input.has('KeyT')) {
      G.screen = SCREEN_TITLE;
    } else if (actions & ACTION_SAVE) {
      saveGame(G);
    } else if (actions & ACTION_MUTE) {
      G.audio.setMuted(!G.audio.isMuted());
    }
    return;
  }
  // SCREEN_PLAY
  if (actions & ACTION_PAUSE) {
    G.screen = SCREEN_PAUSED;
    announce('Paused.');
    return;
  }
  if (actions & ACTION_MUTE) G.audio.setMuted(!G.audio.isMuted());
  if (actions & ACTION_SAVE) saveGame(G);
  if (actions & ACTION_RADIO) nextStation(G);
  if (actions & ACTION_WEAPON1) switchWeapon(G, 0);
  if (actions & ACTION_WEAPON2) switchWeapon(G, 1);
  if (actions & ACTION_WEAPON3) switchWeapon(G, 2);
  if (actions & ACTION_WEAPON4) switchWeapon(G, 3);
  if (G.missions.dialog) {
    if (actions & ACTION_CONFIRM) {
      advanceDialog(G);
      if (G.audio) G.audio.click();
    }
    return;
  }
  if (actions & ACTION_ENTER_CAR) {
    if (G.player.car) exitCar(G);
    else if (G.nearCar) enterCar(G, G.nearCar);
    return;
  }
  if (actions & ACTION_PUNCH) punch(G);
  if (clicked && G.player.onFoot) {
    const mouse = G.input.mouse();
    shoot(G, mouse.x + G.camera.x, mouse.y + G.camera.y);
  } else if (clicked && G.player.car) {
    const mouse = G.input.mouse();
    shoot(G, mouse.x + G.camera.x, mouse.y + G.camera.y);
  }
}

function step() {
  if (G.screen === SCREEN_TITLE) {
    stepWorld(G, STEP, true);
    return;
  }
  if (G.screen !== SCREEN_PLAY) return;
  stepWorld(G, STEP, false);
  if (G.wasted || G.busted || G.gameWon) endGame();
}

function frame(now) {
  requestAnimationFrame(frame);
  const last = frame._last || now;
  frame._last = now;
  let acc = (frame._acc || 0) + Math.min((now - last) / 1000, MAX_FRAME);
  handleActions();
  if (G.screen === SCREEN_TITLE || G.screen === SCREEN_PLAY) {
    while (acc >= STEP && (G.screen === SCREEN_TITLE || G.screen === SCREEN_PLAY)) {
      step();
      acc -= STEP;
    }
  } else {
    acc = 0;
  }
  frame._acc = acc;
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

function runGame() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.screen === SCREEN_PLAY) G.screen = SCREEN_PAUSED;
  });
  announce('Porto Verde: Three Days in the Sun. Press Enter to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
