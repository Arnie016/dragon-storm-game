// Integration: import after the configured DRACO GLTFLoader exists; create LandmarkPath(scene, loader), await loadTemplates(), then call update(D.group.position, S.t) in tick; add getCollisionProxies() to the existing collider pass only after route-flight testing.
import * as THREE from 'three';

const TEMPLATE_SIZE = {
  arch: new THREE.Vector3(32, 22, 10),
  spire: new THREE.Vector3(18, 54, 18),
  harbor: new THREE.Vector3(44, 40, 44)
};

export const DRAGON_STORM_LANDMARK_ROUTE = Object.freeze([
  { id: 'wake-arch', position: [100, 48, 180], yaw: .2, scale: 1.35, template: 'arch' },
  { id: 'storm-spire', position: [170, 54, 40], yaw: -.55, scale: 1.6, template: 'spire' },
  { id: 'drowned-gate', position: [270, 60, -150], yaw: -.8, scale: 1.85, template: 'arch' },
  { id: 'cinder-harbor', position: [410, 46, -355], yaw: .55, scale: 1.45, template: 'harbor' },
  { id: 'bone-sentinel', position: [105, 75, -545], yaw: 1.2, scale: 2.25, template: 'spire' },
  { id: 'aurora-crown', position: [-150, 100, 620], yaw: .1, scale: 2.5, template: 'arch' }
]);

function fallback(type) {
  const root = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x353042, roughness: .82, metalness: .08, flatShading: true });
  const glow = new THREE.MeshStandardMaterial({ color: 0x2d174f, emissive: 0x8c50ff, emissiveIntensity: 1.4, roughness: .3 });
  if (type === 'arch') {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(15, 2.1, 7, 22, Math.PI), stone);
    arch.rotation.z = Math.PI; arch.position.y = 15; root.add(arch);
    for (const side of [-1, 1]) { const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.3, 17, 7), stone); pillar.position.set(side * 15, 8, 0); root.add(pillar); }
  } else if (type === 'spire') {
    const body = new THREE.Mesh(new THREE.ConeGeometry(9, 54, 7, 2), stone); body.position.y = 27; root.add(body);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(3.3), glow); beacon.position.y = 55; root.add(beacon);
  } else {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(17, 21, 10, 8), stone); base.position.y = 5; root.add(base);
    for (let i = 0; i < 3; i += 1) { const mast = new THREE.Mesh(new THREE.ConeGeometry(2.2, 30, 6), glow); mast.position.set((i - 1) * 9, 25, i % 2 ? -5 : 4); root.add(mast); }
  }
  root.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return root;
}

function normalizeTemplate(root, type) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const target = TEMPLATE_SIZE[type];
  if (!target || size.x < 1e-4 || size.y < 1e-4 || size.z < 1e-4) return root;
  root.scale.multiply(new THREE.Vector3(target.x / size.x, target.y / size.y, target.z / size.z));
  root.updateMatrixWorld(true);
  box.setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  const wrapper = new THREE.Group();
  wrapper.add(root);
  return wrapper;
}

export class LandmarkPath {
  constructor(scene, loader, options = {}) {
    if (!scene?.add || !loader?.loadAsync) throw new TypeError('LandmarkPath requires a Three.js scene and GLTFLoader.');
    this.scene = scene;
    this.loader = loader;
    this.assetBase = options.assetBase ?? './world-expansion/assets/';
    this.root = new THREE.Group();
    this.root.name = 'DragonStorm_LandmarkPath';
    this.root.userData.visualOnly = true;
    this.scene.add(this.root);
    this.route = DRAGON_STORM_LANDMARK_ROUTE.map((entry) => ({ ...entry, object: null, active: false }));
    this.templates = new Map();
    this._pulse = [];
    this.collisionAuthority = false;
  }

  async loadTemplates(manifest = { arch: 'portal_arch_draco.glb', spire: 'scene_landmarks_draco.glb', harbor: 'airfield_props_draco.glb' }) {
    for (const [name, filename] of Object.entries(manifest)) {
      try {
        const gltf = await this.loader.loadAsync(`${this.assetBase}${filename}`);
        this.templates.set(name, normalizeTemplate(gltf.scene, name));
      } catch {
        this.templates.set(name, fallback(name));
      }
    }
    for (const entry of this.route) this.place(entry);
    return this.getSnapshot();
  }

  place(entry) {
    const source = this.templates.get(entry.template) || fallback(entry.template);
    const object = source.clone(true);
    object.name = `DragonStorm_Landmark_${entry.id}`;
    object.position.fromArray(entry.position);
    object.rotation.y = entry.yaw;
    object.scale.setScalar(entry.scale);
    object.userData.landmarkId = entry.id;
    object.userData.visualOnly = true;
    this.root.add(object);
    entry.object = object;
    const beacon = new THREE.PointLight(0x8b5cff, 0, 175, 2);
    beacon.position.y = 25;
    object.add(beacon);
    this._pulse.push(beacon);
  }

  update(playerPosition, time = 0) {
    if (!playerPosition?.isVector3) return;
    for (let index = 0; index < this.route.length; index += 1) {
      const entry = this.route[index];
      const distance = playerPosition.distanceTo(entry.object?.position || playerPosition);
      entry.active = distance < 600;
      if (entry.object) entry.object.visible = distance < 2200;
      const beacon = this._pulse[index];
      if (beacon) beacon.intensity = entry.active ? 18 + Math.sin(time * 3 + index) * 5 : 3;
    }
  }

  getCollisionProxies() {
    return this.route.flatMap((entry) => {
      const [x, y, z] = entry.position;
      if (entry.template === 'arch') {
        return [-1, 1].map((side) => {
          const offset = side * 12.5 * entry.scale;
          return {
            id: `${entry.id}-${side < 0 ? 'left' : 'right'}`,
            x: x + Math.cos(entry.yaw) * offset,
            z: z - Math.sin(entry.yaw) * offset,
            radius: 3.3 * entry.scale,
            top: y + 22 * entry.scale
          };
        });
      }
      return [{
        id: entry.id,
        x,
        z,
        radius: (entry.template === 'harbor' ? 12 : 7) * entry.scale,
        top: y + (entry.template === 'harbor' ? 40 : 54) * entry.scale
      }];
    });
  }

  setCollisionAuthority(enabled = true) {
    this.collisionAuthority = !!enabled;
  }

  getSnapshot() {
    return { landmarks: this.route.length, loadedTemplates: [...this.templates.keys()], active: this.route.filter((entry) => entry.active).map((entry) => entry.id), collisionWiringRequired: !this.collisionAuthority };
  }

  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose?.());
    });
    this.root.clear();
  }
}
