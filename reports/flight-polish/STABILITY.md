# CPU stability verification

Run from the repository root:

```sh
node reports/flight-polish/stability-check.mjs
```

The current run passed. Raw measurements, source SHA-256 and asset hashes are in `stability-result.json`.

| Area | Test and result |
| --- | --- |
| Real dragon rigs | Stormcrest and Quaternius GLBs, 600 frames each at 30, 60 and 120 simulation steps per second: 3,600 frames / 70 aggregate simulated seconds. Zero invalid bone transforms, action time scales, skin matrices or sampled skinned vertices. Maximum quaternion length error: 7.35e-8. |
| Procedural pose | The actual pose-restoration function restores every tracked bone to its saved animation pose after procedural offsets. The actual blend block runs with no `D.boost` property; finite time scales come from `S.boost`. |
| Retry/reset | 20 cycles execute the actual reset, combat disposal and flock cleanup functions. Transient state, held controls, charge effects, tower wind-up, detection and spring velocities reset. Owned transient resources dispose: 100 geometries, 120 materials and 20 replaced ring materials. Shared projectile geometry disposes zero times. |
| Progression | Upgrades and scales survive ordinary reset, clear when explicitly requested, and selected chapter spawn coordinates survive the launch callback. |
| Delayed callbacks | A cancelled callback cannot alter a new run even when manually invoked after cancellation. A callback due while paused waits until resume. |
| Cliff graze | Three-second isolated cliff-flank cases at 30/60/120 Hz survive with 100 health, trigger CLOSE CALL and reduce detection. The avoidance push moves the dragon out of the graze band; measured detection ends at 0.9600 / 0.9633 / 0.9633. |
| Collision cooldown | Repeated contact during a one-second impact window causes one damage event at all three rates. A contact exactly on a column centre remains finite. Heightfield near-misses invoke the hillside lift and graze behavior. |
| Gust damping | With otherwise identical state, the actual wind block yields a displacement ratio of 0.2 while grazing at all three rates. |

The runner extracts source blocks directly from `index.html` and uses the vendored Three and Draco implementations. It does not maintain a second copy of the production algorithms. Textures are excluded from the GLB parse; geometry, skin weights, animations and bone hierarchies are real. The Draco worker body runs in a VM to make its decoding available without browser workers.

DOM, audio, story feedback and world state are explicit test boundaries for lifecycle tests. A synthetic chapter callback supplies distinctive coordinates to test that launch does not overwrite them. Graze tests isolate the shipped collision and wind blocks using one cylindrical cliff and a flat hillside. They are not a complete canyon run or a full player flight simulation. These CPU results do not measure GPU frame rate, image quality, perceived flight feel or end-to-end campaign completion.
