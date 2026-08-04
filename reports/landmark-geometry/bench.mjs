// Frame-time benchmark for the landmark geometry pass.
//
// Only SIM hooks that exist in BOTH 2bc643e and the working tree are used, so the
// same scenario code drives both sides of the A/B and the comparison is fair.
//
//   node bench.mjs --label base --root /tmp/dsg-baseline --port 8818 \
//                  --scenario corridor --quality med --frames 600 --out path.json
import { Browser, loadSnapshot, serve, sleep, writeJson } from './harness.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, all) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]]);
  return pairs;
}, []));

// Flight lines are chosen to keep the landmark chain in frame for the whole sample.
// yaw is derived so the craft's forward vector points down the line: the game's
// forward is (-sin(yaw), *, -cos(yaw)), hence atan2(-dx, -dz).
const heading = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));

const SCENARIOS = {
  // Straight run past wake-arch, storm-spire, drowned-gate and cinder-harbor:
  // the densest stretch of built geometry on the route.
  corridor: {
    start: [40, 95, 340],
    aim: [420, 60, -420],
    reseatEveryMs: 3400,
    keys: { KeyW: true }
  },
  // High wide view: the most landmarks resolvable at once, worst case for draw
  // calls and for LOD selection.
  overlook: {
    start: [-60, 330, 520],
    aim: [340, 60, -520],
    reseatEveryMs: 3400,
    keys: { KeyW: true }
  },
  // Reproduces the previous pass's controlled sequence for continuity: empty ocean
  // at (900,220,900), turn phase then climb phase.
  controlled: { controlled: true }
};

async function sampleFrames(cdp, targetFrames, scenario, reseat) {
  await cdp.eval('SIM.clearFrames();');
  const deadline = Date.now() + 60000;
  let lastReseat = Date.now();
  for (;;) {
    await sleep(250);
    if (reseat && scenario.reseatEveryMs && Date.now() - lastReseat > scenario.reseatEveryMs) {
      lastReseat = Date.now();
      await reseat();
    }
    const stats = await cdp.eval('return SIM.frameStats();');
    if (stats.samples >= targetFrames || Date.now() > deadline) return stats;
  }
}

async function main() {
  const label = args.label || 'run';
  const root = args.root;
  const port = Number(args.port || 8830);
  const scenarioName = args.scenario || 'corridor';
  const quality = args.quality || 'med';
  const targetFrames = Number(args.frames || 600);
  const scenario = SCENARIOS[scenarioName];
  if (!root || !scenario) throw new Error(`usage: --root <dir> --scenario <${Object.keys(SCENARIOS).join('|')}>`);

  const server = await serve(root, port);
  const url = `http://127.0.0.1:${port}/index.html`;
  const loadBefore = loadSnapshot();
  const browser = await Browser.launch();
  let record;
  try {
    await browser.instrument();
    const landmarkSnapshot = await browser.openGame(url, { quality });
    const cdp = browser.cdp;
    const focusStart = await browser.focusState();

    let frames;
    if (scenario.controlled) {
      await cdp.eval('SIM.start(); SIM.benchmarkStart();');
      await sleep(1500);
      frames = await sampleFrames(cdp, Math.round(targetFrames / 3), scenario, null);
      await cdp.eval('SIM.benchmarkPhase(1);');
      await sleep(600);
      const turn = await sampleFrames(cdp, Math.round(targetFrames * 2 / 3), scenario, null);
      await cdp.eval('SIM.benchmarkPhase(2);');
      await sleep(600);
      frames = await sampleFrames(cdp, targetFrames, scenario, null);
      frames.turnPhase = turn;
      await cdp.eval('SIM.benchmarkStop();');
    } else {
      const yaw = heading(scenario.start, scenario.aim);
      const seat = `SIM.teleport(${scenario.start.join(',')}, ${yaw});`;
      // benchmarkStart suppresses gusts, strikes and rogues so the sample measures
      // rendering rather than random hazard events, then we reseat onto the route.
      await cdp.eval(`SIM.start(); SIM.benchmarkStart(); SIM.key('ArrowDown', false); ${seat}`);
      for (const [code, value] of Object.entries(scenario.keys)) await cdp.eval(`SIM.key(${JSON.stringify(code)}, ${value});`);
      await sleep(1800);
      frames = await sampleFrames(cdp, targetFrames, scenario, () => cdp.eval(seat));
    }

    const focusEnd = await browser.focusState();
    const expansion = await cdp.eval('return SIM.expansion();');
    const state = await cdp.eval('return SIM.state();');
    // Candidate-only hook; absent on the 2bc643e baseline, which is expected.
    const renderInfo = await cdp.eval('return window.SIM.renderInfo ? SIM.renderInfo() : null;');
    record = {
      label,
      url,
      scenario: scenarioName,
      quality,
      cacheDisabled: true,
      loadBefore,
      loadAfter: loadSnapshot(),
      focusStart,
      focusEnd,
      frames,
      state,
      landmarkSnapshot,
      expansion,
      renderInfo,
      externalRequests: browser.externalRequests(),
      consoleProblems: browser.problems
    };
  } finally {
    await browser.close();
    server.stop();
  }

  if (args.out) writeJson(args.out, record);
  console.log(JSON.stringify(record, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
