# Progression verification

## Beacon 12 before this pass

The game was technically winnable. A CDP-driven route passed through all twelve game-owned beacon registrations in order and produced:

- kick: `ESCAPED`
- title: `TEMPEST GATE`
- copy: `All twelve beacons, unseen. The Gate opens, and the Sable Reach falls behind you.`

The ending was an immediate generic overlay over the final beacon. There was no gate-opening sequence or arrival camera. Evidence: `pre-change-result.json` and `pre-change-beacon-12.png`.

## Progression changes

- Main-route beacons no longer register while hidden in Chapter I, and the arrow now points to tutorial rings until all three are complete.
- Rock impacts remove health, speed, and position instead of causing an instant opening wreck. The verified opening collision reduced health from 100 to 77.7 without ending the run.
- Searchlight range, rotation, detection gain, bolt speed, and fire cadence ramp with beacon progress. Towers do not fire before beacon 2.
- Detection now has `HUNTED` and `LOCKED` warning stages. Clean beacons pay a scale bonus, canyon gates pay scales and break detection, and full detection still loses the run.
- Echolocation, Spiral, Stormbreak Dive, and Dragon Call now unlock at beacons 1, 2, 3, and 4 in both behavior and HUD state.
- Chapters advance at beacons 1, 4, 8, and 11 with route-specific objective copy.
- Nightfall is a real loss after 30 seconds of daylight plus a 210-second sunset. The measured route is 4,388.7 units: about 169 seconds at cruise speed 26 or 125 seconds at speed 35.
- Forge menus pause simulation. Clean play reaches 6 scales after beacon 1 and 28 by beacon 8. First-level verified effects are strap strain 7→10, turn rate 1.55→1.87, downbeat 11→13.5, charge 0.90→0.78 seconds with +0.07 power, and health 100→112 with bolt damage 16→13.
- Beacon 12 now opens a layered Tempest Gate, moves to an arrival camera for 1.8 seconds, then shows the victory overlay.

## Verification

All navigations used `Network.setCacheDisabled` before `Page.navigate` and `127.0.0.1`.

- Tutorial gate: a hidden main-route ring did not score; tutorial rings advanced 0→1→2→3, then the route became visible and beacon 1 scored.
- Full route: CDP teleports drove the game's normal proximity registration, producing scores 1 through 12 and `finishing: true` before the delayed overlay.
- Mid-run and Forge: `mid-run-beacon-6.png` and `forge-affordable.png`.
- Win: `win-tempest-gate.png`.
- Runtime regressions: zero console warnings/errors, zero external requests, and zero old `audio/` requests.
- Full machine-readable evidence: `verification-result.json`.

## Frame timing

A controlled 600-frame baseline/candidate pair before the final tutorial-registration guard measured:

- baseline: p50 8.4 ms, p95 16.7 ms, p99 17.6 ms; load 9.40→9.57
- candidate: p50 8.3 ms, p95 16.7 ms, p99 17.7 ms; load 9.57→9.44

The final retake was discarded: unrelated CPU jobs raised load to 29.12→26.60 on 18 cores and later to 44.52. Its timings are retained in `verification-result.json` as invalid evidence, not a regression claim. The last code change after the valid pair was the Chapter I hidden-beacon guard and debug-route visibility.

## Remaining weakness

The full completion proof is state-driven, not a human-flown twelve-beacon run. The numeric pacing and progression transitions are verified; late-route handling difficulty still needs one uninterrupted human playtest when machine load is normal.
