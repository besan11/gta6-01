// HUD layout: one function owns every panel's rectangle on the 1280x720 frame,
// so no two panels ever overlap. The renderer asks for the layout, then draws.
export function hudLayout(G) {
  const pdLines = G.wanted && G.wanted.stars >= 1 ? Math.min(4, G.police.length + (G.heli && G.heli.active ? 1 : 0)) : 0;
  const pdH = pdLines > 0 ? 30 + pdLines * 24 : 0;
  return {
    money: { x: 16, y: 16, w: 300, h: 74 },
    mission: { x: 16, y: 112, w: 330, h: 108 },
    stars: { x: 964, y: 14, w: 300, h: 34 },
    pdPanel: { x: 964, y: 54, w: 300, h: pdH },
    minimap: { x: 964, y: 54 + pdH + 10, w: 300, h: 210 },
    speed: { x: 964, y: 640, w: 300, h: 64 },
    radio: { x: 964, y: 600, w: 300, h: 32 },
    weapons: { x: 322, y: 660, w: 636, h: 46 },
    dialogue: { x: 322, y: 540, w: 636, h: 108 },
    timer: { x: 640, y: 14, w: 220, h: 52 },
    banner: { x: 340, y: 560, w: 600, h: 64 },
    toast: { x: 640, y: 76, w: 640, h: 30 },
  };
}
