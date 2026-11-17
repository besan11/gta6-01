// config.js — PORTO VERDE: every tuning number, colour and name in one place.
// Features implemented from these constants: the 3200x2400 coastal city grid, the
// day/time clock, wanted stars, player/car speeds, mission rewards, HUD palette.
// The city is Porto Verde, a fictional sun-soaked port town. All names are original.
export const CITY_NAME = 'Porto Verde';
export const GAME_TITLE = 'Porto Verde: Three Days in the Sun';

export const WORLD = { width: 3200, height: 2400 };
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const ROAD_WIDTH = 96;
export const ROADS_X = [500, 900, 1300, 1700, 2100, 2500, 2900];
export const ROADS_Y = [300, 700, 1100, 1500, 1900, 2200];
export const BEACH_X = 340; // sand west of this; sea west of x=260
export const SEA_X = 260;

export const PLAYER = {
  radius: 14,
  walkSpeed: 230,
  runSpeed: 330,
  hp: 100,
  punchDamage: 25,
  punchRange: 46,
  punchCooldown: 0.45,
  shootCooldown: 0.28,
  bulletSpeed: 780,
  bulletDamage: 34,
};

export const CAR = {
  length: 64,
  width: 32,
  accel: 420,
  brake: 700,
  maxSpeed: 520,
  reverseSpeed: 180,
  turnRate: 2.6,
  drag: 0.6,
  hp: 100,
};

export const POLICE = {
  maxSpeed: 560,
  accel: 520,
  ramDamage: 12,
  bustRadius: 60,
  spawnDistance: 700,
};

export const WANTED = {
  maxStars: 5,
  decayDelay: 14, // seconds hidden before stars start falling
  decayInterval: 6, // seconds per star lost while hidden
  stealCar: 1,
  shoot: 2,
  hitPed: 1,
  killThug: 0,
};

export const CLOCK = {
  startDay: 1,
  startHour: 8,
  startMinute: 0,
  minutesPerSecond: 1, // 1 real second = 1 game minute
  dayEndHour: 22,
};

export const MISSION_REWARDS = [150, 300, 450, 400, 350, 500, 600, 700, 650, 800, 1500, 2500];

export const PALETTE = {
  sea: '#1f7fb8',
  seaDeep: '#14608f',
  sand: '#e8d29a',
  sandDark: '#d9c184',
  grass: '#7fae62',
  park: '#6da054',
  road: '#3a3f4a',
  roadEdge: '#2c303a',
  lane: '#e8d44d',
  sidewalk: '#b9b3a4',
  buildingRoof: ['#c96f4a', '#d9a441', '#7d8ba0', '#b05548', '#5f8f7b', '#a06a8f', '#8a6f4d', '#4f7fa0'],
  buildingWall: '#e8e0d0',
  palm: '#3f8f4f',
  palmTrunk: '#8a6f4d',
  player: '#ffcf3f',
  playerShirt: '#e2453c',
  cop: '#2f6fd0',
  copCar: '#22447f',
  thug: '#7a3fd0',
  text: '#f4f1e8',
  darkText: '#20242c',
  muted: '#9aa3ad',
  panel: 'rgba(16,20,28,0.88)',
  panelEdge: '#ffcf3f',
  money: '#7be07b',
  hp: '#ff5a4e',
  star: '#ffd94d',
  marker: '#ffcf3f',
  objective: '#37e0a0',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** localStorage key for the save game (this browser only). */
export const SAVE_KEY = 'porto-verde.save.v1';
