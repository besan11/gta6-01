// HUD layout: one table of rectangles for the 1280x720 frame. Every panel
// reads its place from here, so nothing ever stacks on anything else.
export const LAYOUT = {
  W: 1280, H: 720,
  money: { x: 16, y: 14 },
  missionPanel: { x: 16, y: 74, w: 372 },
  stars: { x: 964, y: 14, w: 300 },
  pdPanel: { x: 964, y: 64, w: 300 },
  minimap: { x: 964, y: 0, w: 300, h: 210 }, // y set below the PD panel at draw time
  speed: { x: 1264, y: 626 },
  radio: { x: 1264, y: 690 },
  weapons: { cx: 640, y: 676 },
  timer: { cx: 640, y: 14 },
  banner: { cx: 640, y: 560 },
  dialog: { cx: 640, y: 548, w: 780 },
  toast: { cx: 640, y: 96 },
  rep: { x: 16, y: 0 }, // placed under the mission panel at draw time
};

export function minimapY(pdHeight) {
  return 64 + pdHeight + 10;
}

export function repY(missionPanelHeight) {
  return 84 + missionPanelHeight + 8;
}
