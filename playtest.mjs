// Porto Verde v6 — scripted playtest + screenshot runner.
// Serves game/ on :8933, drives the real game in headless Chromium, asserts the
// brief's checklist, renders the four shots (seed 7), and verifies the dossier
// is byte-identical across two runs. Exits non-zero on any failure.
import { chromium } from 'playwright-core';
import { spawn, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUD_LAYOUT } from './game/src/hud-layout.js';
import { districtAt } from './game/src/districts.js';
import { isOpenGround } from './game/src/world.js';
import { repRank } from './game/src/rep.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = '/home/hatch/workspace/goals/make-fun-account-setup/hidden_files/makefun/shot';
const CHROME = join(SHOT_DIR, 'chrome-linux64', 'chrome');
const PORT = 8933;
const BASE = `http://localhost:${PORT}/`;

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pv(page, expr) {
  const clean = expr.trim().replace(/;$/, '');
  return page.evaluate(new Function('return (' + clean + ')'));
}
async function waitFor(page, expr, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (await pv(page, expr)) return true;
    } catch { /* page still loading */ }
    await sleep(120);
  }
  return false;
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOut = '';
server.stdout.on('data', (d) => { serverOut += d; });
server.stderr.on('data', (d) => { serverOut += d; });
for (let i = 0; i < 40; i += 1) {
  await sleep(250);
  try {
    const res = await fetch(BASE);
    if (res.ok) break;
  } catch { /* not up yet */ }
}

const errors = [];
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

