# Galevein: Stormflight — Game Structure

Story-driven world layout for themed regions, chapter arc, HUD objectives, sky vistas, and future lobby loop. Data lives in `world-expansion/data/`; runtime logic in `world-expansion/modules/chapterDirector.js` and `gameStructure.js`.

**Dragon reference scale:** wingspan ≈ **8 world units**. All structure heights below are expressed relative to that measure.

---

## World regions (5)

Regions are bounded volumes on the XZ plane. Landmarks are **authored per region** — not dropped in a central valley. Each region declares allowed archetypes, landmark IDs, and a sky preset for `HorizonDirector`.

| ID | Name | Bounds (XZ) | Theme | Allowed archetypes |
|---|---|---|---|---|
| `wake_cove` | Wake Cove | x: −140…220, z: 160…420 | Tutorial shelter, cliff stacks | viaduct |
| `keeper_shallows` | Keeper Shallows | x: −280…320, z: −80…320 | Inner archipelago, patrol lights | viaduct, beacon, seagate |
| `serpent_reach` | Serpent Reach | x: −220…680, z: −580…−80 | Canyon slot + cinder coast | harbor, viaduct, seagate |
| `rib_wastes` | Rib Wastes | x: −620…120, z: −720…−260 | Bone arches, gale spire | ribhall, beacon, harbor |
| `aurora_gate` | Aurora Gate | x: −320…320, z: 480…920 | Tempest sea-stack ring | seagate, ribhall |

### Region narratives

1. **Wake Cove** — A Galevein rests in the lee of the home stacks. Three low rings teach weight and beat before the open sea.
2. **Keeper Shallows** — Home waters under keeper watch. Beacons thread between tide viaducts and the storm spire.
3. **Serpent Reach** — The canyon throat rewards threading at speed. Beyond it, char on the water — four burned longhouses, one spared torch.
4. **Rib Wastes** — Ribs like sea-stacks. The gale spire marks the last shelter before the open night.
5. **Aurora Gate** — The stacks close ranks. The aurora pours into the gate like a tide.

Full bounds, palette, and sky preset fields: `world-expansion/data/regions.json`.

---

## Chapter arc

Five chapters map tutorial → three mid-game regions → nightfall escape. Beacon indices align with the existing 12-leg route in `index.html`.

| Ch | Title | Region | Beacons | Story beat | Win | Loss |
|---|---|---|---|---|---|---|
| I | First Flight | wake_cove | — (3 tut rings) | bond_dragon | 3 tutorial rings cleared | crash / dragon down |
| II | Home Waters | keeper_shallows | 1–4 | rebuild_trust | score ≥ 4 | shot down / nightfall before 4 |
| III | Serpent Run | serpent_reach | 5–8 | thread_canyon | score ≥ 8 | shot down / nightfall before 8 |
| IV | The Long Night | rib_wastes | 9–11 | destroy_tower | score ≥ 11 | shot down / nightfall before 11 |
| V | Tempest Gate | aurora_gate | 12 | nightfall_escape | escape sequence (`finishing`) | shot down / full night before gate |

### Meta story beats (cross-chapter)

| Beat | Player-facing goal |
|---|---|
| Save dragon | Wake Galevein; clear cove rings |
| Rebuild | Cross shallows without losing the Codex to violence |
| Rescue | Find the spared torch in the drowned village |
| Collect at altitude | Climb above harbor masts to read the coast |
| Destroy tower | Charge plasma (X); shatter searchlights |

HUD objective strings per chapter: `world-expansion/data/chapters.json` → `hud.objectiveTemplate`.

---

## HUD objectives

Each chapter exposes:

- **chapterLabel** — e.g. `Chapter III · Serpent Run`
- **objectiveText** — primary goal line (replaces `#objText`)
- **goalText** — designer-facing full sentence
- **distanceText** — metres to next ring/beacon
- **heightText** — metres above water when relevant (chapters II, III, V)

Preview all strings: `reports/chapter-design/hud-preview.html`.

---

## Structure proportion guide

Dragon wingspan **W = 8 units**. Structures should read at flight speed from 200–1500 m.

| Archetype | Default height | vs wingspan | Read at distance |
|---|---:|---|---|
| viaduct | 104 | 13× W | Horizontal deck band + pierced bays |
| harbor | 104 | 13× W | Wide low mass + mast/lantern |
| ribhall | 112 | 14× W | Rib pairs + vault void |
| seagate | 152 | 19× W | Twin towers + arch void (praised tower scale) |
| beacon | 188 | 23.5× W | Tallest; lantern crown visible at 1.2 km |

**Rules:**

