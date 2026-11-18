// Porto Verde v6 — one layout table for the whole HUD, so no two panels ever
// share a pixel. Every coordinate below is for the 1280x720 frame.
export const HUD_LAYOUT = {
  money: { x: 16, y: 16 },
  clock: { x: 16, y: 44 },
  districtLine: { x: 16, y: 68 },
  rep: { x: 16, y: 92, w: 220 },
  missionPanel: { x: 16, y: 122, w: 330, h: 92 },
  wanted: { x: 1280 - 16, y: 16 },
  pdPanel: { x: 1280 - 316, y: 48, w: 300, h: 118 },
  minimap: { x: 1280 - 316, y: 174, w: 300, h: 210 },
  timer: { x: 640, y: 16 },
  districtBanner: { x: 640, y: 640 },
  dialog: { x: 240, y: 470, w: 800, h: 96 },
  contextLine: { x: 640, y: 452 },
  weapons: { x: 490, y: 668, w: 300, h: 40 },
  radio: { x: 1280 - 16, y: 668 },
  speed: { x: 1280 - 16, y: 600 },
  health: { x: 16, y: 646, w: 220 },
  toast: { x: 640, y: 96 },
  hint: { x: 640, y: 700 },
};

export function panelRect(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
