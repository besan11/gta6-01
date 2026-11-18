// The police helicopter: at four stars and up, AIR-1 hangs over Dario with
// a spotlight cone and rotor wash. It cannot be shot down — it is the sky.
import { setRotor } from './audio.js';

export function createHelicopter() {
  return { x: 0, y: 0, active: false, rotor: 0 };
}

export function updateHelicopter(G, dt) {
  const h = G.heli;
  const want = G.wanted.stars >= 4;
  if (want && !h.active) {
    const p = G.player;
    h.x = p.car ? p.car.x : p.x;
    h.y = (p.car ? p.car.y : p.y) - 260;
  }
  h.active = want;
  if (h.active) {
    const p = G.player;
    const px = p.car ? p.car.x : p.x;
    const py = p.car ? p.car.y : p.y;
    const hoverX = Math.sin(G.time * 0.7) * 60;
    const hoverY = Math.cos(G.time * 0.5) * 40;
    h.x += (px + hoverX - h.x) * Math.min(1, dt * 1.4);
    h.y += (py - 190 + hoverY - h.y) * Math.min(1, dt * 1.4);
    h.rotor += dt * 22;
  }
  setRotor(G.audio, h.active);
}

export function drawHelicopter(ctx, G, cam) {
  const h = G.heli;
  if (!h.active) return;
  const p = G.player;
  const px = p.car ? p.car.x : p.x;
  const py = p.car ? p.car.y : p.y;
  // Ground shadow + spotlight cone on the player.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(h.x - cam.x, h.y + 46 - cam.y, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(h.x - cam.x, h.y - cam.y, px - cam.x, py - cam.y);
  grad.addColorStop(0, 'rgba(255,240,180,0.34)');
  grad.addColorStop(1, 'rgba(255,240,180,0.05)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(h.x - cam.x - 10, h.y - cam.y + 8);
  ctx.lineTo(h.x - cam.x + 10, h.y - cam.y + 8);
  ctx.lineTo(px - cam.x + 44, py - cam.y + 30);
  ctx.lineTo(px - cam.x - 44, py - cam.y + 30);
  ctx.closePath();
  ctx.fill();
  // Body + spinning rotor, deterministic angle from G.time.
  const sx = h.x - cam.x;
  const sy = h.y - cam.y;
  ctx.fillStyle = '#22447f';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 26, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f6fd0';
  ctx.fillRect(sx + 18, sy - 4, 22, 7);
  ctx.fillStyle = '#ffcf3f';
  ctx.fillRect(sx - 6, sy - 5, 12, 4);
  ctx.strokeStyle = 'rgba(244,241,232,0.9)';
  ctx.lineWidth = 3;
  const ra = h.rotor;
  ctx.beginPath();
  ctx.moveTo(sx - Math.cos(ra) * 40, sy - Math.sin(ra) * 40);
  ctx.lineTo(sx + Math.cos(ra) * 40, sy + Math.sin(ra) * 40);
  ctx.moveTo(sx - Math.cos(ra + 1.57) * 40, sy - Math.sin(ra + 1.57) * 40);
  ctx.lineTo(sx + Math.cos(ra + 1.57) * 40, sy + Math.sin(ra + 1.57) * 40);
  ctx.stroke();
  ctx.fillStyle = '#f4f1e8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AIR-1', sx, sy - 22);
  ctx.textAlign = 'left';
}
