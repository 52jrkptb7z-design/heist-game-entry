# Midnight Vault

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/52jrkptb7z-design/heist-game-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/52jrkptb7z-design/heist-game-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game, entered in the [best heist game bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559).

One night, one bank, one thief. Slip through the Meridian Trust after hours:
patrolling guards sweep the rooms with vision cones, security cameras pan
across the halls, and every second you are seen the alarm meter climbs. Grab
the Sunfire Diamond from the vault, fill your bag with whatever else you can
carry, and get back to the getaway van before the meter tops out.

## Play it

Open `game/index.html` in a desktop browser, or serve the folder:

```
node serve.ts        # then open http://localhost:8123
```

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, much harder to spot)
- **E** — EMP pulse: kills every camera for 6 seconds, but the noise bumps the alarm
- **R** — restart the night

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `game/` and `screenshots/` to `out/` and writes the `dossier.json`
the judges read, using the vendored library in `vendor/`.

## Layout

- `game/index.html` — the page
- `game/src/` — the game, one job per file: `level.js` the bank, `vision.js`
  sight lines and cones, `guards.js` patrols and cameras, `alarm.js` the meter,
  `player.js` the thief, `render.js` the drawing, `audio.js` the bleeps,
  `shots.js` the staged screenshot scenes, `main.js` the loop
- `main.ts` — the hand-in program; `vendor/makefun-game.ts` — the kit's library, unchanged
- `screenshots/` — real frames of the game running

MIT licensed.
