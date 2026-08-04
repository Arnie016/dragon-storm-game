/**
 * Dragon rig catalogue for Galevein: Stormflight.
 * URL ?rig= maps to id keys below. Default is stormcrest.
 */

export const DRAGON_RIGS = Object.freeze([
  {
    id: 'stormcrest',
    asset: 'dragon_galevein_stormcrest_corrected.glb',
    loreName: 'Stormcrest',
    epithet: 'Warden of the Sable Reach',
    note: 'Broad wings, steady beat — the bond-dragon of the keepers\' exile.',
    scale: 9.0,
    flapClip: 'Flap',
    glideClip: 'Glide',
    default: true
  },
  {
    id: 'corrected',
    asset: 'dragon_rigged_corrected.glb',
    loreName: 'Obsidian Gale',
    epithet: 'First Flight Shell',
    note: 'The corrected baseline rig — lean silhouette, proven flap envelope.',
    scale: 9.0,
    flapClip: 'Flap',
    glideClip: 'Glide'
  },
  {
    id: 'voltspine',
    asset: 'dragon_galevein_voltspine_corrected.glb',
    loreName: 'Voltspine',
    epithet: 'Lightning Ridge Silhouette',
    note: 'Taller dorsal arc — reads sharper against storm stacks.',
    scale: 9.0,
    flapClip: 'Flap',
    glideClip: 'Glide'
  },
  {
    id: 'thunderhook',
    asset: 'dragon_galevein_thunderhook_corrected.glb',
    loreName: 'Thunderhook',
    epithet: 'Hooked Tail Warden',
    note: 'Rear-weighted silhouette — distinct from Stormcrest at distance.',
    scale: 9.0,
    flapClip: 'Flap',
    glideClip: 'Glide'
  },
  {
    id: 'quaternius',
    asset: 'licensed-assets/models/dragon_quaternius_cc0.glb',
    loreName: 'Ember Wyrm',
    epithet: 'Quaternius CC0 · trial mount',
    note: 'Licensed CC0 pack dragon — flying clip only; procedural alive layer is reduced.',
    scale: 12.0,
    flapClip: 'DragonArmature|Dragon_Flying',
    glideClip: 'DragonArmature|Dragon_Flying',
    licensed: true,
    probe: true
  }
]);

export function resolveRigFromQuery(search = '') {
  const params = new URLSearchParams(search || (typeof location !== 'undefined' ? location.search : ''));
  const requested = params.get('rig');
  if (!requested) return DRAGON_RIGS.find((r) => r.default) ?? DRAGON_RIGS[0];
  return DRAGON_RIGS.find((r) => r.id === requested)
    ?? DRAGON_RIGS.find((r) => r.id === 'stormcrest')
    ?? DRAGON_RIGS[0];
}

export function rigCatalog(probed = {}) {
  return DRAGON_RIGS.filter((rig) => !rig.probe || probed[rig.id] === true);
}
