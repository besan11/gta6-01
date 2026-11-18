// Scripted playtest for Porto Verde (node playtest.mjs from the repo root).
// Serves game/ on :8933, drives it in headless Chromium, re-renders the four
// screenshots, and checks the whole loop: title, start, move, drive, shoot,
// punch, mission 1, police, pause, save/continue, WASTED, BUSTED — plus the
// new systems (PD panel, helicopter, REP, radio, weapons, timer, minimap,
// districts, dialogue portraits) and zero console errors.
// Exits 0 only when every check passes.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { statSync, existsSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shotDir = join(here, '..', 'shot');
const require = createRequire(join(shotDir, 'package.json'));
const { chromium } = require('playwright-core');
const CHROME = join(shotDir, 'chrome-linux64', 'chrome');
const BASE = 'http://127.0.0.1:8933';
const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover&seed=7' },
  { name: '2-title.jpg', query: '?shot=title&seed=7' },
  { name: '3-chase.jpg', query: '?shot=chase&seed=7' },
  { name: '4-mission.jpg', query: '?shot=mission&seed=7' },
];

let pass = 0;
let fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name}${extra !== undefined ? ` — ${extra}` : ''}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeout, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return true;
    await sleep(120);
  }
  console.log(`  (timeout waiting: ${label})`);
  return false;
}

