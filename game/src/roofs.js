// Roofs and signage: no two rooftops look alike, and every landmark wears its own
// original sign — AC boxes, water tanks, a helipad over the casino, antennas, roof
// gardens, all drawn procedurally from each building's seed.
export function roofVariantName(variant) {
  return ['plain', 'ac-box', 'water-tank', 'antenna', 'roof-garden'][variant % 5] || 'plain';
}

export function drawRoof(ctx, b) {
  ctx.fillStyle = b.roof;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = 'rgba(32,36,44,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
  const variant = b.variant % 5;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  if (variant === 1) {
    // AC box.
    ctx.fillStyle = '#d8d2c4';
    ctx.fillRect(cx - 14, cy - 10, 28, 20);
    ctx.strokeStyle = '#5a5148';
    ctx.strokeRect(cx - 14, cy - 10, 28, 20);
  } else if (variant === 2) {
    // Water tank.
    ctx.fillStyle = '#8a6f4d';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b5636';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 3) {
    // Antenna.
    ctx.strokeStyle = '#2c303a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 6, cy - 26);
    ctx.stroke();
    ctx.fillStyle = '#ff5a4e';
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 28, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 4) {
    // Roof garden.
    ctx.fillStyle = '#6da054';
    ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);
    ctx.fillStyle = '#3f8f4f';
    ctx.beginPath();
    ctx.arc(cx - 12, cy, 8, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy + 4, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHelipad(ctx, x, y) {
  ctx.fillStyle = '#2c303a';
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('H', x, y + 8);
}

export function signageFor(key) {
  const signs = {
    MARINA_CAFE: 'MARINA CAFE',
    HARBOR: 'HARBOR WAREHOUSE',
    GARAGE: 'VERDE GARAGE',
    DOCKSIDE: 'DOCKSIDE BAR',
    VIEWPOINT: 'MIRADOR',
    PLAZA: 'CENTRAL PLAZA',
    CASINO: 'CASINO VERDE',
    AIRSTRIP: 'AIRSTRIP',
    CITY_HALL: 'CITY HALL',
    PIER: 'SUNSET PIER',
  };
  return signs[key] || key;
}

export function drawSignage(ctx, text, x, y) {
  ctx.save();
  ctx.font = 'bold 13px sans-serif';
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(16,20,28,0.85)';
  ctx.fillRect(x - w / 2, y - 11, w, 20);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 0.5, y - 10.5, w - 1, 19);
  ctx.fillStyle = '#ffcf3f';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 4);
  ctx.restore();
}
