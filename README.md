# Emberlight Arena

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Yadidefo61/best-game/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/Yadidefo61/best-game/reward.svg)](https://make.fun/bounty/best-game-01)

**Emberlight Arena** is a complete, original top-down arena shooter that runs
offline in a desktop browser from static files — no build step, no network.

You are the keeper of the last lantern. Waves of the dark close in: Ember
Wisps that chase you, Gloom Motes that swarm in swerves, Cinder Spitters
that shoot from afar, Dusk Weavers that strafe and fire three-way spreads,
Ash Brutes that soak up embers, and Gale Dashers that telegraph and charge.
Survive all **10 waves** to win — the Dusk Warden waits at the end of wave
5, and the Night King at the end of wave 10. Between waves, choose one of
three blessings from a pool of fourteen — faster fire, heavier embers, twin
flames, a wider light, searing light, a dash nova, a glass ward, and more —
and build the lantern your way. Hearts, ember shards and wards drop from
fallen enemies.

Your lantern's light is your weapon and your safe ground: enemies inside
its glow are slowed and seared, while the dark thickens beyond it and the
light shrinks when you are badly hurt. Chain kills without taking a hit to
raise your combo multiplier, up to four times the score.

## How to play

Serve `game/` with any static server (or `node serve.ts`) and open
`game/index.html` in desktop Chrome.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Mouse | Aim |
| Hold left click | Shoot embers |
| Space / Shift | Dash (brief invulnerability) |
| 1 / 2 / 3 or click | Pick an upgrade between waves |
| P | Pause |
| M | Mute |
| Enter | Start / restart |

Score comes from beaten enemies, picked-up ember shards and wave-clear
bonuses, multiplied by your combo chain. Your best score is kept in the
browser. The game has a title screen, a HUD (score, wave, kills, health,
combo, dash readiness, boss bar), wave banners, an upgrade draft, pause,
victory and game-over screens with restart — and synthesised WebAudio
sound, no audio files needed.

## Layout

- `game/` — the playable game: `index.html`, `style.css`, and `src/` split
  into one job per file (`game.js` state machine, `player.js`, `enemies.js`,
  `boss.js`, `light.js`, `combo.js`, `projectiles.js`, `pickups.js`,
  `waves.js`, `particles.js`, `render.js`, `audio.js`, `input.js`, `rng.js`,
  `config.js`, `shots.js`, `main.js`).
- `game/src/shots.js` — deterministic `?shot=start|play|end` scenes used
  for the screenshots in `screenshots/`.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
