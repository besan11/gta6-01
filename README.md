# Porto Verde: Three Days in the Sun

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/competitions/gta6-01)
[![rank](https://make.fun/badge/gta6-01/besan11/gta6-01/rank.svg)](https://make.fun/competitions/gta6-01)
[![reward](https://make.fun/badge/gta6-01/besan11/gta6-01/reward.svg)](https://make.fun/competitions/gta6-01)

An original open-world crime game for the [make.fun "Make GTA 6" bounty](https://make.fun/competitions/gta6-01) — a fictional sun-soaked coastal city, built top-down in 2D with plain ES modules and canvas. No Rockstar content: every name, character, car and street is invented for Porto Verde.

## The game

Dario Cruz comes home to Porto Verde after three years away. Mara Solis has twelve jobs for him across three days — a van to borrow, a singer to drive, a vault key to lift, a cafe to defend, and one last score at the casino before the airstrip. Kessler's crew owns the docks, and the Porto Verde PD owns the streets.

- **Open world**: a 3200×2400 city — beach and sea to the west, six named districts, parks, palms, traffic and pedestrians, cars to steal and drive.
- **Wanted system**: 0–5 stars, PD units that chase and ram, a bust timer on foot, and police helicopter AIR-1 with a spotlight at four stars.
- **Missions + story**: 12 missions over 3 days with character dialogue and procedural portraits (Mara Solis, Tito Ramos, Lena Voss, Dario Cruz).
- **Combat**: fists and three guns (Tide 9mm, Squall SMG, Breaker 12) with ammo, thugs that fight back, REP that grows with every job.
- **HUD + minimap**: money, day and time, REP rank and progress, mission stage + next mission preview, mission timers, a PD response panel (unit, officer, distance, status), a 300×210 minimap with a dashed route and pulsing objective, weapon slots, radio stations with song titles, district banners, and a golden-hour sunset over a living beach.
- **Save**: press Q to save, C on the title screen to continue. WASTED or BUSTED ends the run.

## How to play

Serve `game/` with any static server (`node serve.ts`, then open http://localhost:8080) and play with keyboard + mouse:

| Key | Action |
| --- | --- |
| WASD / Arrows | Move / drive |
| E | Enter or steal a car / get out |
| F | Punch |
| Mouse click | Shoot |
| 1–4 | Switch weapon |
| R | Change radio station |
| Q | Save |
| M | Mute |
| Shift | Run |
| P / Esc | Pause |
| C | Continue (title screen, when a save exists) |
| T | Back to title (from pause) |

## Screenshots

Four real renders from the game's own code (seed 7): the cover is the mission-11 chase at the casino on Day 3 — four stars, four PD units, AIR-1 overhead, Mara on the radio, REP, weapons and the mission timer all in one frame.

## Structure

- `game/src/main.js` — boot, the fixed-step loop, screen state machine
- `game/src/world.js`, `config.js`, `random.js` — the seeded city
- `game/src/missions.js` — the 12-mission campaign
- `game/src/player.js`, `cars.js`, `traffic.js`, `pedestrians.js` — moving through the city
- `game/src/police.js`, `wanted.js`, `combat.js` — heat and fights
- `game/src/police-response.js`, `helicopter.js`, `dialogue.js`, `rep.js`, `radio.js`, `districts.js`, `weapons.js`, `mission-timer.js`, `sunset.js`, `money-scale.js`, `minimap-plus.js`, `roofs.js`, `hud-layout.js` — the thirteen new systems
- `game/src/render.js`, `hud.js`, `minimap.js` — drawing it all
- `game/src/audio.js`, `input.js`, `save.js`, `shots.js` — sound, input, saves, screenshot staging
- `main.ts` — the hand-in program; `playtest.mjs` — the scripted playtest

## License

MIT. See [LICENSE](LICENSE).
