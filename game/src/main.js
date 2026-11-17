// main.js — The orchestrator. createGame builds the whole world in one
// place, stepWorld advances it one fixed step at a time, and runGame owns
// the frame loop, the screen state, and the ?shot= staging used for the
// four screenshots. window.__pv is the live game, for debugging and for
// the playtest.
import { CLOCK, STEP, ROADS_X, ROADS_Y, TRAFFIC_COUNT, PED_COUNT } from './config.js';
import { createRandom, clamp, dist } from './random.js';
import { createCity, isOpenGround } from './world.js';
import { createPlayer, updatePlayerOnFoot, nearestCar, hurtPlayer } from './player.js';
import { CAR_MODELS, createCar, driveCar, enterCar, exitCar, damageCar, spawnParkedCars } from './cars.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice, COP_MODEL } from './police.js';
import { createWanted, updateWanted, addWanted } from './wanted.js';
import { MISSIONS, createMissions, updateMissions, openBriefing, prepareStep, advanceDialog, completeMission } from './missions.js';
import { punch, shoot, updateCombat } from './combat.js';
import { createAudio } from './audio.js';
import { saveGame, loadSave, hasSave, applySave } from './save.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WON } from './render.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE, moveVector, isRunning, endFrame } from './input.js';
import { stageShot } from './shots.js';
import { createHeli, updateHeli } from './helicopter.js';
import { createRep } from './rep.js';
import { createRadio, updateRadio, nextStation } from './radio.js';
import { createDistrictTracker, updateDistrict } from './districts.js';
import { createWeapons, selectWeapon } from './weapons.js';
import { createMissionTimer, updateMissionTimer } from './mission-timer.js';
import { createBoats, createUmbrellas, updateBoats } from './sunset.js';
import { updateDialogue, createDialogue } from './dialogue.js';
import { setMissionList } from './minimap-plus.js';

export function createGame(seedValue) {
  const random = createRandom(seedValue);
  const G = {
    seed: seedValue,
    random,
    city: createCity(random),
    roadsX: ROADS_X,
    roadsY: ROADS_Y,
    carModels: CAR_MODELS,
    copModel: COP_MODEL,
    player: createPlayer(),
    cars: [],
    traffic: [],
    peds: [],
    police: [],
    enemies: [],
    bullets: [],
    effects: [],
    wanted: createWanted(),
    missions: createMissions(),
    dialogue: createDialogue(),
    clock: { day: CLOCK.startDay, hour: CLOCK.startHour, minute: 0 },
    time: 0,
    clockAcc: 0,
    toast: '',
    toastT: 0,
    dayBanner: '',
    dayBannerT: 0,
    audio: createAudio(),
    input: null,
    busted: false,
    wasted: false,
    gameWon: false,
    endPlayed: false,
    shotsFired: 0,
    bustTimer: 0,
    nearCar: null,
    hasSaveFlag: hasSave(),
    boats: [],
    umbrellas: [],
    heli: createHeli(),
    rep: createRep(),
    radio: createRadio(),
    district: null,
    weapons: createWeapons(),
    missionTimer: createMissionTimer(),
    camZoom: 1,
    drawn: {},
    ambient: false,
    screen: SCREEN_TITLE,
    missionList: MISSIONS,
  };
  G.district = createDistrictTracker(G);
  G.traffic = createTraffic(G, TRAFFIC_COUNT);
  G.peds = createPedestrians(G, PED_COUNT);
  G.cars = spawnParkedCars(G, 10);
  G.cars.push(...G.traffic);
  const starter = createCar(534, 540, -Math.PI / 2, CAR_MODELS[0], 'none');
  G.cars.push(starter);
  G.boats = createBoats(random);
  G.umbrellas = createUmbrellas(random);
  setMissionList(MISSIONS);
  G.saveGame = () => saveGame(G);
  G.stepWorld = (dt) => stepWorld(G, dt);
  G.screenNow = () => G.screen;
  G.isOpenGround = (x, y) => isOpenGround(G.city, x, y, 26);
  G.test = {
    prepareStep: () => prepareStep(G),
    openBriefing: () => openBriefing(G),
    completeMission: () => completeMission(G),
  };
  openBriefing(G);
  prepareStep(G);
  return G;
}

function cameraOf(G) {
  const zoom = G.camZoom || 1;
  const vw = 1280 / zoom;
  const vh = 720 / zoom;
  const p = G.player;
  return {
    x: clamp(p.x - vw / 2, 0, Math.max(0, 3200 - vw)),
    y: clamp(p.y - vh / 2, 0, Math.max(0, 2400 - vh)),
    zoom,
  };
}

