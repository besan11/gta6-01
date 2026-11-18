// Porto Verde — all tuning numbers live here, one place, so the rest of the
// game reads intent instead of magic numbers. Golden-hour coastal city.
export const WORLD = { w: 3200, h: 2400 };
export const ROADS_X = [500, 900, 1300, 1700, 2100, 2500, 2900];
export const ROADS_Y = [300, 700, 1100, 1500, 1900, 2200];
export const ROAD_W = 96;
export const SEA_X = 260;
export const BEACH_X = 340;

export const PARKS = [
  { x: 1400, y: 1200, w: 200, h: 200, name: 'Central Plaza' },
  { x: 1000, y: 1600, w: 160, h: 160, name: 'Jacaranda Park' },
  { x: 2200, y: 400, w: 180, h: 180, name: 'Palm Court' },
];

export const LANDMARKS = {
  MARINA_CAFE: { x: 500, y: 420, label: 'MARINA CAFE' },
  HARBOR: { x: 640, y: 1900, label: 'HARBOR' },
  GARAGE: { x: 1700, y: 880, label: 'VERDE GARAGE' },
  DOCKSIDE: { x: 900, y: 1680, label: 'DOCKSIDE BAR' },
  VIEWPOINT: { x: 2900, y: 420, label: 'MIRADOR' },
  PLAZA: { x: 1500, y: 1300, label: 'CENTRAL PLAZA' },
  CASINO: { x: 2500, y: 1250, label: 'CASINO VERDE' },
  AIRSTRIP: { x: 2750, y: 2005, label: 'AIRSTRIP' },
  CITY_HALL: { x: 1300, y: 950, label: 'CITY HALL' },
  PIER: { x: 300, y: 1100, label: 'SUNSET PIER' },
};

export const DISTRICTS = [
  { name: 'MARINA NORTE', flavor: 'Cafes and old money', x0: 260, y0: 0, x1: 1100, y1: 950 },
  { name: 'SUNSET PIER', flavor: 'Fishermen and runaways', x0: 260, y0: 950, x1: 1100, y1: 1500 },
  { name: 'OLD TOWN', flavor: 'City Hall and quiet streets', x0: 1100, y0: 700, x1: 2000, y1: 1500 },
  { name: 'MIRADOR HEIGHTS', flavor: 'The view is worth the climb', x0: 2000, y0: 0, x1: 3200, y1: 950 },
  { name: 'CASINO STRIP', flavor: 'Neon and bad decisions', x0: 2000, y0: 950, x1: 3200, y1: 1700 },
  { name: 'HARBOR DISTRICT', flavor: "Cranes, crates and Kessler's men", x0: 260, y0: 1500, x1: 3200, y1: 2400 },
];

export const PLAYER = {
  r: 14, walk: 230, run: 330, hp: 100,
  punchDmg: 25, punchRange: 46, punchCd: 0.45,
  shootCd: 0.28, bulletSpeed: 780, bulletDmg: 34,
};

export const CAR = {
  len: 64, wid: 32, accel: 420, brake: 700,
  maxSpeed: 520, reverse: 180, turn: 2.6, drag: 0.6, hp: 100,
};

export const POLICE = {
  maxSpeed: 560, accel: 520, ramDamage: 12,
  bustRadius: 60, spawnDistance: 700,
};

export const WANTED = { maxStars: 5, decayDelay: 14, decayInterval: 6 };

export const CLOCK = { startDay: 1, startHour: 8, endHour: 22, secondsPerMinute: 1 };

export const MISSION_REWARDS = [150, 300, 450, 400, 350, 500, 600, 700, 650, 800, 1500, 2500];
export const TRAFFIC_COUNT = 20;
export const PED_COUNT = 32;
export const SAVE_KEY = 'porto-verde.save.v1';

