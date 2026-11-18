# Porto Verde: Three Days in the Sun

![gta6-01](https://make.fun/badge/gta6-01.svg)
![rank](https://make.fun/badge/gta6-01/besan11/gta6-01/rank.svg)
![reward](https://make.fun/badge/gta6-01/besan11/gta6-01/reward.svg)

A complete open-world crime game for the [Make GTA 6 bounty](https://make.fun/competitions/gta6-01) — fully original city, characters, story and names. Nothing here is from Rockstar.

## The game

Dario Cruz is back in Porto Verde after three years away. Mara Solis has the jobs, Kessler has the city. Twelve missions across three days — from a quiet pickup at the Marina Cafe to a vault job on the Casino Strip and a dawn flight out of the airstrip.

**The city:** a sun-soaked coastal town you can explore on foot or by car — traffic, pedestrians, a living beach with umbrellas and boats, six districts with their own flavour, and a golden-hour sky over the Sunset Pier.

**The systems:**

- **12 missions / 3 days** with briefings, dialogue portraits, stages (`Stage x/y`) and a preview of the next job
- **Wanted 0–5 + Porto Verde PD response panel** — named units, officers, distances and live status (`pursuing` / `en route` / `RAMMING`), plus the AIR-1 helicopter with a spotlight at four stars
- **Combat** — fists and three unlockable guns (Tide 9mm, Squall SMG, Breaker 12) with ammo
- **REP** — ranks from NOBODY to BAY LEGEND, earned from missions, escapes and takedowns
- **Radio** — three stations (CORAL FM 96.4, WAVE 88.1, BRISA BOSSA 101.2) with named tracks
- **Districts** — banners with flavour text as you cross neighbourhoods
- **Mission timers** — defend the cafe for 45 seconds, beat the sunset, outrun the vault alarm
- **HUD + big minimap** — 300×210 with a dashed route to the objective and a pulsing marker
- **Save & continue** — progress persists in localStorage; WASTED and BUSTED are real endings
- **Synthesised sound** — WebAudio engine, sirens, rotor and music, no audio files

## How to play

Serve it locally and open it in a desktop browser:

```
node serve.ts
# http://localhost:8080
```

| Key | Action |
| --- | --- |
| WASD / Arrows | Move (on foot) / drive (in a car) |
| Shift | Run |
| Mouse + click | Aim and shoot |
| E | Enter / exit car |
| F | Punch |
| 1–4 | Switch weapon |
| R | Change radio station |
| Q | Save |
| M | Mute |
| P / Esc | Pause |
| Enter | Confirm / advance dialogue |
| C | Continue a save (title screen) |

## Shots

Four real renders of the game itself live in `screenshots/` — the cover is a four-star chase in front of the Casino Verde on Day 3, with the helicopter overhead, the PD panel live, Mara on the line, and the vault alarm running up. Re-render them with `node playtest.mjs`.

## Tech

Plain static files under `game/` — ES modules, no build step, no network requests, no libraries. Deterministic: one seed drives every random choice, so two runs of the dossier builder produce the same bytes.