try {
  // --- Static module checks (no browser needed) ---
  check('minimap is 300x210', HUD_LAYOUT.minimap.w === 300 && HUD_LAYOUT.minimap.h === 210, HUD_LAYOUT.minimap.w + 'x' + HUD_LAYOUT.minimap.h);
  check('districtAt Marina Cafe is MARINA NORTE', districtAt(500, 420).name === 'MARINA NORTE');
  check('districtAt Casino is CASINO STRIP', districtAt(2500, 1250).name === 'CASINO STRIP');
  check('REP rank 1240 is PLAYER', repRank(1240).name === 'PLAYER');

  // --- Title + start ---
  await page.goto(BASE + '?seed=7', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  check('title screen shows', await pv(page, `window.__pv.screenNow() === 0`));
  check('no dialogue before start (title is clean)', await pv(page, `window.__pv.dialogue.lines === null`));
  await page.keyboard.press('Enter');
  await sleep(400);
  check('Enter starts the game', await pv(page, `window.__pv.screenNow() === 1`));
  check('mission 1 briefing dialogue active', await pv(page, `window.__pv.dialogue.lines !== null`));

  // --- Walk ---
  const before = await pv(page, `({x: window.__pv.player.x, y: window.__pv.player.y})`);
  await page.keyboard.down('KeyW');
  await sleep(700);
  await page.keyboard.up('KeyW');
  const after = await pv(page, `({x: window.__pv.player.x, y: window.__pv.player.y})`);
  check('walking moves the player', Math.hypot(after.x - before.x, after.y - before.y) > 40, `moved ${Math.round(Math.hypot(after.x - before.x, after.y - before.y))}px`);

  // --- Enter car + drive ---
  await pv(page, `window.__pv.player.x = 534, window.__pv.player.y = 500`);
  await sleep(200);
  await page.keyboard.press('KeyE');
  await sleep(300);
  check('E enters the starter car', await pv(page, `window.__pv.player.car !== null && !window.__pv.player.onFoot`));
  await page.keyboard.down('KeyW');
  await sleep(900);
  await page.keyboard.up('KeyW');
  const speed = await pv(page, `Math.abs(window.__pv.player.car.speed)`);
  check('driving builds speed', speed > 50, `speed ${Math.round(speed)}`);
  await page.keyboard.press('KeyE');
  await sleep(200);
  check('E exits the car', await pv(page, `window.__pv.player.onFoot === true`));

  // --- Punch + shoot ---
  await page.keyboard.press('KeyF');
  await sleep(150);
  check('punch triggers cooldown', await pv(page, `window.__pv.player.punchT > 0`));
  const shotsBefore = await pv(page, `window.__pv.shotsFired`);
  await page.mouse.click(700, 300);
  await sleep(300);
  const shotsAfter = await pv(page, `window.__pv.shotsFired`);
  check('mouse click fires a shot', shotsAfter > shotsBefore, `${shotsBefore} -> ${shotsAfter}`);

  // --- Mission 1 completes, money + REP ---
  await pv(page, `window.__pv.player.x = 500, window.__pv.player.y = 420`);
  const m1 = await waitFor(page, `window.__pv.missions.index === 1`, 6000);
  const money1 = await pv(page, `window.__pv.player.money`);
  check('mission 1 completes at the Marina Cafe', m1, `money $${money1}`);
  check('mission 1 pays (money >= 270)', money1 >= 270, `$${money1}`);
  check('REP rises after mission 1', await pv(page, `window.__pv.rep.points >= 150`), `REP ${(await pv(page, `window.__pv.rep.points`))}`);

  // --- Radio + weapons visible ---
  const radio = await pv(page, `({station: window.__pv.radio.station, track: window.__pv.radio.track})`);
  check('radio station active', radio.station === 0 && radio.track === 0, `station ${radio.station} track ${radio.track}`);
  await page.keyboard.press('KeyR');
  await sleep(200);
  check('R changes station', await pv(page, `window.__pv.radio.station === 1`));
  await page.keyboard.press('KeyR');
  await page.keyboard.press('KeyR');
  const slots = await pv(page, `window.__pv.weapons.slots.map(s => s.name + ':' + (s.unlocked ? 'open' : 'locked'))`);
  check('weapon slots present (4 slots, 2 open at start)', slots.length === 4 && slots.filter((s) => s.includes('open')).length >= 2, slots.join(', '));
  await page.keyboard.press('Digit1');
  await sleep(150);
  check('Digit1 selects Fists', await pv(page, `window.__pv.weapons.selected === 0`));
  await page.keyboard.press('Digit2');
  await sleep(150);
  check('Digit2 selects Tide 9mm', await pv(page, `window.__pv.weapons.selected === 1`));

  // --- District label changes ---
  await pv(page, `window.__pv.player.x = 2500, window.__pv.player.y = 1250`);
  await sleep(600);
  check('district label switches to CASINO STRIP', await pv(page, `window.__pv.district.name === 'CASINO STRIP'`), await pv(page, `window.__pv.district.name`));

  // --- Police response + helicopter ---
  await pv(page, `window.__pvDebug.addWanted(2, 'test');`);
  await sleep(1500);
  const cops2 = await pv(page, `window.__pv.police.length`);
  check('PD panel data: >=2 units at wanted 2', cops2 >= 2, `${cops2} units`);
  await pv(page, `window.__pvDebug.addWanted(2, 'test');`);
  await sleep(1500);
  check('helicopter active at wanted 4', await pv(page, `window.__pv.heli.active === true`));
  check('4+ cops at wanted 4', await pv(page, `window.__pv.police.length >= 4`), `${await pv(page, `window.__pv.police.length`)} units`);

  // --- Mission timer (defend mission 10) ---
  await pv(page, `window.__pvDebug.setMission(9), window.__pvDebug.openBriefing(), window.__pvDebug.prepareStep()`);
  await sleep(400);
  check('defend timer active on mission 10', await pv(page, `window.__pv.missionTimer.active === true && window.__pv.missionTimer.remaining > 30`), `remaining ${await pv(page, `Math.round(window.__pv.missionTimer.remaining)`)}s`);

  // --- Pause ---
  await page.keyboard.press('KeyP');
  await sleep(200);
  check('P pauses', await pv(page, `window.__pv.screenNow() === 2`));
  await page.keyboard.press('KeyP');
  await sleep(200);
  check('P resumes', await pv(page, `window.__pv.screenNow() === 1`));

  // --- Save + Continue ---
  const savedMission = await pv(page, `window.__pv.missions.index`);
  await page.keyboard.press('KeyQ');
  await sleep(300);
  check('Q saves', await pv(page, `localStorage.getItem('porto-verde.save.v1') !== null`));
  await page.goto(BASE + '?seed=7', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  await page.keyboard.press('KeyC');
  await sleep(400);
  check('C continues the save', await pv(page, `window.__pv.screenNow() === 1 && window.__pv.missions.index === ${savedMission}`), `mission ${await pv(page, `window.__pv.missions.index`)}`);

  // --- WASTED ---
  await pv(page, `window.__pv.player.hp = 0;`);
  await sleep(600);
  check('WASTED path reaches game over', await pv(page, `window.__pv.screenNow() === 3 && window.__pv.wasted === true`));

  // --- BUSTED ---
  await page.goto(BASE + '?seed=7', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  await page.keyboard.press('Enter');
  await sleep(300);
  await pv(page, `window.__pvDebug.addWanted(5, 'test');`);
  await sleep(1200);
  await pv(page, `(() => { const c = window.__pv.police[0]; if (c) { c.x = window.__pv.player.x + 20; c.y = window.__pv.player.y; c.speed = 0; } return !!c; })()`);
  const busted = await waitFor(page, `window.__pv.busted === true`, 8000);
  check('BUSTED path reaches game over', busted);

  // --- Shots (seed 7) ---
  const shots = [
    ['cover', '1-cover.jpg'],
    ['title', '2-title.jpg'],
    ['chase', '3-chase.jpg'],
    ['mission', '4-mission.jpg'],
  ];
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  mkdirSync(join(HERE, 'game', 'screenshots'), { recursive: true });
  for (const [name, file] of shots) {
    const shotPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    shotPage.on('console', (m) => { if (m.type() === 'error') errors.push('shot ' + name + ' console: ' + m.text()); });
    shotPage.on('pageerror', (e) => errors.push('shot ' + name + ' pageerror: ' + e.message));
    await shotPage.goto(BASE + `?shot=${name}&seed=7`, { waitUntil: 'load' });
    await shotPage.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    await sleep(150);
    const outPath = join(HERE, 'screenshots', file);
    await shotPage.screenshot({ path: outPath, type: 'jpeg', quality: 85 });
    copyFileSync(outPath, join(HERE, 'game', 'screenshots', file));
    check(`shot ${name} rendered`, existsSync(outPath));
    await shotPage.close();
  }

  // --- Cover density asserts (fresh cover page) ---
  const coverPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  coverPage.on('pageerror', (e) => errors.push('cover pageerror: ' + e.message));
  await coverPage.goto(BASE + '?shot=cover&seed=7', { waitUntil: 'load' });
  await coverPage.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
  const cover = await pv(coverPage, `({
    cars: window.__pv.cars.filter(c => !c.wrecked).length,
    traffic: window.__pv.traffic.filter(c => !c.wrecked).length,
    peds: window.__pv.peds.length,
    cops: window.__pv.police.length,
    stars: window.__pv.wanted.stars,
    money: window.__pv.player.money,
    day: window.__pv.clock.day,
    heli: window.__pv.heli.active,
    dialog: window.__pv.dialogue.lines !== null,
    rep: window.__pv.rep.points,
    timer: window.__pv.missionTimer.active,
  })`);
  check('cover: >=5 cars', cover.cars >= 5, `${cover.cars} cars`);
  check('cover: >=1 traffic', cover.traffic >= 1, `${cover.traffic}`);
  check('cover: >=8 peds', cover.peds >= 8, `${cover.peds}`);
  check('cover: 4 cops', cover.cops === 4, `${cover.cops}`);
  check('cover: >=3 stars', cover.stars >= 3, `${cover.stars} stars`);
  check('cover: money >= 8000', cover.money >= 8000, `$${cover.money}`);
  check('cover: Day 3', cover.day === 3);
  check('cover: helicopter active', cover.heli === true);
  check('cover: dialogue visible', cover.dialog === true);
  check('cover: REP visible (>=1000)', cover.rep >= 1000, `REP ${cover.rep}`);
  check('cover: mission timer visible', cover.timer === true);
  await coverPage.close();

  // --- Mission shot: thugs on open ground ---
  const missionPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await missionPage.goto(BASE + '?shot=mission&seed=7', { waitUntil: 'load' });
  await missionPage.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
  const thugs = await pv(missionPage, `window.__pv.enemies.map(e => ({x: e.x, y: e.y}))`);
  const buildings = await pv(missionPage, `window.__pv.city.buildings`);
  const allOpen = thugs.length >= 3 && thugs.every((t) => isOpenGround(buildings, t.x, t.y, 26));
  check('mission shot: 3 thugs on open ground (margin 26)', allOpen, `${thugs.length} thugs`);
  await missionPage.close();

  check('0 console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('playtest ran without harness crash', false, String(e && e.message));
} finally {
  await browser.close();
  server.kill();
}

// --- Dossier determinism: two main.ts runs, same sha256 ---
try {
  rmSync('/tmp/pv6-dos-a', { recursive: true, force: true });
  rmSync('/tmp/pv6-dos-b', { recursive: true, force: true });
  execSync('MAKEFUN_OUTPUT_DIR=/tmp/pv6-dos-a node main.ts', { cwd: HERE, stdio: 'pipe' });
  execSync('MAKEFUN_OUTPUT_DIR=/tmp/pv6-dos-b node main.ts', { cwd: HERE, stdio: 'pipe' });
  const a = createHash('sha256').update(readFileSync('/tmp/pv6-dos-a/dossier.json')).digest('hex');
  const b = createHash('sha256').update(readFileSync('/tmp/pv6-dos-b/dossier.json')).digest('hex');
  check('dossier sha256 identical across 2 runs', a === b, a.slice(0, 16) + '...');
  writeFileSync('/tmp/pv6-dossier-sha.txt', a + '\n');
} catch (e) {
  check('dossier determinism runs', false, String(e && e.message));
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
console.log(`\nPLAYTEST: ${passed}/${results.length} PASS`);
if (failed.length > 0) {
  console.log('FAILURES:');
  for (const f of failed) console.log(' - ' + f.name + ' — ' + f.detail);
  process.exit(1);
}
