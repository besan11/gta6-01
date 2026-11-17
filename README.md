# Porto Verde: Three Days in the Sun

![gta6-01](https://make.fun/badge/gta6-01.svg)
![rank](https://make.fun/badge/gta6-01/besan11/gta6-01/rank.svg)
![reward](https://make.fun/badge/gta6-01/besan11/gta6-01/reward.svg)

A complete open-world crime game for the [Make GTA 6 bounty](https://make.fun/competitions/gta6-01) — fully original, built from scratch in plain JavaScript and canvas, no libraries, no network requests.

Dario Cruz is back in Porto Verde after three years away. Mara Solis has work for him: twelve jobs across three days, from a welcome at the Marina Cafe to a plane out of the airstrip — if Kessler's crew and the Porto Verde PD let him leave.

## What is in the game

- **A living city**: a 3200×2400 sun-soaked coastal town — Marina Norte, Old Town, Casino Strip, Harbor District, Sunset Pier, Mirador Heights — with roads, traffic, pedestrians, parks, palms, a beach with umbrellas and boats, and golden-hour light.
- **Twelve story missions** with dialogue and procedural character portraits (Mara Solis, Tito Ramos, Lena Voss, Dario Cruz): driving, deliveries, collection runs, fights, a chase, a 45-second defence, a vault heist, and the final escape.
- **Police heat**: a 0–5 wanted level, pursuing cruisers with a PD response panel (unit, officer, distance, status), and the AIR-1 helicopter with its spotlight at four stars and above.
- **Systems that show**: REP ranks with a progress bar, three radio stations, four weapon slots with ammo, mission timers with stage and next-job previews, district banners, and a big minimap with a route line and a pulsing objective marker.
- **Play it**: walk or drive (steal any car), punch and shoot, save with Q and Continue from the title screen, pause with P. Synthesized WebAudio sound — engine, sirens, rotor, gunshots, fanfare.

## Controls

WASD / arrows — move · Shift — run · Mouse — aim, click — shoot · E — enter / exit car · F — punch · 1–4 — weapons · R — radio · Q — save · M — mute · P / Esc — pause · C — continue (with a save) · T — title screen

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are real renders of the game (`?shot=cover|title|chase|mission&seed=7`).
