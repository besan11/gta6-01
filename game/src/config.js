// config.js — Every number that shapes Porto Verde lives here, in one place.
// The world, the palette, the physics, the economy, and the tuning for the
// thirteen new systems (police response, helicopter, dialogue, REP, radio,
// districts, weapons, mission timer, sunset, money scale, minimap plus,
// roofs, HUD layout) all come from this file so the other modules stay small.
export const WORLD = { w: 3200, h: 2400 };
export const VIEW = { w: 1280, h: 720 };
export const STEP = 1 / 60;

export const ROADS_X = [500, 900, 1300, 1700, 2100, 2500, 2900];
export const ROADS_Y = [300, 700, 1100, 1500, 1900, 2200];
export const ROAD_W = 96;
export const BEACH_X = 340;
export const SEA_X = 260;

export const PARKS = [
  { x: 1400, y: 1200, w: 200, h: 200, name: 'Central Plaza' },
  { x: 1000, y: 1600, w: 160, h: 160, name: 'Jacaranda Park' },
  { x: 2200, y: 400, w: 180, h: 180, name: 'Palm Court' },
];

export const LANDMARKS = {
  MARINA_CAFE: { x: 500, y: 420 },
  HARBOR: { x: 640, y: 1900 },
  GARAGE: { x: 1700, y: 880 },
  DOCKSIDE: { x: 900, y: 1680 },
  VIEWPOINT: { x: 2900, y: 420 },
  PLAZA: { x: 1500, y: 1300 },
  CASINO: { x: 2500, y: 1250 },
  AIRSTRIP: { x: 2750, y: 2005 },
  CITY_HALL: { x: 1300, y: 950 },
  PIER: { x: 300, y: 1100 },
};

// District boxes are checked in order; OLD TOWN is the catch-all last entry.
export const DISTRICTS = [
  { name: 'MARINA NORTE', flavor: 'Cafes and old money', x0: 0, y0: 0, x1: 1200, y1: 800 },
  { name: 'MIRADOR HEIGHTS', flavor: 'The view is worth the climb', x0: 2300, y0: 0, x1: 3200, y1: 800 },
  { name: 'CASINO STRIP', flavor: 'Neon and bad decisions', x0: 2000, y0: 800, x1: 3200, y1: 1650 },
  { name: 'SUNSET PIER', flavor: 'Fishermen and runaways', x0: 0, y0: 800, x1: 700, y1: 1650 },
  { name: 'HARBOR DISTRICT', flavor: "Cranes, crates and Kessler's men", x0: 0, y0: 1650, x1: 3200, y1: 2400 },
  { name: 'OLD TOWN', flavor: 'City Hall and quiet streets', x0: 0, y0: 0, x1: 3200, y1: 2400 },
];

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

export const ROOF_COLORS = ['#c96f4a', '#d9a441', '#7d8ba0', '#b05548', '#5f8f7b', '#a06a8f', '#8a6f4d', '#4f7fa0'];

export const FONT = {
  title: 'bold 46px system-ui, sans-serif',
  big: 'bold 26px system-ui, sans-serif',
  ui: 'bold 16px system-ui, sans-serif',
  small: 'bold 13px system-ui, sans-serif',
  tiny: '12px system-ui, sans-serif',
};

export const PLAYER = {
  radius: 14, walk: 230, run: 330, hp: 100,
  punchDmg: 25, punchRange: 46, punchCd: 0.45,
  shootCd: 0.28, bulletSpeed: 780, bulletDmg: 34,
};

export const CAR = {
  length: 64, width: 32, accel: 420, brake: 700,
  maxSpeed: 520, reverse: 180, turn: 2.6, drag: 0.6, hp: 100,
};

export const POLICE = { maxSpeed: 560, accel: 520, ramDamage: 12, bustRadius: 60, spawnDistance: 700 };

export const WANTED = {
  maxStars: 5, decayDelay: 14, decayInterval: 6,
  stealCar: 1, shoot: 2, hitPed: 1, killThug: 0,
};

export const CLOCK = { startDay: 1, startHour: 8, endHour: 22, secondsPerMinute: 1 };

export const MISSION_REWARDS = [150, 300, 450, 400, 350, 500, 600, 700, 650, 800, 1500, 2500];

export const TRAFFIC_COUNT = 20;
export const PED_COUNT = 32;
export const SAVE_KEY = 'porto-verde.save.v1';

// 3.1 — Porto Verde PD response units (names shown in the response panel).
export const PD_UNITS = [
  { unit: 'Unit 4 Pelican', officer: 'Ofc. Tomas Reyna' },
  { unit: 'Unit 12 Kestrel', officer: 'Sgt. Dalia Fenn' },
  { unit: 'Unit 21 Osprey', officer: 'Ofc. Marcus Obi' },
  { unit: 'Unit 9 Heron', officer: 'Ofc. Bea Lindqvist' },
];
export const PD_AIR_UNIT = { unit: 'AIR-1', officer: 'Helicopter' };

// 3.4 — REP ranks: [minimum REP, rank name].
export const REP_RANKS = [
  { min: 0, name: 'NOBODY' },
  { min: 300, name: 'HUSTLER' },
  { min: 900, name: 'PLAYER' },
  { min: 1800, name: 'SHOT CALLER' },
  { min: 3000, name: 'BAY LEGEND' },
];
export const REP_PER_MISSION = 150;
export const REP_PER_ESCAPE = 40;
export const REP_PER_THUG = 10;

// 3.5 — Radio stations and their songs (deterministic rotation).
export const RADIO_STATIONS = [
  { name: 'CORAL FM 96.4', genre: 'sunset synth', songs: ['Palm Static — Coral Ghosts', 'Neon Tide — Vesper', 'Saltline — Auntie Coral'] },
  { name: 'WAVE 88.1', genre: 'Neon Drive', songs: ['Midnight Overpass — Glass Palms', 'Redline Hearts — Turbo Sunset', 'Chrome Coast — Night Ferry'] },
  { name: 'BRISA BOSSA 101.2', genre: 'bossa', songs: ['Cafezinho — Lulu Mar', 'Maré Baixa — Os Ventos', 'Areia Fina — Duo Brisa'] },
];
export const RADIO_SONG_SECONDS = 90;

// 3.7 — Weapon slots: Fists are infinite; the rest unlock as the story advances.
export const WEAPON_DEFS = [
  { key: '1', name: 'Fists', ammo: Infinity, unlockMission: 0, dmg: 25 },
  { key: '2', name: 'Tide 9mm', ammo: 90, unlockMission: 0, dmg: 34 },
  { key: '3', name: 'Squall SMG', ammo: 160, unlockMission: 8, dmg: 22 },
  { key: '4', name: 'Breaker 12', ammo: 24, unlockMission: 10, dmg: 70 },
];
export const AMMO_DROP = { pistol: 12, smg: 30, shotgun: 6 };

// 3.8 — Timed missions: defend seconds, Lena's sunset deadline, alarm timer.
export const MISSION_TIMERS = { defendSeconds: 45, lenaSeconds: 150 };

// 3.9 — Golden-hour sunset tuning.
export const SUNSET = {
  glowWest: 'rgba(255,140,50,0.20)',
  glowWarm: 'rgba(255,190,90,0.10)',
  shadowDx: -26,
  shadowDy: 12,
  boats: 3,
  umbrellas: 5,
};
