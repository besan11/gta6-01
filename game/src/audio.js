// audio.js — All sound is synthesized WebAudio: engine hum, siren, rotor,
// gunshots, and a small fanfare. Nothing is loaded from disk. Every call
// is guarded so a headless browser (or a muted tab) never breaks the game.
export function createAudio() {
  const a = {
    ctx: null, muted: false, engineOsc: null, engineGain: null,
    sirenOsc: null, sirenGain: null, rotorOsc: null, rotorGain: null,
    musicTimer: null, musicStep: 0,
  };
  a.ensure = function ensure() {
    try {
      if (!a.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        a.ctx = new AC();
      }
      // Resume needs a user gesture; try once per unlock so a headless
      // page does not spam the autoplay warning every frame.
      if (a.ctx.state === 'suspended' && !a.resumeTried) {
        a.resumeTried = true;
        a.ctx.resume();
      }
    } catch (e) { /* audio is optional */ }
  };
  a.unlock = function unlock() { a.resumeTried = false; a.ensure(); };
  a.tone = function tone(freq, dur, type, vol, slide) {
    if (a.muted) return;
    a.ensure();
    if (!a.ctx) return;
    try {
      const o = a.ctx.createOscillator();
      const g = a.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, a.ctx.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, a.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.08, a.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.ctx.currentTime + dur);
      o.connect(g);
      g.connect(a.ctx.destination);
      o.start();
      o.stop(a.ctx.currentTime + dur);
    } catch (e) { /* ignore */ }
  };
  a.noise = function noise(dur, vol) {
    if (a.muted) return;
    a.ensure();
    if (!a.ctx) return;
    try {
      const len = Math.floor(a.ctx.sampleRate * dur);
      const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.ctx.createBufferSource();
      src.buffer = buf;
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.1, a.ctx.currentTime);
      src.connect(g);
      g.connect(a.ctx.destination);
      src.start();
    } catch (e) { /* ignore */ }
  };
  a.startEngine = function startEngine() {
    a.ensure();
    if (!a.ctx || a.engineOsc) return;
    try {
      a.engineOsc = a.ctx.createOscillator();
      a.engineGain = a.ctx.createGain();
      a.engineOsc.type = 'sawtooth';
      a.engineOsc.frequency.setValueAtTime(60, a.ctx.currentTime);
      a.engineGain.gain.setValueAtTime(0.0, a.ctx.currentTime);
      a.engineOsc.connect(a.engineGain);
      a.engineGain.connect(a.ctx.destination);
      a.engineOsc.start();
    } catch (e) { /* ignore */ }
  };
  a.setEngine = function setEngine(rpm) {
    if (!a.engineOsc || !a.ctx) return;
    try {
      a.engineOsc.frequency.setValueAtTime(50 + rpm * 120, a.ctx.currentTime);
      a.engineGain.gain.setValueAtTime(a.muted ? 0 : 0.03 + rpm * 0.03, a.ctx.currentTime);
    } catch (e) { /* ignore */ }
  };
  a.startMusic = function startMusic() {
    a.ensure();
    if (!a.ctx || a.musicTimer) return;
    const scale = [220, 261.6, 329.6, 392, 440, 523.3];
    a.musicTimer = setInterval(() => {
      if (a.muted) return;
      a.musicStep += 1;
      const f = scale[a.musicStep % scale.length];
      a.tone(f, 0.5, 'triangle', 0.03);
      if (a.musicStep % 4 === 0) a.tone(f / 2, 0.8, 'sine', 0.04);
    }, 420);
  };
  a.setSiren = function setSiren(on) {
    a.ensure();
    if (!a.ctx) return;
    try {
      if (on && !a.sirenOsc) {
        a.sirenOsc = a.ctx.createOscillator();
        a.sirenGain = a.ctx.createGain();
        a.sirenOsc.type = 'square';
        a.sirenOsc.frequency.setValueAtTime(700, a.ctx.currentTime);
        a.sirenGain.gain.setValueAtTime(a.muted ? 0 : 0.02, a.ctx.currentTime);
        a.sirenOsc.connect(a.sirenGain);
        a.sirenGain.connect(a.ctx.destination);
        a.sirenOsc.start();
        const lfo = a.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.6, a.ctx.currentTime);
        const lg = a.ctx.createGain();
        lg.gain.setValueAtTime(220, a.ctx.currentTime);
        lfo.connect(lg);
        lg.connect(a.sirenOsc.frequency);
        lfo.start();
        a.sirenLfo = lfo;
      } else if (!on && a.sirenOsc) {
        try { a.sirenOsc.stop(); } catch (e) {}
        try { if (a.sirenLfo) a.sirenLfo.stop(); } catch (e) {}
        a.sirenOsc = null;
        a.sirenLfo = null;
      }
    } catch (e) { /* ignore */ }
  };
  a.setRotor = function setRotor(on) {
    a.ensure();
    if (!a.ctx) return;
    try {
      if (on && !a.rotorOsc) {
        a.rotorOsc = a.ctx.createOscillator();
        a.rotorGain = a.ctx.createGain();
        a.rotorOsc.type = 'sawtooth';
        a.rotorOsc.frequency.setValueAtTime(28, a.ctx.currentTime);
        a.rotorGain.gain.setValueAtTime(a.muted ? 0 : 0.035, a.ctx.currentTime);
        a.rotorOsc.connect(a.rotorGain);
        a.rotorGain.connect(a.ctx.destination);
        a.rotorOsc.start();
      } else if (!on && a.rotorOsc) {
        try { a.rotorOsc.stop(); } catch (e) {}
        a.rotorOsc = null;
      }
    } catch (e) { /* ignore */ }
  };
  a.wantedUp = function wantedUp() { a.tone(520, 0.25, 'square', 0.05, 780); };
  a.busted = function busted() { a.tone(330, 0.5, 'sawtooth', 0.08, 110); };
  a.wasted = function wasted() { a.tone(220, 0.8, 'sawtooth', 0.08, 55); };
  a.click = function click() { a.tone(880, 0.07, 'sine', 0.05); };
  a.shoot = function shoot() { a.noise(0.09, 0.12); };
  a.fanfare = function fanfare() {
    a.tone(523.3, 0.18, 'triangle', 0.07);
    setTimeout(() => a.tone(659.3, 0.18, 'triangle', 0.07), 140);
    setTimeout(() => a.tone(783.9, 0.4, 'triangle', 0.07), 280);
  };
  a.setMuted = function setMuted(m) {
    a.muted = m;
    if (a.engineGain) a.engineGain.gain.setValueAtTime(0, a.ctx ? a.ctx.currentTime : 0);
    if (a.sirenGain) a.sirenGain.gain.setValueAtTime(0, a.ctx ? a.ctx.currentTime : 0);
    if (a.rotorGain) a.rotorGain.gain.setValueAtTime(0, a.ctx ? a.ctx.currentTime : 0);
  };
  a.isMuted = function isMuted() { return a.muted; };
  return a;
}
