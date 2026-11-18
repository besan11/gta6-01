// Porto Verde v6 — the radio: three Porto Verde stations, one track at a time.
// Track changes are driven by game time, never by the wall clock.
import { RADIO_STATIONS } from './config.js';

export function createRadio() {
  return { station: 0, track: 0, trackT: 0 };
}

export function currentTrack(G) {
  const st = RADIO_STATIONS[G.radio.station];
  return { station: st, track: st.tracks[G.radio.track % st.tracks.length] };
}

export function updateRadio(G, dt) {
  const r = G.radio;
  r.trackT += dt;
  if (r.trackT >= 90) {
    r.trackT = 0;
    const st = RADIO_STATIONS[r.station];
    r.track = (r.track + 1) % st.tracks.length;
  }
}

export function nextStation(G) {
  G.radio.station = (G.radio.station + 1) % RADIO_STATIONS.length;
  G.radio.track = 0;
  G.radio.trackT = 0;
  const st = RADIO_STATIONS[G.radio.station];
  G.toast = '♪ ' + st.name + ' — ' + st.style;
  G.toastT = 2.5;
}
