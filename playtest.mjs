// playtest.mjs — Full local verification for Porto Verde v3. Run from the
// repo root: `node playtest.mjs`. It serves game/ on :8933, drives the real
// game in headless Chromium, takes the four screenshots into screenshots/,
// and asserts the whole checklist from the design brief: the cover staging
// (5+ cars, traffic, 8+ peds, 4 cops, 3+ stars, helicopter, PD panel, REP,
// radio, weapon slots, mission timer, 300x210 minimap with route, district
// label, dialogue portrait), thugs on open ground, title/start, driving,
// shooting, punching, mission 1 completing, police, pause, save/continue,
// WASTED, BUSTED, zero console errors — and two identical dossier hashes.
import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const home = process.env.HOME || '/home/hatch';
const chromePath = join(home, 'workspace/goals/make-fun-account-setup/hidden_files/makefun/shot/chrome-linux64/chrome');
const pwRoot = join(home, 'workspace/goals/make-fun-account-setup/hidden_files/makefun/shot');
const { chromium } = createRequire(join(pwRoot, 'package.json'))('playwright-core');
const shotsDir = join(root, 'screenshots');
const base = 'http://127.0.0.1:8933/';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''));
}

function run(cmd, args, env) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: root, env: { ...process.env, ...env } }, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
  });
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const server = spawn('node', ['serve.ts', '--port', '8933'], { cwd: root, stdio: 'ignore' });
const up = await waitForServer(base);
if (!up) {
  console.log('FAIL  server did not come up on :8933');
  server.kill();
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
});
const errors = [];
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return page;
}
const shot = async (page, name, quality) => {
  const path = join(shotsDir, name);
  await page.screenshot({ path, type: 'jpeg', quality });
  const size = statSync(path).size;
  return size;
};

