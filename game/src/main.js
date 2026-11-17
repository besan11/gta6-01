// main.js — Boot and the one loop for Porto Verde: Three Days in the Sun.
// Features: builds the whole game state (city, player, cars, traffic, pedestrians,
// police, wanted level, 12 missions, clock, save), runs the fixed 1/60 s loop,
// moves between title / play / paused / wasted / busted / won screens, wires every
// input to its action, autosaves after missions, and stages the four screenshot
// scenes behind ?shot=cover|title|chase|mission (with &seed=N), painting twice
// and setting window.__shotReady for the screenshot.
//
// ?seed=N fixes the city and the traffic. ?shot=... stages that scene instead of
// running the loop.
import { CLOCK, STEP } from './config.js';
import { createRandom, clamp, dist } from './random.js';
import { createCity, collideBuildings } from './world.js';
import { createPlayer, updatePlayerOnFoot, nearestCar, hurtPlayer } from './player.js';
import { CAR_MODELS, createCar, driveCar, enterCar, exitCar, damageCar, spawnParkedCars } from './cars.js';
import { createTraffic, updateTraffic } from './traffic.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice } from './police.js';
import { createWanted, updateWanted } from './wanted.js';
import { createMissions, updateMissions, openBriefing, prepareStep, advanceDialog } from './missions.js';
import { punch, shoot, updateCombat } from './combat.js';
import { createAudio } from './audio.js';
import { saveGame, loadSave, hasSave, applySave } from './save.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WON } from './render.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE } from './input.js';
import { stageShot } from './shots.js';
import { ROADS_X, ROADS_Y } from './config.js';

const MAX_FRAME = 0.25;
const COP_MODEL = { name: 'PVPD Interceptor', color: '#22447f', topSpeed: 560, accel: 520 };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

/** Build a fresh game: the whole world, the player, and every system. */
export function createGame(seedValue) {
  const random = createRandom(seedValue);
  const G = {
    random,
    seed: seedValue,
    city: null,
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
    clock: { day: CLOCK.startDay, hour: CLOCK.startHour, minute: CLOCK.startMinute },
    time: 0,
    clockAcc: 0,
    toast: '',
    toastT: 0,
    dayBanner: 'DAY 1 — WELCOME TO PORTO VERDE',
    dayBannerT: 4,
    audio: createAudio(),
    input: null,
    busted: false,
    wasted: false,
    gameWon: false,
    shotsFired: 0,
    bustTimer: 0,
    nearCar: null,
    hasSaveFlag: hasSave(),
  };
  G.city = createCity(random);
  // Never spawn the player inside a building: nudge him out onto the street.
  const spawn = collideBuildings(G.city.buildings, G.player.x, G.player.y, 16);
  G.player.x = spawn.x;
  G.player.y = spawn.y;
  G.traffic = createTraffic(G, 16);
  G.peds = createPedestrians(G, 26);
  spawnParkedCars(G, 14);
  // The player's own starter car waits by the Marina Cafe.
  const starter = createCar(700, 540, Math.PI / 2, CAR_MODELS[0], 'none');
  G.cars.push(starter);
  G.saveGame = () => saveGame(G);
  prepareStep(G);
  return G;
}

/** Advance the living world one fixed step. `ambient` = title backdrop (no crime, no missions). */
function stepWorld(G, move, dt, ambient) {
  G.time += dt;
  if (!ambient) {
    G.clockAcc += dt;
    while (G.clockAcc >= 1) {
      G.clockAcc -= 1;
      G.clock.minute += CLOCK.minutesPerSecond;
      if (G.clock.minute >= 60) { G.clock.minute = 0; G.clock.hour += 1; }
      if (G.clock.hour >= 24) G.clock.hour = 0;
    }
  }
  if (G.toastT > 0) G.toastT -= dt;
  if (G.dayBannerT > 0) G.dayBannerT -= dt;
  for (let i = G.effects.length - 1; i >= 0; i -= 1) {
    G.effects[i].t -= dt;
    if (G.effects[i].t <= 0) G.effects.splice(i, 1);
  }
  const p = G.player;
  if (p.onFoot) {
    updatePlayerOnFoot(G, dt, move, G.input ? G.input.running() : false, G.mouseWorld || null);
  } else if (p.car) {
    driveCar(G, p.car, move, dt);
    p.x = p.car.x;
    p.y = p.car.y;
    p.angle = p.car.angle;
  }
  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  if (!ambient) {
    updatePolice(G, dt);
    updateWanted(G, dt);
    updateMissions(G, dt);
    updateCombat(G, dt);
    // The courier flees the player down the streets.
    const chase = G.missions.chaseCar;
    if (chase && !chase.wrecked && chase.driver === 'chase') {
      const px = p.car ? p.car.x : p.x;
      const py = p.car ? p.car.y : p.y;
      const away = Math.atan2(chase.y - py, chase.x - px);
      let turn = away - chase.angle;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      chase.angle += clamp(turn, -2.4 * dt, 2.4 * dt);
      chase.speed = Math.min(chase.speed + 420 * dt, 470);
      const nx = chase.x + Math.cos(chase.angle) * chase.speed * dt;
      const ny = chase.y + Math.sin(chase.angle) * chase.speed * dt;
      const fixed = collideBuildings(G.city.buildings, nx, ny, 26);
      chase.x = clamp(fixed.x, 340, 3160);
      chase.y = clamp(fixed.y, 30, 2370);
      // Ramming the courier damages it.
      if (p.car && dist(p.car.x, p.car.y, chase.x, chase.y) < 62) {
        damageCar(G, chase, 26 * dt * 10);
        p.car.speed *= 0.96;
      }
      if (!p.car && dist(p.x, p.y, chase.x, chase.y) < 50) {
        damageCar(G, chase, 20 * dt * 10);
      }
    }
    // Traffic cars that hit the player on foot hurt him.
    if (p.onFoot) {
      for (const car of G.traffic) {
        if (!car.wrecked && dist(car.x, car.y, p.x, p.y) < 34 && Math.abs(car.speed) > 60) {
          if (hurtPlayer(G, 14)) G.wasted = true;
          car.speed *= 0.5;
        }
      }
    }
    // The player's car bumps traffic cars.
    if (p.car) {
      for (const car of G.traffic) {
        if (!car.wrecked && dist(car.x, car.y, p.car.x, p.car.y) < 58) {
          car.speed *= 0.6;
          p.car.speed *= 0.92;
        }
      }
    }
    if (p.car && p.car.wrecked) {
      exitCar(G);
      G.toast = 'Your car is wrecked!';
      G.toastT = 3;
    }
  }
  // Engine and siren follow the game.
  if (G.audio) {
    const driving = !!p.car && Math.abs(p.car.speed) > 10;
    G.audio.setEngine(p.car ? Math.abs(p.car.speed) / 560 : 0, driving);
  }
}

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const G = createGame(seed);
G.stepWorld = (move, dt, ambient) => stepWorld(G, move, dt, ambient);
const renderer = createRenderer(canvas);
// Debug handle for play-testing (read-only state inspection from the console).
window.__pv = G;

