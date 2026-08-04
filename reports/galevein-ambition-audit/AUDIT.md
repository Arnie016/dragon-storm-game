# Galevein Ambition Audit — 2026-08-05

Branch: `fix/playable-session` · Play URL: http://localhost:8000/

## Shipped this pass

| Feature | Status | Evidence |
|---|---|---|
| Dragon picker (Stormcrest / Obsidian Gale / Voltspine / Thunderhook / Ember Wyrm) | ✅ | `world-expansion/modules/dragonRigs.js`, `#rigPicker`, `?rig=` |
| Region landmark filter | ✅ | `landmarkPath.setRegionFilter()` wired from `onRegionStory` |
| Sky silhouettes (floating islands) | ✅ | `horizonDirector.islands` instanced planes (+1 draw call) |
| Lobby hub MVP | ✅ | `#lobbyHub` Story / Practice / Chapter; win/loss → hub |
| LOBBY_SPEC | ✅ | `docs/LOBBY_SPEC.md` |

## Dragon rigs

| id | Lore name | Asset | Default |
|---|---|---|---|
| `stormcrest` | Stormcrest | `dragon_galevein_stormcrest_corrected.glb` | yes |
| `corrected` | Obsidian Gale | `dragon_rigged_corrected.glb` | |
| `voltspine` | Voltspine | `dragon_galevein_voltspine_corrected.glb` | |
| `thunderhook` | Thunderhook | `dragon_galevein_thunderhook_corrected.glb` | |
| `quaternius` | Ember Wyrm | `licensed-assets/models/dragon_quaternius_cc0.glb` | probe-gated |

Quaternius uses `Dragon_Flying` clip; procedural alive layer reduced (`ALIVE=0.35`).

All five rigs render in `#rigPicker` via `rigCatalog()`; Stormcrest remains default.

## Region landmark filter

On region enter, `landmarkPath.setRegionFilter(regionId, allowedLandmarkArchetypes, allowedLandmarkIds)`.

Visibility rule: show if **id ∈ allowedLandmarkIds OR archetype ∈ allowedLandmarkArchetypes**.

Initial filter: `wake_cove` at boot.

## Sky silhouettes

- 10 instanced `PlaneGeometry` billboards parented to `HorizonDirector.root`
- Camera-facing in `update()`; bob + preset-driven count/height from `regions.json` `skyPreset`
- Total horizon draw calls: **2** (masses + islands)

## Lobby hub

- Enter via **ENTER HUB** after spotMoment
- **Story** → full `begin()`
- **Practice** → tutorial rings, detection disabled
- **Chapter** → panel → `simJumpChapter(index)` + flight
- Win/loss → brief over card → auto return to hub (~0.8–2.2s)
- **Return to Hub** / **Fly Again** on over card

## Performance budget

| Metric | Target | Notes |
|---|---|---|
| p95 frame | ≤25 ms | Run `SIM.benchmarkStart()` / `benchmarkStop()` after load |
| SIM.jumpBeacon | must pass | Scenario 2 unchanged contract |
| New draw calls | +1 | Island silhouettes only |

## SIM scenarios (extended)

Existing 9/9 in `reports/playability-foundation/run-scenarios.mjs`:

| id | Check |
|---|---|
| `idle65s` | Loop alive 65s, no crash |
| `jumpBeacon6` | HUD objective string contract |
| `flight120` | HP > 0 after 120 accel steps |
| `winRoute` | Score 12 or finishing |
| `loseDetection` | `SIM.triggerDetected()` → `done: true` |
| `rigPicker` | Default `stormcrest`; picker lists all five rigs |
| `lobbyReturn` | Hub visible after `SIM.returnLobby()` |
| `regionFilter` | `SIM.regionLandmarks().filter` set after chapter jump |
| `skyIslands` | `SIM.expansion().horizon.drawCalls === 2` |

Run: `node reports/playability-foundation/run-scenarios.mjs` (server on :8000).

## Blocked / deferred

| Item | Reason |
|---|---|
| 3D hub geometry (120×120 platform) | MVP uses DOM overlay — zero extra draws |
| Cloud save / GameLift | Spec only per GAME_STRUCTURE.md |
| Quaternius bone remap | Flying clip only; full alive layer needs alias map |

## Files touched

- `index.html`
- `world-expansion/modules/dragonRigs.js` (new)
- `world-expansion/modules/lobbyHub.js` (new)
- `world-expansion/modules/horizonDirector.js`
- `world-expansion/modules/landmarkPath.js`
- `world-expansion/modules/chapterDirector.js`
- `docs/LOBBY_SPEC.md` (new)
- `reports/playability-foundation/run-scenarios.mjs`

## Next safe action

Run SIM harness; if p95 > 25 ms, reduce `_islandCount` from 10 → 6.
