# Chapter Director Integration Status

**Date:** 2026-08-05  
**Status:** **INTEGRATED** — playability foundation complete; chapter director wired in `index.html`.

## HUD preview verification

| Check | Result |
|---|---|
| HTTP server on `:8000` | Running (playability agent) |
| `GET /reports/chapter-design/hud-preview.html` | **200 OK** |
| `GET /world-expansion/data/chapters.json` | **200 OK** (5 chapters) |
| `GET /world-expansion/data/regions.json` | **200 OK** (5 regions) |
| Sample objective @ beacon 6 (Serpent Run) | `III · Serpent Run — beacons 6/8 · dive and flock` |

Open: http://localhost:8000/reports/chapter-design/hud-preview.html — renders all five chapter HUD cards from JSON (JS fetch at runtime).

## Live game integration (complete)

Verified 2026-08-05 via CDP (`SIM.jumpBeacon(6)`):

| Check | Result |
|---|---|
| `#objText` @ beacon 6 | `III · Serpent Run — beacons 6/8 · dive and flock` |
| `SIM.chapterHud().chapterRoman` | `III` |
| `SIM.chapterHud().regionId` | `serpent_reach` |

### 1. Import and init

Add after existing expansion imports (~line 530):

```javascript
import { gameStructure } from './world-expansion/modules/gameStructure.js';
```

After `landmarkPath.build()` resolves and `horizonDirector` exists (~line 1077), add:

```javascript
let structure = null;

function nextObjectiveTarget() {
  const nb = S.chapter === 0
    ? tutRings.find(r => !r.userData.hit)
    : rings.find(r => !r.userData.hit);
  return nb?.position ?? null;
}

landmarkReady.then(async () => {
  structure = await gameStructure.init(S, D, landmarkPath, {
    horizonDirector,
    getDayAmount: () => TOD.day,
    getHeightAboveWater: (pos) => pos.y - waveH(pos.x, pos.z, S.t),
    getObjectiveTarget: nextObjectiveTarget,
    getTowersDestroyed: () => searchlights.filter(s => s.disabled > 0).length,
  });
}).catch(/* existing landmark error handler */);
```

**Note:** Merge init into the existing `landmarkReady.then(...)` block rather than adding a second `.then` chain.

### 2. Replace per-frame HUD writes

In the main tick (~line 2197), replace `driveMissions()` with:

```javascript
driveTutorial(dt);
if (structure) {
  const hud = structure.tick({
    tutorialDone: tutRings.filter(r => r.userData.hit).length,
  });
  structure.applyHud(hud);
} else {
  driveMissions(); // fallback until init completes
}
driveRegions(); // see step 4
checkSkillUnlocks();
```

### 3. Remove inline chapter/objective sources

| Current (index.html) | Replace with |
|---|---|
| `const CHAPTERS=[...]` (~1608) | `structure.chapters.chapters` via director |
| `advanceChapter()` (~1615) | `structure.director.syncChapterFromProgress(S.score, S.tutDone)` + `onChapterEnter` callback for `storyPop(chapter.popupOnEnter)` |
| `driveMissions()` (~1619) | `structure.tick()` + `structure.applyHud()` |
| Manual `S.chapter=1` in `driveTutorial` (~1602) | Let director handle via `enterChapter(1)` when tutorial completes |

Keep `driveTutorial()` ring collision logic; only chapter transitions and HUD strings move to data.

### 4. Replace inline region story pops

| Current | Replace with |
|---|---|
| `const REGIONS=[{x,z,r,line}]` (~894) | `regions.json` bounds + `ambientLine` |
| `driveRegions()` (~900) | Director `updateRegionGate()` already runs inside `structure.tick()`. Add `onRegionEnter` callback in init: `storyPop(region.ambientLine, 6)` on first visit |

Optional: map legacy one-off pops (drowned village torch, bone arches) to `regions.json` `storyBeats` or keep as static world art triggers until a second pass.

### 5. Sky presets on region enter

