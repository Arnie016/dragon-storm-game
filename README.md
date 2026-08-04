# Dragon Storm Game

Dragon Storm is a self-contained three.js flying game. Fly a Night Fury through a storm, learn the controls in the cove, evade searchlights, collect all twelve beacon rings, and reach the Hidden World.

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
- `Tab`: Book of Dragons
- `B`: The Forge
- `M` or the sound button: mute/unmute

## Features

- Guided three-ring flight tutorial and a twelve-beacon win route
- Searchlight stealth, combat, health, crashes, win/lose screens, and restart
- Plasma breath, echolocation, flock stealth, spiral acceleration, fury dive, and lightning harvest
- The Forge upgrades and Book of Dragons skill tracking
- Dynamic weather, sea life, storm audio, graphics presets, and local vendored assets
