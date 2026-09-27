# Licensing audit — Dragon Storm

**Status: BLOCKED — do not sell or publish this build commercially.**  
**Scope:** local evidence reviewed 2026-08-04; this is risk documentation, not legal advice.

## Bottom line

There is no clearance record for the dragon, any of the ten audio files, or any of the four converted world-expansion assets. The absence of a claim in the catalog is not proof that an asset is owner-created. The game cannot be commercially released until each shipped non-code asset has a recorded source and a commercial-use right.

`MANIFEST.csv` has **142 asset records** (143 physical CSV lines including its header). Its stated 143-row count is therefore an off-by-one if “rows” means asset entries. The `00_Licenses_Manifests/` directory is empty. Every record has the same generic `license_status` text, so that column is a catalog warning, not per-file license evidence.

## Evidence standard used

An asset is only “owner-original” here if local evidence independently supports authorship or a rights assignment; a path inside an owner directory and the string “Arnav original or staged Fab export” are not enough. A file is “third-party-cleared-for-commercial” only if its specific creator, listing/source, acquired license, and applicable terms are retained. Neither category can be inferred from file possession, conversion, or a “Free” listing.

| Partition | Count | Result | Why |
|---|---:|---|---|
| Owner-original | 0 | No asset is cleared by this audit | 56 records are labeled “Arnav original or staged Fab export” and 78 “Existing local game-dev asset,” but no source `.blend` authorship history, commission/assignment, creator declaration, or license record establishes ownership. Staging into a prospective Fab output is not proof of authorship. |
| Third-party-cleared-for-commercial | 0 | None | The directory has no license manifests, receipts, account acquisition records, listing captures, author identities, or terms tied to a file checksum. |
| Third-party-NOT-cleared | 8 | Excluded from any commercial build | Six files are explicitly labeled “Existing third-party Fab runtime asset,” and two are explicitly labeled “Existing third-party Sketchfab/Fab-style asset.” Each lacks the license evidence needed to establish commercial rights. |
| Provenance-unknown | 134 | Not eligible for a sellable build | 56 “original or staged” and 78 “existing local” records are only internal-path claims. The catalog itself warns that they require review; embedded metadata does not name a creator or license. |

This is deliberately conservative. It does **not** say the 134 unknown files are third-party. It says the current evidence cannot establish who owns or licensed them.

### Identified third-party, not cleared (8)

1. `01_Aircraft_Vehicles_Engineering/ithappy-city-car-06.glb`
2. `01_Aircraft_Vehicles_Engineering/ithappy-city-car-19.glb`
3. `01_Aircraft_Vehicles_Engineering/ithappy-city-eco-building-grid.glb`
4. `01_Aircraft_Vehicles_Engineering/ithappy-city-eco-building-terrace.glb`
5. `01_Aircraft_Vehicles_Engineering/ithappy-city-twisted-tower.glb`
6. `01_Aircraft_Vehicles_Engineering/ithappy-city-van.glb`
7. `07_Packages_Archives_To_Review/model.zip`
8. `99_Unsorted_Review/scene.gltf`

The first six have local paths under `flight-sim/assets/runtime/fab/`; the last two have local paths under `vendor/sketchfab/`. Those paths identify likely third-party origin but do not preserve a listing, creator, or acquired license. They are not commercially cleared.

## What the other library files prove — and do not prove

* The library README says it was consolidated on 2026-08-03 using hardlinks/symlinks/copies. That preserves a local relationship to prior files, not copyright ownership.
* The 56 “Arnav original or staged Fab export” records mostly point to `.../outputs/fab-marketplace-staging/...`; that supports a staging workflow but does not identify an author or prove the material was not imported.
* The 78 “Existing local game-dev asset” records point to owner workspaces, `Downloads`, and local project folders. These locations are not a license grant.
* The four inspected source GLBs and `dragon_rigged.glb` identify only `Khronos glTF Blender I/O v5.1.18` as generator. Their `asset.copyright` and `asset.extras` fields are empty. Converted outputs identify `glTF-Transform v4.4.2`, which is technical conversion metadata, not provenance.
* File mtimes are weak evidence of the latest local write, not creation or rights history.