// ---------- 1. The four screenshots + staging asserts ----------
const shotSpecs = [
  { file: '1-cover.jpg', query: '?shot=cover&seed=7' },
  { file: '2-title.jpg', query: '?shot=title&seed=7' },
  { file: '3-chase.jpg', query: '?shot=chase&seed=7' },
  { file: '4-mission.jpg', query: '?shot=mission&seed=7' },
];
for (const spec of shotSpecs) {
  const page = await newPage();
  await page.goto(base + 'index.html' + spec.query, { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
  } catch (e) {
    check('shot ' + spec.file + ' renders', false, '__shotReady never fired');
    await page.close();
    continue;
  }
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => {
    const G = window.__pv;
    return {
      screen: G.screenNow(),
      cars: G.cars.length,
      traffic: G.traffic.filter((c) => !c.wrecked).length,
      peds: G.peds.length,
      cops: G.police.length,
      stars: G.wanted.stars,
      heli: G.heli.active,
      money: Math.floor(G.player.money),
      day: G.clock.day,
      rep: G.rep.total,
      drawn: { ...G.drawn },
      enemies: G.enemies.filter((e) => e.hp > 0).map((e) => ({ x: e.x, y: e.y, open: G.isOpenGround(e.x, e.y) })),
    };
  });
  let quality = 80;
  let size = await shot(page, spec.file, quality);
  while (size > 262144 && quality > 30) {
    quality -= 20;
    size = await shot(page, spec.file, quality);
  }
  check('shot ' + spec.file + ' renders', true, size + ' bytes, q' + quality);
  check('shot ' + spec.file + ' under 256 KiB', size <= 262144, size + ' bytes');
  if (spec.file === '1-cover.jpg') {
    check('cover: 5+ cars', state.cars >= 5, state.cars + ' cars');
    check('cover: 1+ traffic', state.traffic >= 1, state.traffic + ' traffic');
    check('cover: 8+ peds', state.peds >= 8, state.peds + ' peds');
    check('cover: 4 cops', state.cops >= 4, state.cops + ' cops');
    check('cover: 3+ stars', state.stars >= 3, state.stars + ' stars');
    check('cover: helicopter active', state.heli, '');
    check('cover: PD panel 2+ units', (state.drawn.pdPanel || 0) >= 2, 'rows=' + (state.drawn.pdPanel || 0));
    check('cover: heli drawn', !!state.drawn.heli, '');
    check('cover: REP drawn', !!state.drawn.rep, 'rep=' + state.rep);
    check('cover: radio drawn', !!state.drawn.radio, '');
    check('cover: weapon slots 2+', (state.drawn.weapons || 0) >= 2, 'slots=' + (state.drawn.weapons || 0));
    check('cover: mission timer drawn', !!state.drawn.timer, '');
    check('cover: minimap 300x210', state.drawn.minimap && state.drawn.minimap.w === 300 && state.drawn.minimap.h === 210, JSON.stringify(state.drawn.minimap));
    check('cover: district CASINO STRIP', state.drawn.district === 'CASINO STRIP', String(state.drawn.district));
    check('cover: Mara portrait drawn', state.drawn.portrait === 'Mara Solis', String(state.drawn.portrait));
    check('cover: money >= $8,000', state.money >= 8000, '$' + state.money);
    check('cover: Day 3', state.day === 3, 'day ' + state.day);
  }
  if (spec.file === '2-title.jpg') {
    check('title: title screen', state.screen === 'title', state.screen);
  }
  if (spec.file === '3-chase.jpg') {
    check('chase: 3+ cops', state.cops >= 3, state.cops + ' cops');
    check('chase: helicopter active', state.heli, '');
    check('chase: minimap drawn', !!state.drawn.minimap, '');
  }
  if (spec.file === '4-mission.jpg') {
    check('mission: 3 thugs', state.enemies.length >= 3, state.enemies.length + ' thugs');
    check('mission: thugs on open ground', state.enemies.every((e) => e.open), state.enemies.map((e) => e.open).join(','));
    check('mission: portrait drawn', !!state.drawn.portrait, String(state.drawn.portrait));
    check('mission: 8+ peds', state.peds >= 8, state.peds + ' peds');
    check('mission: 1+ traffic', state.traffic >= 1, state.traffic + ' traffic');
  }
  await page.close();
}

