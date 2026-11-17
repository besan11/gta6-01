// render.js — Drawing Porto Verde: the city, its people, its cars, its screens.
// Features: camera that follows Dario (on foot or in a car), sun-soaked top-down
// art (sea, beach, palms, parks, roads with lane dashes, roofed buildings), cars
// with headlights and police light bars, pedestrians, thugs, bullets, crash and
// explosion effects, mission markers, and the title / pause / wasted / busted /
// victory screens. The HUD itself lives in hud.js; this file paints the world.
import { FONT, PALETTE, VIEW, WORLD } from './config.js';
import { drawHud } from './hud.js';
import { currentMission, currentStep } from './missions.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WON = 'won';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
    view.x = (canvas.width - VIEW.width * view.scale) / 2;
    view.y = (canvas.height - VIEW.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, bold) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, (bold ? 'bold ' : '') + size + 'px ' + FONT);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }

  function camera(G) {
    const p = G.player;
    const cx = p.car ? p.car.x : p.x;
    const cy = p.car ? p.car.y : p.y;
    return {
      x: Math.max(0, Math.min(WORLD.width - VIEW.width, cx - VIEW.width / 2)),
      y: Math.max(0, Math.min(WORLD.height - VIEW.height, cy - VIEW.height / 2)),
    };
  }

  function drawGround(G, cam) {
    // Base grass, then sea + beach on the west.
    ctx.fillStyle = '#6da054';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = PALETTE.seaDeep;
    ctx.fillRect(0, 0, 260, WORLD.height);
    ctx.fillStyle = PALETTE.sea;
    ctx.fillRect(40, 0, 220, WORLD.height);
    // Animated wave lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y < WORLD.height; y += 180) {
      const off = ((G.time * 24 + y) % 180) - 90;
      ctx.beginPath();
      ctx.moveTo(238, y + off);
      ctx.quadraticCurveTo(250, y + off + 14, 262, y + off);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(260, 0, 80, WORLD.height);
    // Parks.
    for (const park of G.city.parks) {
      ctx.fillStyle = PALETTE.park;
      ctx.fillRect(park.x, park.y, park.w, park.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(park.x + 8, park.y + 8, park.w - 16, park.h - 16);
    }
    // Sidewalks beside every road.
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of G.roadsX) ctx.fillRect(rx - 64, 0, 128, WORLD.height);
    for (const ry of G.roadsY) ctx.fillRect(0, ry - 64, WORLD.width, 128);
    // Roads.
    ctx.fillStyle = PALETTE.road;
    for (const rx of G.roadsX) ctx.fillRect(rx - 48, 0, 96, WORLD.height);
    for (const ry of G.roadsY) ctx.fillRect(0, ry - 48, WORLD.width, 96);
    // Lane dashes.
    ctx.fillStyle = PALETTE.lane;
    for (const rx of G.roadsX) {
      for (let y = 0; y < WORLD.height; y += 90) ctx.fillRect(rx - 2, y, 4, 44);
    }
    for (const ry of G.roadsY) {
      for (let x = 340; x < WORLD.width; x += 90) ctx.fillRect(x, ry - 2, 44, 4);
    }
    // Airstrip runway (south-east block).
    ctx.fillStyle = '#4a4f58';
    ctx.fillRect(2620, 1960, 520, 90);
    ctx.fillStyle = '#e8e4da';
    for (let x = 2640; x < 3120; x += 80) ctx.fillRect(x, 2000, 40, 6);
    text('PORTO VERDE AIRSTRIP', 2680, 1990, 16, '#e8e4da', 'left', true);
  }

  function drawBuildings(G) {
    for (const b of G.city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(b.x + 10, b.y + 10, 14, 10);
      ctx.fillRect(b.x + b.w - 24, b.y + 10, 14, 10);
      if (b.tall) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
      }
    }
    // Landmark labels.
    ctx.textAlign = 'center';
    for (const lm of G.city.landmarks) {
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(lm.name, lm.x + 1, lm.y - 9);
      ctx.fillStyle = '#fff';
      ctx.fillText(lm.name, lm.x, lm.y - 10);
    }
    ctx.textAlign = 'left';
  }

  function drawPalms(G) {
    for (const palm of G.city.palms) {
      ctx.fillStyle = PALETTE.palmTrunk;
      ctx.fillRect(palm.x - 2, palm.y - 2, 4, 10);
      ctx.fillStyle = PALETTE.palm;
      ctx.beginPath();
      ctx.arc(palm.x, palm.y - 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#57a868';
      ctx.beginPath();
      ctx.arc(palm.x - 5, palm.y - 10, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCarShape(car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    if (car.skid > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-34, -20, 20, 6);
      ctx.fillRect(-34, 14, 20, 6);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-30, -14, 62, 32);
    ctx.fillStyle = car.wrecked ? '#3a3a3a' : car.color;
    ctx.beginPath();
    ctx.roundRect(-32, -16, 64, 32, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,44,0.85)';
    ctx.beginPath();
    ctx.roundRect(-8, -13, 18, 26, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(24, -13, 4, 26);
    // Headlights.
    ctx.fillStyle = '#fff6b0';
    ctx.fillRect(30, -12, 3, 6);
    ctx.fillRect(30, 6, 3, 6);
    if (car.siren && !car.wrecked) {
      const flash = Math.floor(G_time() * 6) % 2 === 0;
      ctx.fillStyle = flash ? '#ff3b30' : '#3b82ff';
      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#3b82ff' : '#ff3b30';
      ctx.beginPath();
      ctx.arc(0, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (car.wrecked) {
      ctx.fillStyle = 'rgba(255,120,40,0.8)';
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('WRECK', car.x, car.y - 26);
      ctx.textAlign = 'left';
    }
  }

  // Time accessor closed over the last drawn game (avoids a parameter through every helper).
  let _t = 0;
  function G_time() { return _t; }

  function drawEntities(G) {
    // Mission pickups (glowing envelopes / cash bags).
    for (const pk of G.missions.pickups) {
      if (pk.taken) continue;
      const pulse = 1 + Math.sin(G.time * 6) * 0.15;
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, 14 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20242c';
      ctx.font = 'bold 16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('$', pk.x, pk.y + 6);
      ctx.textAlign = 'left';
    }
    // Objective marker: a tall pulsing beacon.
    const step = currentStep(G.missions);
    if (step && !G.missions.done) {
      const pulse = 0.5 + Math.sin(G.time * 4) * 0.5;
      ctx.strokeStyle = 'rgba(255,207,63,' + (0.5 + pulse * 0.5) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(step.x, step.y, 26 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.marker;
      ctx.beginPath();
      ctx.moveTo(step.x, step.y - 34);
      ctx.lineTo(step.x + 12, step.y - 12);
      ctx.lineTo(step.x - 12, step.y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 13px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText('▼', step.x, step.y - 40);
      ctx.textAlign = 'left';
    }
    // Traffic and parked cars (player car drawn last, on top).
    for (const car of G.cars) {
      if (car.driver === 'player') continue;
      drawCarShape(car);
    }
    // Pedestrians.
    for (const ped of G.peds) {
      const bob = Math.sin(ped.bob) * 2;
      ctx.fillStyle = ped.color;
      ctx.beginPath();
      ctx.arc(ped.x, ped.y + bob * 0.3, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20242c';
      ctx.beginPath();
      ctx.arc(ped.x + Math.cos(ped.angle) * 3, ped.y + Math.sin(ped.angle) * 3 + bob * 0.3, 4, 0, Math.PI * 2);
      ctx.fill();
      if (ped.flee > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('!', ped.x, ped.y - 16);
        ctx.textAlign = 'left';
      }
    }
    // Thugs.
    for (const e of G.enemies) {
      ctx.fillStyle = '#7a3fd0';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c1040';
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(e.angle) * 4, e.y + Math.sin(e.angle) * 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(e.x - 14, e.y - 22, 28, 5);
      ctx.fillStyle = '#ff5a4e';
      ctx.fillRect(e.x - 14, e.y - 22, 28 * Math.max(0, e.hp / 60), 5);
    }
    // Bullets.
    ctx.fillStyle = '#ffe27a';
    for (const b of G.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Effects.
    for (const fx of G.effects) {
      if (fx.kind === 'explosion') {
        ctx.fillStyle = 'rgba(255,' + Math.floor(140 * fx.t) + ',40,' + fx.t + ')';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 40 * (1.2 - fx.t), 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.kind === 'muzzle') {
        ctx.fillStyle = 'rgba(255,240,150,' + (fx.t * 8) + ')';
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.kind === 'punch') {
        ctx.strokeStyle = 'rgba(255,255,255,' + (fx.t * 4) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === 'down') {
        ctx.fillStyle = 'rgba(255,90,78,' + fx.t + ')';
        ctx.font = 'bold 13px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('DOWN', fx.x, fx.y - 18);
        ctx.textAlign = 'left';
      } else if (fx.kind === 'crash') {
        ctx.fillStyle = 'rgba(255,255,255,' + (fx.t * 2) + ')';
        ctx.font = 'bold 16px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('CRASH!', fx.x, fx.y - 30);
        ctx.textAlign = 'left';
      }
    }
    // Player car, then the player on foot.
    if (G.player.car) drawCarShape(G.player.car);
    const p = G.player;
    if (p.onFoot) {
      const blink = p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0;
      if (!blink) {
        ctx.fillStyle = PALETTE.playerShirt;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.player;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#20242c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20);
        ctx.stroke();
      }
      // "Press E" hint near a car.
      if (G.nearCar) {
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(p.x - 70, p.y - 52, 140, 26);
        ctx.fillStyle = PALETTE.marker;
        ctx.font = 'bold 13px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('Press E — drive ' + G.nearCar.model.name, p.x, p.y - 34);
        ctx.textAlign = 'left';
      }
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    const width = 640;
    const height = 150 + lines.length * 30;
    const x = (VIEW.width - width) / 2;
    const y = (VIEW.height - height) / 2;
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = accent || PALETTE.panelEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    text(title, VIEW.width / 2, y + 62, 44, PALETTE.text, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], VIEW.width / 2, y + 108 + i * 30, 17, PALETTE.muted, 'center');
    }
    text(prompt, VIEW.width / 2, y + height - 26, 18, PALETTE.marker, 'center', true);
  }

  function drawTitle(G) {
    // Sun-soaked title over the living city.
    ctx.fillStyle = 'rgba(8,12,20,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text('PORTO VERDE', VIEW.width / 2, 150, 72, '#ffcf3f', 'center', true);
    text('THREE DAYS IN THE SUN', VIEW.width / 2, 196, 26, PALETTE.text, 'center', true);
    text('An open-world crime story — 12 missions, 3 days, one city that remembers.', VIEW.width / 2, 232, 17, PALETTE.muted, 'center');
    const story = [
      'Dario Cruz is back in Porto Verde after three years away, broke and out of options.',
      'Mara Solis has work for him — twelve jobs across three days — and the city is watching.',
      'Drive it. Steal it. Fight for it. Just do not let the police catch you.',
    ];
    for (let i = 0; i < story.length; i += 1) text(story[i], VIEW.width / 2, 276 + i * 26, 16, PALETTE.text, 'center');
    const controls = [
      'WASD / Arrows — walk & drive    •    E — enter / exit car    •    F — punch',
      'Mouse — aim    •    Click — shoot    •    Shift — run    •    Space — handbrake',
      'Q — save    •    P / Esc — pause    •    M — mute sound',
    ];
    for (let i = 0; i < controls.length; i += 1) text(controls[i], VIEW.width / 2, 380 + i * 26, 15, PALETTE.muted, 'center');
    const features = 'FEATURES: open city on foot + by car  •  traffic & pedestrians  •  steal & drive  •  wanted stars & police chases  •  12 story missions  •  combat  •  minimap  •  save game  •  synth sound';
    text(features, VIEW.width / 2, 486, 13, PALETTE.objective, 'center');
    if (G.hasSaveFlag) {
      text('Press ENTER to start  •  Press C to continue your saved game', VIEW.width / 2, 560, 20, PALETTE.marker, 'center', true);
    } else {
      text('Press ENTER or click to start', VIEW.width / 2, 560, 20, PALETTE.marker, 'center', true);
    }
    text('An original game. Porto Verde, Dario Cruz, Mara Solis — all invented here.', VIEW.width / 2, 600, 13, PALETTE.muted, 'center');
  }

  function drawWorld(G) {
    const cam = camera(G);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawGround(G, cam);
    drawBuildings(G);
    drawPalms(G);
    drawEntities(G);
    ctx.restore();
  }

  /** Paint one frame for the given screen. */
  function draw(G, screen) {
    _t = G.time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    // The world is drawn behind every screen (title shows the city alive).
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW.width, VIEW.height);
    ctx.clip();
    drawWorld(G);
    ctx.restore();
    if (screen === SCREEN_TITLE) {
      drawTitle(G);
      return;
    }
    drawHud(ctx, G);
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(8,12,20,0.6)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      drawPanel('PAUSED', [
        'Porto Verde waits for no one — except right now.',
        'Q saves your progress.  M mutes the sound.',
        'Mission ' + (G.missions.index + 1) + '/12 — ' + (currentMission(G.missions) ? currentMission(G.missions).title : 'done'),
      ], 'Press P / Esc to resume  •  T for title screen');
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(20,4,4,0.55)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      const busted = G.busted;
      drawPanel(busted ? 'BUSTED' : 'WASTED', [
        busted ? 'The Porto Verde police finally cornered Dario.' : 'Dario went down in the streets of Porto Verde.',
        'Missions complete: ' + G.missions.completedCount + ' / 12   •   Cash: $' + G.player.money,
        'Day ' + G.clock.day + ' — the city keeps your save. Try again.',
      ], 'Press ENTER to try again', '#ff5a4e');
    } else if (screen === SCREEN_WON) {
      ctx.fillStyle = 'rgba(8,20,12,0.55)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      drawPanel('PORTO VERDE IS YOURS', [
        'Twelve missions. Three days. One plane out — and a city that remembers.',
        'Missions complete: 12 / 12   •   Final cash: $' + G.player.money,
        'Thank you for playing Porto Verde: Three Days in the Sun.',
      ], 'Press ENTER to play again', '#37e0a0');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
