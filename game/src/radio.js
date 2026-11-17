// radio.js — Porto Verde's airwaves. Three stations, each with three songs;
// the song changes every ninety game-seconds, on a clock driven by G.time
// so two runs with the same seed hear the same song. R cycles stations.
import { RADIO_STATIONS, RADIO_SONG_SECONDS } from './config.js';

export function createRadio() {
  return { station: 0, song: 0, songT: 0, on: true };
}

export function updateRadio(G, dt) {
  const r = G.radio;
  if (!r.on) return;
  r.songT += dt;
  if (r.songT >= RADIO_SONG_SECONDS) {
    r.songT = 0;
    const st = RADIO_STATIONS[r.station];
    r.song = (r.song + 1) % st.songs.length;
  }
}

export function nextStation(G) {
  const r = G.radio;
  r.station = (r.station + 1) % RADIO_STATIONS.length;
  r.song = 0;
  r.songT = 0;
  const st = RADIO_STATIONS[r.station];
  G.toast = 'Radio: ' + st.name + ' — ' + st.genre;
  G.toastT = 2.5;
}

export function currentSong(G) {
  const st = RADIO_STATIONS[G.radio.station];
  return st.songs[G.radio.song];
}

export function currentStation(G) {
  return RADIO_STATIONS[G.radio.station];
}
