// Playability foundation SIM scenarios — CDP harness, cache disabled, Chrome killed on exit.
import { Browser, loadSnapshot, writeJson } from '../landmark-geometry/harness.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'verification-result.json');

const URL = process.env.PLAY_URL || 'http://127.0.0.1:8000/index.html';
const snapBefore = loadSnapshot();

const browser = await Browser.launch({ port: 9355 });
const results = { startedAt: new Date().toISOString(), loadBefore: snapBefore, scenarios: {} };

try {
  await browser.instrument();
  const landmark = await browser.openGame(URL, { quality: 'med', settleMs: 800 });
  results.landmark = { ok: true, sites: landmark.landmarks, buildMs: landmark.metrics?.buildMs, bootErrors: browser.problems.slice(0, 5) };

  // Scenario 1: in-flight 65s — loop alive, no crash
  await browser.cdp.eval(`
    SIM.jumpBeacon(2, { setupRun: true });
    SIM.controls({ accel: true, climb: false });
    return true;
  `);
  await new Promise((r) => setTimeout(r, 65000));
  const idle = await browser.cdp.eval(`
    return {
      uptime: SIM.uptime(),
      state: SIM.state(),
      bootErrors: SIM.bootErrors(),
      frameStats: SIM.frameStats(),
      cameraShake: SIM.motion().camera.shakeIntensity
    };
  `);
  results.scenarios.idle65s = { pass: idle.uptime.alive && !idle.state.done, ...idle };

  // Scenario 2: jumpBeacon(6) HUD string
  const beacon6 = await browser.cdp.eval(`
    SIM.jumpBeacon(6);
    return {
      objective: document.getElementById('objText')?.textContent,
      chapterHud: SIM.chapterHud(),
      structure: SIM.structureSnapshot(),
      state: SIM.state()
    };
  `);
  const expected = 'III · Serpent Run — beacons 6/8 · dive and flock';
  results.scenarios.jumpBeacon6 = {
    pass: beacon6.objective === expected,
    expected,
    ...beacon6
  };

  // Scenario 3: flight controls 120 steps with accel
  const flight = await browser.cdp.eval(`
    SIM.jumpBeacon(3, { setupRun: true });
    return SIM.runSteps({ steps: 120, controls: { accel: true, climb: true }, dt: 1/60 });
  `, { awaitPromise: true });
  results.scenarios.flight120 = {
    pass: flight.state?.hp > 0 && !flight.state?.done,
    hp: flight.state?.hp,
    pos: flight.state?.pos,
    frameStats: flight.frameStats
  };

  // Scenario 4: win route harness (jump near end, run until score 12 or done)
  const win = await browser.cdp.eval('return SIM.win();', { awaitPromise: true });
  results.scenarios.winRoute = {
    pass: win.verdict === true || win.state?.score >= 12 || win.state?.finishing,
    verdict: win.verdict,
    score: win.state?.score,
    finishing: win.state?.finishing,
    steps: win.steps
  };

  // Scenario 4b: lose detection (quick)
  await browser.cdp.eval('SIM.reset(); return true;');
  const loseDet = await browser.cdp.eval('return SIM.loseDetection();', { awaitPromise: true });
  results.scenarios.loseDetection = {
    pass: loseDet.verdict === true || loseDet.state?.done,
    cause: loseDet.state?.cause,
    steps: loseDet.steps
  };

  results.loadAfter = loadSnapshot();
  results.consoleProblems = browser.problems.slice(0, 10);
  writeJson(OUT, results);
} catch (error) {
  results.error = String(error.message || error);
  results.consoleProblems = browser.problems.slice(0, 15);
  writeJson(OUT, results);
  throw error;
} finally {
  await browser.close();
}

const passCount = Object.values(results.scenarios).filter((s) => s.pass).length;
console.log(JSON.stringify({ passCount, total: Object.keys(results.scenarios).length, scenarios: results.scenarios }, null, 2));
