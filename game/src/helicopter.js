// Police helicopter AIR-1: joins the chase at four stars, hovers over the player,
// sweeps a spotlight across the street and thumps its rotor through the audio mixer.
import { clamp } from './random.js';

export function createHeli() {
  return { active: false, x: 0, y: 0, rotor: 0, bob: 0 };
}

export function updateHeli(G, dt) {
  const heli = G.heli;
  const want = G.wanted.stars >= 4;
  if (want && !heli.active) {
    heli.active = true;
    heli.x = G.player.x - 160;
    heli.y = G.player.y - 200;
    if (G.audio) G.audio.setRotor(true);
  } else if (!want && heli.active) {
    heli.active = false;
    if (G.audio) G.audio.setRotor(false);
  }
  if (!heli.active) return;
  heli.rotor += dt * 22;
  heli.bob += dt;
  const tx = G.player.x - 40;
  const ty = G.player.y - 110;
  heli.x += clamp(tx - heli.x, -260 * dt, 260 * dt);
  heli.y += clamp(ty - heli.y, -260 * dt, 260 * dt);
}

export function drawHeliShadow(ctx, G, cam) {
  const heli = G.heli;
  if (!heli.active) return;
  const sx = heli.x - cam.x;
  const sy = heli.y - cam.y + 46;
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spotlight cone from the helicopter down onto the player.
  const px = G.player.x - cam.x;
  const py = G.player.y - cam.y;
  const grad = ctx.createRadialGradient(px, py, 8, px, py, 150);
  grad.addColorStop(0, 'rgba(255,240,180,0.34)');
  grad.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, 150, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHeli(ctx, G, cam) {
  const heli = G.heli;
  if (!heli.active) return;
  const sx = heli.x - cam.x;
  const sy = heli.y - cam.y + Math.sin(heli.bob * 2.2) * 5;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = '#22447f';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9fd4ff';
  ctx.beginPath();
  ctx.ellipse(14, -2, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AIR-1', 0, 4);
  const a = heli.rotor;
  ctx.strokeStyle = 'rgba(244,241,232,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.cos(a) * -44, Math.sin(a) * -8);
  ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 8);
  ctx.moveTo(Math.cos(a + 1.57) * -44, Math.sin(a + 1.57) * -8);
  ctx.lineTo(Math.cos(a + 1.57) * 44, Math.sin(a + 1.57) * 8);
  ctx.stroke();
  ctx.restore();
}
