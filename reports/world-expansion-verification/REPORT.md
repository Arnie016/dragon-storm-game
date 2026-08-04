# World expansion verification

Tested from `python3 -m http.server 8000` in Chrome 150 with `Network.setCacheDisabled({cacheDisabled:true})` and a cache-busting query string.

## Integration

- `CinematicDofPipeline` replaces direct scene rendering only on High. It uses local color/depth render targets and a fullscreen shader; no post-processing dependency was added.
- `HorizonDirector` extends the camera far plane to 9,000, lowers exponential fog density to `0.00082`, and adds 30 camera-relative instanced horizon masses.
- The sea spans 9,000 units and refreshes both fog color and density after the horizon/time-of-day update.
- `LandmarkPath` loads and normalizes three converted GLBs into six route structures. Procedural fallbacks remain in place.
- Compact collision proxies were added after all six approaches were flown without a crash. Arch proxies cover pillars rather than blocking the opening.
- Medium is now the clean default. DOF, shadows, and the 2x pixel-ratio path remain High-only.

The converted wind-ribbon GLB is retained but not rendered. The package contains no integration hook for it, and the existing procedural wind-line system remains active.

## Frame time

The baseline was sampled before integration on the prior High default. Final values are two stabilized 175-frame samples per mode.

| Mode | Mean frame time | p50 | p95 |
|---|---:|---:|---:|
| Baseline High | 16.15 ms | 9.2 ms | 18.0 ms |
| Final Medium run 1 | 16.09 ms | 16.6 ms | 25.0 ms |
| Final Medium run 2 | 16.24 ms | 16.7 ms | 25.2 ms |
| Final High + DOF run 1 | 13.95 ms | 15.7 ms | 24.4 ms |
| Final High + DOF run 2 | 13.90 ms | 16.4 ms | 23.3 ms |

Headless requestAnimationFrame pacing is noisy, so p50/p95 are more useful than the FPS HUD. Both final modes stayed below 25.2 ms at p95 in the stabilized runs.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Live uncached content | Pass | URL marker contained `CinematicDofPipeline`; CDP cache disabled |
| Zero console errors | Pass | `consoleErrors: []` |
| DOF visible and High-only | Pass | Paired High screenshots |
| Long horizon | Pass | 9,000 far plane, 30 horizon instances, expanded sea |
| Six landmarks reachable | Pass | Closest approach 7.2–26.3 units; no route-test crash |
| Collision proxies active | Pass | `collisionWiringRequired: false` |
| Local-only requests | Pass | no external or failed requests |
| Tutorial loop | Pass | 3/3 rings, chapter 1, First Flight achievement |
| Achievement overlap | Pass | 0 overlap pixels with story text |
| Restart | Pass | chapter 0, tutorial 0/3, route rings hidden, cove position |
| Dragon GLB failure handling | Pass | start disabled and explicit model-load failure copy |

## Screenshots

- `reports/world-expansion-verification/expanded-menu.png`
- `reports/world-expansion-verification/final-world-clean-high-no-dof.png`
- `reports/world-expansion-verification/final-world-clean-high-dof.png`
- `reports/world-expansion-verification/final-tutorial-complete.png`

## Remaining blockers

- The four converted GLBs and the existing dragon GLB still lack commercial license provenance. `world-expansion/CREDITS.md` correctly blocks commercial shipment.
- The landmarks are technically integrated and reachable, but their low-poly source silhouettes are not final art.
- The wind-ribbon GLB is intentionally unused.
