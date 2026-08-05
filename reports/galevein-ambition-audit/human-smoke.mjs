/** Human-playable smoke: tutorial → beacon 3 via SIM.controls (no jumpBeacon progression). */
import { Browser } from '../landmark-geometry/harness.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const URL = process.env.PLAY_URL || 'http://127.0.0.1:8000/index.html?rig=stormcrest';

mkdirSync(OUT_DIR, { recursive: true });

const browser = await Browser.launch({ port: 9362 });
const startedAt = new Date().toISOString();

try {
  await browser.instrument();
  await browser.openGame(URL, { quality: 'med', settleMs: 1200 });

  const result = await browser.cdp.eval(`
    SIM.setCameraShake(0.35);
    SIM.jumpChapter(0);
    SIM.start();
    SIM.clearControls();
    return SIM.runUntil((s, step) => {
      SIM.steerObjective();
      const tut = SIM.state().tutorial;
      if (tut >= 3 && s.score >= 3) return 'beacon3';
      if (s.done) return 'crashed:' + (s.cause||'unknown');
      if (step > 7200) return 'timeout';
    }, { dt: 1/60, maxSteps: 7200, sampleEvery: 120 });
  `, { awaitPromise: true });

  const shake = result.motion?.camera?.shakeIntensity ?? result.samples?.slice(-1)[0]?.motion?.camera?.shakeIntensity;
  const pass = result.verdict === 'beacon3' && !result.state?.done;
  const hudTrail = [];
  for (const s of result.samples || []) {
    const obj = s.objective || '';
    if (obj && (!hudTrail.length || hudTrail[hudTrail.length - 1].objective !== obj)) {
      hudTrail.push({ step: s.step, t: s.t, objective: obj });
    }
  }
  const finalObjective = result.samples?.slice(-1)[0]?.objective ?? '';

  const md = [
    '# Human-playable smoke — Galevein ambition audit',
    '',
    `Date: ${startedAt}`,
    `URL: ${URL}`,
    `Verdict: **${result.verdict}** (${pass ? 'PASS' : 'FAIL'})`,
    '',
    '## Method',
    '- `SIM.jumpChapter(0)` — tutorial start at REST (no jumpBeacon score skip)',
    '- `SIM.steerObjective()` each frame (SIM.controls accel + bank + climb toward next ring)',
    '- Camera shake locked to **0.35** via `SIM.setCameraShake(0.35)`',
    '',
    '## Outcome',
    `- Tutorial rings: ${result.state?.tutorial ?? '?'}/3`,
    `- Beacon score: ${result.state?.score ?? '?'}/12`,
    `- Steps: ${result.steps ?? '?'}`,
    `- HP: ${result.state?.hp ?? '?'}`,
    `- Camera shake intensity: ${shake ?? '?'}`,
    `- Frame stats: p50 ${result.frameStats?.p50 ?? 'n/a'} ms · p95 ${result.frameStats?.p95 ?? 'n/a'} ms · p99 ${result.frameStats?.p99 ?? 'n/a'} ms (${result.frameStats?.samples ?? '?'} samples)`,
    `- Final objective HUD: \`${finalObjective}\``,
    '',
    '## Objective HUD trail',
    ...(hudTrail.length
      ? hudTrail.map((h) => `- step ${h.step} (t=${h.t}s): \`${h.objective}\``)
      : ['- (none captured)']),
    '',
    '## Samples (last 3)',
    '```json',
    JSON.stringify((result.samples || []).slice(-3), null, 2),
    '```',
    ''
  ].join('\n');

  writeFileSync(join(OUT_DIR, 'HUMAN_SMOKE.md'), md);
  writeFileSync(join(OUT_DIR, 'human-smoke-result.json'), JSON.stringify({ pass, startedAt, result }, null, 2));
  console.log(pass ? 'PASS human smoke' : 'FAIL human smoke', result.verdict);
  process.exitCode = pass ? 0 : 1;
} finally {
  await browser.close();
}
