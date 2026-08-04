# Asset credits and commercial gate

## Release status

**BLOCKED FOR COMMERCIAL SHIPMENT.** `FAB ASSETS/00_Licenses_Manifests` is empty. Every applicable `MANIFEST.csv` entry says `review before commercial use; do not resell third-party assets as standalone packs`. That status is not a license grant, does not identify an author, and does not establish whether the file was acquired under Fab Standard, CC-BY, CC-BY-NC, Sketchfab, or a project-owned license.

The files below are a technical conversion batch only. They must not be wired into a sellable build until the publisher records the original listing URL, author, acquired license, acquisition account/entity, and a source checksum. A Fab Standard License would generally permit commercial distribution inside a game and does not require attribution, but the local files do not prove they were acquired under that license.

## Converted technical batch

| Output | Local source | Manifest origin | License evidence | Attribution | Commercial release |
|---|---|---|---|---|---|
| `assets/portal_arch_draco.glb` | `03_Fantasy_Creatures_Props/modular_portal_arch.glb` | Existing local game-dev asset | No license file or listing ID | Unknown | Blocked |
| `assets/scene_landmarks_draco.glb` | `04_Environment_Building_Kits/fable-scene-landmarks.glb` | Arnav original or staged Fab export | No authorship or license proof | Unknown | Blocked |
| `assets/airfield_props_draco.glb` | `04_Environment_Building_Kits/fable-airfield-props.glb` | Arnav original or staged Fab export | No authorship or license proof | Unknown | Blocked |
| `assets/wind_ribbon_draco.glb` | `06_VFX_Interaction/wind-ribbon-vfx.glb` | Existing local game-dev asset | No license file or listing ID | Unknown | Blocked |

## Excluded

- `dragon_rigged.glb`: already used by the game, but its 15.8 MB source has no license record in the supplied library. Its commercial status is separately unresolved.
- `fantasy-rpg-dungeon-kit-*`, `haunted-halloween-manor-*`, and any Sketchfab/Fab-style archive: excluded because provenance is third-party/unclear and there is no retained license evidence.
- `Dragon Cave` in `FAB_FREE_REVIEWED_STARTER_LIST.csv`: excluded because it is only a listing lead, marked limited-time-free, and is not an installed asset with a retained license record.
- All `00_Licenses_Manifests` entries: none exist.

## Required remediation

For each intended runtime asset, create a durable record containing: exact source URL, creator, acquired date, license text/PDF or listing capture, account/licensee entity, source SHA-256, output SHA-256, whether attribution is required, and attribution text. Reject CC-BY-NC and other non-commercial terms. Do not publish an extracted GLB pack; Fab Standard permits assets inside a game, not standalone redistribution.
