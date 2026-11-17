// Radio: three Porto Verde stations, one track at a time, rotating on game time.
// The music stays the synthesised loop from audio.js; this is the station + song.
import { RADIO_STATIONS } from './config.js';

export function createRadio() {
  return { station: 0, track: 0, trackT: 0, trackLen: 90 };
}

export function updateRadio(G, dt) {
  const r = G.radio;
  r.trackT += dt;
  if (r.trackT >= r.trackLen) {
    r.trackT = 0;
    const st = RADIO_STATIONS[r.station];
    r.track = (r.track + 1) % st.tracks.length;
  }
}

export function nextStation(G) {
  const r = G.radio;
  r.station = (r.station + 1) % RADIO_STATIONS.length;
  r.track = 0;
  r.trackT = 0;
  const st = RADIO_STATIONS[r.station];
  G.toast = `Radio: ${st.name} — ${st.style}`;
  G.toastT = 2.5;
}

export function radioLine(G) {
  const st = RADIO_STATIONS[G.radio.station];
  return `♪ ${st.name} — ${st.tracks[G.radio.track]}`;
}