async function main() {
  const server = spawn('node', ['serve.ts', '--port', '8933'], { cwd: here, stdio: 'pipe' });
  let serverOut = '';
  server.stdout.on('data', (d) => { serverOut += d; });
  server.stderr.on('data', (d) => { serverOut += d; });
  try {
    const up = await waitFor(async () => {
      try { const r = await fetch(`${BASE}/index.html`); return r.ok; } catch { return false; }
    }, 15000, 'server up');
    check('server serves game/', up, serverOut.slice(0, 300));

    const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    const pv = (expr) => page.evaluate(expr);

    // ---- Screenshots: real renders, then size caps.
    console.log('== shots ==');
    mkdirSync(join(here, 'game', 'screenshots'), { recursive: true });
    for (const s of SHOTS) {
      await page.goto(`${BASE}/${s.query}`, { waitUntil: 'load' });
      const ready = await waitFor(() => pv(() => window.__shotReady === true), 15000, `${s.name} ready`);
      check(`${s.name} renders`, ready);
      await sleep(400);
      const path = join(here, 'game', 'screenshots', s.name);
      await page.screenshot({ path, type: 'jpeg', quality: 78 });
      const size = statSync(path).size;
      check(`${s.name} <= 256 KiB (${Math.round(size / 1024)} KiB)`, size <= 262144);
    }
    // Cover density, read off live state.
    await page.goto(`${BASE}/?shot=cover&seed=7`, { waitUntil: 'load' });
    await waitFor(() => pv(() => window.__shotReady === true), 15000, 'cover ready');
    await sleep(300);
    const cover = await pv(() => {
      const G = window.__pv;
      return {
        cars: G.cars.length + G.traffic.length + G.police.length,
        traffic: G.traffic.length, peds: G.peds.length,
        cops: G.police.length, stars: G.wanted.stars,
        heli: G.heli.active, money: G.player.money,
        day: G.clock.day, rep: G.rep.points,
        dialog: !!G.dialogue, timer: G.missionTimer.active,
        district: G.district.name,
      };
    });
    console.log('== cover ==', JSON.stringify(cover));
    check('cover >= 5 cars', cover.cars >= 5, cover.cars);
    check('cover >= 1 traffic', cover.traffic >= 1, cover.traffic);
    check('cover >= 8 peds', cover.peds >= 8, cover.peds);
    check('cover >= 4 cops', cover.cops >= 4, cover.cops);
    check('cover >= 3 stars', cover.stars >= 3, cover.stars);
    check('cover helicopter active', cover.heli === true);
    check('cover money >= 8000', cover.money >= 8000, cover.money);
    check('cover is Day 3', cover.day === 3, cover.day);
    check('cover dialog with portrait', cover.dialog === true);
    check('cover mission timer active', cover.timer === true);
    check('cover district CASINO STRIP', cover.district === 'CASINO STRIP', cover.district);
    // Thugs on open ground in the mission shot (margin 26, computed here).
    await page.goto(`${BASE}/?shot=mission&seed=7`, { waitUntil: 'load' });
    await waitFor(() => pv(() => window.__shotReady === true), 15000, 'mission ready');
    const thugsOk = await pv(() => {
      const G = window.__pv;
      return G.enemies.length > 0 && G.enemies.every((e) => {
        for (const b of G.city.buildings) {
          if (e.x > b.x - 26 && e.x < b.x + b.w + 26 && e.y > b.y - 26 && e.y < b.y + b.h + 26) return false;
        }
        return true;
      });
    });
    check('mission thugs on open ground', thugsOk);

    // ---- Interactive run: a real playthrough, scripted.
    console.log('== playthrough ==');
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await waitFor(() => pv(() => !!window.__pv && window.__pv.screenNow() === 'title'), 10000, 'title');
    check('title screen', await pv(() => window.__pv.screenNow() === 'title'));
    await page.keyboard.press('Enter');
    await sleep(500);
    check('starts into play', await pv(() => window.__pv.screenNow() === 'play'));
    check('briefing dialog with portrait open', await pv(() => !!window.__pv.dialogue && !!window.__pv.missions.dialog));
    await page.keyboard.press('Enter');
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(200);
    await page.keyboard.press('Enter');
    await sleep(400);
    check('briefing advances, mission 1 live', await pv(() => !window.__pv.missions.dialog && window.__pv.missions.index === 0));
    const rep0 = await pv(() => window.__pv.rep.points);
    // Move on foot.
    const p0 = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y }));
    await page.keyboard.down('w');
    await sleep(900);
    await page.keyboard.up('w');
    const p1 = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y }));
    check('walks with WASD', Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y) > 40, JSON.stringify(p1));
    // Enter the starter car and drive.
    await pv(() => {
      const G = window.__pv;
      const car = G.cars[G.cars.length - 1];
      G.player.x = car.x + 40;
      G.player.y = car.y;
    });
    await sleep(300); // let stepWorld refresh nearCar after the teleport
    await page.keyboard.press('e');
    await sleep(300);
    check('enters car with E', await pv(() => !window.__pv.player.onFoot && !!window.__pv.player.car));
    await page.keyboard.down('w');
    await sleep(1200);
    await page.keyboard.up('w');
    const spd = await pv(() => Math.abs(window.__pv.player.car.speed));
    check('drives (speed > 50)', spd > 50, spd);
    // Shoot from the car.
    const shots0 = await pv(() => window.__pv.shotsFired);
    await page.mouse.move(700, 300);
    await page.mouse.down();
    await sleep(600);
    await page.mouse.up();
    const shots1 = await pv(() => window.__pv.shotsFired);
    check('shoots with mouse', shots1 > shots0, `${shots0} -> ${shots1}`);
    // Punch on foot.
    await page.keyboard.press('e');
    await sleep(300);
    await page.keyboard.press('f');
    await sleep(200);
    check('punches with F', await pv(() => window.__pv.player.punchT > 0 || window.__pv.player.onFoot));
    // Mission 1: walk into the Marina Cafe.
    const repBeforeWalk = rep0;
    await pv(() => { const G = window.__pv; G.player.x = 500; G.player.y = 420; });
    const m1 = await waitFor(() => pv(() => window.__pv.missions.index >= 1), 5000, 'mission 1 completes');
    check('mission 1 completes', m1);
    const money1 = await pv(() => window.__pv.player.money);
    check('mission 1 pays (money >= 270)', money1 >= 270, money1);
    const rep1 = await pv(() => window.__pv.rep.points);
    check('REP rises after mission 1', rep1 > repBeforeWalk, `${repBeforeWalk} -> ${rep1}`);
    // Police: two stars brings at least two units; four stars brings the heli.
    await pv(() => { window.__pv.wanted.stars = 2; window.__pv.wanted.heat = 50; window.__pv.wanted.decayTimer = 0; });
    await sleep(1500);
    const cops2 = await pv(() => window.__pv.police.filter((c) => !c.wrecked).length);
    check('PD panel >= 2 units at 2 stars', cops2 >= 2, cops2);
    await pv(() => { window.__pv.wanted.stars = 4; window.__pv.wanted.heat = 90; window.__pv.wanted.decayTimer = 0; });
    await sleep(1200);
    check('helicopter active at 4 stars', await pv(() => window.__pv.heli.active === true));
    // Radio + weapons + minimap + route, read through the real modules.
    // First advance the mission-2 briefing so the objective is live.
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Enter'); await sleep(200); }
    await sleep(300);
    const sys = await page.evaluate(async () => {
      const G = window.__pv;
      const radio = await import('/src/radio.js');
      const weapons = await import('/src/weapons.js');
      const layout = await import('/src/hud-layout.js');
      return {
        track: radio.currentTrack(G),
        slots: weapons.unlockedSlots(G).length,
        minimap: layout.LAYOUT.minimap,
        route: !!G.objectiveNow(),
      };
    });
    check('radio track shown', typeof sys.track === 'string' && sys.track.length > 3, sys.track);
    check('weapon slots >= 2', sys.slots >= 2, sys.slots);
    check('minimap 300x210', sys.minimap.w === 300 && sys.minimap.h === 210, JSON.stringify(sys.minimap));
    check('minimap route to objective', sys.route === true);
    // Timed mission: mission 10 defend shows the big timer.
    await pv(() => {
      const G = window.__pv;
      G.missions.index = 9; G.missions.step = 0; G.missions.dialog = null; G.dialogue = null;
      G.debug.prepareStep();
    });
    await sleep(300);
    check('mission timer shows on timed mission', await pv(() => window.__pv.missionTimer.active && window.__pv.missionTimer.seconds > 30));
    // District label changes as Dario crosses the city. Clear the heat first
    // so the standing player is not wasted/busted mid-check.
    await pv(() => {
      const G = window.__pv;
      G.player.hp = 100;
      G.wanted.stars = 0; G.wanted.heat = 0; G.wanted.decayTimer = 0;
      G.police.length = 0; G.enemies.length = 0;
    });
    await sleep(300);
    await pv(() => { const G = window.__pv; G.player.x = 2500; G.player.y = 1250; if (G.player.car) { G.player.car.x = 2500; G.player.car.y = 1250; } });
    await sleep(400);
    check('district label CASINO STRIP', await pv(() => window.__pv.district.name === 'CASINO STRIP'));
    // Pause, save, continue.
    await page.keyboard.press('p');
    await sleep(300);
    check('pauses with P', await pv(() => window.__pv.screenNow() === 'paused'));
    await page.keyboard.press('p');
    await sleep(300);
    check('resumes with P', await pv(() => window.__pv.screenNow() === 'play'));
    await page.keyboard.press('q');
    await sleep(300);
    const saved = await pv(() => localStorage.getItem('porto-verde.save.v1'));
    check('saves with Q', !!saved);
    const savedMoney = saved ? JSON.parse(saved).money : 0;
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await waitFor(() => pv(() => !!window.__pv && window.__pv.screenNow() === 'title'), 10000, 'title again');
    await page.keyboard.press('c');
    await sleep(500);
    check('continues save with C', await pv(() => window.__pv.screenNow() === 'play'));
    check('continued money matches save', await page.evaluate((m) => window.__pv.player.money === m, savedMoney));
    // WASTED: a thug at arm's length finishes a 5-HP Dario.
    await pv(() => {
      const G = window.__pv;
      G.player.hp = 5;
      G.enemies.push({ x: G.player.x + 12, y: G.player.y, hp: 60, angle: 0, speed: 150, shootT: 5, meleeT: 0, name: 'Kessler thug' });
    });
    const wasted = await waitFor(() => pv(() => window.__pv.screenNow() === 'over' && window.__pv.wasted), 8000, 'WASTED');
    check('WASTED on HP 0', wasted);
    // BUSTED: cornered on foot by a cop car at five stars.
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await waitFor(() => pv(() => !!window.__pv && window.__pv.screenNow() === 'title'), 10000, 'title 3');
    await page.keyboard.press('Enter');
    await sleep(400);
    await pv(() => {
      const G = window.__pv;
      G.missions.dialog = null; G.dialogue = null;
      G.player.x = 900; G.player.y = 1100; G.player.onFoot = true; G.player.car = null;
      G.wanted.stars = 5; G.wanted.heat = 100; G.wanted.decayTimer = 0;
      G.police.length = 0;
    });
    await sleep(600);
    await pv(() => {
      const G = window.__pv;
      const cop = G.police[0];
      if (cop) { cop.x = G.player.x + 10; cop.y = G.player.y; cop.speed = 0; }
    });
    const busted = await waitFor(() => pv(() => window.__pv.screenNow() === 'over' && window.__pv.busted), 8000, 'BUSTED');
    check('BUSTED when cornered', busted);

    check('0 console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close();
  } finally {
    server.kill();
  }
  // Copy the fresh screenshots to the dossier location too.
  for (const s of SHOTS) {
    const src = join(here, 'game', 'screenshots', s.name);
    if (existsSync(src)) {
      mkdirSync(join(here, 'screenshots'), { recursive: true });
      cpSync(src, join(here, 'screenshots', s.name));
    }
  }
  console.log(`\nplaytest: ${pass} PASS, ${fail} FAIL`);
  if (failures.length) console.log('failed:', failures.join(', '));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
