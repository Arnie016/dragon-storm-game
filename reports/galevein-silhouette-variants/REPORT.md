# Galevein silhouette variants

## Scope and legal boundary

This pass reduces overlap with recognizable creature-design traits. It is not legal
clearance, does not establish that any legal threshold has been met, and should not be
treated as a substitute for qualified review before a commercial release.

## Topology-preservation method

Blender's normal Draco export path was rejected during the build because it re-ordered
decoded vertices even though it carried positions and skin attributes together. The final
files instead retain each source GLB's existing Draco primitive byte-for-byte and append a
single default-on `POSITION` morph target containing only the sculpt displacement.

That method preserves the source vertex indices, triangle ordering, skin attributes,
skeleton, and animations exactly while moving the rendered vertices before skinning.
It costs file size: corrected variants are about 28.59 MB and membrane variants about
28.92 MB, versus about 16 MB for the source files. The original Draco payload is still
used unchanged by `DRACOLoader`; the added morph target is uncompressed float data.

For every one of the six files:

- Vertex count is unchanged at 1,080,189.
- Edge count is unchanged at 1,242,070.
- Polygon count is unchanged at 468,563.
- The decoded polygon-index hash matches its source.
- The base Draco payload SHA-256 matches its source byte-for-byte.
- Base per-index coordinate error is exactly 0.
- Applied morph per-index error is at most 1.74e-7, with zero mismatches above 2e-4.
- There are zero unweighted vertices, zero negative weights, zero invalid joints, zero
  vertices above four influences, and zero sums outside the 1e-3 runtime tolerance.
- `Flap` remains frames 1-39 and `Glide` remains frames 1-73.

Full machine-readable evidence is in `build-report.json`.

## Variants

### Voltspine — strongest

Queries: `?rig=voltspine` and `?rig=voltspine-membrane`

The skull is compressed into a narrow wedge, the paired head fins are pulled inward and
up into a tall storm-spine, the torso is deeper and narrower, and the terminal tail
surfaces are folded into an asymmetric vertical lightning fork. This is the strongest
silhouette departure because the head crown and tail termination both stop reading as the
source design's familiar paired-fin arrangement.

Renders: `renders/voltspine-front.png`, `renders/voltspine-side.png`,
`renders/voltspine-threequarter.png`.

### Stormcrest

Queries: `?rig=stormcrest` and `?rig=stormcrest-membrane`

The muzzle is lengthened and tapered, the brow is sharpened, the head fins are drawn
inward and swept backward into a three-point crest, the neck and chest gain depth, and
the tail fins are compressed into a raised vertical vane. It reads more heraldic and
storm-bird-like than the source, but the broad wing/body relationship is still familiar.

Renders: `renders/stormcrest-front.png`, `renders/stormcrest-side.png`,
`renders/stormcrest-threequarter.png`.

### Thunderhook — weakest

Queries: `?rig=thunderhook` and `?rig=thunderhook-membrane`

The muzzle is pulled into a longer downturned hook, the upper head fins are flattened
into swept cheek ridges, the neck is thickened, and the terminal tail is narrowed and
extended into a low needle-like profile. The head profile changes materially in side
view, but the paired appendage roots remain readable from the rear. This is the weakest
commercial-risk-reduction option of the three.

Renders: `renders/thunderhook-front.png`, `renders/thunderhook-side.png`,
`renders/thunderhook-threequarter.png`.

## Runtime and deformation checks

`verify_rig_runtime.py` was run for every corrected/membrane pair with cache disabled and
900 measured frames. All six runtime GPU-input weight audits passed. `Flap` and `Glide`
loaded for every file; membrane variants report all six membrane bones.

Thirty in-engine captures are under `in-engine/`: rest, wing-up, wing-down, leap, and
dive for both rig types of all three designs. The capture report records zero console
warnings/errors, zero external requests, and zero requests to the old `audio/` directory
for every variant. No new neck, tail, wing-root, or membrane pinching is visible at
gameplay scale in the four animated checks. The rest camera is partly occluded by level
geometry, so the consistent Blender views are the better rest-silhouette evidence.

Performance is not fully cleared. Voltspine measured p95 9.1 ms for both rigs and
Thunderhook measured p95 9.2 ms for both rigs. Stormcrest's first pair measured p95
33.4/25.0 ms and its warmed retest measured 16.8/16.8 ms while machine load averages were
roughly 100-130. This does not meet the requested approximately 10 ms threshold. The
result is confounded by severe ambient load, but it remains a failed performance check
until repeated in a stable load window.

## Limits of topology-only change

The bat-like wing planform, wing-finger count, limb attachment points, broad skeletal
proportions, eye placement, and the connectivity roots of the head and tail appendages
cannot be replaced cleanly by moving existing vertices. The ear-fin surfaces can be
folded into crests or ridges, but cannot be removed or turned into genuinely new separate
anatomy. The same is true of the tail-fin roots. Texture and surface-detail recognition
were outside this geometry-only pass.

Blunt recommendation: Voltspine is the only variant here that changes both high-value
recognition zones strongly enough to justify further review. Stormcrest is a viable
second choice. Thunderhook should not be selected if risk reduction is the main goal.
Even Voltspine should receive qualified commercial-release review.
