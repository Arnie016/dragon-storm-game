/** Menu idle stability: loop must stay alive 65s with no boot errors. */
export const id = 'menu-idle';
export const description = 'Idle menu cinematic for 65s — catches load death and WebGL loss.';

export async function run(cdp) {
  await cdp.eval('SIM.clearFrames();');
  const start = Date.now();
  const samples = [];
  while (Date.now() - start < 65000) {
    await new Promise((r) => setTimeout(r, 5000));
    samples.push(await cdp.eval('return SIM.snapshot({ scenario: "menu-idle" });'));
    const alive = await cdp.eval('return SIM.uptime().alive;');
    if (!alive) break;
  }
  return {
    id,
    description,
    durationMs: Date.now() - start,
    samples,
    final: samples.at(-1),
    pass: samples.at(-1)?.uptimeSec >= 60 && (samples.at(-1)?.bootErrors?.length ?? 0) === 0 && samples.at(-1)?.loopLagMs < 250
  };
}
