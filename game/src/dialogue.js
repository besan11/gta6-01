// Character dialogue with procedural portraits: every mission briefing is a face,
// a name and three lines — drawn from code, never from an image file.
import { DIALOG_PORTRAITS } from './config.js';

export function createDialogue() {
  return { active: null, contextual: null, contextualT: 0 };
}

export function openDialogue(G, giver, lines) {
  G.dialogue.active = { giver, lines, line: 0 };
}

export function showContextLine(G, giver, line) {
  G.dialogue.contextual = { giver, line };
  G.dialogue.contextualT = 4;
}

export function drawPortrait(ctx, giver, x, y, size) {
  const spec = DIALOG_PORTRAITS[giver] || DIALOG_PORTRAITS['Dario Cruz'];
  const r = size / 2;
  ctx.save();
  ctx.fillStyle = '#20242c';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = spec.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  const cx = x + r;
  const cy = y + r - 4;
  // Shoulders.
  ctx.fillStyle = spec.accent;
  ctx.beginPath();
  ctx.arc(cx, y + size + 6, r * 0.95, Math.PI, 0);
  ctx.fill();
  // Face.
  ctx.fillStyle = spec.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  // Hair by style.
  ctx.fillStyle = spec.hair;
  if (spec.style === 'bob') {
    ctx.beginPath();
    ctx.arc(cx, cy - 4, r * 0.54, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r * 0.54, cy - 4, r * 0.2, r * 0.5);
    ctx.fillRect(cx + r * 0.34, cy - 4, r * 0.2, r * 0.5);
  } else if (spec.style === 'long') {
    ctx.beginPath();
    ctx.arc(cx, cy - 6, r * 0.56, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r * 0.56, cy - 6, r * 0.28, r * 0.9);
    ctx.fillRect(cx + r * 0.28, cy - 6, r * 0.28, r * 0.9);
  } else if (spec.style === 'cap') {
    ctx.beginPath();
    ctx.arc(cx, cy - 6, r * 0.54, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - r * 0.5, cy - 12, r * 1.2, 7);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy - 6, r * 0.52, Math.PI, 0);
    ctx.fill();
  }
  // Eyes.
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy, 2.4, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.2, cy, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawDialoguePanel(ctx, G, x, y, w) {
  const d = G.dialogue.active || G.dialogue.contextual;
  if (!d) return 0;
  const lineIdx = d.line !== undefined ? d.line : 0;
  const text = d.lines ? d.lines[lineIdx] : d.line;
  const giver = d.giver;
  const h = 108;
  ctx.fillStyle = 'rgba(16,20,28,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  drawPortrait(ctx, giver, x + 12, y + 12, 84);
  ctx.fillStyle = '#ffcf3f';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(giver.toUpperCase(), x + 108, y + 28);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = '15px sans-serif';
  wrapText(ctx, text, x + 108, y + 52, w - 124, 20);
  ctx.fillStyle = '#9aa3ad';
  ctx.font = '12px sans-serif';
  ctx.fillText('Enter / Space — continue', x + 108, y + h - 12);
  return h;
}

export function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  let line = '';
  let ly = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly);
      line = word;
      ly += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, ly);
  return ly - y + lineH;
}
