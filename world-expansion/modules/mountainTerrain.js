import * as THREE from 'three';
import { MOUNTAINS } from './worldMap.js';

// Physics always samples the same 40-cell triangulation. Graphics settings only
// change the distance at which its 20/10-cell visual approximations are shown.
const CELLS = 40;
const LOD_DISTANCES = Object.freeze({
  low: [360, 820], med: [480, 1100], high: [700, 1550],
  'extra-high': [1050, 2150], extreme: [1550, 3000]
});
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (x, z) => { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); };
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), tx = smooth(0, 1, x - ix), tz = smooth(0, 1, z - iz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}
function rawHeight(m, dx, dz) {
  const radial = Math.hypot(dx, dz) / m.r;
  if (radial >= 1) return -3;
  const u = (dx * m.cos + dz * m.sin) / m.r;
  const v = (-dx * m.sin + dz * m.cos) / m.r;
  const envelope = Math.pow(1 - radial * radial, 1.23);
  const spine = Math.exp(-Math.abs(v + .15 * Math.sin(u * 5 + m.seed)) * 6.2);
  const peaks = .62 + .38 * Math.pow(Math.sin(u * 4.2 + m.seed), 2);
  let ridges = 0, amplitude = .5, frequency = 3.2;
  for (let octave = 0; octave < 3; octave++) {
    ridges += amplitude * (1 - Math.abs(noise(u * frequency + m.seed, v * frequency + 7.3) * 2 - 1));
    frequency *= 2.13; amplitude *= .5;
  }
  return m.h * envelope * (.47 + .40 * spine * peaks + .25 * ridges) - 3;
}
const mountains = MOUNTAINS.map(([x, z, r, h], i) => {
  const angle = i * 2.399963229728653, seed = i * 3.17 + 1.8;
  const m = { x, z, r, h, seed, cos: Math.cos(angle), sin: Math.sin(angle), step: 2 * r / CELLS, heights: new Float32Array((CELLS + 1) ** 2) };
  for (let iz = 0; iz <= CELLS; iz++) for (let ix = 0; ix <= CELLS; ix++)
    m.heights[iz * (CELLS + 1) + ix] = rawHeight(m, -r + ix * m.step, -r + iz * m.step);
  return m;
});

function sampleOne(m, x, z) {
  const gx = (x - m.x + m.r) / m.step, gz = (z - m.z + m.r) / m.step;
  if (gx < 0 || gz < 0 || gx > CELLS || gz > CELLS) return -3;
  const ix = Math.min(CELLS - 1, Math.floor(gx)), iz = Math.min(CELLS - 1, Math.floor(gz));
  const tx = gx - ix, tz = gz - iz, a = iz * (CELLS + 1) + ix;
  const ha = m.heights[a], hb = m.heights[a + 1], hd = m.heights[a + CELLS + 1], hc = m.heights[a + CELLS + 2];
  return tx + tz <= 1 ? ha + (hb - ha) * tx + (hd - ha) * tz : hc + (hd - hc) * (1 - tx) + (hb - hc) * (1 - tz);
}

/** World height, including negative seabed; invariant across quality settings. */
export function sampleMountainHeight(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return -10;
  let height = -10;
  for (const m of mountains) {
    if (Math.abs(x - m.x) <= m.r && Math.abs(z - m.z) <= m.r) height = Math.max(height, sampleOne(m, x, z));
  }
  return height;
}

/** Exact segment test against each canonical triangle's linear height function. */
export function mountainOccludesSegment(from, to, clearance = 0) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  for (const m of mountains) {
    let lo = 0, hi = 1;
    for (const [origin, direction, center] of [[from.x, dx, m.x], [from.z, dz, m.z]]) {
      if (Math.abs(direction) < 1e-12) { if (origin < center - m.r || origin > center + m.r) { hi = -1; break; } }
      else { const a = (center - m.r - origin) / direction, b = (center + m.r - origin) / direction; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); }
    }
    if (hi < lo) continue;
    const cuts = [lo, hi];
    // Grid edges and cell diagonals divide the segment into planar intervals.
    const addCuts = (origin, direction, start, count) => {
      if (Math.abs(direction) < 1e-12) return;
      for (let k = 0; k <= count; k++) { const t = (start + k * m.step - origin) / direction; if (t > lo && t < hi) cuts.push(t); }
    };
    addCuts(from.x, dx, m.x - m.r, CELLS);
    addCuts(from.z, dz, m.z - m.r, CELLS);
    addCuts(from.x + from.z, dx + dz, m.x + m.z - 2 * m.r, 2 * CELLS);
    cuts.sort((a, b) => a - b);
    for (const t of cuts) {
      const h = sampleOne(m, from.x + dx * t, from.z + dz * t);
      if (h > 0 && from.y + dy * t <= h + clearance) return true;
    }
  }
  return false;
}

