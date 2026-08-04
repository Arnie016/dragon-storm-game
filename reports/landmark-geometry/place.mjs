// Offline landmark placement checker.
//
// Runs the same siteProxies()/validateRouteClearance()/evaluateTerrainClearance() code
// the game runs, but without building geometry or booting a browser, so placement can be
// solved in milliseconds instead of two-minute render runs.
//
// The terrain and route are read out of index.html so this tool cannot drift from the
// world it is checking. Run it with:
//   node reports/landmark-geometry/place.mjs
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const REPO = '/Users/arnav/Desktop/dragon-storm-game';

// The game resolves 'three' through an HTML import map, which Node does not read. Point
// the bare specifier at the same vendored build the browser uses, so this tool and the
// game are provably running identical code.
register(`data:text/javascript,export function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: ${JSON.stringify(pathToFileURL(`${REPO}/vendor/three.module.js`).href)}, shortCircuit: true };
  return next(specifier, context);
}`);
const html = readFileSync(`${REPO}/index.html`, 'utf8');

// --- route ------------------------------------------------------------------------
const routeMatch = html.match(/const route=\[([\s\S]*?)\];/);
if (!routeMatch) throw new Error('could not find the beacon route in index.html');
const route = [...routeMatch[1].matchAll(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g)]
  .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);

// --- terrain masses ---------------------------------------------------------------
// Visual radii, not collider radii. Mountains are cones so their silhouette narrows with
// height; 0.9 of the base radius is a fair stand-in. Displaced rocks bulge past their
// nominal radius, hence 1.15.
const masses = [];
for (const m of html.matchAll(/\bmountain\((-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)\)/g)) {
  masses.push({ id: `mountain(${m[1]},${m[2]})`, x: Number(m[1]), z: Number(m[2]), radius: Number(m[3]) * .9 });
}
for (const m of html.matchAll(/\brock\((-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)\)/g)) {
  masses.push({ id: `rock(${m[1]},${m[2]})`, x: Number(m[1]), z: Number(m[2]), radius: Number(m[3]) * 1.15 });
}
const archipelago = html.match(/for\(const \[ix,iz,ir,ih\] of \[([\s\S]*?)\]\) rock/);
if (archipelago) {
  for (const m of archipelago[1].matchAll(/\[(-?[\d.]+),(-?[\d.]+),([\d.]+),([\d.]+)\]/g)) {
    masses.push({ id: `isle(${m[1]},${m[2]})`, x: Number(m[1]), z: Number(m[2]), radius: Number(m[3]) * 1.15 });
  }
}
// The bone arches are 46-unit tori, big enough to clip a landmark.
for (let i = 0; i < 5; i += 1) {
  masses.push({ id: `bonearch${i}`, x: -330 - i * 46, z: -410 + i * 10, radius: (46 - i * 3) * 1.1 });
}
// The Tempest Gate itself must stay clear.
masses.push({ id: 'tempest-gate', x: 0, z: 780, radius: 66 });

const { LANDMARK_SITES, siteProxies, validateRouteClearance, evaluateTerrainClearance } =
  await import(`${REPO}/world-expansion/modules/proceduralLandmarks.js`);

const collision = LANDMARK_SITES.flatMap((site) => siteProxies(site).collision);
const routeReport = validateRouteClearance(collision, route);
const terrain = evaluateTerrainClearance(LANDMARK_SITES, masses);

console.log(`route legs ${route.length}   terrain masses ${masses.length}   sites ${LANDMARK_SITES.length}`);
console.log('\n-- route clearance (collider surface to flight line, world units) --');
for (const entry of routeReport.all.slice().sort((a, b) => a.clearance - b.clearance).slice(0, 8)) {
  console.log(`  ${entry.clearance >= 26 ? 'ok  ' : 'TIGHT'} ${entry.id.padEnd(20)} ${String(entry.clearance).padStart(8)}`);
}
console.log('\n-- terrain clearance (footprint disc to terrain mass, world units) --');
for (const entry of terrain.all.slice().sort((a, b) => a.gap - b.gap)) {
  const flag = entry.gap < 0 ? 'CLIP' : entry.gap < 20 ? 'near' : 'ok  ';
  console.log(`  ${flag} ${entry.site.padEnd(16)} gap ${String(entry.gap).padStart(8)}  vs ${entry.mass.padEnd(22)} push (${entry.pushX}, ${entry.pushZ})`);
}
console.log(`\nclipping sites: ${terrain.clipping}`);

