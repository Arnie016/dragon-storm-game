# Galevein Ambition Audit — 2026-08-05

Branch: `fix/playable-session` · Play URL: http://localhost:8000/

## Verdict (post-polish)

**Status: polished vertical slice / strong demo — not early-access yet.**

The game delivers a coherent pre-flight hub → chapter-run → win/loss loop with data-driven objectives, five dragon rigs, region-filtered landmarks, and SIM-verified contracts. It reads as a **playable demo** with chapter structure and mission beats, not a shippable early-access product: no persistence beyond local rig/gfx prefs, no cloud save, no full 3D hub traversal, and content depth stops at one beacon road.

| Criterion | Demo | Early-access bar | This build |
|---|---|---|---|
| Enter → play → return loop | ✅ | ✅ | ✅ Hub + win/loss return |
| Distinct chapter objectives | ✅ | ✅ | ✅ chapterDirector + `#missionBeat` |
| Mission beat beyond beacon count | partial | ✅ | ✅ Altitude collect (Ch III) + tower destroy (Ch IV) |
| Hub presence | partial | ✅ | ✅ DOM nodes + 3D pillar markers (+2 draws) |
| Performance p95 ≤25 ms | ✅ | ✅ | ✅ ~9.3 ms (SIM idle65s) |
| Save / progression | ❌ | ✅ | ❌ localStorage rig/gfx only |
| Content volume | 1 route | multiple modes + meta | 1 route, 3 lobby modes |

**Honest label:** ship as **demo / GDC-style vertical slice**; call early-access only after save progression, hub traversal, and second content pass.

---

## Shipped this pass (polish)

| Feature | Status | Evidence |
|---|---|---|
| Lobby 3D markers | ✅ | `LobbyMarkers` in `lobbyHub.js` — platform + 3 instanced pillars at REST (+2 draw calls) |
| Hub kicker copy | ✅ | `#lobbyHub .lobby-hub-kicker` — "Choose your flight path" |
| Mission beat HUD | ✅ | `#chapterLabel`, `#missionBeat`; `chapterDirector.buildMissionBeat()` |
| Altitude-collect beat (Ch III) | ✅ | 80m AGL threshold; peak tracking; popup on collect |
| Tower-destroy beat (Ch IV) | ✅ | `{towersDestroyed}/3` in mission beat line |
| SIM regression | ✅ | 9/9 pass; p95 9.3 ms; `jumpBeacon6` objective unchanged |

## Prior pass (still valid)

| Feature | Status | Evidence |
|---|---|---|
| Dragon picker (5 rigs) | ✅ | `dragonRigs.js`, `#rigPicker`, `?rig=` |
| Region landmark filter | ✅ | `landmarkPath.setRegionFilter()` |
| Sky silhouettes | ✅ | `horizonDirector.islands` (+1 draw call) |
| Lobby hub MVP | ✅ | Story / Practice / Chapter; win/loss → hub |
| Chapter director HUD | ✅ | `gameStructure.tick()` → `#objText` |

## Dragon rigs

| id | Lore name | Asset | Default |
|---|---|---|---|
| `stormcrest` | Stormcrest | `dragon_galevein_stormcrest_corrected.glb` | yes |
| `corrected` | Obsidian Gale | `dragon_rigged_corrected.glb` | |
| `voltspine` | Voltspine | `dragon_galevein_voltspine_corrected.glb` | |
| `thunderhook` | Thunderhook | `dragon_galevein_thunderhook_corrected.glb` | |
| `quaternius` | Ember Wyrm | `licensed-assets/models/dragon_quaternius_cc0.glb` | probe-gated |

## Performance budget

| Metric | Target | Measured (SIM idle65s) |
|---|---|---|
| p95 frame | ≤25 ms | **9.3 ms** |
| New lobby draws | minimal | +2 (platform + instanced pillars) |
| Horizon draws | 2 | 2 (unchanged) |

## SIM scenarios (9/9)

Run: `node reports/playability-foundation/run-scenarios.mjs` (server on :8000).

| id | Check | Pass |
|---|---|---|
| `idle65s` | Loop alive 65s | ✅ |
| `jumpBeacon6` | HUD objective string contract | ✅ |
| `flight120` | HP > 0 after 120 steps | ✅ |
| `winRoute` | Score 12 or finishing | ✅ |
| `loseDetection` | triggerDetected → done | ✅ |
| `rigPicker` | 5 rigs listed, stormcrest default | ✅ |
| `lobbyReturn` | Hub visible + markers snapshot | ✅ |
| `regionFilter` | filter set after chapter jump | ✅ |
| `skyIslands` | horizon drawCalls === 2 | ✅ |

Human smoke at `35e03a4` / `64add7b` — **not re-run** this pass (SIM only).

## Blocked / deferred

| Item | Reason |
|---|---|
| Walkable 120×120 hub platform | Markers only — zero traversal |
| Cloud save / GameLift | Spec only |
| Full early-access meta loop | Needs persistence + content breadth |

## Files touched (polish pass)

- `index.html` — HUD mission beat, lobby kicker, marker wiring, altitude tracking
- `world-expansion/modules/lobbyHub.js` — `LobbyMarkers` class
- `world-expansion/modules/chapterDirector.js` — `buildMissionBeat()`
- `world-expansion/modules/gameStructure.js` — `#missionBeat` apply
- `reports/galevein-ambition-audit/AUDIT.md` — this file

## Next safe action

Play Ch III from chapter select — confirm `#missionBeat` shows altitude line; fly above 80m AGL for collect popup. For Ch IV jump, confirm tower destroy line updates as searchlights fall.
