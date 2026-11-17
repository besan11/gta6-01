// helicopter.js — AIR-1, the police helicopter. It lifts off once the heat
// hits four stars, trails Dario from above with a slow hover offset, and
// pins him in a spotlight cone. It cannot be shot down; it just watches.
// The rotor sound rides on audio.setRotor, and the blades spin off G.time,
// so the frame is identical on every deterministic run.
export function createHeli() {
  return { active: false, x: 0, y: 0, angle: 0, hoverT: 0 };
}

export function updateHeli(G, dt) {
  const h = G.heli;
  const shouldBe = G.wanted.stars >= 4;
  if (shouldBe && !h.active) {
    h.active = true;
    h.x = G.player.x - 260;
    h.y = G.player.y - 260;
    if (G.audio) G.audio.setRotor(true);
  } else if (!shouldBe && h.active) {
    h.active = false;
    if (G.audio) G.audio.setRotor(false);
  }
  if (!h.active) return;
  h.hoverT += dt;
  const px = G.player.x;
  const py = G.player.y;
  const tx = px + Math.cos(h.hoverT * 0.7) * 90 - 40;
  const ty = py + Math.sin(h.hoverT * 0.9) * 70 - 110;
  h.x += (tx - h.x) * Math.min(1, dt * 1.2);
  h.y += (ty - h.y) * Math.min(1, dt * 1.2);
  h.angle = Math.atan2(py - h.y, px - h.x);
}

export function drawHeli(ctx, G, cam) {
  const h = G.heli;
  if (!h.active) return;
  const sx = (h.x - cam.x) * cam.zoom;
  const sy = (h.y - cam.y) * cam.zoom;
  // Ground shadow, offset like the late sun throws it.
  ctx.fillStyle = 'rgba(20,16,10,0.30)';
  ctx.beginPath();
  ctx.ellipse(sx - 30, sy + 34, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spotlight cone onto the player.
  const p = G.player;
  const px = (p.x - cam.x) * cam.zoom;
  const py = (p.y - cam.y) * cam.zoom;
  const grad = ctx.createRadialGradient(px, py, 6, px, py, 150);
  grad.addColorStop(0, 'rgba(255,240,180,0.35)');
  grad.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,180,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(px - 40, py - 30);
  ctx.moveTo(sx, sy);
  ctx.lineTo(px + 40, py + 30);
  ctx.stroke();
  // Body.
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(h.angle);
  ctx.fillStyle = '#22447f';
  ctx.fillRect(-26, -10, 52, 20);
  ctx.fillStyle = '#9fd4ff';
  ctx.fillRect(8, -7, 14, 14);
  ctx.fillStyle = '#ffcf3f';
  ctx.fillRect(-26, -3, 10, 6);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AIR-1', 0, 0);
  // Rotor, spinning off game time (deterministic).
  const blade = G.time * 9;
  ctx.strokeStyle = 'rgba(20,24,32,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.cos(blade) * -34, Math.sin(blade) * -34);
  ctx.lineTo(Math.cos(blade) * 34, Math.sin(blade) * 34);
  ctx.moveTo(Math.cos(blade + Math.PI / 2) * -34, Math.sin(blade + Math.PI / 2) * -34);
  ctx.lineTo(Math.cos(blade + Math.PI / 2) * 34, Math.sin(blade + Math.PI / 2) * 34);
  ctx.stroke();
  ctx.restore();
  G.drawn.heli = true;
}
