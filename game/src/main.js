// Porto Verde — game entry. Builds the world, runs the loop, owns the
// screens (title / play / paused / over / won) and the save + shot hooks.
// Everything the modules need hangs off one object: window.__pv = G.
import { createRandom, clamp, dist } from './random.js';
import { CAR_MODELS, TRAFFIC_COUNT, PED_COUNT, CLOCK } from './config.js';
import { createCity } from './world.js';
import { createCar, spawnParkedCars, driveCar, enterCar, exitCar } from './cars.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createPlayer, updatePlayerOnFoot, hurtPlayer, nearestCar } from './player.js';
import { updatePolice } from './police.js';
import { createWanted, updateWanted, addWanted } from './wanted.js';
import { punch, shoot, updateCombat } from './combat.js';
import { createMissions, openBriefing, advanceDialog, updateMissions, currentStep, prepareStep, completeMission } from './missions.js';
import { createAudio, unlockAudio, startEngine, setEngine, setSiren, startMusic, setMuted, isMuted, wantedUp, bustedSound, wastedSound, clickSound } from './audio.js';
import { createInput, attachInput, moveVector, consumeActions, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE } from './input.js';
import { saveGame as doSave, loadSave, hasSave, applySave } from './save.js';
import { createRenderer } from './render.js';
import { createHelicopter, updateHelicopter } from './helicopter.js';
import { createRep, addRep } from './rep.js';
import { createRadio, updateRadio, nextStation } from './radio.js';
import { createDistrict, updateDistrict } from './districts.js';
import { createWeapons, selectWeapon } from './weapons.js';
import { createMissionTimer, updateMissionTimer } from './mission-timer.js';
import { createSunset, updateSunset } from './sunset.js';
import { stageShot } from './shots.js';

export function createGame(seed) {
  const random = createRandom(seed || 7);
  const G = {
    seed: seed || 7, random, time: 0, clockAcc: 0,
    clock: { day: CLOCK.startDay, hour: CLOCK.startHour, minute: 0 },
    city: null, player: null, cars: [], traffic: [], peds: [],
    police: [], enemies: [], bullets: [], effects: [],
    wanted: null, missions: null, audio: null, input: null,
    heli: null, rep: null, radio: null, district: null,
    weapons: null, missionTimer: null, sunset: null, dialogue: null,
    toast: '', toastT: 0, dayBanner: '', dayBannerT: 0,
    busted: false, wasted: false, gameWon: false,
    shotsFired: 0, bustTimer: 0, nearCar: null,
    hasSaveFlag: false, ambient: false, cam: { x: 0, y: 0 },
    prevStars: 0,
  };
  G.city = createCity(random);
  G.player = createPlayer();
  G.player.x = 534;
  G.player.y = 600;
  G.cars = spawnParkedCars(G, 14);
  const starter = createCar(534, 540, -Math.PI / 2, CAR_MODELS[0], null);
  G.cars.push(starter);
  G.traffic = createTraffic(G, TRAFFIC_COUNT);
  G.peds = createPedestrians(G, PED_COUNT);
  G.wanted = createWanted();
  G.missions = createMissions();
  G.audio = createAudio();
  G.heli = createHelicopter();
  G.rep = createRep();
  G.radio = createRadio();
  G.district = createDistrict();
  G.weapons = createWeapons();
  G.missionTimer = createMissionTimer();
  G.sunset = createSunset(G);
  G.hasSaveFlag = hasSave();
  G.stepWorld = (dt) => stepWorld(G, dt);
  G.saveGame = () => doSave(G);
  G.objectiveNow = () => {
    const s = currentStep(G);
    if (!s || s.x === undefined || G.missions.dialog) return null;
    return { x: s.x, y: s.y, label: s.label || '' };
  };
  // Test hooks: the scripted playtest drives the same code paths a player
  // would; nothing here changes the game for a human.
  G.debug = {
    prepareStep: () => prepareStep(G),
    openBriefing: () => openBriefing(G),
    completeMission: () => completeMission(G),
  };
  return G;
}

