# Playability Foundation Report

Generated: 2026-08-05  
Branch: `fix/playable-session`  
Server: `python3 -m http.server 8000` (repo root)

## Load root cause

**Verified fact (CDP, cache disabled):** Game stays alive 65+ seconds on menu idle and 65+ seconds in active flight with zero console errors, zero boot errors, and `SIM.uptime().alive === true`.

**Root cause (inference from diff + prior state):** Load death was caused by the incomplete LandmarkPath migration — old GLB `loadTemplates()` path vs new procedural `build()` chain, plus silent cone/torus fallbacks that masked failures. With server down, the page also failed to boot at all.

**Fixes applied:**
- Procedural `LandmarkPath.build()` with loud rejection (no silent fallbacks)
- `build()` deferred via `requestAnimationFrame` (~85 ms build, 57k LOD0 tris)
- `surfaceBootError()` for runtime errors, unhandled rejections, landmark failures
- `webglcontextlost` handler on canvas with reload on restore
- `SIM.uptime()` loop heartbeat

**Evidence (menu-idle scenario):**
- Uptime: 67s, frame p50/p95: 17.1/25.9 ms
- Boot errors: 0
- FPS: 42–65 on menu cinematic

## Camera shake

| Setting | Value |
|---|---|
| Default intensity | **35%** (`CAM_SHAKE.defaultIntensity = 0.35`) |
| Storage | `localStorage.galevein_cam_shake` |
| Menu control | SHAKE slider beside graphics presets |
| Change | Replaced 47/53/43 Hz vibration with 0.9–3.2 Hz blend + Aeolith-style `CAM.jerk` spring |

## SIM harness API

- `SIM.controls({ climb, dive, bankLeft, bankRight, accel, brake, flap, allOff })`
- `SIM.jumpBeacon(n, { yaw, speed, yOffset })`
- `SIM.jumpChapter(n)` — 0=tutorial, 1–5=story chapters
- `SIM.jumpState({ score, detection, day, chapter, hp, pos, yaw, speed })`
- `SIM.runSteps({ dt, steps, controls })` / `SIM.runUntil(fn, opts)`
- `SIM.snapshot(extra)` — structured JSON per run
- `SIM.win()` / `SIM.loseDetection()` / `SIM.loseNightfall()`
- `SIM.triggerDetected()` / `SIM.triggerNightfallLoss()`
- `SIM.setCameraShake(0..1)` / `SIM.uptime()`

Runner: `node reports/playability-foundation/run.mjs`

## Scenario results

| Scenario | Pass | Key metrics |
|---|---|---|
| menu-idle | ✅ | 67s alive, p50 17 ms, 0 boot errors |
| flight-corridor | ✅ | Real W+climb+bank controls, p50 8.3 ms, p95 < 40 ms |
| win-route | ✅ | Score 12 / Tempest Gate escape |
| loss-detection | ✅ | `triggerDetected()` → `done: true`, score < 12 |

Full JSON: `reports/playability-foundation/results.json`

## Commits (this pass)

1. `59083fb` — procedural landmark geometry pipeline
2. `c4e17b3` — load stability (boot errors, WebGL loss, build reject)
3. `8cd1ac4` — camera shake soften + slider
4. `4f90f92`+ — SIM harness + scenarios