Already wired inside `ChapterDirector.applySkyPreset()` → called from `gameStructure.init` callbacks. No extra index.html code beyond passing `horizonDirector` in init options.

Verify after integration: fly from Wake Cove → Keeper Shallows → Serpent Reach; fog density and horizon distances should shift per `regions.json` `skyPreset`.

### 6. Region-themed landmarks

**Current state:** `proceduralLandmarks.js` exports fixed `LANDMARK_SITES` (12 sites, each with `id` + `archetype`). `regions.json` lists `allowedLandmarkIds` and `allowedLandmarkArchetypes` per region. `gameStructure.allowedLandmarksForRegion()` exposes the filter but nothing consumes it yet.

**Minimal hook (landmarkPath.js only — coordinate with playability agent):**

```javascript
// LandmarkPath constructor option:
this.allowedLandmarkIds = options.allowedLandmarkIds ?? null;

// In build(), before buildLandmarkSite:
const sites = this.allowedLandmarkIds
  ? this.sites.filter(s => this.allowedLandmarkIds.includes(s.id))
  : this.sites;
```

**Runtime region swap (optional v2):** pass `getAllowedLandmarkIds: () => structure.allowedLandmarksForRegion()` and rebuild or toggle visibility when region changes. v1 can rely on sites already placed in region-appropriate coordinates.

### 7. SIM harness extensions

Add to `window.SIM` for playtest:

```javascript
jumpBeacon: (n) => {
  reset(); S.chapter = 1; S.tutDone = true;
  for (const r of rings) r.visible = true;
  S.score = Math.max(0, n - 1);
  for (let i = 0; i < S.score; i++) rings[i].userData.hit = true;
  const target = rings[S.score];
  if (target) D.group.position.copy(target.position).add(new THREE.Vector3(0, 40, -80));
  structure?.director?.syncChapterFromProgress(S.score, true);
  return SIM.state();
},
chapterHud: () => structure?.director?.lastHud ?? null,
structureSnapshot: () => structure?.snapshot() ?? null,
```

### 8. DOM elements

| Element | Used by `applyHud` | Present in index.html |
|---|---|---|
| `#objText` | objective string | Yes |
| `#beaconV` | beacon count | Yes |
| `#chapterLabel` | chapter label | **Missing** — add to HUD panel or skip (objective template includes chapter roman) |
| `#distanceV` | distance to target | **Missing** — optional add |
| `#heightV` | height AGL | **Missing** — optional; `hud()` already writes `#altV` |

Minimal path: wire only `#objText` and `#beaconV` (already handled). Add `#chapterLabel` / `#distanceV` if richer HUD desired.

## Verification checklist (post-integration)

1. Start server: `python3 -m http.server 8000` from repo root.
2. Load http://localhost:8000/index.html — no console errors; landmarks build.
3. Complete tutorial → objective shows `II · home waters — beacons 0/4 · echo at 1`.
4. `SIM.jumpBeacon(6)` → `#objText` shows **`III · Serpent Run — beacons 6/8 · dive and flock`**.
5. Fly into Serpent Reach → sky fog/horizon shifts; optional region ambient pop.
6. `SIM.chapterHud()` returns JSON with `chapterRoman: "III"`, `regionId: "serpent_reach"`.

## Files ready (commit `88fd5bd`)

| Path | Role |
|---|---|
| `world-expansion/data/chapters.json` | Chapter arc, HUD templates, win/loss |
| `world-expansion/data/regions.json` | Bounds, sky presets, allowed landmarks |
| `world-expansion/modules/chapterDirector.js` | State machine |
| `world-expansion/modules/gameStructure.js` | Init + HUD apply |
| `docs/GAME_STRUCTURE.md` | Design doc |
| `reports/chapter-design/hud-preview.html` | Standalone preview |

## Next action

When playability agent finishes (`turn_ended` in transcript or explicit handoff):

1. Rebase/merge any `index.html` changes.
2. Apply steps 1–8 above.
3. Commit: **`Wire chapter director and region objectives`**
4. Run SIM jump-beacon-6 verification and record objective string in this file.