export function stepWorld(G, dt) {
  G.time += dt;
  // Clock: one real second is one game minute; the day ends at 22:00.
  G.clockAcc += dt * CLOCK.secondsPerMinute;
  while (G.clockAcc >= 1) {
    G.clockAcc -= 1;
    G.clock.minute += 1;
    if (G.clock.minute >= 60) {
      G.clock.minute = 0;
      G.clock.hour += 1;
    }
    if (G.clock.hour >= CLOCK.endHour) {
      G.clock.hour = 8;
      G.clock.minute = 0;
      if (G.clock.day < 3) {
        G.clock.day += 1;
        G.dayBanner = `DAY ${G.clock.day}`;
        G.dayBannerT = 3;
      }
    }
  }
  if (G.toastT > 0) G.toastT -= dt;
  if (G.dayBannerT > 0) G.dayBannerT -= dt;
  if (G.dialogue && G.dialogue.sticky) {
    G.dialogue.sticky -= dt;
    if (G.dialogue.sticky <= 0) G.dialogue = null;
  }
  for (const fx of G.effects) fx.t += dt;
  G.effects = G.effects.filter((fx) => fx.t < fx.life);
  // Player: on foot or driving.
  const input = G.input;
  const move = input ? moveVector(input) : { x: 0, y: 0 };
  const running = input ? (input.keys.has('ShiftLeft') || input.keys.has('ShiftRight')) : false;
  const mouseWorld = input && G.cam ? { x: G.cam.x + input.mouse.x, y: G.cam.y + input.mouse.y } : null;
  if (G.player.onFoot) {
    updatePlayerOnFoot(G, dt, move, running, mouseWorld);
    G.nearCar = nearestCar(G, 90);
  } else if (G.player.car) {
    const throttle = (input && (input.keys.has('KeyW') || input.keys.has('ArrowUp')) ? 1 : 0)
      - (input && (input.keys.has('KeyS') || input.keys.has('ArrowDown')) ? 1 : 0);
    const steer = (input && (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) ? -1 : 0)
      + (input && (input.keys.has('KeyD') || input.keys.has('ArrowRight')) ? 1 : 0);
    driveCar(G, G.player.car, { throttle, steer }, dt);
    G.nearCar = null;
    // Running over a pedestrian is a crime, and they remember it.
    const px = G.player.car.x;
    const py = G.player.car.y;
    for (const ped of G.peds) {
      if (dist(px, py, ped.x, ped.y) < 30 && Math.abs(G.player.car.speed) > 60) {
        if (!ped.hitT || ped.hitT <= 0) {
          ped.hitT = 3;
          ped.fleeing = 3;
          ped.x += (ped.x - px) * 0.4;
          ped.y += (ped.y - py) * 0.4;
          addWanted(G, 1, 'hit a pedestrian');
        }
      }
      if (ped.hitT) ped.hitT -= dt;
    }
  }
  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  if (!G.ambient) updatePolice(G, dt);
  updateWanted(G, dt);
  updateMissions(G, dt);
  updateCombat(G, dt);
  // New systems, one wiring point after combat.
  updateHelicopter(G, dt);
  updateRadio(G, dt);
  updateDistrict(G, dt);
  updateMissionTimer(G, dt);
  updateSunset(G, dt);
  // Escaped the heat: REP for losing the cops.
  if (G.prevStars > 0 && G.wanted.stars === 0) {
    addRep(G, 40);
    G.toast = 'You lost them. +40 REP';
    G.toastT = 3;
  }
  if (G.wanted.stars > G.prevStars) wantedUp(G.audio);
  G.prevStars = G.wanted.stars;
  // Engine + siren follow the car and the heat.
  if (G.player.car) setEngine(G.audio, Math.abs(G.player.car.speed) / 520);
  else setEngine(G.audio, 0);
  setSiren(G.audio, G.wanted.stars > 0);
}

function endCheck(G, screen) {
  if (G.wasted) { wastedSound(G.audio); return 'over'; }
  if (G.busted) { bustedSound(G.audio); return 'over'; }
  if (G.gameWon) return 'won';
  return screen;
}

export function runGame(canvas) {
  const renderer = createRenderer(canvas);
  let G = createGame(7);
  window.__pv = G;
  G.input = createInput();
  attachInput(G.input, canvas);
  let screen = 'title';
  G.screenNow = () => screen;
  G.setScreen = (s) => { screen = s; };
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  let paints = 0;

  function startGame(fresh) {
    const input = G.input;
    const seed = G.seed;
    G = createGame(seed);
    G.input = input;
    window.__pv = G;
    G.screenNow = () => screen;
    G.setScreen = (s) => { screen = s; };
    if (!fresh) {
      const data = loadSave();
      if (data) applySave(G, data);
    }
    screen = 'play';
    unlockAudio(G.audio);
    startEngine(G.audio);
    startMusic(G.audio);
    clickSound(G.audio);
    openBriefing(G);
  }

  if (shot) {
    stageShot(shot, G);
    screen = shot === 'title' ? 'title' : 'play';
    unlockAudio(G.audio);
  }

  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const input = G.input;
    // Snapshot edge-triggered keys BEFORE consumeActions clears them:
    // a quick press can go down+up between two frames, so the held set
    // alone would miss it.
    const pressed = new Set(input.pressed);
    const actions = consumeActions(input);
    if (screen === 'title') {
      if (actions & ACTION_CONFIRM) startGame(true);
      else if (pressed.has('KeyC') && hasSave()) startGame(false);
    } else if (screen === 'play') {
      if (actions & ACTION_PAUSE) { screen = 'paused'; }
      else {
        if (G.missions.dialog && (actions & ACTION_CONFIRM)) advanceDialog(G);
        if (actions & ACTION_ENTER_CAR) {
          if (G.player.onFoot) enterCar(G);
          else exitCar(G);
        }
        if (actions & ACTION_PUNCH) punch(G);
        if (actions & ACTION_SAVE) doSave(G);
        if (actions & ACTION_MUTE) setMuted(G.audio, !isMuted(G.audio));
        if (pressed.has('KeyR')) nextStation(G);
        for (let i = 0; i < 4; i++) {
          if (pressed.has(`Digit${i + 1}`)) selectWeapon(G, i);
        }
        if (input.mouse.down && mouseWorldOf(G)) shoot(G, mouseWorldOf(G).x, mouseWorldOf(G).y);
        stepWorld(G, dt);
        screen = endCheck(G, screen);
      }
    } else if (screen === 'paused') {
      if (actions & ACTION_PAUSE) screen = 'play';
      else if (pressed.has('KeyT')) screen = 'title';
      else if (actions & ACTION_SAVE) doSave(G);
    } else if (screen === 'over' || screen === 'won') {
      if (actions & ACTION_CONFIRM) startGame(true);
    }
    renderer.draw(G, screen);
    if (shot) {
      paints++;
      if (paints >= 2) window.__shotReady = true;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { getG: () => G };
}

function mouseWorldOf(G) {
  if (!G.input || !G.cam) return null;
  return { x: G.cam.x + G.input.mouse.x, y: G.cam.y + G.input.mouse.y };
}

const canvas = document.getElementById('game');
if (canvas) runGame(canvas);
