import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

// Import the shipped browser modules without a bundler or a second Three build.
const asModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const threeUrl = asModule(await readFile(new URL('../../vendor/three.module.js', import.meta.url), 'utf8'));
const mapUrl = asModule(await readFile(new URL('../../world-expansion/modules/worldMap.js', import.meta.url), 'utf8'));
const THREE = await import(threeUrl), MAP = await import(mapUrl);
const source = (await readFile(new URL('../../world-expansion/modules/mountainTerrain.js', import.meta.url), 'utf8'))
  .replace("from 'three'", `from '${threeUrl}'`).replace("from './worldMap.js'", `from '${mapUrl}'`);
const { createMountainTerrain, sampleMountainHeight, mountainOccludesSegment } = await import(asModule(source));
// Open water must stay below zero: the flight code uses negative terrain to
// distinguish sea skimming from ground contact and terrain-graze rewards.
assert.equal(sampleMountainHeight(0, -600), -10);
assert.equal(sampleMountainHeight(99999, 99999), -10);
assert.equal(sampleMountainHeight(NaN, 0), -10);
const scene = new THREE.Scene(), terrain = createMountainTerrain(scene), camera = new THREE.PerspectiveCamera();
scene.updateMatrixWorld(true);
const canonicalMeshes = terrain.group.children.map(lod => lod.levels[0].object);
const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
let heightSamples = 0, maxHeightError = 0, occlusionSamples = 0, routeSamples = 0;
const stableHeights = [];
for (let i = 0; i < MAP.MOUNTAINS.length; i++) {
  const [x, z, r, h] = MAP.MOUNTAINS[i], mesh = terrain.group.children[i].levels[0].object;
  for (let j = 0; j < 36; j++) {
    const a = j * 2.399963229728653, d = r * (.1 + .76 * ((j * 17 % 37) / 37));
    const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, height = sampleMountainHeight(px, pz);
    ray.set(new THREE.Vector3(px, 1500, pz), down); ray.far = Infinity;
    const hit = ray.intersectObjects(canonicalMeshes, false)[0]; assert.ok(hit, `missing mesh at mountain ${i}`);
    maxHeightError = Math.max(maxHeightError, Math.abs(hit.point.y - height)); heightSamples++;
    assert.ok(Math.abs(hit.point.y - height) < .0001, `mesh/physics mismatch: ${hit.point.y} vs ${height}`);
    stableHeights.push([px, pz, height]);
    assert.equal(mountainOccludesSegment(new THREE.Vector3(px, height + 5, pz), new THREE.Vector3(px, height - .001, pz)), true);
    assert.equal(mountainOccludesSegment(new THREE.Vector3(px, height + 5, pz), new THREE.Vector3(px, height + .001, pz)), false);
    occlusionSamples += 2;
  }
  for (let j = 0; j < 18; j++) {
    const angle = j * .3490658504, height = h * (.14 + .7 * ((j * 7 % 19) / 19));
    const from = new THREE.Vector3(x - Math.cos(angle) * r * 1.2, height, z - Math.sin(angle) * r * 1.2);
    const to = new THREE.Vector3(x + Math.cos(angle) * r * 1.2, height, z + Math.sin(angle) * r * 1.2);
    ray.set(from, to.clone().sub(from).normalize()); ray.far = from.distanceTo(to);
    const startsInside = sampleMountainHeight(from.x, from.z) >= from.y;
    assert.equal(mountainOccludesSegment(from, to), startsInside || ray.intersectObjects(canonicalMeshes, false).length > 0, `occlusion mismatch at mountain ${i}/${j}`);
    occlusionSamples++;
  }
}
// The authored tutorial, beacon legs and canyon centres must remain free of new mountains.
for (const route of [MAP.TUTORIAL, MAP.ROUTE, MAP.CANYON.map(([x, z]) => [x, 50, z])]) {
  for (let i = 1; i < route.length; i++) for (let j = 0; j <= 50; j++) {
    const a = route[i - 1], b = route[i], t = j / 50;
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
    assert.ok(sampleMountainHeight(x, z) < y - 8, `new terrain blocks authored leg at ${x},${z}`); routeSamples++;
  }
}
const profiles = {};
camera.position.set(MAP.DEN.x, 70, MAP.DEN.z); camera.updateMatrixWorld(true);
for (const quality of ['low', 'med', 'high', 'extra-high', 'extreme']) {
  terrain.setQuality(quality);
  for (const lod of terrain.group.children) lod.update(camera);
  for (const [x, z, height] of stableHeights) assert.equal(sampleMountainHeight(x, z), height);
  profiles[quality] = terrain.getStats();
  scene.traverse(object => { if (object.isMesh) { assert.equal(object.castShadow, false); assert.equal(object.receiveShadow, false); } });
}
const triangles = Object.values(profiles).map(profile => profile.visibleTriangles);
assert.ok(triangles[0] < triangles[4]);
for (let i = 1; i < triangles.length; i++) assert.ok(triangles[i] >= triangles[i - 1]);
terrain.setQuality('low');
for (let i = 0; i < MAP.MOUNTAINS.length; i++) {
  const [x, z] = MAP.MOUNTAINS[i];
  camera.position.set(x, sampleMountainHeight(x, z) + 12, z); camera.updateMatrixWorld(true);
  const lod = terrain.group.children[i]; lod.update(camera);
  assert.equal(lod.getCurrentLevel(), 0, `summit close-pass must use canonical mesh on Low (${i})`);
}
terrain.dispose(); assert.equal(scene.children.length, 0);
const result = { passed: true, heightSamples, maxHeightError, occlusionSamples, routeSamples, profiles, limitations: 'Numerical geometry, collision and LOD verification; no hardware frame-rate claim.' };
await writeFile(new URL('terrain-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
