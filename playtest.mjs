// Porto Verde — scripted play-test + deterministic screenshot driver (Playwright).
// Serves game/ on :8933, takes the 4 shots from shots.json into ./screenshots/,
// then plays the live game with keyboard + mouse and checks it end to end:
// title, start, walk, enter/drive a car, shoot, punch, mission advance, police,
// pause, save/continue — plus the two death paths (WASTED by thugs, BUSTED by
// the police) and the restart after each. Any console error fails the run.
//
//   node playtest.mjs            (from this repo root)
//   exit 0 = every test passed, 0 console errors; log + death shots in out/playtest/
import { createRequire } from 'node:module';
const require = createRequire('/home/hatch/workspace/goals/make-fun-account-setup/hidden_files/makefun/shot/node_modules/playwright-core/package.json');
const { chromium } = require('playwright-core');
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entry = root;
const chrome = '/home/hatch/workspace/goals/make-fun-account-setup/hidden_files/makefun/shot/chrome-linux64/chrome';
const PORT = 8933;
const BASE = `http://localhost:${PORT}`;
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
const outDir = join(root, 'out', 'playtest');
mkdirSync(outDir, { recursive: true });

const errors = [];
const results = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    const detail = await fn();
    passed += 1;
    results.push({ name, status: 'PASS', detail: detail ?? '' });
    console.log(`PASS ${name}${detail ? ' — ' + detail : ''}`);
  } catch (e) {
    failed += 1;
    results.push({ name, status: 'FAIL', detail: String(e.message || e) });
    console.log(`FAIL ${name} — ${e.message || e}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** JPEG dimensions from the SOF0/SOF2 marker (no image library). */
function jpegSize(path) {
  const b = readFileSync(path);
  let i = 2;
  while (i < b.length - 1) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      // SOF layout: precision (1 byte), height (2), width (2).
      return { width: (b[i + 7] << 8) | b[i + 8], height: (b[i + 5] << 8) | b[i + 6] };
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    i += 2 + len;
  }
  throw new Error('no SOF marker in ' + path);
}

async function waitFor(page, fn, timeoutMs, what) {
  const start = Date.now();
  for (;;) {
    try {
      if (await fn()) return true;
    } catch { /* page mid-navigation: retry */ }
    if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${what}`);
    await page.waitForTimeout(250);
  }
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: entry, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
let browser = null;
try {
  browser = await chromium.launch({
    executablePath: chrome,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const pv = (expr, arg) => page.evaluate(expr, arg);

  // ---------- 1. The four deterministic shots ----------
  for (const shot of shots) {
    await test(`shot ${shot.name}`, async () => {
      await page.goto(`${BASE}/${shot.query}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__shotReady, null, { timeout: 20000 });
      await page.waitForTimeout(300);
      const path = join(root, 'screenshots', shot.name);
      await page.screenshot({ path, type: 'jpeg', quality: 82 });
      const size = statSync(path).size;
      assert(size <= 262144, `screenshot ${size} bytes > 256 KiB cap`);
      const dim = jpegSize(path);
      assert(dim.width === 1280 && dim.height === 720, `screenshot is ${dim.width}x${dim.height}, want 1280x720`);
      return `${size} bytes, 1280x720`;
    });
  }

  // The mission shot must stage its thugs on open ground, never on a roof.
  await test('mission thugs on open ground', async () => {
    await page.goto(`${BASE}/?shot=mission&seed=7`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady, null, { timeout: 20000 });
    const thugs = await page.evaluate(() => {
      const G = window.__pv;
      function open(x, y, m) {
        for (const b of G.city.buildings) {
          if (x + m > b.x && x - m < b.x + b.w && y + m > b.y && y - m < b.y + b.h) return false;
        }
        const onRoad = G.roadsX.some((rx) => Math.abs(x - rx) <= 48) || G.roadsY.some((ry) => Math.abs(y - ry) <= 48);
        const onWalk = G.roadsX.some((rx) => { const d = Math.abs(x - rx); return d > 48 && d <= 64; })
          || G.roadsY.some((ry) => { const d = Math.abs(y - ry); return d > 48 && d <= 64; });
        if (onRoad || onWalk) return true;
        for (const p of G.city.parks) if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true;
        for (const p of G.city.plazas) if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true;
        if (x >= 274 && x < 340) return true;
        return false;
      }
      return G.enemies.map((e) => ({ x: Math.round(e.x), y: Math.round(e.y), open: open(e.x, e.y, 26) }));
    });
    assert(thugs.length === 3, `expected 3 thugs, got ${thugs.length}`);
    for (const t of thugs) assert(t.open, `thug at (${t.x},${t.y}) is not on open ground`);
    return thugs.map((t) => `(${t.x},${t.y})`).join(' ');
  });

  // The cover frame must actually show cars and pedestrians in view.
  await test('cover frame has traffic + pedestrians in view', async () => {
    await page.goto(`${BASE}/?shot=cover&seed=7`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady, null, { timeout: 20000 });
    const counts = await page.evaluate(() => {
      const G = window.__pv;
      const p = G.player;
      const cx = p.car ? p.car.x : p.x;
      const cy = p.car ? p.car.y : p.y;
      const camX = Math.max(0, Math.min(3200 - 1280, cx - 640));
      const camY = Math.max(0, Math.min(2400 - 720, cy - 360));
      const inView = (x, y) => x >= camX && x <= camX + 1280 && y >= camY && y <= camY + 720;
      const cars = G.traffic.filter((c) => inView(c.x, c.y)).length
        + G.cars.filter((c) => c.driver !== 'player' && inView(c.x, c.y)).length
        + G.police.filter((c) => inView(c.x, c.y)).length;
      return {
        cars,
        traffic: G.traffic.filter((c) => inView(c.x, c.y)).length,
        peds: G.peds.filter((e) => inView(e.x, e.y)).length,
        cops: G.police.length,
        stars: G.wanted.stars,
      };
    });
    assert(counts.cars >= 5, `only ${counts.cars} cars in the cover frame`);
    assert(counts.traffic >= 1, `no traffic car in the cover frame`);
    assert(counts.peds >= 8, `only ${counts.peds} pedestrians in the cover frame`);
    assert(counts.cops === 4 && counts.stars === 3, `cover wanted state off: ${counts.cops} cops, ${counts.stars} stars`);
    return `${counts.cars} cars (${counts.traffic} traffic), ${counts.peds} peds, ${counts.cops} cops, ${counts.stars} stars`;
  });

  // ---------- 2. The live game ----------
  async function freshGame() {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
  }
  async function startGame() {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const screen = await pv(() => window.__pv.screenNow());
    assert(screen === 'play', `screen is ${screen}, want play`);
  }
  async function closeDialog() {
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    const open = await pv(() => !!window.__pv.missions.dialog);
    assert(!open, 'briefing dialog still open after 3x Enter');
  }

  await freshGame();
  await test('title loads', async () => {
    const status = await page.textContent('#status');
    assert(status.includes('Porto Verde'), `status line: ${status}`);
    assert(await pv(() => !!window.__pv), 'window.__pv missing');
    return status;
  });

  await test('start game opens mission 1 briefing', async () => {
    await startGame();
    const d = await pv(() => ({ dialog: !!window.__pv.missions.dialog, title: window.__pv.missions.index }));
    assert(d.dialog, 'no briefing dialog after start');
    assert(d.title === 0, `mission index ${d.title}, want 0`);
    return 'MISSION 1/12 — Welcome Home';
  });

  await test('walk moves the player', async () => {
    // Road x=500 is open ground on every seed: walk north along it.
    await pv(() => { const G = window.__pv; G.player.x = 500; G.player.y = 470; });
    const before = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');
    const after = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y }));
    const moved = Math.hypot(after.x - before.x, after.y - before.y);
    assert(moved > 100, `player only moved ${Math.round(moved)}px in 1s`);
    assert(await pv(() => window.__pv.player.onFoot), 'player left on-foot while walking');
    return `moved ${Math.round(moved)}px`;
  });

  await test('enter the starter car (steal = wanted 1)', async () => {
    // One-shot actions are ignored while the briefing dialog is open.
    await closeDialog();
    const spot = await pv(() => {
      const G = window.__pv;
      let best = null; let bd = 1e9;
      for (const c of G.cars) {
        if (c.driver !== 'none') continue;
        const d = Math.hypot(c.x - 534, c.y - 540);
        if (d < bd) { bd = d; best = { x: c.x, y: c.y }; }
      }
      return best;
    });
    assert(spot, 'no parked starter car found near the Marina Cafe');
    await pv(([x, y]) => { const G = window.__pv; G.player.x = x; G.player.y = y - 40; }, [spot.x, spot.y]);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    const st = await pv(() => ({ inCar: !!window.__pv.player.car, stars: window.__pv.wanted.stars }));
    assert(st.inCar, 'player did not enter the car');
    assert(st.stars >= 1, `wanted stars ${st.stars} after stealing a parked car`);
    return `car at (${spot.x},${spot.y}), stars ${st.stars}`;
  });

  await test('drive the car', async () => {
    const before = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y, s: Math.abs(window.__pv.player.car.speed) }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2500);
    await page.keyboard.up('KeyW');
    const after = await pv(() => ({ x: window.__pv.player.x, y: window.__pv.player.y, s: Math.abs(window.__pv.player.car.speed) }));
    const moved = Math.hypot(after.x - before.x, after.y - before.y);
    assert(moved > 300, `car only moved ${Math.round(moved)}px in 2.5s`);
    assert(after.s > 100, `car speed ${Math.round(after.s)}, want > 100`);
    return `moved ${Math.round(moved)}px, speed ${Math.round(after.s)}`;
  });

  await test('shoot the pistol', async () => {
    await page.keyboard.press('KeyE'); // exit the car
    await page.waitForTimeout(300);
    assert(await pv(() => window.__pv.player.onFoot), 'player still in the car after E');
    await closeDialog();
    await page.mouse.click(760, 360);
    await page.waitForTimeout(200);
    const fired = await pv(() => window.__pv.shotsFired > 0 || window.__pv.bullets.length > 0);
    assert(fired, 'no bullet fired on click');
    return 'bullet away';
  });

  await test('punch hurts a thug', async () => {
    await pv(() => {
      const G = window.__pv;
      const p = G.player;
      G.enemies.push({ x: p.x + 30, y: p.y, hp: 60, angle: 0, speed: 0, shootT: 99, meleeT: 99, name: 'Kessler thug' });
      p.angle = 0;
    });
    await page.keyboard.press('KeyF');
    await page.waitForTimeout(300);
    const hp = await pv(() => (window.__pv.enemies[0] ? window.__pv.enemies[0].hp : -1));
    assert(hp >= 0 && hp < 60, `thug hp ${hp}, punch did not land`);
    return `thug hp ${hp}/60`;
  });

  await test('mission 1 completes on arrival', async () => {
    await pv(() => { const G = window.__pv; G.player.x = 500; G.player.y = 420; });
    await waitFor(page, () => pv(() => window.__pv.missions.index === 1), 5000, 'mission 1 to complete');
    const st = await pv(() => ({ money: window.__pv.player.money, index: window.__pv.missions.index }));
    assert(st.money >= 270, `money $${st.money} after mission 1 (want >= 270)`);
    return `MISSION 2/12 live, $${st.money}`;
  });

  await test('police respond to wanted stars', async () => {
    await waitFor(page, () => pv(() => window.__pv.police.length >= 2), 5000, 'police to spawn');
    const st = await pv(() => ({ cops: window.__pv.police.length, siren: window.__pv.police.some((c) => c.siren), stars: window.__pv.wanted.stars }));
    assert(st.siren, 'no police siren');
    return `${st.cops} cops, ${st.stars} stars, sirens on`;
  });

  await test('pause and resume', async () => {
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(300);
    assert((await pv(() => window.__pv.screenNow())) === 'paused', 'P did not pause');
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(300);
    assert((await pv(() => window.__pv.screenNow())) === 'play', 'P did not resume');
    return 'paused → playing';
  });

  await test('save then continue from title', async () => {
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(300);
    const saved = await pv(() => {
      const raw = window.localStorage.getItem('porto-verde.save.v1');
      return raw ? JSON.parse(raw) : null;
    });
    assert(saved && saved.mission === 1, `save missing or wrong mission: ${JSON.stringify(saved)}`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    assert(await pv(() => window.__pv.hasSaveFlag), 'title does not offer Continue after save');
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(400);
    const st = await pv(() => ({ screen: window.__pv.screenNow(), mission: window.__pv.missions.index }));
    assert(st.screen === 'play' && st.mission === 1, `continue landed on ${st.screen} mission ${st.mission}`);
    return 'continued at mission 2/12';
  });

  // ---------- 3. The death paths ----------
  await test('WASTED: thugs beat Dario down, panel shows, restart works', async () => {
    await freshGame();
    await startGame();
    await closeDialog();
    await pv(() => {
      const G = window.__pv;
      const p = G.player;
      p.hp = 12;
      p.invuln = 0;
      G.enemies.push({ x: p.x + 30, y: p.y, hp: 60, angle: 0, speed: 150, shootT: 99, meleeT: 0, name: 'Kessler thug' });
    });
    await waitFor(page, () => pv(() => window.__pv.wasted && window.__pv.screenNow() === 'over'), 25000, 'WASTED');
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, 'wasted.jpg'), type: 'jpeg', quality: 82 });
    const status = await page.textContent('#status');
    assert(status.includes('Wasted'), `status after death: ${status}`);
    assert(await pv(() => !window.__pv.busted), 'death counted as BUSTED, want WASTED');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const st = await pv(() => ({ screen: window.__pv.screenNow(), wasted: window.__pv.wasted, hp: window.__pv.player.hp }));
    assert(st.screen === 'play' && !st.wasted && st.hp === 100, `restart after WASTED: ${JSON.stringify(st)}`);
    return 'WASTED panel → Enter → fresh game, HP 100';
  });

  await test('BUSTED: police corner Dario on foot, panel shows, restart works', async () => {
    await freshGame();
    await startGame();
    await closeDialog();
    await pv(() => {
      const G = window.__pv;
      G.player.hp = 100;
      G.wanted.stars = 3;
      G.wanted.heat = 80;
      G.wanted.lastCrime = G.time;
    });
    // If no cop closes in on its own, nudge the nearest one closer — the bust
    // itself (1.6 s of contact) still has to happen for real.
    const start = Date.now();
    for (;;) {
      const done = await pv(() => window.__pv.busted && window.__pv.screenNow() === 'over');
      if (done) break;
      if (Date.now() - start > 30000) throw new Error('timeout waiting for BUSTED');
      const nearest = await pv(() => {
        const G = window.__pv;
        let bd = 1e9;
        for (const c of G.police) bd = Math.min(bd, Math.hypot(c.x - G.player.x, c.y - G.player.y));
        return bd;
      });
      if (nearest > 120) {
        await pv(() => {
          const G = window.__pv;
          let best = null; let bd = 1e9;
          for (const c of G.police) {
            const d = Math.hypot(c.x - G.player.x, c.y - G.player.y);
            if (d < bd) { bd = d; best = c; }
          }
          if (best) {
            const a = Math.atan2(G.player.y - best.y, G.player.x - best.x);
            best.x = G.player.x - Math.cos(a) * 150;
            best.y = G.player.y - Math.sin(a) * 150;
          }
        });
      }
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, 'busted.jpg'), type: 'jpeg', quality: 82 });
    const status = await page.textContent('#status');
    assert(status.includes('Busted'), `status after bust: ${status}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const st = await pv(() => ({ screen: window.__pv.screenNow(), busted: window.__pv.busted, hp: window.__pv.player.hp }));
    assert(st.screen === 'play' && !st.busted && st.hp === 100, `restart after BUSTED: ${JSON.stringify(st)}`);
    return 'BUSTED panel → Enter → fresh game, HP 100';
  });

  // ---------- 4. Console errors ----------
  await test('zero console errors', async () => {
    assert(errors.length === 0, errors.join(' | '));
    return 'no console errors, no pageerrors';
  });
} finally {
  if (browser) await browser.close();
  server.kill();
}

const log = { passed, failed, errors, results };
writeFileSync(join(outDir, 'playtest-log.json'), JSON.stringify(log, null, 2));
console.log(`\nplay-test: ${passed} passed, ${failed} failed, ${errors.length} console errors`);
if (failed > 0 || errors.length > 0) process.exit(1);
