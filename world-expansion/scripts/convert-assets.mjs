#!/usr/bin/env node
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const jobs = [
  ['portal_arch_draco.glb', '/Users/arnav/Desktop/FAB ASSETS/03_Fantasy_Creatures_Props/modular_portal_arch.glb'],
  ['scene_landmarks_draco.glb', '/Users/arnav/Desktop/FAB ASSETS/04_Environment_Building_Kits/fable-scene-landmarks.glb'],
  ['airfield_props_draco.glb', '/Users/arnav/Desktop/FAB ASSETS/04_Environment_Building_Kits/fable-airfield-props.glb'],
  ['wind_ribbon_draco.glb', '/Users/arnav/Desktop/FAB ASSETS/06_VFX_Interaction/wind-ribbon-vfx.glb']
];
const output = resolve(root, 'assets');
mkdirSync(output, { recursive: true });
const report = [];
for (const [name, source] of jobs) {
  if (!existsSync(source)) throw new Error(`Missing source: ${source}`);
  const target = resolve(output, name);
  mkdirSync(dirname(target), { recursive: true });
  const result = spawnSync('npx', ['--yes', '@gltf-transform/cli', 'optimize', source, target, '--compress', 'draco', '--texture-compress', 'webp'], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  report.push({ output: name, source, beforeBytes: statSync(source).size, afterBytes: statSync(target).size });
}
console.log(JSON.stringify({ target: 'draco+webp', report }, null, 2));
