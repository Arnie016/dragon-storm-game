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

### GPU-input weight audit

Both files pass the in-engine checks over 1,080,189 decoded vertices and one `SkinnedMesh`.

- Original: 0 zero-weight vertices, 0 sums deviating from 1.0 by more than 1e-3, 0 negative weights, sum range 0.999999957-1.000000045, mean 1.000000010. Influence distribution: 87,351 / 24,083 / 319,560 / 649,195 for 1 / 2 / 3 / 4 influences.
- Corrected: 0 zero-weight vertices, 0 sums deviating from 1.0 by more than 1e-3, 0 negative weights, sum range 0.999999957-1.000000045, mean 1.000000009. Influence distribution: 88,224 / 96,485 / 388,927 / 506,553 for 1 / 2 / 3 / 4 influences.
- Both files have joint indices 0-22 and 0 positively weighted invalid joint references.

The correction already renormalized affected vertices before export. The in-engine audit required no additional repair.

### Controlled frame-time A/B

Each rig ran the same 900-frame, three-phase flight path in the same isolated browser session at Medium quality. The script disabled cache before each navigation and recorded system load around each sample.

- Original-first: original p50/p95/p99 16.7/25.7/33.4 ms at load average 134.82 -> 132.48; corrected 17.0/26.0/34.2 ms at 137.51 -> 157.90.
- Corrected-first: corrected p50/p95/p99 8.3/16.2/50.0 ms at 200.06 -> 183.26; original 8.3/9.2/17.1 ms at 170.19 -> 157.52.

The frame-time result is inconclusive because ambient load changed substantially inside both pairs. The first pair is effectively tied at p95; the reverse pair favors the original but also ran it under materially lower load. This renderer always carries four skin slots per vertex, so reducing the count of nonzero weights does not reduce the vertex shader's fixed four-bone skinning path.

Re-run with:

```bash
nice -n 19 python3 reports/flight-motion-verification/verify_rig_runtime.py --cdp http://127.0.0.1:9224 --frames 900
```

Screenshots in this directory cover the original/corrected rig sample, launch coil/release/settle, and dive entry/load/pull-out. The automated static clip-extreme sampler did not advance the baked action reliably; the before/after files therefore prove comparative rendered loading, not exact extrema.

## Membrane-bone candidate

`dragon_rigged_membrane.glb` is an opt-in Draco-compressed candidate selected with `?rig=membrane`; the corrected rig remains the default. The Blender build is reproducible with `build_membrane_rig.py`.

- The source hierarchy was independently verified as 25 deform bones: hips/chest/neck/head, bilateral shoulder/forearm/finger A-B-C chains, tail1-tail5, and bilateral thigh/shin/foot chains.
- Six deform bones were added: `membraneBody`, `membraneAB`, and `membraneBC` on each side. The body rib spans shoulder to the inner finger; the other two bisect the A/B and B/C rays. Three ribs per side provide one independently curved bay between each structural boundary without building a dense rib cage that competes for the four available skin slots.
- Smooth weights were derived from the overlap between adjacent corrected wing groups, capped to the strongest four assignments, and renormalized. 470,973 vertices changed.
- Post-export influence distribution: 88,224 / 82,858 / 203,922 / 705,185 vertices with 1 / 2 / 3 / 4 influences. Zero vertices are unweighted or above four influences. Sum range after Draco round-trip: 0.999816835-1.000183195.
- `Flap` remains frames 1-39 and `Glide` remains frames 1-73. Existing-bone animation matrices differ by at most 4.75e-7 after export/import. Each clip contains the original 75 TRS channels plus 18 additive membrane-bone TRS channels.
- In-engine GPU-input audit: 1,080,189 vertices, zero unweighted, zero negative weights, zero normalization failures, and zero invalid joints. The membrane rig has joint indices 0-28.
- Paired captures are under `membrane-comparison/`, with corrected on the left and membrane on the right in `paired-wingUp.png`, `paired-wingDown.png`, `paired-leap.png`, and `paired-dive.png`. The capture pass reported zero console warnings/errors and zero external requests.

The visual result is restrained. The leap capture has a visibly fuller, rounder membrane contour and the upstroke has slight independent cupping. The downstroke and dive difference is subtle at gameplay scale. This reads as real skinned stretch/billow, but not as cloth simulation and not as a dramatic rig transformation.

The first 600-frame corrected/membrane timing pair is recorded in `membrane-controlled-ab.json`: corrected p95/p99 10.3/25.3 ms and membrane 10.2/17.2 ms. It is not accepted as performance proof because one-minute load was already about 19-22 on 18 cores and subsequently exceeded 200 due unrelated CPU jobs. The p95 result is effectively tied; p99 must be retaken in a stable load window.
