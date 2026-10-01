# Journey state and backend verification

The game now has durable, resumable Story state and an optional server save service. The existing graphics, flight physics, story route and combat tuning remain in place. A renderer-independent, versioned save contract is shared by browser storage and server validation.

## What changed

- Added exact-flight Continue, five-second/progression autosaves, save-and-return from pause, persistent Forge upgrades/currency, unlocked chapter selection, and legacy completion/village/mystery migration.
- Checkpoints include position/orientation, beacons and canyon/tutorial gates, day/time, health/ammunition/cooldowns, tower damage and active raid wave/enemies/village health. Loadout and currency rewind together with the checkpoint.
- Added checksummed portable export/import, previous-valid-save recovery, future-version protection, quota/denied-storage handling with an exportable session copy, and conflicting-tab detection.
- Added a same-origin Node 24 / SQLite backend with HttpOnly device sessions, transactional revision checks, ten-version retention, payload validation, request limits, and private static-file boundaries. It is optional; GitHub Pages still uses local persistence.
- Added a cleaner two-column journey hub, a collapsible backup panel, keyboard-focusable flight choices, and a route back to title/settings. Restored flights start paused, with their pose and HUD synchronized.

## Results

**33 automated tests passed.** `unit-results.txt` covers legacy migration, full checkpoint round trips, damaged saves, quota failures, concurrent tabs, future schemas, invalid inputs, queued/cloud conflicts, session isolation, cross-origin rejection, server restart durability, revision races, history retention, static-file access restrictions, payload/rate limits, and existing combat/graphics/audio tests.

**Seven browser checks passed with zero browser exceptions.** `browser-results.json` and `browser-check.mjs` cover normal UI Story launch, save/return, reload/Continue, a diagnostic imported second-wave raid with damaged tower and upgraded loadout, server backup recovery after deleting local save keys, and an actual Forge purchase retained after reload. Imported fixtures are diagnostic, not earned campaign progress.

**Full main campaign completed again.** `campaign-evidence/results.json` records all three tutorial rings, both raid waves, all twelve beacons, ESCAPED / TEMPEST GATE, legacy completion persistence and return to hub. The run used normal flight controls and charged-shot keyboard events with read-only terrain lookahead. There were no teleports, HP/progress mutations or forced victory. It took 179.9 simulated flight seconds and nine charged shots; Rook finished at 98.4 health and Hearthholm at 82. Chromium 143 used SwiftShader; this is accelerated simulation, not a native-GPU benchmark or human playthrough.

Final hub checks cover 1280×800 and 800×500, card separation, hidden title copy, no horizontal overflow, and return-to-title navigation. See `hub-results.json`, `hub-1280.jpg`, and `hub-800.jpg`. The earlier `journey-backups.jpg` shows the functional backup test before the final hub layout polish.

## Failures preserved and fixed

- `first-attempt.json`: the browser caught an unbound native `fetch` invocation that prevented backend discovery. The client now wraps the browser fetch call.
- `campaign-first-attempt.json`: an invisible save panel intercepted Start at 800×500. The hidden hub now uses visibility as well as opacity.
- `campaign-collision-attempt.json`: the initial input driver cleared the raid but crashed into a mountain at beacon five. A read-only terrain lookahead was added to the test pilot; no gameplay collisions or difficulty were weakened to pass.
- `hub-first-attempt.json`: the old wake hint intercepted the new Back link at small height. It is now hidden while the hub is open.
- Visual inspection caught an unsynchronized restored dragon pose/HUD; the Continue adapter now applies those before pausing.

## Limits and operation

The backend was tested locally, including a real SQLite process restart. It has **not** been provisioned on a public host, and the Docker deployment recipe has not been executed. GitHub Pages cannot run a Node/SQLite service. No multiplayer, account login/recovery, authoritative anti-cheat, or competitive leaderboard is claimed. Server-session cookies expire after 30 days; export/import is the portable transfer/recovery path. Production needs a same-origin HTTPS proxy and persistent disk, as documented in `backend/README.md`.

Transient projectiles, particles, active mystery minigames and the exact current storm/raider dive animation are not serialized. Continue restores a playable checkpoint with a short grace period. Browser/device memory and native GPU performance have not been benchmarked. The final small hub layout change was checked separately after the functional save and campaign runs; the source hashes identify the final source snapshot.
