// Porto Verde v6 — character dialogue with procedural portraits. Every briefing
// is a conversation, not a wall of text; the face next to the words is drawn
// from code (skin, hair, one signature feature per character).
export const PORTRAITS = {
  'Mara Solis': { skin: '#e8b48c', hair: '#2c1a12', accent: '#e2453c', feature: 'hoops' },
  'Tito Ramos': { skin: '#c98d5f', hair: '#1a1a1a', accent: '#4f9f5f', feature: 'cap' },
  'Lena Voss': { skin: '#f0c8a0', hair: '#e8c832', accent: '#7a3fd0', feature: 'mic' },
  'Dario Cruz': { skin: '#d9a06f', hair: '#3a2a1a', accent: '#ffcf3f', feature: 'scar' },
};

export function createDialogue() {
  const d = {
    lines: null, line: 0, speaker: null, t: 0,
    context: null, contextT: 0,
  };
  d.contextLine = function contextLine(G, kind) {
    if (kind === 'wanted') {
      d.context = 'MARA: Lose them before you come near my garage!';
      d.contextT = 4;
    } else if (kind === 'praise') {
      d.context = 'MARA: Clean work, Dario. The city notices that.';
      d.contextT = 4;
    }
  };
  return d;
}

export function openDialogue(G, speaker, lines) {
  G.dialogue.lines = lines;
  G.dialogue.line = 0;
  G.dialogue.speaker = speaker;
  G.dialogue.t = 0;
}

export function advanceDialogue(G) {
  const d = G.dialogue;
  if (!d.lines) return false;
  d.line += 1;
  if (d.line >= d.lines.length) {
    d.lines = null;
    d.speaker = null;
    d.line = 0;
    return true;
  }
  return false;
}

export function dialogueActive(G) {
  return !!G.dialogue.lines;
}

export function drawPortrait(ctx, name, x, y, size) {
  const p = PORTRAITS[name] || PORTRAITS['Dario Cruz'];
  const r = size / 2;
  ctx.save();
  ctx.fillStyle = '#20242c';
  ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
  ctx.fillStyle = p.accent;
  ctx.fillRect(x, y, size, size);
  ctx.beginPath();
  ctx.arc(x + r, y + r + 2, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = p.skin;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r, y + r - r * 0.22, r * 0.5, Math.PI, Math.PI * 2);
  ctx.fillStyle = p.hair;
  ctx.fill();
  if (p.feature === 'cap') {
    ctx.fillStyle = p.accent;
    ctx.fillRect(x + r * 0.5, y + r * 0.28, r, r * 0.22);
  } else if (p.feature === 'hoops') {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + r * 0.52, y + r * 1.05, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 1.48, y + r * 1.05, 4, 0, Math.PI * 2); ctx.stroke();
  } else if (p.feature === 'mic') {
    ctx.fillStyle = '#20242c';
    ctx.fillRect(x + r * 1.3, y + r * 1.2, 4, 10);
    ctx.beginPath(); ctx.arc(x + r * 1.38, y + r * 1.15, 5, 0, Math.PI * 2); ctx.fill();
  } else if (p.feature === 'scar') {
    ctx.strokeStyle = '#8a4a3a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + r * 0.8, y + r * 0.75); ctx.lineTo(x + r * 1.05, y + r * 1.05); ctx.stroke();
  }
  ctx.fillStyle = '#20242c';
  ctx.beginPath(); ctx.arc(x + r * 0.78, y + r * 0.95, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 1.22, y + r * 0.95, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