export function stepWorld(G, dt) {
  G.time += dt;
  // Clock: one real second is one game minute.
  G.clockAcc += dt;
  while (G.clockAcc >= CLOCK.secondsPerMinute) {
    G.clockAcc -= CLOCK.secondsPerMinute;
    G.clock.minute += 1;
    if (G.clock.minute >= 60) {
      G.clock.minute = 0;
      G.clock.hour += 1;
    }
    if (G.clock.hour >= CLOCK.endHour) {
      G.clock.day = Math.min(3, G.clock.day + 1);
      G.clock.hour = CLOCK.startHour;
      G.clock.minute = 0;
      G.dayBanner = 'DAY ' + G.clock.day;
      G.dayBannerT = 3;
    }
  }
  if (G.toastT > 0) G.toastT -= dt;
  if (G.dayBannerT > 0) G.dayBannerT -= dt;
  updateDialogue(G, dt);

  const input = G.input;
  const mv = input ? moveVector(input) : { x: 0, y: 0 };
  const running = input ? isRunning(input) : false;
  const cam = cameraOf(G);
  const mouseWorld = input
    ? { x: cam.x + input.mouse.x / cam.zoom, y: cam.y + input.mouse.y / cam.zoom }
    : null;
  const p = G.player;
  if (p.onFoot) {
    updatePlayerOnFoot(G, dt, mv, running, mouseWorld);
  } else if (p.car) {
    driveCar(G, p.car, { throttle: -mv.y, steer: mv.x }, dt);
    p.x = p.car.x;
    p.y = p.car.y;
    p.angle = p.car.angle;
  }
  G.nearCar = p.onFoot ? nearestCar(G, 90) : null;

  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  if (!G.ambient) updatePolice(G, dt);
  updateWanted(G, dt);
  if (!G.ambient) updateMissions(G, dt);
  updateCombat(G, dt);

  // The courier flees: steer away from Dario, foot down.
  const chaseCar = G.missions.chaseCar;
  if (chaseCar && !chaseCar.wrecked) {
    const away = Math.atan2(chaseCar.y - p.y, chaseCar.x - p.x);
    let da = away - chaseCar.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    driveCar(G, chaseCar, { throttle: 1, steer: clamp(da * 2, -1, 1) }, dt);
  }

  // Collisions: cars into cars, cars into Dario, Dario's car into pedestrians.
  for (let i = 0; i < G.cars.length; i++) {
    for (let j = i + 1; j < G.cars.length; j++) {
      const a = G.cars[i];
      const b = G.cars[j];
      if (a.wrecked || b.wrecked) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d < 54 && d > 0.01) {
        const push = (54 - d) / 2;
        const nx = (b.x - a.x) / d;
        const ny = (b.y - a.y) / d;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
        const rel = Math.abs(a.speed - b.speed);
        if (rel > 200) {
          damageCar(G, a, 6);
          damageCar(G, b, 6);
          a.speed *= 0.6;
          b.speed *= 0.6;
        }
      }
    }
  }
  for (const car of G.cars) {
    if (car.wrecked || car.driver === 'player') continue;
    if (p.onFoot && Math.abs(car.speed) > 120 && dist(p.x, p.y, car.x, car.y) < 26) {
      hurtPlayer(G, 15);
    }
  }
  if (p.car && Math.abs(p.car.speed) > 150) {
    for (let i = G.peds.length - 1; i >= 0; i--) {
      if (dist(p.x, p.y, G.peds[i].x, G.peds[i].y) < 30) {
        G.peds.splice(i, 1);
        addWanted(G, 1, 'Hit a pedestrian');
      }
    }
  }

  // New systems, wired after combat in one place.
  updateHeli(G, dt);
  updateRadio(G, dt);
  updateDistrict(G, dt);
  updateMissionTimer(G, dt);
  updateBoats(G, dt);

  // Engine hum and siren follow the game state.
  if (G.audio) {
    if (p.car) {
      G.audio.startEngine();
      G.audio.setEngine(Math.abs(p.car.speed) / 520);
    } else {
      G.audio.setEngine(0);
    }
    G.audio.setSiren(G.wanted.stars > 0);
  }
}

