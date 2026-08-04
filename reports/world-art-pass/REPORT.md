# World art pass

## Result

The sea no longer uses the repeating diamond/chevron read. It now combines collision-matched macro swells, smooth analytic wave lighting, non-repeating wind glints, crest breakup, and distance haze. Existing mountains gained height-driven rock color, while the 30-instance horizon remains one draw call with a faceted ridge mass instead of a single cone profile.

The sky now has a low volumetric haze band and two-scale cloud breakup. Fog grades from 0.00058 in daylight to 0.001 at full night, with the objective rings explicitly excluded from fog. Six landmark identities use separate stone/emissive palettes, roughness, and metal response without adding geometry to the CC0 models.

Nightfall now drains warm light into violet/cyan fill, raises landmark and beacon signal intensity, increases fog late rather than immediately, and darkens the horizon masses. Medium remains the default and depth of field remains High-only.

## Paired visual evidence

All pairs use identical world positions, yaw, progression, time-of-day value, the same visible Chrome viewport, and cache-disabled navigation.

- Low altitude: `before/low-altitude.png` and `after/low-altitude.png`
- Cruise horizon: `before/cruise-horizon.png` and `after/cruise-horizon.png`
- Landmark distance: `before/landmark-distance.png` and `after/landmark-distance.png`
- Objective proof: `after/objective-visibility.png`

The final objective probe reported arrow opacity 0.9, arrow on-screen, next ring visible, and next-ring material `fog:false`.

## Performance and regression proof

`controlled-benchmark.json` is a sequential Medium-quality 600-frame pair at load average roughly 51-53:

- Original `2776d9f`: p50 16.6 ms, p95 25.7 ms, p99 50 ms.
- Candidate: p50 16.5 ms, p95 25.1 ms, p99 50 ms.

The candidate was slightly faster in that matched high-load pair. A separate 900-frame sample with 36/36 visible-and-focused checks measured p50 8.4 ms, p95 25.0 ms, p99 33.3 ms at load average 20.77 to 17.96. This is at the requested ceiling, not strictly below it; ambient machine load was far above the trusted 9.4-load baseline.

The controlled pair produced zero console warnings/errors and zero external requests. The route smoke reached score 12, chapter 5, `finishing:true`, health 100. Medium reported DOF disabled, 48,841 sea vertices, 180 horizon triangles per instance, 16 styled landmark materials, and all objective-ring materials fog-free.

## Remaining weakness

The source landmarks still have broad, low-detail surfaces and no authored texture sets. Palette separation and dusk rim/fill make them readable, but close inspection still exposes their primitive construction. The procedural ocean is materially better at low altitude and cruise height, but it is still a stylized shader surface rather than an authored coastline or erosion system.
