# Galevein silhouette variants — baked pass

## Commercial and legal boundary

This work reduces overlap with recognizable design traits. It is not legal clearance and
does not establish that any legal threshold has been met. A qualified reviewer should
assess any candidate before commercial release.

## Baked export result

The permanent morph targets have been removed. Each displacement is now baked into base
`POSITION`; custom imported normals are cleared so geometric normals are recomputed, and
`POSITION`, `NORMAL`, `TEXCOORD_0`, `JOINTS_0`, and `WEIGHTS_0` are jointly re-encoded
through Blender's Draco encoder.

Matched explicit settings are compression level 6, position 14 bits, normal 10 bits,
texcoord 12 bits, color 10 bits, and generic attributes 12 bits. The six files are
14.31–14.49 MiB each instead of roughly 29 MiB. Every output has zero morph targets and
no mesh-level morph weights.

All six files pass:

- 1,080,189 vertices, 1,242,070 edges, 468,563 polygons, and 1,405,689 loops.
- All five required primitive attributes contain 1,080,189 entries.
- Zero unweighted vertices, negative weights, invalid joints, or vertices above four
  influences; all sums are within the 1e-3 runtime tolerance.
- `Flap` remains frames 1–39 and `Glide` remains frames 1–73.
- Corrected/membrane geometry correspondence was solved spatially before baking:
  mean nearest-source error 2.24e-7, p95 4.17e-7, maximum 5.40e-7 world units.

Draco surface shift was measured rather than assumed. Across the six files, sampled
nearest-surface displacement is:

- Mean: 2.96e-5 to 3.08e-5 world units.
- p95: 4.26e-5 to 4.42e-5 world units.
- Maximum: 5.26e-5 to 5.47e-5 world units.

Body length is 0.899995 world units, so the worst measured Draco shift is about 0.0061%
of body length. It is measurable but negligible relative to the sculpt displacement.
Full evidence is in `build-report.json`.

## Regional displacement

Values below are `mean / maximum` displacement, followed by `mean / maximum` as a
percentage of the 0.899995-unit body length.

### Stormcrest

- Head: 0.03384 / 0.10091 units; 3.76% / 11.21%.
- Snout: 0.06685 / 0.10091 units; 7.43% / 11.21%.
- Ear-fins/crest: 0.03376 / 0.10091 units; 3.75% / 11.21%.
- Neck: 0.00777 / 0.08345 units; 0.86% / 9.27%.
- Torso: 0.00520 / 0.02494 units; 0.58% / 2.77%.
- Limbs and wings: 0.00098 / 0.02058 units; 0.11% / 2.29%.
- Tail: 0.02584 / 0.20900 units; 2.87% / 23.22%.

### Voltspine

- Head: 0.02539 / 0.13058 units; 2.82% / 14.51%.
- Snout: 0.04496 / 0.13058 units; 5.00% / 14.51%.
- Ear-fins/crest: 0.04011 / 0.13058 units; 4.46% / 14.51%.
- Neck: 0.00866 / 0.04881 units; 0.96% / 5.42%.
- Torso: 0.00754 / 0.03454 units; 0.84% / 3.84%.
- Limbs and wings: 0.00171 / 0.02850 units; 0.19% / 3.17%.
- Tail: 0.02533 / 0.23459 units; 2.81% / 26.07%.

### Thunderhook

- Head: 0.03390 / 0.10175 units; 3.77% / 11.31%.
- Snout: 0.06574 / 0.10175 units; 7.30% / 11.31%.
- Ear-fins/crest: 0.03077 / 0.06763 units; 3.42% / 7.51%.
- Neck: 0.00845 / 0.08239 units; 0.94% / 9.15%.
- Torso: 0.00391 / 0.02041 units; 0.43% / 2.27%.
- Limbs and wings: 0.00063 / 0.01266 units; 0.07% / 1.41%.
- Tail: 0.02615 / 0.15483 units; 2.91% / 17.20%.

The owner's 2–3% working threshold is reasonable for broad silhouette regions. The
snout, crest, and localized tail extrema clear it. Neck, torso, limbs, and nearly the
entire wing planform do not. This explains both observations: the variants are visibly
different in properly framed side and top views, while the previous renders hid those
differences and the overall creature still shares most of its body language.

## Silhouette evidence and tail diagnosis

Flat, unshaded comparisons against the base are:

- `silhouettes/side-comparison.png`
- `silhouettes/threequarter-comparison.png`
- `silhouettes/top-comparison.png`

The frayed terminal tail geometry is already present in the unmodified base; the base
side and three-quarter silhouettes show it directly. No connectivity is torn and topology
counts are unchanged. The displacement does reshape and sometimes exaggerate those fins.
Tail-edge maximum stretch is 3.88× for Stormcrest, 5.19× for Voltspine, and 2.61× for
Thunderhook. Voltspine's long vertical fork is therefore an intentional but severe local
stretch, not newly disconnected geometry; it remains the highest pinching/shading risk.

## Runtime and deformation

The baked files were reloaded in-engine with cache disabled. All six GPU-input weight
audits pass. Thirty fresh baked captures under `in-engine-baked/` cover rest, wing-up,
wing-down, leap, and dive for corrected and membrane forms. The capture report records
zero console warnings/errors, zero external requests, and zero requests to the old
`audio/` directory.

The clean visible-tab representative performance sample used baked Stormcrest corrected
as the warm-up and measured its membrane counterpart immediately afterward:

- Stormcrest membrane: p50 8.3 ms, p95 9.3 ms, p99 9.4 ms over 900 frames.
- Load average before: 11.34 / 16.54 / 32.44.
- Load average after: 11.16 / 16.42 / 32.30.

The first shader-warm-up sample in that same visible window measured p95 16.8 ms; the
next sample fell to 9.3 ms at effectively unchanged load. The old 16.8-vs-9.1 variant gap
was not a credible geometry effect.

## Blunt assessment

The prior renders were defective evidence: they were cropped, overexposed, and lacked a
base reference. The corrected silhouettes show real differences. Voltspine and Stormcrest
materially change the head and tail; Thunderhook changes the side profile.

That does not mean this route produces a genuinely new overall creature design. The
top-down comparison is dominated by the unchanged wing planform, shoulder placement,
limb attachment, torso proportions, and appendage roots. Eye placement, facial topology,
surface language, and wing-finger structure also remain fixed.

Plain conclusion: vertex movement can reduce a few high-value recognizable traits, but
it cannot confidently turn this asset into an independently designed commercial hero
creature. None of these variants should be represented as sufficient on its own. If the
owner needs strong commercial confidence, commissioning or sourcing a genuinely different
mesh is the defensible route. Of these limited-risk-reduction options, Voltspine is the
most visibly different but also has the worst local tail stretching; Stormcrest is the
safer geometry compromise.

## Redundant files after selection

Nothing was deleted. Once a design is selected, the two unselected corrected/membrane
pairs become redundant (four GLBs, about 58 MiB). If membrane testing is abandoned, the
selected membrane GLB is also redundant. The old morph-era blobs no longer exist as
working-tree files because the same six paths were replaced by baked exports, but they
remain in Git history. `renders/`, `in-engine/`, and the pre-bake runtime JSON files are
historical evidence superseded by `silhouettes/`, `in-engine-baked/`, and
`runtime-baked-*.json`; they can be pruned separately after review.