- **Footprint width** ≥ 10× W (80 u) for landmarks that must read from the route.
- **Foundation drop** 34 u below site origin (sea swell ±8 u) — already enforced in `proceduralLandmarks.js`.
- **Scale jitter** per region: `landmarkScaleRange` in `regions.json` (e.g. keeper arcade 0.58× in tight archipelago).
- **Never** place full beacon (188 u) inside wake_cove bounds — tutorial uses rings only.
- Searchlight towers in gameplay (~42 u lamp height) ≈ 5× W — deliberately smaller than landmarks; landmarks are navigation monuments, towers are threats.

---

## Cheap sky-layer rendering plan

Extend `HorizonDirector` (no new draw calls per silhouette type):

1. **Instanced cone masses** (existing 30 instances, 1 draw call) — region preset adjusts `near`, `far`, height multiplier, count cap.
2. **Billboard impostors (phase 2)** — add optional `THREE.InstancedMesh` plane ring (8–12 instances) parented to `HorizonDirector.root`, camera-facing in `update()`, textured with pre-rendered floating-island silhouettes (256×128 PNG, 2–3 variants). Cull when `distance > far`. Cost: +1 draw call, +3 KB texture.
3. **Horizon snap grid** — keep 400 u snap; rebuild silhouettes on cell change only.
4. **Fog coupling** — `configureFog()` already runs per frame; region preset sets `fogDensity` so distant islands dissolve into Burke-inspired layered atmosphere (cool base, warm signal windows on landmarks, not IP copy).
5. **Palette drift** — `skyPreset.hueShift` applied to `masses.material.color.setHSL()` in `update()`; `emissivePulse` scales sin(time) amplitude.

Region → preset mapping: `regions.json` → `skyPreset.id`. Apply via `ChapterDirector.applySkyPreset(horizonDirector)` on region enter.

---

## Future lobby loop (Riders Republic–style)

**Spec only — no netcode in this pass.**

```
[Hub load] → walk/fly Galevein in compact hub geometry
     ↓
[Map nodes] — physical pillars or floating markers in hub space
     ↓
[Interact] — hold E at node → modal: Story / Time Trial / AI Match
     ↓
[Story] — load chapter checkpoint, `gameStructure.init`, spawn at region `bounds.center`
[Time Trial] — same route, leaderboard slot (AWS GameLift or PlayFab later)
[AI Match] — async ghost or Microsoft PlayFab multiplayer template (future)
     ↓
[Return] — hub with scales, saddle upgrades, chapter completion flags
```

**Hub requirements:**

- 120×120 u platform over void sea; 3 map nodes (Story, Trial, Match).
- Node states: locked / available / cleared from `ChapterDirector.snapshot().seenRegions`.
- Persist `{ chaptersCleared, bestTimes, scales }` to cloud save when multiplayer lands.

---

## Multiplayer (spec only)

| Concern | Planned approach |
|---|---|
| Session host | AWS GameLift Fleet or Azure PlayFab Multiplayer Servers |
| Sync model | Authoritative host, client-side prediction for dragon rigid body |
| Scope v1 | 2–4 player co-op story (shared beacon score) |
| Scope v2 | Async time-trial ghosts via replay blob |
| Anti-cheat | Server validates beacon order and nightfall timer |

No netcode in repo until story solo loop is wired.

---

## File map

| Path | Role |
|---|---|
| `world-expansion/data/regions.json` | Region bounds, landmarks, sky presets |
| `world-expansion/data/chapters.json` | Chapter arc, win/loss, HUD templates |
| `world-expansion/modules/chapterDirector.js` | State machine, region gates, objectives |
| `world-expansion/modules/gameStructure.js` | Init hook + HUD apply helpers |
| `reports/chapter-design/hud-preview.html` | Standalone HUD copy preview |

---

## Integration note (playability agent)

After `landmarkPath.build()` resolves and `horizonDirector` exists:

```javascript
import { gameStructure } from './world-expansion/modules/gameStructure.js';

const structure = await gameStructure.init(S, D, landmarkPath, {
  horizonDirector,
  getDayAmount: () => TOD.day,
  getHeightAboveWater: (pos) => pos.y - waveH(pos.x, pos.z, S.t),
  getObjectiveTarget: () => nextRingOrBeaconPosition,
  getTowersDestroyed: () => searchlights.filter(t => t.destroyed).length
});

// each frame, after driveTutorial / before legacy driveMissions:
const hud = structure.tick({ tutorialDone: tutRings.filter(r => r.userData.hit).length });
structure.applyHud(hud);
```

Replace inline `CHAPTERS`, `driveMissions()`, and `REGIONS` story pops incrementally — data files become source of truth.
