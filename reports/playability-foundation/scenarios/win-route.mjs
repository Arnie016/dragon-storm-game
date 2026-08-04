/** Full win path: jump to final beacon with 11 collected, fly through #12. */
export const id = 'win-route';
export const description = '12-beacon win — jump to beacon 12 with score 11 and complete Tempest Gate escape.';

export async function run(cdp) {
  const result = await cdp.eval(`return (async () => {
    SIM.start();
    SIM.jumpChapter(5);
    SIM.jumpState({ score: 11, detection: 0, day: 0.25, done: false });
    SIM.jumpBeacon(12, { speed: 38, yOffset: 10 });
    SIM.controls({ accel: true, climb: false });
    const snap = await SIM.runUntil(s => s.done || s.score >= 12, { dt: 1/60, maxSteps: 3600, sampleEvery: 90,
      controls: { accel: true } });
    snap.id = 'win-route';
    snap.description = '12-beacon win — jump to beacon 12 with score 11 and complete Tempest Gate escape.';
    snap.pass = snap.state?.score >= 12 && snap.verdict !== 'timeout';
    return snap;
  })();`, { awaitPromise: true });
  return result;
}
