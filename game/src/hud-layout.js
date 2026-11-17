// hud-layout.js — Where every HUD piece lives on a 1280x720 frame, so no
// two panels ever stack on top of each other. The right column is a stack:
// wanted stars, then the PD response panel, then the big minimap. The left
// column holds money, the clock, and the district; the mission panel sits
// below it. Weapon slots anchor the bottom centre, radio the bottom right,
// the mission timer the top centre, and the district banner the lower centre.
export const LAYOUT = {
  money: { x: 16, y: 14 },
  missionPanel: { x: 16, y: 96, w: 340 },
  stars: { x: 1264, y: 14 },
  pdPanel: { x: 944, y: 44, w: 320 },
  minimap: { x: 964, y: 0, w: 300, h: 210 }, // y filled in by drawHud (below PD panel)
  speed: { x: 1264, y: 676 },
  weapons: { x: 640, y: 676 },
  radio: { x: 1264, y: 640 },
  timer: { x: 640, y: 14 },
  districtBanner: { x: 640, y: 580 },
  dialog: { x: 640, y: 470 },
  toast: { x: 640, y: 80 },
};

export function hudLayout() {
  return LAYOUT;
}
