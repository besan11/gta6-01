// Dialogue: mission briefings and mid-mission lines, delivered as a panel
// with a procedurally drawn portrait of whoever is talking. No images —
// every face is circles and arcs in that character's colours.
import { CHARACTERS } from './config.js';

export function createDialogue() {
  return null;
}

// One contextual line while playing, shown as a short sticky dialogue card.
export function sayLine(G, who, text, seconds) {
  G.dialogue = { who, lines: [text], line: 0, sticky: seconds || 3 };
}

export function drawPortrait(ctx, who, x, y, size) {
  const c = CHARACTERS[who] || CHARACTERS.DARIO;
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.fillStyle = c.accent;
  ctx.fillRect(x, y, size, size);
  // Shoulders.
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.ellipse(x + r, y + size * 0.98, r * 0.95, r * 0.55, 0, Math.PI, 0);
  ctx.fill();
  // Head.
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(x + r, y + r * 0.86, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  // Hair by style.
  ctx.fillStyle = c.hair;
  if (c.style === 'long') {
    ctx.beginPath();
    ctx.arc(x + r, y + r * 0.62, r * 0.55, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + r * 0.42, y + r * 0.5, r * 0.22, r * 0.9);
    ctx.fillRect(x + r * 1.36, y + r * 0.5, r * 0.22, r * 0.9);
  } else if (c.style === 'bob') {
    ctx.beginPath();
    ctx.arc(x + r, y + r * 0.66, r * 0.56, Math.PI * 0.95, Math.PI * 0.05);
    ctx.fill();
  } else if (c.style === 'cap') {
    ctx.beginPath();
    ctx.arc(x + r, y + r * 0.6, r * 0.54, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + r * 0.4, y + r * 0.52, r * 1.2, r * 0.16);
  } else {
    ctx.beginPath();
    ctx.arc(x + r, y + r * 0.58, r * 0.53, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }
  // Eyes + mouth.
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(x + r * 0.78, y + r * 0.88, r * 0.06, 0, Math.PI * 2);
  ctx.arc(x + r * 1.22, y + r * 0.88, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#20242c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + r, y + r * 1.05, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
}

export function drawDialog(ctx, G, cx, y, w) {
  const d = G.dialogue;
  if (!d) return 0;
  const c = CHARACTERS[d.who] || CHARACTERS.DARIO;
  const line = d.lines[Math.min(d.line, d.lines.length - 1)] || '';
  const h = 104;
  const x = cx - w / 2;
  ctx.fillStyle = 'rgba(16,20,28,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  drawPortrait(ctx, d.who, x + 12, y + 12, 80);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(c.name.toUpperCase(), x + 106, y + 12);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = '15px sans-serif';
  wrapText(ctx, line, x + 106, y + 34, w - 122, 20);
  if (d.lines.length > 1) {
    ctx.fillStyle = '#9aa3ad';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Enter ▸  ${d.line + 1}/${d.lines.length}`, x + 106, y + h - 20);
  }
  return h;
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
