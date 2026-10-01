# Fresh browser verification

This evidence was regenerated after workspace maintenance. The browser was Chromium 153 with SwiftShader software rendering, so these runs verify rendering and game rules but do not establish hardware FPS targets.

## Full main campaign follow-up

The later combat-capable input driver completed the tutorial, both raid waves, twelve beacons and the Tempest Gate. See [CAMPAIGN.md](CAMPAIGN.md) and `campaign-evidence/results.json`. The earlier unsuccessful route attempt below remains part of the historical ledger.

## Verified behavior

- The real Start → Story menu launched; W, Arrow Up and Space moved the dragon.
- Escape froze simulation. The visible Resume button worked.
- G opened and closed the actual terrain chart and paused flight. `browser-evidence/02-navigation-map.png` (also losslessly encoded as `02-navigation-map.webp` for Git) is an export of its real 900 × 900 canvas.
- All five visible graphics buttons applied the requested settings and persisted the selected profile.
- A keyboard X charge of 1.58 seconds reduced watchtower health from 4 to 1. The firing position and checkpoint were explicitly set up for this diagnostic.
- A real enemy bolt reduced dragon health from 100 to 84 and activated the 0.55-second hit guard. The captured popup was “HIT −16 · BREAK THE BEAM”. The test held the dragon at a declared position 35 metres from a real searchlight, then locked the position after the bolt launched. It did not inject health, projectiles or damage.
- A death-screen retry restored full health and cleared hostile projectiles.
- All five selectable rigs loaded and kept finite bone transforms during rule stepping: Stormcrest, Corrected, Voltspine, Thunderhook and Quaternius.
- All six chapter checkpoint initializations produced finite positions.
- The final terrain source loaded with open-ocean collision height −10. No uncaught browser exceptions occurred in any of these runs.

## Earlier route attempt and limits

The input-only route driver started through normal game initialization and used steering controls plus accelerated rule stepping. It completed all three tutorial rings and four beacons. The run ended after approximately 100.6 simulated flight seconds at the village raid. This driver follows beacons and does not fight raiders; it therefore did not complete the story. No position, score or health assignments were used during this route attempt.

The chapter and combat setups are diagnostic coverage, not evidence of a full unassisted campaign playthrough. Audio playback requests were observed, but audio quality was not judged. Physical-device performance, prolonged GPU memory behavior and a complete human campaign remain unverified.

## Raw ledgers

- `browser-evidence/results.json`: 16 passing checks; one moving-target retaliation diagnostic did not receive a hit. The initial browser load preceded the final underwater-terrain correction; UI, rig and combat behavior checks remain documented as that run's evidence.
- `final-browser-evidence/results.json`: final-source boot, rendering, capture and runtime checks passed. Its stationary wind-up setup caused the beam to sweep off the player, correctly cancelling the attack before firing.
- `combat-confirmation/results.json`: the corrected held-position diagnostic passed all three checks and records the actual hostile projectile hit, health loss and hit guard.

The unsuccessful diagnostics are retained rather than edited into passes. They motivated the final setup, which waits for a real projectile launch before holding the target still.

`final-browser-evidence/flight-scene.jpg` (compressed from the original PNG) is a real 1440 × 900 Low-preset capture in the canyon with a diagnostic camera. It verifies a rendered scene and HUD, not a normal-play camera or a maximum-quality hero image. Two earlier screenshots timed out in the software-rendered browser; those timeouts are retained in the raw ledger.

## Reproduction

Run a script with Node, `CODEX_PRIMARY_RUNTIME_NODE_MODULES` pointing to installed Playwright, and `CHROMIUM_EXECUTABLE` pointing to a Chromium executable with its SwiftShader libraries available:

```
node reports/flight-polish/browser-verification.mjs
node reports/flight-polish/final-browser-check.mjs
node reports/flight-polish/combat-confirmation.mjs
```

Each script starts its own local HTTP server and browser in one process. The source hashes for the final-source follow-ups are in `browser-source-hashes.json`.
