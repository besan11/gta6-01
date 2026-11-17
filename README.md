# Porto Verde: Three Days in the Sun

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/besan11/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/besan11/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

An open-world crime game in the spirit of GTA 6 — fully original. Built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01).

## The game

**Porto Verde** is a fictional sun-soaked coastal city: sea and beach on the west,
six avenues and six streets, the Marina, Old Town, Palm Heights, Market Row, the
Casino Strip, Harbor South and the Airstrip Flats. **Dario Cruz** is back after
three years away, broke and out of options. **Mara Solis** has work for him —
**12 story missions across 3 days** — and the city is watching.

- **Explore on foot and by car** — walk the sidewalks, steal any parked car (E) and drive it
- **Living streets** — traffic that follows the roads (20 cars), pedestrians who stroll, chat and flee (32), parked cars that never stack
- **Wanted level** — 0–5 stars with a HEAT meter; the Porto Verde police chase, ram, and corner you on foot to bust you
- **Missions + story** — go-to, drive, collect, fight, chase, escape and defend objectives, with dialogue briefings; thugs spawn on open streets, never on a roof
- **Combat** — punch (F) and mouse-aimed pistol (click), thugs who chase and shoot back
- **HUD + minimap** — money, health, wanted stars, day/time clock, district, mission panel, car speed/health, police + thug blips on the minimap
- **Save game** — autosaves after every mission, manual save (Q), Continue from the title screen
- **Polish** — start / pause / wasted / busted / victory screens, camera that follows you, crash and explosion effects, synthesised WebAudio sound (engine, sirens, gunshots, music) — no audio files, no network requests

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Walk / drive |
| Shift | Run |
| E | Enter / exit car |
| F | Punch |
| Mouse + click | Aim / shoot |
| Space | Handbrake |
| Q | Save game |
| P / Esc | Pause |
| M | Mute |
| Enter | Confirm / start |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network requests — just static files under `game/`.

## Screenshots

The four screenshots in `screenshots/` are real renders of the game in a browser
(`?shot=cover|title|chase|mission&seed=7`): the cover is the densest chase frame,
then the title screen, a police chase, and a mission briefing on foot.

## Play-test

`playtest.mjs` drives the game in headless Chromium (Playwright): it retakes the
four screenshots and plays the live game — start, walk, steal and drive a car,
shoot, punch, complete a mission, police response, pause, save/continue — plus
both death paths (WASTED by thugs, BUSTED by the police) and the restart after
each. It passes 20/20 with zero console errors:

```sh
node playtest.mjs
```

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`. Verify locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). Porto Verde, Dario Cruz, Mara Solis and every other
name, character and place in this game are original inventions of this project.
