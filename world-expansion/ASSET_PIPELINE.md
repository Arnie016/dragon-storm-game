# Web asset pipeline

## Budget

Target added payload: **under 8 MB compressed total**, with **under 2 MB** required for the first playable world route. The initial converted batch is 48,380 bytes total, down from 751,640 bytes. This is technically cheap, but is quarantined from commercial release pending license proof.

| Asset | Before | After | Change | Intended role |
|---|---:|---:|---:|---|
| `modular_portal_arch.glb` | 172,304 B | 16,856 B | -90.2% | Route gate |
| `fable-scene-landmarks.glb` | 337,304 B | 16,724 B | -95.0% | Distant spire |
| `fable-airfield-props.glb` | 220,240 B | 10,576 B | -95.2% | Harbor landmark |
| `wind-ribbon-vfx.glb` | 21,792 B | 4,224 B | -80.6% | Wind effect |

## Repeatable command

```sh
node world-expansion/scripts/convert-assets.mjs
node world-expansion/verification/verify-world-expansion.mjs
```

The script invokes `@gltf-transform/cli optimize` with Draco mesh compression and WebP texture conversion. It writes only under `world-expansion/assets/`; it never writes to the source library.

## Quality rules

- Hero landmarks: target 5,000–20,000 triangles after simplification; one 1024 px texture set maximum.
- Mid-distance landmark: target 1,000–5,000 triangles; 512 px texture maximum.
- Horizon/instanced dressing: target 200–1,500 triangles; no unique textures where vertex color is sufficient.
- Do not use the converted asset until it is visually inspected in browser with DRACO enabled. Conversion success proves container conversion, not art quality.
- Keep runtime meshes visual-only initially. Add compact `x/z/radius/top` proxies only after the intended flight route is tested.
- Keep raw source paths, file sizes, hashes, original listing metadata, and final output hashes in the provenance record before release.

## Explicit limitations

This batch was optimized from small local GLBs and contains no evidence that generated assets have acceptable silhouette, animation, textures, or commercial rights. The unusually large reductions require visual inspection before use; they are not automatically an improvement.
