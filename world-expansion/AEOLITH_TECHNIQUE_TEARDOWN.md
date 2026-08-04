# Aeolith technique teardown

## Portable technique set

Aeolith achieves scale with a layered, bounded scene rather than a single expensive terrain mesh.

- `megaLandscape.js` builds eight ground masses and five floating masses from seeded rings: 30 radial segments, seven top rings, flat-shaded vertex colors, and terrain-sampled buried toes. It hard-caps the layer at seven draw calls and 45,000 triangles; the reported implementation is 17,436 triangles.
- The same module builds three monumental arches as one merged mesh, seven animated rings and 28 fins as instanced meshes, a `620 x 220`, `84 x 30` shader sea, and 920 horizon-dust points. This yields silhouette diversity before fine detail.
- Horizon atmosphere is not a wall of fog. The dust field uses normal blending, `depthWrite: false`, point size clamped to 1–8.5 pixels, and fades over roughly 75–520 view-space units. Its main fog is `FogExp2`; objects remain legible because the horizon has geometry, sea variation, and dust layers.
- `livingStormVillage.js` makes a route destination read at speed through a clustered silhouette: 18 buildings, three approach arches, one tall storm loom, seven signal needles, instanced traffic, and 640 weather points. It budgets the feature at eight draws / 35,000 triangles rather than scattering unrelated props.
- Terrain contact matters. Ground assets use buried foundations and terrain sampling; soft contact-shadow planes and terrain-normal orientation avoid floating props.
- `speedCameraRig.js` is a bounded second-order spring camera. Speed, acceleration, boost, tailwind, draft, and slingshot drive pullback (max 17 m), vertical drop (max 3.2 m), look-ahead, and FOV. The tuned targets are `speedLoad*7.2 + accelerationLoad*4.6 + boost*3.8` for pullback and `speedLoad*10 + accelerationLoad*4 + boost*6` for FOV. It avoids snapback by retaining spring velocity under braking.
- Camera obstruction is tested against compact circle/ellipse proxies, not render triangles. The resolver tries shoulder shifts, elevation, and craft-side escape. This keeps the camera usable without making decorative far geometry authoritative.
- The reference renderer runs ACES filmic tone mapping, exposure 1.02, sRGB output, pixel-ratio limits, soft shadows, and an initial fog density of 0.0072. Dragon Storm already uses ACES; its current `0.0030` fog is less dense but its sky/sea need horizon content to stop looking empty.

## Direct portability to Dragon Storm

The game already uses a module import map for `three`, a 6,000-unit far plane, `FogExp2`, a camera-following sky dome, a procedural sea, a configured `GLTFLoader`/`DRACOLoader`, and a manual render loop. No bundler is required.

1. Add the standalone modules under `world-expansion/modules/` through native browser imports.
2. Keep the existing procedural mountains and islands as collision authority. The new horizon and landmark meshes start `visualOnly`; add proxies only after route testing.
3. Run the horizon layer at 30 instanced masses / one draw. Its camera far plane is 9,000 and its recommended fog density is 0.00082, but the existing sea shader copies fog density into its own uniform, so its uniform must be refreshed during time-of-day updates.
4. Use the DOF pipeline only on High graphics. It performs a color render plus depth render plus fullscreen composite; Low/Med should call normal `renderer.render`.
5. Place landmarks along the existing beacon chain, not randomly: current route coordinates already progress from home waters through the drowned village and bone arches to the hidden cove.

## Non-portable parts

Aeolith's Vite build, its 47 modules, its custom terrain API, and its existing `three` package resolution do not transfer. The Dragon Storm modules deliberately use only the existing import-map identifier and no external post-processing package. Its GLB assets also cannot be assumed commercial merely because they are present locally.

## Integration order

1. Wire `HorizonDirector`; validate distant sea/sky and fog at daytime and night.
2. Wire `LandmarkPath` with procedural fallbacks; verify every beacon segment remains flyable.
3. Wire `CinematicDofPipeline` behind the existing High graphics control; profile GPU time before enabling by default.
4. Replace only cleared fallback landmark templates with converted assets.
