// Visual budgets only. Flight, collision, targets and enemy cues never use a tier.
export const GRAPHICS_PROFILES = Object.freeze({
  low: Object.freeze({label:'Low', ratio:1, scale:.8, rain:350, wind:0, streaks:0, sea:100, shadow:0, dof:false, postScale:.5, detail:0}),
  med: Object.freeze({label:'Medium', ratio:1, scale:1, rain:650, wind:45, streaks:60, sea:140, shadow:0, dof:false, postScale:.5, detail:1}),
  high: Object.freeze({label:'High', ratio:1.5, scale:1, rain:1000, wind:75, streaks:100, sea:180, shadow:1024, dof:false, postScale:.65, detail:2}),
  extra: Object.freeze({label:'Extra High', ratio:1.75, scale:1, rain:1250, wind:95, streaks:125, sea:220, shadow:1536, dof:true, postScale:.75, detail:3}),
  extreme: Object.freeze({label:'Extreme', ratio:2, scale:1, rain:1500, wind:110, streaks:150, sea:280, shadow:2048, dof:true, postScale:1, detail:4})
});
export function normalizeGraphics(value) {
  const aliases={medium:'med', 'extra-high':'extra', ultra:'extra'};
  const key=aliases[value]||value;
  return Object.hasOwn(GRAPHICS_PROFILES,key)?key:'high';
}
export function graphicsPixelRatio(profile, deviceRatio=1) {
  return Math.min(Math.max(.5,Number(deviceRatio)||1),profile.ratio)*profile.scale;
}
