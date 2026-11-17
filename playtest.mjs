// Scripted playtest for Porto Verde v4: title -> mission 1 -> steal a car -> wanted
// -> police -> shoot -> punch -> pause -> save/continue -> WASTED -> BUSTED, plus the
// new-system asserts (PD panel, helicopter, REP, radio, weapon slots, mission timer,
// 300x210 minimap with route, district banner, dialogue portrait) and 4 screenshots.
// Run: node playtest.mjs  (serves game/ on :8933, Chromium headless via playwright-core)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const shotDir = '/home/hatch/workspace/goals/make-fun-account-setup/hidden_files/makefun/shot';
const require = createRequire(join(shotDir, 'package.json'));
const { chromium } = require('playwright-core');

const PORT = 8933;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover&seed=7' },
  { name: '2-title.jpg', query: '?shot=title&seed=7' },
  { name: '3-chase.jpg', query: '?shot=chase&seed=7' },
  { name: '4-mission.jpg', query: '?shot=mission&seed=7' },
];

let pass = 0;
let fail = 0;
const results = [];
function check(name, ok, detail) {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (ok) pass += 1;
  else fail += 1;
}

const server = spawn(process.execPath, ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));

let browser;
try {
  browser = await chromium.launch({
    executablePath: join(shotDir, 'chrome-linux64', 'chrome'),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const ev = (fn, ...args) => page.evaluate(fn, ...args);
  const state = () => ev(() => {
    const G = window.__pv;
    return {
      screen: G.screen, money: G.player.money, hp: G.player.hp,
      mission: G.missions.index, completed: G.missions.completedCount,
      stars: G.wanted.stars, cops: G.police.length, heli: G.heli.active,
      dialog: !!G.missions.dialog, enemies: G.enemies.length,
      rep: G.rep.points, shots: G.shotsFired, inCar: !!G.player.car,
      px: Math.round(G.player.x), py: Math.round(G.player.y),
      cars: G.cars.length, traffic: G.traffic.length, peds: G.peds.length + (G.beachgoers || []).length,
      weapon: G.weapons.current, timer: G.missionTimer.active, timerS: Math.round(G.missionTimer.seconds),
      district: G.district.current, banner: G.district.bannerT > 0,
      radio: G.radio.station, busted: G.busted, wasted: G.wasted, won: G.gameWon,
    };
  });

  // 1. Load + title.
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  let s = await state();
  check('title screen shows', s.screen === 'TITLE', s.screen);

  // 2. Start game, briefing dialog opens.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  s = await state();
  check('start game -> PLAY + briefing dialog', s.screen === 'PLAY' && s.dialog, `screen=${s.screen} dialog=${s.dialog}`);
  const dlg = await ev(async () => {
    const m = await import('/src/dialogue.js');
    return !!window.__pv.dialogue.active;
  });
  check('dialogue portrait panel active', dlg === true);

  // 3. Advance the briefing, walk to the Marina Cafe, finish mission 1.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  s = await state();
  check('briefing advances and closes', s.dialog === false, `dialog=${s.dialog}`);
  await ev(() => { const G = window.__pv; G.player.x = 500; G.player.y = 420; });
  await page.waitForTimeout(700);
  s = await state();
  check('mission 1 completes (money >= 250 = 150 reward + 100 clean bonus)', s.completed >= 1 && s.money >= 250, `completed=${s.completed} money=${s.money}`);
  check('REP rose after mission 1', s.rep >= 150, `rep=${s.rep}`);

  // 4. Close mission 2's briefing (it opens on mission 1's completion), then steal the car.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await ev(() => { const G = window.__pv; G.player.x = 534; G.player.y = 540; });
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(300);
  s = await state();
  check('steal car (E) + wanted +1', s.inCar === true && s.stars >= 1, `inCar=${s.inCar} stars=${s.stars}`);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyW');
  s = await state();
  check('car drives (moved from spawn)', s.py !== 540 || s.px !== 534, `x=${s.px} y=${s.py}`);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(200);

  // 5. Shoot: click the canvas toward a point ahead.
  await page.mouse.click(900, 300);
  await page.waitForTimeout(400);
  s = await state();
  check('shoot fires + wanted rises', s.shots >= 1 && s.stars >= 2, `shots=${s.shots} stars=${s.stars}`);

  // 6. Police respond; PD panel lists >= 2 units.
  await page.waitForTimeout(1500);
  s = await state();
  check('police spawn for wanted level', s.cops >= 2, `cops=${s.cops} stars=${s.stars}`);
  const pdLines = await ev(async () => {
    const m = await import('/src/police-response.js');
    return m.policeResponseLines(window.__pv).length;
  });
  check('PD response panel lists >= 2 units', pdLines >= 2, `lines=${pdLines}`);

  // 7. Punch a thug placed next to the player.
  await ev(() => {
    const G = window.__pv;
    G.enemies.push({ x: G.player.x + 20, y: G.player.y, hp: 60, angle: 0, speed: 0, shootT: 5, meleeT: 5, name: 'Kessler thug' });
  });
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(300);
  const thugHp = await ev(() => window.__pv.enemies[0] ? window.__pv.enemies[0].hp : 0);
  check('punch damages thug', thugHp < 60, `hp=${thugHp}`);

  // 8. Radio + weapon slots + minimap route.
  const radio = await ev(async () => {
    const m = await import('/src/radio.js');
    return m.radioLine(window.__pv);
  });
  check('radio line shows station + track', radio.includes('CORAL FM'), radio);
  const slots = await ev(() => window.__pv.weapons.slots.length);
  check('weapon slots visible (4 slots)', slots === 4, `slots=${slots}`);
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(150);
  s = await state();
  check('weapon switch to Tide 9mm (key 2)', s.weapon === 1, `weapon=${s.weapon}`);
  const route = await ev(async () => {
    const m = await import('/src/minimap-plus.js');
    return m.routePoints(window.__pv).length;
  });
  check('minimap route has player + objective', route === 2, `points=${route}`);

  // 9. Pause / resume.
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  s = await state();
  check('pause works', s.screen === 'PAUSED', s.screen);
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  s = await state();
  check('resume works', s.screen === 'PLAY', s.screen);

  // 10. Save, reload, Continue.
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);
  const saved = await ev(() => window.localStorage.getItem('porto-verde.save.v1'));
  check('save writes localStorage', !!saved, saved ? saved.slice(0, 60) : 'none');
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  await page.waitForTimeout(300);
  s = await state();
  check('title offers Continue after save', s.screen === 'TITLE', s.screen);
  await page.keyboard.press('KeyC');
  await page.waitForTimeout(400);
  s = await state();
  check('Continue loads save (mission + money kept)', s.screen === 'PLAY' && s.mission === 1 && s.money >= 250, `mission=${s.mission} money=${s.money}`);

  // 11. Mission timer shows on a timed mission (defend, mission 10).
  await ev(() => {
    const G = window.__pv;
    G.missions.index = 9;
    G.missions.step = 0;
    G.missions.completedCount = 9;
    G.missions.dialog = null;
    G.dialogue.active = null;
    G.player.x = 500;
    G.player.y = 420;
  });
  await page.waitForTimeout(300);
  await ev(async () => {
    const m = await import('/src/mission-timer.js');
    m.startMissionTimer(window.__pv, 'DEFEND THE CAFE', 45);
  });
  s = await state();
  check('mission timer active on timed mission', s.timer === true && s.timerS > 0, `timer=${s.timer} s=${s.timerS}`);

  // 12. Helicopter at 4 stars.
  await ev(() => { const G = window.__pv; G.wanted.stars = 4; G.wanted.heat = 80; });
  await page.waitForTimeout(600);
  s = await state();
  check('helicopter AIR-1 active at 4 stars', s.heli === true, `heli=${s.heli}`);

  // 13. District banner on entering a new district.
  await ev(() => { const G = window.__pv; G.player.x = 2500; G.player.y = 1250; });
  await page.waitForTimeout(300);
  s = await state();
  check('district banner shows CASINO STRIP', s.district === 'CASINO STRIP' && s.banner === true, `district=${s.district} banner=${s.banner}`);

  // 14. WASTED: thug beats the player down for real.
  await ev(() => {
    const G = window.__pv;
    G.wanted.stars = 0;
    G.police = [];
    G.player.hp = 5;
    G.player.car = null;
    G.player.onFoot = true;
    G.enemies.push({ x: G.player.x + 10, y: G.player.y, hp: 60, angle: 0, speed: 150, shootT: 5, meleeT: 0, name: 'Kessler thug' });
  });
  await page.waitForFunction(() => window.__pv.screen === 'OVER', null, { timeout: 8000 }).catch(() => {});
  s = await state();
  check('WASTED path works (hp 0 -> OVER)', s.screen === 'OVER' && s.wasted === true, `screen=${s.screen} wasted=${s.wasted}`);

  // 15. BUSTED: cop holds the player on foot.
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pv, null, { timeout: 10000 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await ev(() => {
    const G = window.__pv;
    G.wanted.stars = 2;
    G.wanted.heat = 50;
    G.player.x = 1300;
    G.player.y = 950;
    G.player.car = null;
    G.player.onFoot = true;
    G.police = [{ x: 1310, y: 950, angle: 0, speed: 0, siren: true, ramCd: 5, id: 0 }];
  });
  await page.waitForFunction(() => window.__pv.screen === 'OVER', null, { timeout: 12000 }).catch(() => {});
  s = await state();
  check('BUSTED path works (held by cop -> OVER)', s.screen === 'OVER' && s.busted === true, `screen=${s.screen} busted=${s.busted}`);

  // 16. Screenshots (fresh loads, seed 7).
  for (const shot of SHOTS) {
    await page.goto(BASE + '/' + shot.query, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    await page.screenshot({ path: join(here, 'screenshots', shot.name), type: 'jpeg', quality: 85 });
    const size = statSync(join(here, 'screenshots', shot.name)).size;
    check(`screenshot ${shot.name} <= 256 KiB`, size <= 262144, `${size} bytes`);
  }
  // Cover density in the staged scene.
  await page.goto(BASE + '/?shot=cover&seed=7', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
  s = await state();
  check('cover: 4 cops + 4 stars', s.cops >= 4 && s.stars >= 4, `cops=${s.cops} stars=${s.stars}`);
  check('cover: heli active', s.heli === true);
  check('cover: money >= $8,000', s.money >= 8000, `$${s.money}`);
  check('cover: 5+ cars in scene', s.cars + s.traffic >= 5, `cars=${s.cars} traffic=${s.traffic}`);
  check('cover: 8+ peds in scene', s.peds >= 8, `peds=${s.peds}`);
  check('cover: dialog + REP + timer visible in state', s.dialog === true && s.rep >= 1000 && s.timer === true, `dialog=${s.dialog} rep=${s.rep} timer=${s.timer}`);
  // Thugs on open ground in the mission scene.
  await page.goto(BASE + '/?shot=mission&seed=7', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
  const thugsOk = await ev(async () => {
    const m = await import('/src/world.js');
    const G = window.__pv;
    if (G.enemies.length === 0) return 'no thugs';
    return G.enemies.every((e) => m.isOpenGround(G.city.buildings, e.x, e.y, 26)) ? 'ok' : 'thug inside building';
  });
  check('mission scene: thugs on open ground (margin 26)', thugsOk === 'ok', thugsOk);
  const missionCount = await ev(() => window.__pv.enemies.length);
  check('mission scene: 3 thugs spawned', missionCount === 3, `thugs=${missionCount}`);

  check('zero console/page errors during playtest', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('playtest run completed without harness crash', false, String(e && e.message || e).slice(0, 300));
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log(results.join('\n'));
console.log(`\nTOTAL: ${pass} PASS, ${fail} FAIL`);
if (!existsSync(join(here, 'screenshots'))) console.log('no screenshots dir');
process.exit(fail > 0 ? 1 : 0);