function announce(message) {
  status.textContent = message;
}

/** Convert a mouse position on the canvas (canvas-relative pixels) to world coordinates. */
function mouseToWorld(G, mx, my) {
  const rect = canvas.getBoundingClientRect();
  const lx = (mx / rect.width) * 1280;
  const ly = (my / rect.height) * 720;
  const p = G.player;
  const cx = p.car ? p.car.x : p.x;
  const cy = p.car ? p.car.y : p.y;
  const camX = Math.max(0, Math.min(3200 - 1280, cx - 640));
  const camY = Math.max(0, Math.min(2400 - 720, cy - 360));
  return { x: camX + lx, y: camY + ly };
}

function runShot(name) {
  const scene = stageShot(name, G);
  let painted = 0;
  function paint() {
    renderer.draw(G, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  G.input = input;
  let screen = SCREEN_TITLE;
  G.screenNow = () => screen;
  let accumulator = 0;
  let last = performance.now();

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyC' && screen === SCREEN_TITLE && G.hasSaveFlag) {
      const data = loadSave();
      if (data) {
        applySave(G, data);
        prepareStep(G);
        openBriefing(G);
        screen = SCREEN_PLAY;
        G.audio.unlock();
        announce('Continuing your saved game.');
      }
    }
    if (event.code === 'KeyT' && screen === SCREEN_PAUSED) {
      screen = SCREEN_TITLE;
      announce('Title screen.');
    }
  });

  function startGame(fresh) {
    if (fresh) {
      const freshG = createGame(seed);
      Object.keys(G).forEach((k) => { if (k !== 'input' && k !== 'stepWorld' && k !== 'saveGame') delete G[k]; });
      Object.assign(G, freshG);
      G.input = input;
      G.stepWorld = (move, dt, ambient) => stepWorld(G, move, dt, ambient);
      G.saveGame = () => saveGame(G);
      G.screenNow = () => screen;
    }
    G.busted = false;
    G.wasted = false;
    G.gameWon = false;
    accumulator = 0;
    screen = SCREEN_PLAY;
    openBriefing(G);
    G.audio.unlock();
    announce('Playing. Mission 1: Welcome Home.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    G.audio.setSiren(false);
    announce(G.busted ? 'Busted by the police.' : 'Wasted.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      G.audio.setMuted(!G.audio.isMuted());
      G.toast = G.audio.isMuted() ? 'Sound muted' : 'Sound on';
      G.toastT = 1.5;
    }
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame(true);
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_WON) {
      if (actions & ACTION_CONFIRM) startGame(true);
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & ACTION_PAUSE) { screen = SCREEN_PLAY; announce('Playing.'); }
      else if (actions & ACTION_CONFIRM) { screen = SCREEN_PLAY; announce('Playing.'); }
      else if (actions & ACTION_SAVE) { saveGame(G); }
      return;
    }
    // SCREEN_PLAY — save, mute and pause work even while a briefing is open.
    if (actions & ACTION_SAVE) saveGame(G);
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (G.missions.dialog) {
      if (actions & ACTION_CONFIRM) advanceDialog(G);
      return;
    }
    if (actions & ACTION_ENTER_CAR) {
      if (G.player.onFoot) {
        const car = nearestCar(G, 78);
        if (car) { enterCar(G, car); G.audio.click(); }
      } else {
        exitCar(G);
        G.audio.click();
      }
    }
    if (actions & ACTION_PUNCH) punch(G);
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      stepWorld(G, { x: 0, y: 0 }, STEP, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const move = input.move();
    const mouse = input.mouse();
    G.mouseWorld = mouseToWorld(G, mouse.x, mouse.y);
    // Click (or Space while on foot with a target) shoots toward the mouse.
    if (input.takeClick() && !G.missions.dialog) {
      const target = mouseToWorld(G, mouse.x, mouse.y);
      shoot(G, target.x, target.y);
    }
    G.nearCar = G.player.onFoot ? nearestCar(G, 78) : null;
    stepWorld(G, move, STEP, false);
    if (G.wasted || G.busted) endGame();
    else if (G.gameWon) { screen = SCREEN_WON; G.audio.setSiren(false); announce('You won — Porto Verde is yours.'); }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(G, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Porto Verde: Three Days in the Sun. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
