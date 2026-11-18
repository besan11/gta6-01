// Porto Verde v6 — every sound is synthesized with WebAudio; no audio files exist.
// The whole module is safe to call before any user gesture: nothing throws when
// the context is locked, it just waits for unlock().
export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let rotorOsc = null;
  let rotorGain = null;
  let musicStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure();
    if (!c || muted) return;
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
    } catch { /* audio is garnish, never fatal */ }
  }

  function noise(dur, vol, low) {
    const c = ensure();
    if (!c || muted) return;
    try {
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = low || 1200;
      const g = c.createGain();
      g.gain.value = vol || 0.12;
      src.connect(filt).connect(g).connect(c.destination);
      src.start();
    } catch { /* ignore */ }
  }

  const api = {
    ensure,
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
    tone, noise,
    click() { tone(660, 0.06, 'square', 0.05); },
    wantedUp() { tone(392, 0.16, 'square', 0.07); tone(523, 0.2, 'square', 0.07); },
    busted() { tone(220, 0.5, 'sawtooth', 0.09, 110); },
    wasted() { tone(330, 0.7, 'sawtooth', 0.09, 55); },
    fanfare() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 110)); },
    startMusic() {
      if (musicTimer || !ensure()) return;
      const scale = [262, 294, 330, 392, 440, 523, 587, 659];
      musicTimer = setInterval(() => {
        if (muted) return;
        const f = scale[musicStep % scale.length];
        musicStep += 1;
        tone(f, 0.34, 'triangle', 0.035);
        if (musicStep % 4 === 0) tone(f / 2, 0.5, 'sine', 0.04);
      }, 340);
    },
    startEngine() {
      const c = ensure();
      if (!c || engineOsc) return;
      try {
        engineOsc = c.createOscillator();
        engineGain = c.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 60;
        engineGain.gain.value = 0.0;
        engineOsc.connect(engineGain).connect(c.destination);
        engineOsc.start();
      } catch { engineOsc = null; }
    },
    setEngine(running, speed01) {
      if (!engineOsc || !engineGain || !ctx) return;
      engineGain.gain.value = muted ? 0 : running ? 0.02 + speed01 * 0.05 : 0.0;
      engineOsc.frequency.value = 55 + speed01 * 130;
    },
    setSiren(on) {
      const c = ensure();
      if (!c) return;
      if (on && !sirenOsc) {
        try {
          sirenOsc = c.createOscillator();
          sirenGain = c.createGain();
          sirenOsc.type = 'sine';
          sirenOsc.frequency.value = 700;
          sirenGain.gain.value = muted ? 0 : 0.025;
          const lfo = c.createOscillator();
          const lfoGain = c.createGain();
          lfo.frequency.value = 0.8;
          lfoGain.gain.value = 220;
          lfo.connect(lfoGain).connect(sirenOsc.frequency);
          sirenOsc.connect(sirenGain).connect(c.destination);
          sirenOsc.start(); lfo.start();
          sirenOsc._lfo = lfo;
        } catch { sirenOsc = null; }
      } else if (!on && sirenOsc) {
        try { sirenOsc.stop(); if (sirenOsc._lfo) sirenOsc._lfo.stop(); } catch { /* ignore */ }
        sirenOsc = null; sirenGain = null;
      }
    },
    setRotor(on) {
      const c = ensure();
      if (!c) return;
      if (on && !rotorOsc) {
        try {
          rotorOsc = c.createOscillator();
          rotorGain = c.createGain();
          rotorOsc.type = 'square';
          rotorOsc.frequency.value = 13;
          rotorGain.gain.value = muted ? 0 : 0.03;
          rotorOsc.connect(rotorGain).connect(c.destination);
          rotorOsc.start();
        } catch { rotorOsc = null; }
      } else if (!on && rotorOsc) {
        try { rotorOsc.stop(); } catch { /* ignore */ }
        rotorOsc = null; rotorGain = null;
      }
    },
    setMuted(m) { muted = !!m; if (engineGain) engineGain.gain.value = muted ? 0 : 0.03; },
    isMuted() { return muted; },
  };
  return api;
}