function handleActions(G) {
  const input = G.input;
  if (!input) return;
  const pressed = input.pressed;
  if (G.screen === SCREEN_TITLE) {
    if (input.actions & ACTION_CONFIRM) {
      G.audio.unlock();
      G.audio.startMusic();
      startGame(G, true);
    } else if (pressed.has('KeyC') && G.hasSaveFlag) {
      G.audio.unlock();
      startGame(G, false);
    }
    return;
  }
  if (G.screen === SCREEN_PAUSED) {
    if (input.actions & ACTION_PAUSE) G.screen = SCREEN_PLAY;
    else if (pressed.has('KeyT')) G.screen = SCREEN_TITLE;
    return;
  }
  if (G.screen === SCREEN_OVER || G.screen === SCREEN_WON) {
    if (input.actions & ACTION_CONFIRM) startGame(G, true);
    return;
  }
  // SCREEN_PLAY.
  if (input.actions & ACTION_PAUSE) {
    G.screen = SCREEN_PAUSED;
    return;
  }
  if (input.actions & ACTION_SAVE) {
    saveGame(G);
    G.toast = 'Game saved';
    G.toastT = 2;
    return;
  }
  if (input.actions & ACTION_MUTE) {
    G.audio.setMuted(!G.audio.isMuted());
    G.toast = G.audio.isMuted() ? 'Muted' : 'Sound on';
    G.toastT = 1.5;
    return;
  }
  if (G.dialogue.active) {
    if (input.actions & ACTION_CONFIRM) advanceDialog(G);
    return;
  }
  if (pressed.has('KeyR')) nextStation(G);
  if (pressed.has('Digit1')) selectWeapon(G, 0);
  if (pressed.has('Digit2')) selectWeapon(G, 1);
  if (pressed.has('Digit3')) selectWeapon(G, 2);
  if (pressed.has('Digit4')) selectWeapon(G, 3);
  if (input.actions & ACTION_ENTER_CAR) {
    if (G.player.onFoot) {
      const car = G.nearCar;
      if (car) {
        if (car.driver === 'traffic') addWanted(G, 1, 'Stole a car');
        enterCar(G, car);
        G.audio.click();
      }
    } else {
      exitCar(G);
    }
    return;
  }
  if (input.actions & ACTION_PUNCH) punch(G);
  if (input.mouse.clicked) {
    const cam = cameraOf(G);
    const tx = cam.x + input.mouse.x / cam.zoom;
    const ty = cam.y + input.mouse.y / cam.zoom;
    shoot(G, tx, ty);
  }
}

export function startGame(G, fresh) {
  const keep = {
    input: G.input,
    audio: G.audio,
    renderer: G.renderer,
    stepWorld: G.stepWorld,
    saveGame: G.saveGame,
    screenNow: G.screenNow,
    isOpenGround: G.isOpenGround,
    test: G.test,
  };
  const rebuilt = createGame(G.seed);
  Object.assign(G, rebuilt, keep);
  if (!fresh) {
    const data = loadSave();
    if (data) {
      applySave(G, data);
      openBriefing(G);
      prepareStep(G);
    }
  }
  G.screen = SCREEN_PLAY;
  G.hasSaveFlag = hasSave();
}

function endGame(G) {
  if (G.busted || G.wasted) {
    if (!G.endPlayed) {
      G.endPlayed = true;
      if (G.busted) G.audio.busted();
      else G.audio.wasted();
    }
    G.screen = SCREEN_OVER;
  } else if (G.gameWon) {
    G.screen = SCREEN_WON;
  }
}

export function runGame(canvas) {
  const params = new URLSearchParams(window.location.search);
  const seed = parseInt(params.get('seed') || '7', 10) || 7;
  const shot = params.get('shot');
  const renderer = createRenderer(canvas);
  const G = createGame(seed);
  G.input = createInput(canvas);
  G.renderer = renderer;
  window.__pv = G;
  if (shot) {
    const staged = stageShot(shot, G);
    G.screen = staged || SCREEN_PLAY;
  }
  let last = performance.now();
  let acc = 0;
  let painted = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt < 0) dt = 0;
    handleActions(G);
    if (G.screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        stepWorld(G, STEP);
        acc -= STEP;
      }
      endGame(G);
    }
    renderer.draw(G, G.screen);
    if (shot) {
      painted += 1;
      if (painted >= 2 && !window.__shotReady) window.__shotReady = true;
    }
    endFrame(G.input);
  }
  requestAnimationFrame(frame);
  return G;
}

if (typeof document !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) runGame(canvas);
}
