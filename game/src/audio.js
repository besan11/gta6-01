// Synthesised WebAudio: engine hum, sirens, shots, coins and music — no audio files.
// Everything is guarded so a browser without audio still plays silently.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let rotorOsc = null;
  let rotorGain = null;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch { /* audio is cosmetic */ }
  }

  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    try {
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      let noiseState = 1234567;
      for (let i = 0; i < len; i += 1) {
        noiseState = (noiseState * 1103515245 + 12345) >>> 0;
        data[i] = ((noiseState >>> 8) / 8388608 - 1) * (1 - i / len);
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq || 1200;
      const g = c.createGain();
      g.gain.value = vol || 0.12;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
    } catch { /* cosmetic */ }
  }

  return {
    ensure,
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
    tone,
    noise,
    click() { tone(660, 0.06, 'square', 0.05); },
    wantedUp() { tone(440, 0.12, 'square', 0.07, 880); },
    busted() { tone(220, 0.5, 'sawtooth', 0.09, 110); },
    wasted() { tone(330, 0.6, 'sawtooth', 0.09, 55); },
    fanfare() { tone(523, 0.12, 'triangle', 0.09); setTimeout(() => tone(659, 0.12, 'triangle', 0.09), 110); setTimeout(() => tone(784, 0.22, 'triangle', 0.1), 220); },
    shot() { noise(0.09, 0.14, 2600); },
    punch() { noise(0.07, 0.1, 700); },
    coin() { tone(988, 0.1, 'sine', 0.07, 1319); },
    startEngine() { tone(90, 0.3, 'sawtooth', 0.06, 180); },
    startMusic() {
      if (musicTimer) return;
      const bass = [110, 130.8, 98, 146.8];
      musicTimer = setInterval(() => {
        if (muted) return;
        tone(bass[musicStep % 4], 0.5, 'triangle', 0.035);
        if (musicStep % 2 === 0) tone(bass[musicStep % 4] * 2, 0.25, 'sine', 0.025);
        musicStep += 1;
      }, 500);
    },
    setEngine(on, speedRatio) {
      if (muted) { if (engineOsc) { try { engineOsc.stop(); } catch {} engineOsc = null; } return; }
      const c = ensure();
      if (!c) return;
      try {
        if (on && !engineOsc) {
          engineOsc = c.createOscillator();
          engineGain = c.createGain();
          engineOsc.type = 'sawtooth';
          engineOsc.frequency.value = 70;
          engineGain.gain.value = 0.02;
          engineOsc.connect(engineGain).connect(c.destination);
          engineOsc.start();
        } else if (!on && engineOsc) {
          engineOsc.stop();
          engineOsc = null;
        }
        if (engineOsc) engineOsc.frequency.value = 60 + (speedRatio || 0) * 140;
      } catch { /* cosmetic */ }
    },
    setSiren(on) {
      if (muted) { if (sirenOsc) { try { sirenOsc.stop(); } catch {} sirenOsc = null; } return; }
      const c = ensure();
      if (!c) return;
      try {
        if (on && !sirenOsc) {
          sirenOsc = c.createOscillator();
          sirenGain = c.createGain();
          sirenOsc.type = 'sine';
          sirenOsc.frequency.value = 700;
          sirenGain.gain.value = 0.025;
          sirenOsc.connect(sirenGain).connect(c.destination);
          sirenOsc.start();
          sirenOsc.frequency.setValueAtTime(700, c.currentTime);
          sirenOsc.frequency.linearRampToValueAtTime(950, c.currentTime + 0.6);
        } else if (!on && sirenOsc) {
          sirenOsc.stop();
          sirenOsc = null;
        }
      } catch { /* cosmetic */ }
    },
    setRotor(on) {
      if (muted) { if (rotorOsc) { try { rotorOsc.stop(); } catch {} rotorOsc = null; } return; }
      const c = ensure();
      if (!c) return;
      try {
        if (on && !rotorOsc) {
          rotorOsc = c.createOscillator();
          rotorGain = c.createGain();
          rotorOsc.type = 'square';
          rotorOsc.frequency.value = 13;
          rotorGain.gain.value = 0.03;
          rotorOsc.connect(rotorGain).connect(c.destination);
          rotorOsc.start();
        } else if (!on && rotorOsc) {
          rotorOsc.stop();
          rotorOsc = null;
        }
      } catch { /* cosmetic */ }
    },
    setMuted(m) {
      muted = m;
      if (m) {
        for (const o of [engineOsc, sirenOsc, rotorOsc]) { if (o) { try { o.stop(); } catch {} } }
        engineOsc = null; sirenOsc = null; rotorOsc = null;
      }
    },
    isMuted() { return muted; },
  };
}
