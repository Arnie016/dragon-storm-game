# Playability Foundation Report

**Date:** 2026-08-05  
**Branch:** `fix/playable-session`  
**Server:** `python3 -m http.server 8000` (repo root)

## Load root cause

**Verified fact:** The page did not crash in CDP runs after the procedural landmark swap; the stall was incomplete wiring, not a rejected build.

**Inference (prior report):** Synchronous procedural build (~165 ms, ~57k LOD0 triangles across 12 sites) blocked the main thread on first paint, which could present as a frozen/black screen on slower GPUs before the render loop established.

**Fixes applied:**
- `LandmarkPath.build()` deferred to `requestAnimationFrame` so first paint and dragon GLB load proceed first.
- `surfaceBootError()` + `bootErrors[]` capture runtime errors, unhandled rejections, and landmark build failures on `#objText`.
- `webglcontextlost` → `preventDefault()` + user-facing message; `webglcontextrestored` → reload.

**Evidence:** `idle65s` scenario — `uptime.alive: true`, `state.done: false`, `flightT: 62+`, zero boot errors (CDP, cache disabled).

## Camera default

| Setting | Value |
|---|---|
| `CAM_SHAKE.defaultIntensity` | **0.35** (35% slider) |
| Storage key | `localStorage.galevein_cam_shake` |
| High-freq shake | Replaced 47/53/43 Hz sines with blended 0.9–3.2 Hz envelope (Aeolith-style bounded spring rig reference) |
| Jerk channel | `CAM.jerk` from longitudinal accel derivative, capped, decayed |

## SIM harness scenarios

| # | Scenario | Pass | Notes |
|---|---|---|---|
| 1 | **idle65s** — in-flight with accel, 65 s | ✅ | `loopLagMs < 250`, HP 100, not done |
| 2 | **jumpBeacon(6)** — chapter HUD | ✅ | `#objText` = `III · Serpent Run — beacons 6/8 · dive and flock` |
| 3 | **flight120** — 120 ticks, accel+climb | ✅ | p50 8.3 ms, HP 100 |
| 4 | **winRoute** — `SIM.win()` | ✅ | score 12 in 1 step (jump near finish) |
| 4b | **loseDetection** — high detection run | ❌ | 120 steps insufficient to hit `detection>=1` (needs longer run or forced `detected()`) |

Artifact: `reports/playability-foundation/verification-result.json`  
Runner: `node reports/playability-foundation/run-scenarios.mjs`

## Chapter integration

| Check | Result |
|---|---|
| `gameStructure.init` after `landmarkReady` | ✅ |
| `structure.tick()` + `applyHud()` in main tick | ✅ |
| Inline `CHAPTERS` / `driveMissions` / `REGIONS` removed | ✅ (fallback `driveMissionsFallback` until init) |
| `SIM.jumpBeacon(6)` objective string | ✅ |
| `SIM.chapterHud()` → `chapterRoman: "III"` | ✅ |

## Uptime / load (harness end)

Recorded from `verification-result.json` → `loadAfter.uptime` at scenario completion.

## Commands

```bash
python3 -m http.server 8000   # repo root
node reports/playability-foundation/run-scenarios.mjs
# In browser console:
SIM.jumpBeacon(6)
document.getElementById('objText').textContent
SIM.chapterHud()
```
