// Synthesised WebAudio only — no audio files, no network. Everything is
// guarded so a headless browser without audio still runs the game fine.
export function createAudio() {
  return {
    ctx: null, muted: false, engineOsc: null, engineGain: null,
    sirenOsc: null, sirenGain: null, rotorOsc: null, rotorGain: null,
    musicTimer: null, musicStep: 0,
  };
}

function ensure(a) {
  if (a.ctx) return a.ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    a.ctx = new AC();
  } catch { return null; }
  return a.ctx;
}

export function unlockAudio(a) {
  const ctx = ensure(a);
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function tone(a, freq, dur, type, vol) {
  if (a.muted) return;
  const ctx = ensure(a);
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch { /* audio is decoration, never fatal */ }
}

export function noiseBurst(a, dur, vol) {
  if (a.muted) return;
  const ctx = ensure(a);
  if (!ctx) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let s = 123456789;
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x40000000 - 1) * (1 - i / len); }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol || 0.12;
    src.buffer = buf;
    src.connect(g).connect(ctx.destination);
    src.start();
  } catch { /* ignore */ }
}

export function startEngine(a) {
  const ctx = ensure(a);
  if (!ctx || a.engineOsc) return;
  try {
    a.engineOsc = ctx.createOscillator();
    a.engineGain = ctx.createGain();
    a.engineOsc.type = 'sawtooth';
    a.engineOsc.frequency.value = 55;
    a.engineGain.gain.value = 0.0;
    a.engineOsc.connect(a.engineGain).connect(ctx.destination);
    a.engineOsc.start();
  } catch { /* ignore */ }
}

export function setEngine(a, speed01) {
  if (!a.engineOsc || a.muted) return;
  try {
    a.engineOsc.frequency.value = 55 + speed01 * 90;
    a.engineGain.gain.value = 0.015 + speed01 * 0.03;
  } catch { /* ignore */ }
}

export function setSiren(a, on) {
  const ctx = ensure(a);
  if (!ctx) return;
  try {
    if (on && !a.sirenOsc) {
      a.sirenOsc = ctx.createOscillator();
      a.sirenGain = ctx.createGain();
      a.sirenOsc.type = 'sine';
      a.sirenOsc.frequency.value = 780;
      a.sirenGain.gain.value = a.muted ? 0 : 0.02;
      a.sirenOsc.connect(a.sirenGain).connect(ctx.destination);
      a.sirenOsc.start();
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.8;
      const lg = ctx.createGain();
      lg.gain.value = 220;
      lfo.connect(lg).connect(a.sirenOsc.frequency);
      lfo.start();
      a.sirenLfo = lfo;
    } else if (!on && a.sirenOsc) {
      try { a.sirenOsc.stop(); a.sirenLfo && a.sirenLfo.stop(); } catch { /* ignore */ }
      a.sirenOsc = null; a.sirenLfo = null;
    }
  } catch { /* ignore */ }
}

export function setRotor(a, on) {
  const ctx = ensure(a);
  if (!ctx) return;
  try {
    if (on && !a.rotorOsc) {
      a.rotorOsc = ctx.createOscillator();
      a.rotorGain = ctx.createGain();
      a.rotorOsc.type = 'triangle';
      a.rotorOsc.frequency.value = 28;
      a.rotorGain.gain.value = a.muted ? 0 : 0.03;
      a.rotorOsc.connect(a.rotorGain).connect(ctx.destination);
      a.rotorOsc.start();
    } else if (!on && a.rotorOsc) {
      try { a.rotorOsc.stop(); } catch { /* ignore */ }
      a.rotorOsc = null;
    }
  } catch { /* ignore */ }
}

export function startMusic(a) {
  const ctx = ensure(a);
  if (!ctx || a.musicTimer) return;
  const notes = [262, 330, 392, 494, 392, 330, 294, 392];
  a.musicTimer = setInterval(() => {
    if (a.muted) return;
    tone(a, notes[a.musicStep % notes.length], 0.5, 'sine', 0.03);
    a.musicStep++;
  }, 420);
}

export function wantedUp(a) { tone(a, 880, 0.18, 'square', 0.09); tone(a, 1174, 0.22, 'square', 0.09); }
export function bustedSound(a) { tone(a, 220, 0.5, 'sawtooth', 0.1); }
export function wastedSound(a) { tone(a, 110, 0.7, 'sawtooth', 0.1); }
export function clickSound(a) { tone(a, 660, 0.06, 'sine', 0.06); }
export function fanfare(a) { tone(a, 523, 0.15, 'square', 0.08); setTimeout(() => tone(a, 784, 0.25, 'square', 0.08), 140); }

export function setMuted(a, m) {
  a.muted = m;
  if (a.engineGain) a.engineGain.gain.value = 0;
  if (a.sirenGain) a.sirenGain.gain.value = 0;
  if (a.rotorGain) a.rotorGain.gain.value = 0;
}
export function isMuted(a) { return a.muted; }
