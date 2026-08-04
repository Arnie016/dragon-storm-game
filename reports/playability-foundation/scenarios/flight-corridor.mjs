/** Real flight controls through the landmark corridor (not teleport-only). */
export const id = 'flight-corridor';
export const description = 'W+D climb run along wake-arch → drowned-gate stretch with SIM.controls.';

const heading = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));

export async function run(cdp) {
  const from = [40, 95, 340];
  const to = [420, 60, -420];
  const yaw = heading(from, to);
  await cdp.eval(`SIM.start(); SIM.benchmarkStart(); SIM.clearControls();
    SIM.teleport(${from.join(',')}, ${yaw});
    SIM.controls({ accel: true, climb: true, bankRight: true });`);
  await new Promise((r) => setTimeout(r, 2000));
  const result = await cdp.eval(`return SIM.runUntil((s, step) => step > 900 || s.done, {
    dt: 1/60, maxSteps: 1200, sampleEvery: 60,
    controls: { accel: true, climb: true, bankRight: true },
    reseat: () => SIM.teleport(${from.join(',')}, ${yaw})
  });`, { awaitPromise: true });
  result.id = id;
  result.description = description;
  result.pass = !result.verdict?.done && result.state?.spd > 20 && result.frameStats?.p95 < 40;
  return result;
}
