// Paired screenshot capture at fixed viewpoints.
//
// The original 2bc643e camera positions were never recorded, so instead of guessing at
// them this script re-derives the same three named framings (landmark distance, cruise
// horizon, low altitude) plus close-pass views, and runs the identical script against
// both the 2bc643e mirror and the working tree. Only the geometry differs between the
// two sets.
//
// The dragon is re-pinned every simulated tick because tick() integrates velocity
// unconditionally; a single teleport would drift before the camera spring settles.
import { Browser, loadSnapshot, serve, sleep, writeJson } from './harness.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, all) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]]);
  return pairs;
}, []));

const yawTo = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[1] - from[2]));

// look is [x, z] of what the camera should face. day 0.36 is the dusk value the earlier
// art-pass shots were taken at.
// Close-pass views are broadside to each structure's long axis, because viewing a gate or
// a viaduct end-on just puts a pier in front of the lens.
//
// Altitude is not free to pick. The chase camera sits 27 behind and 14 above the dragon
// and aims at it, so its axis runs ~29 degrees below horizontal; anything at the
// dragon's own height lands far above the top of the frame. Each `pos` height is
// therefore solved as (structure top) + 0.15 * (camera distance) - 14, which puts the
// roofline just under the horizon and leaves the dusk sky in shot. Structure tops come
// from SIM.landmarkBounds().
const VIEWS = [
  { name: 'landmark-distance', pos: [180, 150, 480], look: [361, -116], day: .36 },
  { name: 'cruise-horizon', pos: [250, 270, 210], look: [545, -505], day: .36 },
  { name: 'low-altitude', pos: [545, 24, -80], look: [545, -305], day: .36 },
  { name: 'mid-arcade', pos: [180, 150, -30], look: [-82, -292], day: .36 },
  { name: 'close-seagate', pos: [6, 173, 434], look: [128, 263], day: .36 },
  { name: 'close-viaduct', pos: [689, 167, -769], look: [612, -552], day: .36 },
  { name: 'close-beacon', pos: [-199, 241, -782], look: [-155, -587], day: .36 },
  { name: 'close-harbor', pos: [-336, 143, -379], look: [-525, -216], day: .36 },
  { name: 'close-ribhall', pos: [-347, 157, 687], look: [-504, 519], day: .36 },
  { name: 'night-silhouette', pos: [250, 270, 210], look: [545, -505], day: .92 },
  { name: 'objective-visibility', pos: [0, 80, 420], look: [0, 200], day: .36 }
];

async function main() {
  const root = args.root;
  const outDir = args.outDir;
  const port = Number(args.port || 8851);
  if (!root || !outDir) throw new Error('usage: --root <dir> --outDir <dir> [--port n]');

  const server = await serve(root, port);
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const captured = [];
  try {
    await browser.instrument();
    await browser.openGame(`http://127.0.0.1:${port}/index.html`, { quality: args.quality || 'med' });
    const cdp = browser.cdp;
    // benchmarkStart suppresses gusts, lightning and rogue waves so the framings are
    // reproducible rather than depending on random weather.
    await cdp.eval('SIM.start(); SIM.benchmarkStart(); SIM.key("KeyW", false); SIM.key("ArrowDown", false);');
    await sleep(400);

    // --only lets a single framing be re-shot while iterating, instead of paying two
    // minutes for all eleven.
    const only = args.only ? new Set(args.only.split(',')) : null;
    for (const view of VIEWS.filter((v) => !only || only.has(v.name))) {
      const yaw = yawTo(view.pos, view.look);
      const pin = `SIM.teleport(${view.pos.join(',')}, ${yaw}); SIM.day(${view.day});`;
      await cdp.eval(`
        for (let i = 0; i < 60; i += 1) { ${pin} SIM.warp(1 / 60, 1); }
        ${pin} SIM.warp(1 / 60, 1);
      `);
      await sleep(500);
      const path = `${outDir}/${view.name}.png`;
      await browser.screenshot(path);
      captured.push({
        name: view.name,
        pos: view.pos,
        look: view.look,
        yaw: +yaw.toFixed(4),
        day: view.day,
        path,
        state: await cdp.eval('return SIM.state();'),
        objectives: await cdp.eval('return SIM.objectiveVisibility();'),
        renderInfo: await cdp.eval('return window.SIM.renderInfo ? SIM.renderInfo() : null;')
      });
    }

    const record = {
      root,
      quality: args.quality || 'med',
      load: loadSnapshot(),
      focus: await browser.focusState(),
      views: captured,
      externalRequests: browser.externalRequests(),
      consoleProblems: browser.problems
    };
    if (args.out) writeJson(args.out, record);
    console.log(JSON.stringify({ ...record, views: captured.map((v) => ({ name: v.name, path: v.path, objectives: v.objectives, calls: v.renderInfo?.calls, triangles: v.renderInfo?.triangles })) }, null, 2));
  } finally {
    await browser.close();
    server.stop();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
