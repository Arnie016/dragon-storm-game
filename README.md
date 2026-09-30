# Galevein: Stormflight

Galevein: Stormflight is a self-contained three.js flying game. Guide Rook, a Galevein, through the Sable Reach; learn the controls in the cove, evade searchlights, gather all twelve beacon rings, and reach the Tempest Gate.

## Run locally

Run this from the repository root:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

Do not open `index.html` with `file://`. The game loads ES modules and the rigged GLB asset, which browsers block from local files because of CORS.

## Controls

- `W` / `S`: accelerate / brake
- Arrow keys or `A` / `D`: climb, dive, bank, and turn
- `Space`: flap for lift
- Hold then release `X`: charge and fire plasma
- `C`: echolocation pulse
- `F`: call the flock for temporary stealth
- Hold `A` or `D`, then release: spiral into Ultra speed
- Dive with Down, then pull up with Up: sonic boom
- `Q` / `E`: look around
- `V`: switch chase / rider view
- `Tab`: Flight Codex
- `B`: The Forge
- `M` or the sound button: mute/unmute

## Features

- Guided three-ring flight tutorial and a twelve-beacon win route
- Searchlight stealth, combat, health, crashes, win/lose screens, and restart
- Plasma breath, echolocation, flock stealth, spiral acceleration, Stormbreak Dive, and lightning harvest
- The Forge upgrades and Flight Codex skill tracking
- Dynamic weather, sea life, storm audio, graphics presets, and local vendored assets
- Storm strikes use a potential-biased bolt path by default (`?lightning=jag` for the old random polyline)

## Graphics and flight polish

Five persisted graphics levels are available: **Low, Medium, High, Extra High, Extreme**.
They scale resolution, rain/trails, sea geometry, mountain detail distance, dragon shadows and cinematic depth. Collision and enemy warning timings remain consistent across settings.

- **G:** terrain chart with heading, objective and tower states.
- **Escape:** pause/resume or close the active panel.
- **Graphics:** change quality during flight; the open panel pauses the game.

Mountains use a shared terrain surface for collision, projectiles and navigation. Watchtowers show target/health feedback, warn before firing and lose their lock behind terrain. Retry clears the previous run while keeping earned upgrades.

See [the change and verification report](reports/flight-polish/REPORT.md) for tests, screenshots and measured limitations.
