/** Prove region landmark filter: Wake Cove vs Serpent Reach vs Rib Wastes archetypes differ. */
import { Browser } from '../landmark-geometry/harness.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const URL = process.env.PLAY_URL || 'http://127.0.0.1:8000/index.html';

mkdirSync(OUT_DIR, { recursive: true });

const browser = await Browser.launch({ port: 9363 });

try {
  await browser.instrument();
  await browser.openGame(URL, { quality: 'med', settleMs: 800 });
  const proof = await browser.cdp.eval('return SIM.regionLandmarkProof();', { awaitPromise: true });

  const wake = new Set(proof.wake_cove?.activeArchetypes || []);
  const serpent = new Set(proof.serpent_reach?.activeArchetypes || []);
  const rib = new Set(proof.rib_wastes?.activeArchetypes || []);
  const distinct = wake.size && serpent.size && rib.size
    && (wake.has('viaduct') || wake.has('seagate'))
    && (serpent.has('harbor') || serpent.has('viaduct'))
    && (rib.has('ribhall') || rib.has('beacon') || rib.has('harbor'));

  writeFileSync(join(OUT_DIR, 'region-filter-proof.json'), JSON.stringify({ distinct, proof }, null, 2));
  console.log(distinct ? 'PASS region filter proof' : 'FAIL region filter proof');
  console.log(JSON.stringify({
    wake: [...wake], serpent: [...serpent], rib: [...rib]
  }));
  process.exitCode = distinct ? 0 : 1;
} finally {
  await browser.close();
}