function terrainGeometry(m, cells) {
  const stride = CELLS / cells, size = cells + 1, positions = [], colors = [], indices = [];
  const rock = new THREE.Color(), moss = new THREE.Color(0x4b5943), snow = new THREE.Color(0xc1cccf);
  for (let z = 0; z <= cells; z++) for (let x = 0; x <= cells; x++) {
    const ix = x * stride, iz = z * stride, y = m.heights[iz * (CELLS + 1) + ix];
    const px = -m.r + ix * m.step, pz = -m.r + iz * m.step;
    positions.push(px, y, pz);
    const left = m.heights[iz * (CELLS + 1) + Math.max(0, ix - 1)], right = m.heights[iz * (CELLS + 1) + Math.min(CELLS, ix + 1)];
    const near = m.heights[Math.max(0, iz - 1) * (CELLS + 1) + ix], far = m.heights[Math.min(CELLS, iz + 1) * (CELLS + 1) + ix];
    const slope = Math.hypot(right - left, far - near) / (2 * m.step);
    const variation = noise(px * .027 + m.seed, pz * .027) * .10;
    rock.setRGB(.25 + variation, .28 + variation, .30 + variation);
    rock.lerp(moss, (1 - smooth(.14, .42, y / m.h)) * (1 - smooth(.7, 2.4, slope)) * .78);
    const snowLine = .61 + .06 * noise(px * .015, pz * .015 + m.seed);
    rock.lerp(snow, smooth(snowLine, snowLine + .22, y / m.h) * (1 - smooth(.7, 2.5, slope)));
    colors.push(rock.r, rock.g, rock.b);
  }
  for (let z = 0; z < cells; z++) for (let x = 0; x < cells; x++) {
    const a = z * size + x, b = a + 1, d = a + size, c = d + 1;
    indices.push(a, d, b, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

export function createMountainTerrain(scene, { quality = 'high' } = {}) {
  const group = new THREE.Group(); group.name = 'Fjord mountain terrain';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: .02, flatShading: true });
  const lods = mountains.map((m, mountainIndex) => {
    const canonicalGeometry = terrainGeometry(m, 40);
    const bounds = canonicalGeometry.boundingSphere;
    const lod = new THREE.LOD(); lod.name = `Fjord mountain ${mountainIndex + 1}`;
    lod.position.set(m.x + bounds.center.x, bounds.center.y, m.z + bounds.center.z);
    lod.userData.terrainRadius = bounds.radius;
    for (const cells of [40, 20, 10]) {
      const mesh = new THREE.Mesh(cells === 40 ? canonicalGeometry : terrainGeometry(m, cells), material);
      // LOD distance is measured from the mountain's bounds, not its sea-level
      // origin. Close passes at the summit therefore keep the collision mesh.
      mesh.position.copy(bounds.center).multiplyScalar(-1);
      mesh.name = `${lod.name} / ${cells} cells`; mesh.castShadow = false; mesh.receiveShadow = false;
      mesh.userData.terrainCells = cells; mesh.userData.mountainIndex = mountainIndex;
      lod.addLevel(mesh, cells === 40 ? 0 : cells === 20 ? 700 : 1550, .12);
    }
    group.add(lod); return lod;
  });
  scene.add(group);
  let currentQuality;
  const controller = {
    group,
    setQuality(value) {
      const normalized = value === 'extra' ? 'extra-high' : value === 'medium' ? 'med' : value;
      currentQuality = Object.hasOwn(LOD_DISTANCES, normalized) ? normalized : 'high';
      const distances = LOD_DISTANCES[currentQuality];
      for (const lod of lods) {
        lod.levels[1].distance = distances[0] + lod.userData.terrainRadius;
        lod.levels[2].distance = distances[1] + lod.userData.terrainRadius;
      }
      return currentQuality;
    },
    getStats() {
      const levels = [0, 0, 0]; let visibleTriangles = 0;
      for (const lod of lods) { const level = lod.getCurrentLevel(); levels[level]++; visibleTriangles += lod.levels[level].object.geometry.index.count / 3; }
      return { quality: currentQuality, mountains: mountains.length, canonicalCells: CELLS, levels, visibleTriangles, shadowCasters: 0, residentTriangles: mountains.length * (3200 + 800 + 200) };
    },
    dispose() { scene.remove(group); for (const lod of lods) for (const level of lod.levels) level.object.geometry.dispose(); material.dispose(); }
  };
  controller.setQuality(quality);
  return controller;
}