export const PALETTE = {
  sea: '#1f7fb8', seaDeep: '#14608f', sand: '#e8d29a', sandDark: '#d9c184',
  grass: '#7fae62', park: '#6da054', road: '#3a3f4a', roadEdge: '#2c303a',
  lane: '#e8d44d', sidewalk: '#b9b3a4', buildingWall: '#e8e0d0',
  palm: '#3f8f4f', palmTrunk: '#8a6f4d', player: '#ffcf3f', playerShirt: '#e2453c',
  cop: '#2f6fd0', copCar: '#22447f', thug: '#7a3fd0', text: '#f4f1e8',
  darkText: '#20242c', muted: '#9aa3ad', panel: 'rgba(16,20,28,0.88)',
  panelEdge: '#ffcf3f', money: '#7be07b', hp: '#ff5a4e', star: '#ffd94d',
  marker: '#ffcf3f', objective: '#37e0a0',
};

export const ROOF_COLORS = ['#c96f4a', '#d9a441', '#7d8ba0', '#b05548', '#5f8f7b', '#a06a8f', '#8a6f4d', '#4f7fa0'];

export const CAR_MODELS = [
  { name: 'Palma GT', color: '#e2453c', top: 540 },
  { name: 'Coral Cruiser', color: '#3fa7c9', top: 470 },
  { name: 'Brisa Sedan', color: '#e8e0d0', top: 450 },
  { name: 'Tide Runner', color: '#d9a441', top: 500 },
  { name: 'Sol Van', color: '#7fae62', top: 400 },
  { name: 'Marina Van', color: '#3f8f4f', top: 400 },
];
export const COP_MODEL = { name: 'PD Interceptor', color: '#22447f', top: 560 };

export const RADIO_STATIONS = [
  { name: 'CORAL FM 96.4', tag: 'sunset synth', songs: ['Palm Static — Coral Ghosts', 'Neon Tide — Vesper', 'Saltline — Auntie Coral'] },
  { name: 'WAVE 88.1', tag: 'Neon Drive', songs: ['Midnight Mirage — Vela', 'Chrome Sunset — The Palms', 'Night Ferry — Duo Sol'] },
  { name: 'BRISA BOSSA 101.2', tag: 'bossa nova', songs: ['Cafe Brisa — Luma', 'Slow Tide — Mar & Sol', 'Paper Moon — Tico'] },
];

export const REP_RANKS = [
  { min: 0, name: 'NOBODY' },
  { min: 300, name: 'HUSTLER' },
  { min: 900, name: 'PLAYER' },
  { min: 1800, name: 'SHOT CALLER' },
  { min: 3000, name: 'BAY LEGEND' },
];

export const WEAPON_DEFS = [
  { id: 'fists', name: 'Fists', ammo: Infinity, afterMission: 0 },
  { id: 'tide', name: 'Tide 9mm', ammo: 90, afterMission: 0 },
  { id: 'squall', name: 'Squall SMG', ammo: 160, afterMission: 8 },
  { id: 'breaker', name: 'Breaker 12', ammo: 24, afterMission: 10 },
];

export const PD_UNITS = [
  { unit: 'Unit 4 Pelican', officer: 'Ofc. Tomas Reyna' },
  { unit: 'Unit 12 Kestrel', officer: 'Sgt. Dalia Fenn' },
  { unit: 'Unit 21 Osprey', officer: 'Ofc. Marcus Obi' },
  { unit: 'Unit 9 Heron', officer: 'Ofc. Bea Lindqvist' },
];

export const CHARACTERS = {
  MARA: { name: 'Mara Solis', skin: '#e8b98a', hair: '#2b1d16', accent: '#c94f6d', style: 'long' },
  TITO: { name: 'Tito Ramos', skin: '#c98f5f', hair: '#3a2a1a', accent: '#3f7d4f', style: 'cap' },
  LENA: { name: 'Lena Voss', skin: '#f0c39a', hair: '#d9a441', accent: '#7d5fc9', style: 'bob' },
  DARIO: { name: 'Dario Cruz', skin: '#d9a06f', hair: '#1d1a16', accent: '#e2453c', style: 'short' },
};