### Fab catalogs are leads, not acquired assets

* `FAB_FREE_REVIEWED_STARTER_LIST.csv` has nine listing leads. It is not an acquisition ledger and does not map any listing to a local file checksum.
* `FAB_FREE_500_DOWNLOAD_QUEUE.csv` has 500 search slots; every row is `queued_not_downloaded`. It proves no download or license acquisition.
* `Fab_Free_Aviation_Assets_100/` contains a 100-result catalog and URLs. Its README says individual local package downloads must be verified before local presence is claimed.
* `Fab_Free_Dune_Space_Assets_100/` contains 100 `.webloc` listing links, not package files. Its README expressly says the listings are third-party and not cleared for resale.

## Current game asset register

“Present” means present in the repository and therefore liable to be included or served with a browser build. “Loaded now” means directly loaded by the current `index.html`; the world-expansion modules are not imported by that entry point at the time of review, but their output assets remain blocked if integrated or distributed.

| Game asset | Present / loaded now | Local evidence | Clearance status | Required decision |
|---|---|---|---|---|
| `dragon_rigged.glb` | Present; **loaded now** | 15,779,752 B; copied into the library from this repository; Blender exporter metadata only; no author, listing, license, or source `.blend` found | **Provenance-unknown — BLOCKING** | Replace with a newly commissioned/created original creature under written assignment, or produce a complete source-to-license chain and obtain specialist derivative-work review. Renaming it does not clear it. |
| `audio/amb_sea.mp3` | Present; **loaded now** | 30.0 s; `Lavf59.27.100` encoder tag only; no author/license metadata | **Provenance-unknown — BLOCKING** | Replace or retain a source/license/commission record. |
| `audio/crash.mp3` | Present; **loaded now** | 1.5 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/detected.mp3` | Present; **loaded now** | 20.88 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/flap.mp3` | Present; **loaded now** | 1.0 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/music_menu.mp3` | Present; **loaded now** | 5.0 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/music_tension.mp3` | Present; **loaded now** | 30.0 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/ring.mp3` | Present; **loaded now** | 5.0 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/thunder.mp3` | Present; **loaded now** | 10.16 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/wind.mp3` | Present; **loaded now** | 10.08 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `audio/zap.mp3` | Present; **loaded now** | 3.08 s; encoder tag only | **Provenance-unknown — BLOCKING** | Replace or document commercial right. |
| `world-expansion/assets/portal_arch_draco.glb` | Present; not entry-point loaded | Converted from library `modular_portal_arch.glb`, whose manifest origin is “Existing local game-dev asset”; no license file/listing | **Provenance-unknown — BLOCKING if shipped** | Keep quarantined; replace or establish source chain. |
| `world-expansion/assets/scene_landmarks_draco.glb` | Present; not entry-point loaded | Converted from `fable-scene-landmarks.glb`, labeled “Arnav original or staged Fab export”; no authorship proof | **Provenance-unknown — BLOCKING if shipped** | Keep quarantined; establish ownership/rights or replace. |
| `world-expansion/assets/airfield_props_draco.glb` | Present; not entry-point loaded | Converted from `fable-airfield-props.glb`, labeled “Arnav original or staged Fab export”; no authorship proof | **Provenance-unknown — BLOCKING if shipped** | Keep quarantined; establish ownership/rights or replace. |
| `world-expansion/assets/wind_ribbon_draco.glb` | Present; not entry-point loaded | Converted from `wind-ribbon-vfx.glb`, labeled “Existing local game-dev asset”; no license file/listing | **Provenance-unknown — BLOCKING if shipped** | Keep quarantined; establish source chain. |
| `vendor/three.module.js` and `vendor/GLTFLoader.js` | Present; **loaded now** | Vendored three.js r165 (`REVISION = '165'`); no local license notice was found | **Commercially usable subject to notice — remediation required** | Keep the MIT copyright and permission notice with the distributed copy. Do not represent this as a proprietary engine. |

The game’s current entry point directly loads all ten audio files and `dragon_rigged.glb`. No other raster, font, or model/audio files were found by extension inventory.

## Fab license rule, correctly scoped

Official Fab documentation lists CC-BY and Standard licenses. “Free” describes price, not a universal license or a local proof of acquisition.

* **Fab Standard — Personal and Professional:** both grant the same scope of rights: commercial/private use, modification, and commercial distribution of a project containing the asset. They prohibit standalone resale or redistribution of the asset. Personal eligibility is at or below USD $100,000 gross commercial revenue in the prior 12 months; Professional applies above that threshold. A later revenue increase does not retroactively require an upgrade for an already acquired asset. The limited UEFN **Reference Only** version is not source-format permission and is unsuitable as evidence for an exported browser-game asset.
* **Fab CC-BY:** may be used and adapted commercially, but only with proper attribution, license link, and change indication. The exact version/listing controls. CC-BY-NC, editorial, reference-only, or other non-commercial/restricted terms are not acceptable for this project.
* **Legacy UE Marketplace license:** may appear on migrated listings and is identified on the listing. It must be preserved and reviewed rather than assumed to be Fab Standard.
* **three.js:** r165 is MIT-licensed. Commercial use and distribution are permitted, including sale, if the copyright and permission notice are retained.

None of those permissive license rules clears a local file whose precise listing and acquisition cannot be shown.

## Required clearance record for each asset used in a release

Create a release ledger before the asset enters a sellable build. For each file, retain:

1. asset ID, in-game path, source path, and SHA-256 of source and shipped derivative;
2. creator/legal rights holder and contact;
3. exact listing/source URL and a dated listing capture or contract;
4. acquisition date, purchasing account, and licensee entity;
5. complete license text/version and an explicit commercial-use determination;
6. attribution text and placement, if required;
7. permitted modification/distribution terms and a standalone-redistribution check;
8. for commissioned/owner material, source files plus an authorship declaration or signed IP assignment; and
9. reviewer, review date, and release build hash.

For a paid launch, a lawyer should review the final ledger, especially the dragon model, music, title/branding, commissioned work assignments, and any ambiguous Fab/Sketchfab history.

## Sources consulted

* Epic Games, [Licenses and Pricing in Fab](https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab), accessed 2026-08-04.
* Epic Games, [Fab Standard License / EULA summary](https://www.fab.com/eula), accessed 2026-08-04. The site required JavaScript verification during retrieval; the terms summarized here were also returned by official search results and must be rechecked against the binding EULA at acquisition.
* Creative Commons, [CC BY 4.0 deed](https://creativecommons.org/licenses/by/4.0/deed.en), accessed 2026-08-04.
* three.js, [r165 MIT license](https://github.com/mrdoob/three.js/blob/r165/LICENSE), accessed 2026-08-04.
* Local evidence: `FAB ASSETS/MANIFEST.csv`, its README/catalogs, game file inventory, embedded GLB metadata, and `world-expansion/CREDITS.md` / `PUBLISHING.md`.

## Fonts added 2026-09-27 (Norse UI pass)

Vendored locally in `fonts/` (latin + runic subsets only, fetched from Google Fonts' static CDN). All four families are published under the **SIL Open Font License 1.1**, which permits commercial use, embedding and redistribution with the software; the fonts may not be sold on their own. Keep this record with any shipped build.

| File | Family | Designer / source | License |
|---|---|---|---|
| `fonts/uncial-antiqua.woff2` | Uncial Antiqua | Astigmatic (Google Fonts) | OFL 1.1 |
| `fonts/im-fell-english.woff2`, `fonts/im-fell-english-italic.woff2` | IM FELL English | Igino Marini (Google Fonts) | OFL 1.1 |
| `fonts/grenze.woff2` | Grenze | Omnibus-Type (Google Fonts) | OFL 1.1 |
| `fonts/noto-sans-runic-runic.woff2` | Noto Sans Runic | Google Noto project | OFL 1.1 |

All other Norse-pass ornament (knotwork bands, rivets, painted shields, runestones, longships, braziers) is original procedural CSS/SVG/canvas/three.js code in `index.html` — no imported images or models. Elder Futhark runes and Viking-age motifs (round shields, dragon-head prows, runestones, Urnes-style interlace) are historical public-domain forms; no franchise logos, lettering or crests were copied.
