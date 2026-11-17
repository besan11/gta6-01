// roofs.js — Roofs with character, and signs you can read from the street.
// A roof is more than a flat colour: AC boxes, water tanks, antennas, a
// rooftop garden, and the casino's helipad, all drawn procedurally from the
// building's own seed. Landmarks wear their own original signs.
import { PALETTE } from './config.js';

const SIGNS = {
  MARINA_CAFE: 'MARINA CAFE',
  GARAGE: 'VERDE GARAGE',
  DOCKSIDE: 'DOCKSIDE BAR',
  CASINO: 'CASINO VERDE',
  VIEWPOINT: 'MIRADOR',
  CITY_HALL: 'CITY HALL',
  PIER: 'SUNSET PIER',
  HARBOR: 'HARBOR',
  AIRSTRIP: 'AIRSTRIP',
  PLAZA: 'CENTRAL PLAZA',
};

export function drawRoofDetails(ctx, b, cam) {
  const sx = (b.x - cam.x) * cam.zoom;
  const sy = (b.y - cam.y) * cam.zoom;
  const w = b.w * cam.zoom;
  const h = b.h * cam.zoom;
  if (sx + w < 0 || sx > 1280 || sy + h < 0 || sy > 720) return;
  const z = cam.zoom;
  if (b.variant === 'ac') {
    ctx.fillStyle = '#c8ccd2';
    ctx.fillRect(sx + w * 0.2, sy + h * 0.25, 18 * z, 12 * z);
    ctx.fillRect(sx + w * 0.6, sy + h * 0.55, 18 * z, 12 * z);
    ctx.fillStyle = '#8a8f96';
    ctx.fillRect(sx + w * 0.2 + 3 * z, sy + h * 0.25 + 3 * z, 12 * z, 6 * z);
  } else if (b.variant === 'tank') {
    ctx.fillStyle = '#7d8ba0';
    ctx.beginPath();
    ctx.arc(sx + w * 0.5, sy + h * 0.5, 12 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a6572';
    ctx.fillRect(sx + w * 0.5 - 2 * z, sy + h * 0.5 - 18 * z, 4 * z, 8 * z);
  } else if (b.variant === 'antenna') {
    ctx.strokeStyle = '#3a3f4a';
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.moveTo(sx + w * 0.5, sy + h * 0.5);
    ctx.lineTo(sx + w * 0.5 + 8 * z, sy + h * 0.5 - 22 * z);
    ctx.stroke();
    ctx.fillStyle = '#e2453c';
    ctx.beginPath();
    ctx.arc(sx + w * 0.5 + 8 * z, sy + h * 0.5 - 22 * z, 3 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.variant === 'garden') {
    ctx.fillStyle = '#6da054';
    ctx.fillRect(sx + w * 0.15, sy + h * 0.15, w * 0.7, h * 0.7);
    ctx.fillStyle = '#3f8f4f';
    ctx.beginPath();
    ctx.arc(sx + w * 0.35, sy + h * 0.35, 7 * z, 0, Math.PI * 2);
    ctx.arc(sx + w * 0.65, sy + h * 0.6, 7 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.variant === 'helipad') {
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.arc(sx + w / 2, sy + h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f4f1e8';
    ctx.font = 'bold ' + Math.max(12, 18 * z) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', sx + w / 2, sy + h / 2);
  }
}

export function drawSignage(ctx, G, cam) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const lm of G.city.landmarks) {
    const label = SIGNS[lm.name];
    if (!label) continue;
    const sx = (lm.x - cam.x) * cam.zoom;
    const sy = (lm.y - cam.y) * cam.zoom;
    if (sx < -80 || sx > 1360 || sy < -80 || sy > 800) continue;
    ctx.font = 'bold 13px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 16;
    ctx.fillStyle = 'rgba(16,20,28,0.85)';
    ctx.fillRect(sx - w / 2, sy - 52, w, 20);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - w / 2 + 0.5, sy - 51.5, w - 1, 19);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillText(label, sx, sy - 42);
    // A small marker pin under the sign.
    ctx.fillStyle = PALETTE.marker;
    ctx.beginPath();
    ctx.arc(sx, sy - 26, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
