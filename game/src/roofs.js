// Roof variety + original signage: no two rooftops read the same — AC
// boxes, water tanks, antennas, a roof garden, and one helipad over the
// casino — and every landmark carries its own hand-lettered sign.
export function drawRoofDetails(ctx, b, cam) {
  const x = b.x - cam.x;
  const y = b.y - cam.y;
  const cx = x + b.w / 2;
  const cy = y + b.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  if (b.variant === 1) {
    // AC box.
    ctx.fillRect(cx - 16, cy - 12, 32, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(cx - 16, cy - 12, 32, 6);
  } else if (b.variant === 2) {
    // Water tank on legs.
    ctx.fillStyle = '#5f8f7b';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 8);
    ctx.lineTo(cx - 16, cy + 22);
    ctx.moveTo(cx + 12, cy + 8);
    ctx.lineTo(cx + 16, cy + 22);
    ctx.stroke();
  } else if (b.variant === 3) {
    // Antenna.
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, cy - 26);
    ctx.stroke();
    ctx.fillStyle = '#ff5a4e';
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.variant === 4) {
    // Roof garden.
    ctx.fillStyle = '#3f8f4f';
    ctx.fillRect(x + 10, y + 10, b.w - 20, b.h - 20);
    ctx.fillStyle = '#6da054';
    for (let i = 0; i < 5; i++) {
      const gx = x + 18 + ((b.seed * 997 + i * 53) % Math.max(20, b.w - 36));
      const gy = y + 18 + ((b.seed * 613 + i * 37) % Math.max(20, b.h - 36));
      ctx.beginPath();
      ctx.arc(gx, gy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (b.variant === 5) {
    // Helipad: only the biggest roof in the strip gets one.
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(b.w, b.h) / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `bold ${Math.max(18, Math.min(34, b.w / 3))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f4f1e8';
    ctx.fillText('H', cx, cy);
    ctx.textAlign = 'left';
  }
}

export function drawSignage(ctx, lm, cam) {
  const sx = lm.x - cam.x;
  const sy = lm.y - cam.y;
  if (sx < -160 || sx > 1440 || sy < -80 || sy > 800) return;
  ctx.font = 'bold 15px sans-serif';
  const w = ctx.measureText(lm.label).width + 18;
  ctx.fillStyle = 'rgba(16,20,28,0.85)';
  ctx.fillRect(sx - w / 2, sy - 52, w, 24);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx - w / 2 + 0.5, sy - 52 + 0.5, w - 1, 23);
  ctx.fillStyle = '#ffcf3f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lm.label, sx, sy - 40);
  ctx.textAlign = 'left';
}