// --- solver -----------------------------------------------------------------------
// Relaxes each site out of terrain and away from the flight line while a weak spring
// holds it near where it was authored, so the composition survives the correction.
if (process.argv.includes('--solve')) {
  const TERRAIN_TARGET = 26;
  const ROUTE_TARGET = 42;

  const worstTerrainGap = (site) => {
    let worst = { gap: Infinity, x: 0, z: 0 };
    for (const disc of siteProxies(site).footprint) {
      for (const mass of masses) {
        const distance = Math.hypot(disc.x - mass.x, disc.z - mass.z) || 1e-6;
        const gap = distance - (disc.radius + mass.radius);
        if (gap < worst.gap) worst = { gap, x: (disc.x - mass.x) / distance, z: (disc.z - mass.z) / distance };
      }
    }
    return worst;
  };

  const worstRouteClearance = (site) => {
    let worst = { clearance: Infinity, x: 0, z: 0 };
    for (const proxy of siteProxies(site).collision) {
      for (let i = 0; i < route.length; i += 1) {
        const a = route[i], b = route[(i + 1) % route.length];
        const dx = b[0] - a[0], dz = b[2] - a[2];
        const lengthSq = dx * dx + dz * dz;
        const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((proxy.x - a[0]) * dx + (proxy.z - a[2]) * dz) / lengthSq)) : 0;
        const cx = a[0] + dx * t, cz = a[2] + dz * t;
        const distance = Math.hypot(proxy.x - cx, proxy.z - cz) || 1e-6;
        const clearance = distance - proxy.radius;
        if (clearance < worst.clearance) worst = { clearance, x: (proxy.x - cx) / distance, z: (proxy.z - cz) / distance };
      }
    }
    return worst;
  };

  // Relax position for one fixed yaw and starting offset.
  const relax = (site, start) => {
    const origin = [...site.position];
    let position = [...start];
    for (let step = 0; step < 500; step += 1) {
      const candidate = { ...site, position };
      const terrainWorst = worstTerrainGap(candidate);
      const routeWorst = worstRouteClearance(candidate);
      let moveX = 0, moveZ = 0;
      if (terrainWorst.gap < TERRAIN_TARGET) {
        const need = (TERRAIN_TARGET - terrainWorst.gap) * .35;
        moveX += terrainWorst.x * need; moveZ += terrainWorst.z * need;
      }
      if (routeWorst.clearance < ROUTE_TARGET) {
        const need = (ROUTE_TARGET - routeWorst.clearance) * .35;
        moveX += routeWorst.x * need; moveZ += routeWorst.z * need;
      }
      // Weak pull home, so a site that is already legal drifts back toward intent.
      moveX += (origin[0] - position[0]) * .02;
      moveZ += (origin[2] - position[2]) * .02;
      if (Math.abs(moveX) < .01 && Math.abs(moveZ) < .01) break;
      position = [position[0] + moveX, position[1], position[2] + moveZ];
    }
    return [Math.round(position[0]), position[1], Math.round(position[2])];
  };

  // Yaw is a free variable: a 320-unit arcade simply will not fit the inner archipelago
  // at an arbitrary angle, but it threads the gaps at the right one. Search yaw and a
  // few seed offsets, then keep the feasible answer closest to the authored intent.
  console.log('\n-- solved placements --');
  const solved = [];
  for (const site of LANDMARK_SITES) {
    const origin = [...site.position];
    let best = null;
    for (let turn = 0; turn < 24; turn += 1) {
      const yaw = +(site.yaw + turn * (Math.PI / 12)).toFixed(3);
      for (const seed of [[0, 0], [140, 0], [-140, 0], [0, 140], [0, -140], [120, 120], [-120, -120]]) {
        const candidateSite = { ...site, yaw };
        const position = relax(candidateSite, [origin[0] + seed[0], origin[1], origin[2] + seed[1]]);
        const placed = { ...candidateSite, position };
        const terrainWorst = worstTerrainGap(placed);
        const routeWorst = worstRouteClearance(placed);
        const feasible = terrainWorst.gap >= 8 && routeWorst.clearance >= 30;
        const moved = Math.hypot(position[0] - origin[0], position[2] - origin[2]);
        const turned = Math.min(turn, 24 - turn) * (Math.PI / 12);
        const cost = moved + turned * 90 + (feasible ? 0 : 100000);
        if (!best || cost < best.cost) best = { placed, terrainWorst, routeWorst, feasible, moved: Math.round(moved), yaw, cost };
      }
    }
    solved.push({ site, ...best });
  }
  // Joint pass. The per-site search is blind to the other sites, and left two of them
  // stacked on each other, so relax all twelve together with mutual repulsion.
  const SITE_TARGET = 40;
  let placed = solved.map((entry) => ({ ...entry.placed }));
  const homes = solved.map((entry) => [...entry.site.position]);
  for (let step = 0; step < 900; step += 1) {
    const footprints = placed.map((site) => siteProxies(site).footprint);
    let motion = 0;
    for (let i = 0; i < placed.length; i += 1) {
      const terrainWorst = worstTerrainGap(placed[i]);
      const routeWorst = worstRouteClearance(placed[i]);
      let moveX = 0, moveZ = 0;
      if (terrainWorst.gap < TERRAIN_TARGET) {
        const need = (TERRAIN_TARGET - terrainWorst.gap) * .3;
        moveX += terrainWorst.x * need; moveZ += terrainWorst.z * need;
      }
      if (routeWorst.clearance < ROUTE_TARGET) {
        const need = (ROUTE_TARGET - routeWorst.clearance) * .3;
        moveX += routeWorst.x * need; moveZ += routeWorst.z * need;
      }
      for (let j = 0; j < placed.length; j += 1) {
        if (i === j) continue;
        for (const mine of footprints[i]) {
          for (const theirs of footprints[j]) {
            const distance = Math.hypot(mine.x - theirs.x, mine.z - theirs.z) || 1e-6;
            const gap = distance - (mine.radius + theirs.radius);
            if (gap >= SITE_TARGET) continue;
            const need = (SITE_TARGET - gap) * .16;
            moveX += (mine.x - theirs.x) / distance * need;
            moveZ += (mine.z - theirs.z) / distance * need;
          }
        }
      }
      moveX += (homes[i][0] - placed[i].position[0]) * .018;
      moveZ += (homes[i][2] - placed[i].position[2]) * .018;
      placed[i] = { ...placed[i], position: [placed[i].position[0] + moveX, placed[i].position[1], placed[i].position[2] + moveZ] };
      motion += Math.abs(moveX) + Math.abs(moveZ);
    }
    if (motion < .02) break;
  }
  placed = placed.map((site) => ({ ...site, position: [Math.round(site.position[0]), site.position[1], Math.round(site.position[2])] }));

  const footprints = placed.map((site) => siteProxies(site).footprint);
  console.log('\n-- joint solution --');
  let allOk = true;
  for (let i = 0; i < placed.length; i += 1) {
    const terrainWorst = worstTerrainGap(placed[i]);
    const routeWorst = worstRouteClearance(placed[i]);
    let siteGap = Infinity;
    for (let j = 0; j < placed.length; j += 1) {
      if (i === j) continue;
      for (const mine of footprints[i]) for (const theirs of footprints[j]) {
        siteGap = Math.min(siteGap, Math.hypot(mine.x - theirs.x, mine.z - theirs.z) - (mine.radius + theirs.radius));
      }
    }
    const ok = terrainWorst.gap >= 0 && routeWorst.clearance >= 20 && siteGap >= 0;
    if (!ok) allOk = false;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${placed[i].id.padEnd(16)} terrain ${terrainWorst.gap.toFixed(1).padStart(7)}  route ${routeWorst.clearance.toFixed(1).padStart(7)}  neighbour ${siteGap.toFixed(1).padStart(7)}  moved ${Math.round(Math.hypot(placed[i].position[0] - homes[i][0], placed[i].position[2] - homes[i][2]))}`);
  }
  console.log(`\nall constraints satisfied: ${allOk}`);
  console.log('\n-- paste-ready --');
  for (const site of placed) {
    // Normalise yaw into (-PI, PI] so the site table stays readable.
    let yaw = site.yaw % (Math.PI * 2);
    if (yaw > Math.PI) yaw -= Math.PI * 2;
    if (yaw <= -Math.PI) yaw += Math.PI * 2;
    console.log(`  position: [${site.position[0]}, ${site.position[1]}, ${site.position[2]}], yaw: ${+yaw.toFixed(3)},   // ${site.id}`);
  }
}
