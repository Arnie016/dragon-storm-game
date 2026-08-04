// Boots the game once and dumps the landmark build metrics, renderer counters and any
// console problems. Used to iterate on geometry without grinding through gameplay.
import { Browser, loadSnapshot, serve, sleep, writeJson } from './harness.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, token, index, all) => {
  if (token.startsWith('--')) pairs.push([token.slice(2), all[index + 1]]);
  return pairs;
}, []));

async function main() {
  const root = args.root || '/Users/arnav/Desktop/dragon-storm-game';
  const port = Number(args.port || 8841);
  const server = await serve(root, port);
  const browser = await Browser.launch();
  try {
    await browser.instrument();
    const snapshot = await browser.openGame(`http://127.0.0.1:${port}/index.html`, { quality: args.quality || 'med' });
    const cdp = browser.cdp;
    await cdp.eval('SIM.start(); SIM.benchmarkStart(); SIM.key("ArrowDown", false);');
    if (args.at) {
      const [x, y, z, yaw] = args.at.split(',').map(Number);
      await cdp.eval(`SIM.teleport(${x},${y},${z},${yaw || 0});`);
    }
    await sleep(1200);
    const record = {
      load: loadSnapshot(),
      state: await cdp.eval('return SIM.state();'),
      snapshot,
      metrics: await cdp.eval('return SIM.landmarkMetrics();'),
      renderInfo: await cdp.eval('return SIM.renderInfo();'),
      bounds: await cdp.eval('return SIM.landmarkBounds();'),
      objectives: await cdp.eval('return SIM.objectiveVisibility();'),
      externalRequests: browser.externalRequests(),
      consoleProblems: browser.problems
    };
    if (args.shot) await browser.screenshot(args.shot);
    if (args.out) writeJson(args.out, record);
    console.log(JSON.stringify(record, null, 2));
  } finally {
    await browser.close();
    server.stop();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
