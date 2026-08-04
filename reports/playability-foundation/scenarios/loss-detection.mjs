/** Loss via searchlight detection meter hitting 100%. */
export const id = 'loss-detection';
export const description = 'Stealth loss — detection at 100% triggers SPOTTED game over.';

export async function run(cdp) {
  const result = await cdp.eval(`return (() => {
    SIM.start();
    SIM.jumpChapter(2);
    SIM.jumpState({ score: 2, detection: 0.88, done: false, day: 0.35 });
    SIM.triggerDetected();
    const snap = SIM.snapshot({ id: 'loss-detection', verdict: 'detected' });
    snap.description = 'Stealth loss — detection at 100% triggers SPOTTED game over.';
    snap.pass = snap.state?.done === true && snap.state?.score < 12;
    return snap;
  })();`);
  return result;
}
