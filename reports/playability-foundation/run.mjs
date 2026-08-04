#!/usr/bin/env node
// Run playability scenarios and write REPORT.md + JSON evidence.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Browser, loadSnapshot, serve, writeJson } from '../landmark-geometry/harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const scenarios = [
  './scenarios/menu-idle.mjs',
  './scenarios/flight-corridor.mjs',
  './scenarios/win-route.mjs',
  './scenarios/loss-detection.mjs'
];

const port = Number(process.env.PLAY_PORT || 8840);
const server = await serve(root, port);
const url = `http://127.0.0.1:${port}/index.html`;
const loadBefore = loadSnapshot();
const browser = await Browser.launch();
const results = [];

try {
  await browser.instrument();
  for (const rel of scenarios) {
    const mod = await import(pathToFileURL(join(here, rel)).href);
    console.error(`running ${mod.id}...`);
    browser.problems.length = 0;
    await browser.openGame(url, { settleMs: 800 });
    const started = Date.now();
    const outcome = await mod.run(browser.cdp);
    outcome.runtimeMs = Date.now() - started;
    outcome.consoleProblems = browser.problems.slice();
    results.push(outcome);
  }
} finally {
  await browser.close();
  server.stop();
}

const payload = {
  generatedAt: new Date().toISOString(),
  url,
  loadBefore,
  loadAfter: loadSnapshot(),
  results
};
writeJson(join(here, 'results.json'), payload);

const lines = [
  '# Playability Foundation Report',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Load averages',
  '',
  `- Before: ${loadBefore.uptime}`,
  `- After: ${payload.loadAfter.uptime}`,
  '',
  '## Scenario results',
  ''
];

for (const r of results) {
  lines.push(`### ${r.id} — ${r.pass ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push(r.description || '');
  lines.push('');
  if (r.final) {
    lines.push(`- Uptime: ${r.final.uptimeSec}s`);
    lines.push(`- Frame p50/p95: ${r.final.frameStats?.p50}/${r.final.frameStats?.p95} ms`);
    lines.push(`- Boot errors: ${r.final.bootErrors?.length ?? 0}`);
  } else if (r.state) {
    lines.push(`- Final score: ${r.state.score}/12`);
    lines.push(`- Done: ${r.state.done}`);
    lines.push(`- Frame p50/p95: ${r.frameStats?.p50}/${r.frameStats?.p95} ms`);
    lines.push(`- Steps: ${r.steps}`);
  }
  lines.push(`- Runtime: ${r.runtimeMs} ms`);
  if (r.consoleProblems?.length) lines.push(`- Console problems: ${r.consoleProblems.length}`);
  lines.push('');
}

lines.push('## SIM harness API');
lines.push('');
lines.push('- `SIM.controls({ climb, dive, bankLeft, bankRight, accel, brake, flap, allOff })`');
lines.push('- `SIM.jumpBeacon(n, { yaw, speed, yOffset })`');
lines.push('- `SIM.jumpChapter(n)` — 0=tutorial, 1-5=story chapters');
lines.push('- `SIM.jumpState({ score, detection, day, chapter, hp, pos, yaw, speed })`');
lines.push('- `SIM.runSteps({ dt, steps, controls })` / `SIM.runUntil(fn, opts)`');
lines.push('- `SIM.snapshot(extra)` — structured JSON per run');
lines.push('- `SIM.win()` / `SIM.loseDetection()` / `SIM.loseNightfall()` — canned endings');
lines.push('- `SIM.setCameraShake(0..1)` — camera shake intensity');
lines.push('');

writeFileSync(join(here, 'REPORT.md'), `${lines.join('\n')}\n`);
console.log(JSON.stringify({ report: join(here, 'REPORT.md'), results: results.map((r) => ({ id: r.id, pass: r.pass })) }, null, 2));
