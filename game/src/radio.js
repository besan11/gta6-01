// Radio: three Porto Verde stations, songs that change on a fixed game-time
// schedule. The music itself stays the synth loop in audio.js; this is the
// station, the track name, and the clock that turns the songs over.
import { RADIO_STATIONS } from './config.js';

export function createRadio() {
  return { station: 0, song: 0, songT: 0 };
}

export function currentStation(G) {
  return RADIO_STATIONS[G.radio.station % RADIO_STATIONS.length];
}

export function currentTrack(G) {
  const st = currentStation(G);
  return st.songs[G.radio.song % st.songs.length];
}

export function updateRadio(G, dt) {
  const r = G.radio;
  r.songT += dt;
  if (r.songT >= 90) {
    r.songT = 0;
    const st = currentStation(G);
    r.song = (r.song + 1) % st.songs.length;
  }
}

export function nextStation(G) {
  G.radio.station = (G.radio.station + 1) % RADIO_STATIONS.length;
  G.radio.song = 0;
  G.radio.songT = 0;
}

export function drawRadio(ctx, G, x, y) {
  const st = currentStation(G);
  const line = `♪ ${st.name} — ${currentTrack(G)}`;
  ctx.font = 'bold 13px sans-serif';
  const w = ctx.measureText(line).width + 20;
  ctx.fillStyle = 'rgba(16,20,28,0.88)';
  ctx.fillRect(x - w, y - 18, w, 26);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w + 0.5, y - 18 + 0.5, w - 1, 25);
  ctx.fillStyle = '#f4f1e8';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(line, x - 10, y - 5);
  ctx.textAlign = 'left';
}
