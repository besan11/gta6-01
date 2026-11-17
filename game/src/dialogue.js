// dialogue.js — Faces and words. Every mission briefing is a dialogue panel
// with a procedural portrait of whoever is talking — Mara's dark bob and
// gold hoop, Tito's cap and moustache, Lena's blonde sweep and red lips,
// Dario's own stubble and sun-bleached hair. Context lines fire during play
// too: Mara warning Dario off her garage while the heat is on, a giver's
// praise when a job lands. Portraits are drawn from code, never images.
export const PORTRAITS = {
  'Mara Solis': { skin: '#d9a06b', hair: '#2b2118', accent: '#e8c33c', style: 'bob' },
  'Tito Ramos': { skin: '#b97e4e', hair: '#3a2a1a', accent: '#3f8f5f', style: 'cap' },
  'Lena Voss': { skin: '#f2c89b', hair: '#e8c33c', accent: '#e2453c', style: 'sweep' },
  'Dario Cruz': { skin: '#c98f5e', hair: '#5a3a22', accent: '#ffcf3f', style: 'stubble' },
};

export function createDialogue() {
  return { lines: [], line: 0, speaker: '', active: false, t: 0 };
}

export function openDialogue(G, speaker, lines) {
  G.dialogue.lines = lines.slice();
  G.dialogue.line = 0;
  G.dialogue.speaker = speaker;
  G.dialogue.active = true;
  G.dialogue.t = 0;
}

export function advanceDialogue(G) {
  const d = G.dialogue;
  if (!d.active) return false;
  d.line += 1;
  if (d.line >= d.lines.length) {
    d.active = false;
    return false;
  }
  return true;
}

export function sayContext(G, speaker, text) {
  G.dialogue.lines = [text];
  G.dialogue.line = 0;
  G.dialogue.speaker = speaker;
  G.dialogue.active = true;
  G.dialogue.t = 4;
}

export function updateDialogue(G, dt) {
  const d = G.dialogue;
  if (!d.active) return;
  if (d.t > 0) {
    d.t -= dt;
    if (d.t <= 0 && d.lines.length === 1) d.active = false;
  }
}

// Draw a small procedural face: head, hair by style, eyes, mouth, accent.
export function drawPortrait(ctx, speaker, x, y, size) {
  const p = PORTRAITS[speaker] || PORTRAITS['Dario Cruz'];
  const r = size / 2;
  ctx.save();
  ctx.translate(x + r, y + r);
  ctx.fillStyle = '#10141c';
  ctx.fillRect(-r, -r, size, size);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 2;
  ctx.strokeRect(-r, -r, size, size);
  // Face.
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(0, 2, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Hair by style.
  ctx.fillStyle = p.hair;
  if (p.style === 'bob') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 0.64, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-r * 0.64, -r * 0.18, r * 0.22, r * 0.5);
    ctx.fillRect(r * 0.42, -r * 0.18, r * 0.22, r * 0.5);
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(-r * 0.62, r * 0.22, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.62, r * 0.22, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.style === 'cap') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.28, r * 0.6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(-r * 0.62, -r * 0.34, r * 1.24, r * 0.16);
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(-r * 0.28, r * 0.12, r * 0.56, r * 0.1);
  } else if (p.style === 'sweep') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r * 0.62, Math.PI * 0.9, Math.PI * 2.05);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.1, r * 0.34, Math.PI, Math.PI * 1.7);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(-r * 0.14, r * 0.32, r * 0.28, r * 0.07);
  } else {
    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r * 0.6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,26,14,0.85)';
    ctx.beginPath();
    ctx.arc(0, r * 0.34, r * 0.4, 0, Math.PI);
    ctx.fill();
  }
  // Eyes and mouth.
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(-r * 0.24, 0, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.24, 0, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a3a28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, r * 0.28, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
