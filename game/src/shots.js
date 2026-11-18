// Shot staging: each screenshot is a real render of a real game state, set
// up deterministically from seed 7. The cover is the densest chase frame —
// mission 11, Day 3, four stars, helicopter overhead — never a title screen.
import { createCar } from './cars.js';
import { COP_MODEL } from './config.js';
import { openBriefing } from './missions.js';

export const SHOT_NAMES = ['cover', 'title', 'chase', 'mission'];

function placeCop(G, x, y) {
  const cop = createCar(x, y, 0, COP_MODEL, 'police');
  cop.hp = 120;
  cop.speed = 420;
  G.police.push(cop);
  return cop;
}

function putPlayerInCar(G, x, y, modelIdx) {
  const model = G.cars[0] ? G.cars[0].model : null;
  void model;
  const car = createCar(x, y, Math.PI / 2, { name: 'Palma GT', color: '#e2453c', top: 540 }, 'player');
  G.cars.push(car);
  G.player.car = car;
  G.player.onFoot = false;
  G.player.x = x;
  G.player.y = y;
  return car;
}

export function stageShot(name, G) {
  G.ambient = false;
  if (name === 'title') {
    G.time = 12;
    return;
  }
  if (name === 'cover') {
    // Mission 11, 'The Last Score', late state: big money, Day 3 evening.
    G.missions.index = 10;
    G.missions.step = 1;
    G.missions.completedCount = 10;
    G.player.money = 8450;
    G.clock.day = 3;
    G.clock.hour = 19;
    G.clock.minute = 42;
    G.rep.points = 1240;
    G.wanted.stars = 4;
    G.wanted.heat = 88;
    G.wanted.lastCrime = 'the vault alarm';
    putPlayerInCar(G, 2500, 1250, 0);
    G.player.car.angle = -Math.PI / 2;
    G.player.car.speed = 380;
    // A tight pursuit cluster around the casino, not scattered.
    placeCop(G, 2380, 1180);
    placeCop(G, 2620, 1160);
    placeCop(G, 2440, 1380);
    placeCop(G, 2580, 1400);
    placeCop(G, 2500, 1080);
    // Helicopter overhead (stars >= 4 activates it on the next step).
    G.heli.active = true;
    G.heli.x = 2500;
    G.heli.y = 1060;
    // Timed alarm running up, Mara on the radio of the moment.
    G.missionTimer.label = 'ALARM';
    G.missionTimer.seconds = 127;
    G.missionTimer.active = true;
    G.missionTimer.countUp = true;
    G.radio.station = 0;
    G.radio.song = 0;
    // Mara briefing line with her portrait.
    G.dialogue = {
      who: 'MARA',
      lines: ['MARA: Grab the bags and run, Dario — the whole city is coming for us now.'],
      line: 0,
    };
    G.missions.dialog = { lines: G.dialogue.lines, line: 0, giver: 'MARA' };
    // Weapons: Squall SMG unlocked after mission 8, loaded and selected.
    G.weapons.selected = 2;
    // District banner up for the shot.
    G.district.name = 'CASINO STRIP';
    G.district.flavor = 'Neon and bad decisions';
    G.district.bannerT = 3;
    G.time = 40;
    return;
  }
  if (name === 'chase') {
    // A police chase down the beach road: three units, helicopter-free heat.
    G.missions.index = 6;
    G.missions.step = 0;
    G.missions.completedCount = 6;
    G.player.money = 2890;
    G.clock.day = 2;
    G.clock.hour = 18;
    G.clock.minute = 24;
    G.rep.points = 640;
    G.wanted.stars = 3;
    G.wanted.heat = 72;
    putPlayerInCar(G, 380, 1100, 0);
    G.player.car.angle = Math.PI / 2;
    G.player.car.speed = 430;
    placeCop(G, 380, 820);
    placeCop(G, 460, 980);
    placeCop(G, 380, 1380);
    G.district.name = 'SUNSET PIER';
    G.district.flavor = 'Fishermen and runaways';
    G.district.bannerT = 3;
    G.radio.station = 1;
    G.radio.song = 1;
    G.time = 22;
    return;
  }
  if (name === 'mission') {
    // Mission 4, 'First Blood': briefing open, thugs on open ground.
    G.missions.index = 3;
    G.missions.step = 0;
    G.missions.completedCount = 3;
    G.player.money = 1240;
    G.clock.day = 1;
    G.clock.hour = 20;
    G.clock.minute = 15;
    G.rep.points = 310;
    G.player.x = 900;
    G.player.y = 1560;
    G.player.onFoot = true;
    openBriefing(G);
    // Thugs spawn on open ground around the bar (prepareStep runs after
    // the briefing advances; stage them now so the frame is alive).
    const spots = [[820, 1600], [960, 1620], [900, 1740]];
    for (const [x, y] of spots) {
      G.enemies.push({ x, y, hp: 60, angle: 0, speed: 150, shootT: 1, meleeT: 0, name: 'Kessler thug' });
    }
    G.district.name = 'HARBOR DISTRICT';
    G.district.flavor = "Cranes, crates and Kessler's men";
    G.district.bannerT = 3;
    G.time = 8;
    return;
  }
}