// ---------- 2. Live play: title -> start -> mission 1 -> drive/shoot/punch ----------
const page = await newPage();
await page.goto(base + 'index.html?seed=7', { waitUntil: 'load' });
await page.waitForFunction(() => window.__pv !== undefined, { timeout: 10000 });
await page.waitForTimeout(300);
let s = await page.evaluate(() => window.__pv.screenNow());
check('title screen shows', s === 'title', s);
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
s = await page.evaluate(() => window.__pv.screenNow());
check('Enter starts the game', s === 'play', s);
let dlg = await page.evaluate(() => window.__pv.dialogue.active);
check('mission 1 briefing opens', dlg === true, '');
await page.keyboard.press('Enter');
await page.waitForTimeout(120);
await page.keyboard.press('Enter');
await page.waitForTimeout(120);
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
dlg = await page.evaluate(() => window.__pv.dialogue.active);
check('briefing advances and closes', dlg === false, '');
// Walk to the Marina Cafe objective and finish mission 1.
await page.evaluate(() => {
  const G = window.__pv;
  G.player.x = 500;
  G.player.y = 420;
});
await page.waitForTimeout(900);
let m1 = await page.evaluate(() => ({ index: window.__pv.missions.index, money: Math.floor(window.__pv.player.money), rep: window.__pv.rep.total }));
check('mission 1 completes', m1.index === 1, 'index=' + m1.index);
check('mission 1 pays (reward + clean bonus)', m1.money >= 250, '$' + m1.money);
check('REP rises after mission 1', m1.rep >= 150, 'rep=' + m1.rep);
// Completing mission 1 opens mission 2's briefing — close it first, or
// the modal dialog eats every other key.
await page.keyboard.press('Enter');
await page.waitForTimeout(120);
await page.keyboard.press('Enter');
await page.waitForTimeout(120);
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
// Enter the starter car and drive.
await page.evaluate(() => {
  const G = window.__pv;
  G.player.x = 534;
  G.player.y = 540;
});
await page.waitForTimeout(200);
await page.keyboard.press('KeyE');
await page.waitForTimeout(200);
let inCar = await page.evaluate(() => window.__pv.player.car !== null);
check('E enters the car', inCar, '');
await page.keyboard.down('KeyW');
await page.waitForTimeout(1200);
await page.keyboard.up('KeyW');
let drove = await page.evaluate(() => ({ speed: Math.round(Math.abs(window.__pv.player.car ? window.__pv.player.car.speed : 0)), moved: window.__pv.player.x }));
check('car drives', drove.speed > 30, 'speed=' + drove.speed);
// Exit the car, then shoot and punch on foot.
await page.keyboard.press('KeyE'); // exit car
await page.waitForTimeout(200);
const shotsBefore = await page.evaluate(() => window.__pv.shotsFired);
await page.mouse.click(900, 300);
await page.waitForTimeout(300);
const shotsAfter = await page.evaluate(() => window.__pv.shotsFired);
check('click shoots', shotsAfter > shotsBefore, shotsBefore + ' -> ' + shotsAfter);
const punchesBefore = await page.evaluate(() => window.__pv.shotsFired);
await page.keyboard.press('KeyF');
await page.waitForTimeout(200);
const punchesAfter = await page.evaluate(() => window.__pv.shotsFired);
check('F punches', punchesAfter > punchesBefore, punchesBefore + ' -> ' + punchesAfter);
// Police + PD panel + helicopter.
await page.evaluate(() => {
  const G = window.__pv;
  G.wanted.stars = 2;
  G.wanted.heat = 50;
  G.wanted.decayTimer = 0;
});
await page.waitForTimeout(1500);
let pd = await page.evaluate(() => ({ cops: window.__pv.police.length, pdRows: window.__pv.drawn.pdPanel || 0 }));
check('police respond at 2 stars', pd.cops >= 2, pd.cops + ' cops');
check('PD panel shows 2+ units at 2 stars', pd.pdRows >= 2, 'rows=' + pd.pdRows);
await page.evaluate(() => {
  const G = window.__pv;
  G.wanted.stars = 4;
  G.wanted.heat = 80;
});
await page.waitForTimeout(1200);
let heli = await page.evaluate(() => ({ active: window.__pv.heli.active, drawn: !!window.__pv.drawn.heli }));
check('helicopter active at 4 stars', heli.active && heli.drawn, JSON.stringify(heli));
// Radio, weapons, minimap, district, timer.
let hudBits = await page.evaluate(() => ({
  radio: !!window.__pv.drawn.radio,
  weapons: window.__pv.drawn.weapons || 0,
  minimap: window.__pv.drawn.minimap || null,
}));
check('radio drawn', hudBits.radio, '');
check('weapon slots drawn (2+)', hudBits.weapons >= 2, 'slots=' + hudBits.weapons);
check('minimap 300x210 in play', hudBits.minimap && hudBits.minimap.w === 300 && hudBits.minimap.h === 210, JSON.stringify(hudBits.minimap));
await page.evaluate(() => {
  const G = window.__pv;
  G.player.x = 2500;
  G.player.y = 1250;
});
await page.waitForTimeout(800);
let dist1 = await page.evaluate(() => window.__pv.drawn.district);
check('district label on entering Casino Strip', dist1 === 'CASINO STRIP', String(dist1));
await page.evaluate(() => {
  const G = window.__pv;
  G.missions.index = 9;
  G.missions.step = 0;
  G.test.prepareStep();
});
await page.waitForTimeout(500);
let timerShown = await page.evaluate(() => !!window.__pv.drawn.timer);
check('mission timer on timed mission', timerShown, '');
// Pause / resume.
await page.keyboard.press('KeyP');
await page.waitForTimeout(300);
s = await page.evaluate(() => window.__pv.screenNow());
check('P pauses', s === 'paused', s);
await page.keyboard.press('KeyP');
await page.waitForTimeout(300);
s = await page.evaluate(() => window.__pv.screenNow());
check('P resumes', s === 'play', s);
// Save, reload, continue.
await page.keyboard.press('KeyQ');
await page.waitForTimeout(300);
const savedMoney = await page.evaluate(() => Math.floor(window.__pv.player.money));
const hasSave = await page.evaluate(() => {
  try { return !!localStorage.getItem('porto-verde.save.v1'); } catch (e) { return false; }
});
check('Q saves', hasSave, 'money=$' + savedMoney);
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__pv !== undefined, { timeout: 10000 });
await page.waitForTimeout(300);
await page.keyboard.press('KeyC');
await page.waitForTimeout(500);
const continued = await page.evaluate(() => ({ screen: window.__pv.screenNow(), money: Math.floor(window.__pv.player.money) }));
check('C continues saved game', continued.screen === 'play' && continued.money === savedMoney, JSON.stringify(continued));
// WASTED: a thug at arm's length with Dario at 5 HP.
await page.evaluate(() => {
  const G = window.__pv;
  G.player.hp = 5;
  G.player.invuln = 0;
  G.enemies.push({ x: G.player.x + 10, y: G.player.y, hp: 60, angle: 0, speed: 150, shootT: 5, meleeT: 0, name: 'Kessler thug', t: 0 });
});
await page.waitForTimeout(2500);
let over = await page.evaluate(() => ({ wasted: window.__pv.wasted, screen: window.__pv.screenNow() }));
check('WASTED path works', over.wasted && over.screen === 'over', JSON.stringify(over));
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
s = await page.evaluate(() => window.__pv.screenNow());
check('Enter retries after WASTED', s === 'play', s);
// BUSTED: pin a cruiser on top of Dario on foot.
await page.evaluate(() => {
  const G = window.__pv;
  G.wanted.stars = 3;
  G.wanted.heat = 60;
  G.wanted.decayTimer = 0;
  window.__pinBust = setInterval(() => {
    const GG = window.__pv;
    if (GG.police[0]) {
      GG.police[0].x = GG.player.x;
      GG.police[0].y = GG.player.y;
      GG.police[0].speed = 0;
    }
  }, 50);
});
await page.waitForTimeout(4000);
let bust = await page.evaluate(() => {
  clearInterval(window.__pinBust);
  return { busted: window.__pv.busted, screen: window.__pv.screenNow() };
});
check('BUSTED path works', bust.busted && bust.screen === 'over', JSON.stringify(bust));
await page.close();

// ---------- 3. Determinism: two dossier runs, identical sha256 ----------
const a = await run('node', ['main.ts'], { MAKEFUN_OUTPUT_DIR: join(root, 'out-a') });
const b = await run('node', ['main.ts'], { MAKEFUN_OUTPUT_DIR: join(root, 'out-b') });
let detOk = false;
let detDetail = '';
try {
  const ha = createHash('sha256').update(readFileSync(join(root, 'out-a', 'dossier.json'))).digest('hex');
  const hb = createHash('sha256').update(readFileSync(join(root, 'out-b', 'dossier.json'))).digest('hex');
  detOk = ha === hb;
  detDetail = ha.slice(0, 16) + ' vs ' + hb.slice(0, 16);
} catch (e) {
  detDetail = 'dossier build failed: ' + (a.stderr || b.stderr || e.message);
}
check('determinism: two dossier runs identical sha256', detOk, detDetail);

// ---------- 4. Console errors ----------
check('0 console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
server.kill();

const failed = results.filter((r) => !r.ok);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed' + (failed.length ? ' — ' + failed.map((f) => f.name).join('; ') : ''));
process.exit(failed.length ? 1 : 0);
