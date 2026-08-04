# Flight motion verification

## Rig diagnosis

- Source: `dragon_rigged.glb`, 15,779,752 bytes, 1,080,189 decoded vertices.
- Contract: 25-joint skin; `Flap` (frames 1-39, 75 channels) and `Glide` (frames 1-73, 75 channels); `head` and `chest` present.
- Influence counts: 87,351 vertices with 1 influence, 24,083 with 2, 319,560 with 3, and 649,195 with 4. There is no second joint/weight set, so the file does not contain more than four exported influences.
- Zero-weight vertices: 0.
- Weight sums: 0.9998168-1.0003663. The small error is Draco quantization, not the deformation source.
- Defect: 144,267 vertices combine wing joints with distant head, neck, tail, or leg joints. 31,974 vertices combine left- and right-wing joints. Examples include 14,242 vertices shared by both `fingerA` sides plus `head` and `neck`.

## Correction

`dragon_rigged_corrected.glb` is a separate export; the source remains unchanged. The correction removed 216,790 impossible assignments from 144,267 vertices, selected the anatomically nearest current joint family, then renormalized and re-exported with Draco compression.

Post-export audit: 0 uncovered vertices, 0 wing/distant combinations, 0 cross-wing-side combinations. The 25-joint hierarchy and both animation clips remain intact.

## Runtime verification

- Cache disabled through CDP before each navigation.
- External network resources: 0.
- Loaded runtime bones: 5 tail, neck, head, chest, hips, 2 shoulders, 2 forearms, 6 wing-tip/finger joints.
- Measured 900-frame sample: p50 8.3 ms, p95 16.6 ms, p99 25.0 ms.
- Previous verified project baseline supplied for this task: p95 under 25.2 ms. The two samples are not a controlled A/B because the earlier raw frame series was unavailable.

Screenshots in this directory cover the original/corrected rig sample, launch coil/release/settle, and dive entry/load/pull-out. The automated static clip-extreme sampler did not advance the baked action reliably; the before/after files therefore prove comparative rendered loading, not exact extrema.
