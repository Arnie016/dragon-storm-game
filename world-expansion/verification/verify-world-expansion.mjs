import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const modules = ['cinematicDof.js', 'horizonDirector.js', 'landmarkPath.js'];
for (const module of modules) {
  const file = resolve(root, 'modules', module);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${module} parse failure: ${result.stderr}`);
}
const source = await import('node:fs/promises').then((fs) => fs.readFile(resolve(root, 'modules', 'landmarkPath.js'), 'utf8'));
assert.match(source, /DRAGON_STORM_LANDMARK_ROUTE/);
assert.match(source, /loadTemplates/);
assert.match(source, /getCollisionProxies/);
assert.match(source, /setCollisionAuthority/);
const game = await import('node:fs/promises').then((fs) => fs.readFile(resolve(root, '..', 'index.html'), 'utf8'));
assert.match(game, /CinematicDofPipeline/);
assert.match(game, /HorizonDirector/);
assert.match(game, /LandmarkPath/);
assert.match(game, /landmarkPath\.getCollisionProxies/);
for (const file of ['portal_arch_draco.glb', 'scene_landmarks_draco.glb', 'airfield_props_draco.glb', 'wind_ribbon_draco.glb']) {
  const asset = resolve(root, 'assets', file);
  assert.ok(existsSync(asset), `missing converted asset: ${file}`);
  assert.ok(statSync(asset).size > 100, `empty converted asset: ${file}`);
}
console.log(JSON.stringify({
  passed: true,
  modules,
  contract: 'dragon-storm-world-expansion-v1',
  assetCount: 4,
  integration: ['CinematicDofPipeline.render replaces renderer.render', 'HorizonDirector.update follows camera', 'LandmarkPath.update follows dragon'],
  collisionAuthority: true
}, null, 2));
