// audio.js — Synthesised sound for Porto Verde (WebAudio, no audio files).
// Features: engine hum that follows car speed, police siren while wanted, gunshots,
// punches, pickup chimes, mission-complete jingle, UI clicks and a soft bassline
// music loop. Everything is generated with oscillators and noise; nothing is fetched.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  /** Must be called from a user gesture at least once (start button / click). */
  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
    startEngine();
    startMusic();
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur + 0.02);
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.value = vol || 0.2;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  function startEngine() {
    const c = ensure();
    if (!c || engineOsc) return;
    engineOsc = c.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineGain = c.createGain();
    engineGain.gain.value = 0;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    engineOsc.connect(filter).connect(engineGain).connect(c.destination);
    engineOsc.start();
  }

  function startMusic() {
    if (musicTimer) return;
    // Lazy bassline: A minor groove, one soft note every 0.42s.
    const bass = [55, 55, 65.41, 49, 55, 55, 82.41, 73.42];
    musicTimer = window.setInterval(() => {
      if (muted || !ctx) return;
      tone(bass[musicStep % bass.length], 0.4, 'triangle', 0.05);
      if (musicStep % 4 === 2) tone(bass[musicStep % bass.length] * 2, 0.18, 'sine', 0.03);
      musicStep += 1;
    }, 420);
  }

  function setEngine(speed01, driving) {
    if (!engineOsc || !engineGain || !ctx) return;
    const target = muted || !driving ? 0 : 0.02 + speed01 * 0.05;
    engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
    engineOsc.frequency.setTargetAtTime(50 + speed01 * 130, ctx.currentTime, 0.1);
  }

  function setSiren(on) {
    const c = ensure();
    if (!c) return;
    if (on && !sirenOsc) {
      sirenOsc = c.createOscillator();
      sirenOsc.type = 'sine';
      sirenOsc.frequency.value = 700;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.6;
      const lfoGain = c.createGain();
      lfoGain.gain.value = 320;
      lfo.connect(lfoGain).connect(sirenOsc.frequency);
      sirenGain = c.createGain();
      sirenGain.gain.value = muted ? 0 : 0.035;
      sirenOsc.connect(sirenGain).connect(c.destination);
      sirenOsc.start();
      lfo.start();
      sirenOsc._lfo = lfo;
    } else if (!on && sirenOsc) {
      try { sirenOsc.stop(); sirenOsc._lfo.stop(); } catch { /* already stopped */ }
      sirenOsc = null;
      sirenGain = null;
    }
    if (sirenGain) sirenGain.gain.value = muted ? 0 : 0.035;
  }

  return {
    unlock,
    setMuted(m) {
      muted = m;
      if (engineGain && ctx) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      if (sirenGain) sirenGain.gain.value = 0;
    },
    isMuted() { return muted; },
    setEngine,
    setSiren,
    click() { tone(660, 0.07, 'square', 0.06); },
    punch() { noise(0.09, 0.25, 900); tone(140, 0.09, 'sine', 0.2, 70); },
    shoot() { noise(0.14, 0.32, 2600); tone(220, 0.1, 'square', 0.1, 60); },
    hit() { tone(180, 0.15, 'sawtooth', 0.12, 90); },
    pickup() { tone(880, 0.1, 'sine', 0.1); window.setTimeout(() => tone(1318, 0.14, 'sine', 0.1), 90); },
    cash() { tone(988, 0.09, 'triangle', 0.1); window.setTimeout(() => tone(1319, 0.09, 'triangle', 0.1), 80); window.setTimeout(() => tone(1760, 0.18, 'triangle', 0.1), 160); },
    missionComplete() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => window.setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110));
    },
    wantedUp() { tone(392, 0.16, 'square', 0.09); window.setTimeout(() => tone(311, 0.22, 'square', 0.09), 140); },
    crash() { noise(0.25, 0.3, 700); tone(90, 0.25, 'sine', 0.2, 40); },
    busted() { tone(220, 0.4, 'sawtooth', 0.12, 110); },
  };
}
