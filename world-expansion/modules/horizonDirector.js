// Integration: import after sky/sea setup; create new HorizonDirector(scene, camera), call update(camera.position, S.t, TOD.day) once per frame after sky follows camera, and call setSize only if renderer pixel ratio changes.
import * as THREE from 'three';

const TAU = Math.PI * 2;

function seeded(index) {
  let value = (index + 1) * 0x9e3779b1;
  value ^= value >>> 16; value = Math.imul(value, 0x85ebca6b); value ^= value >>> 13;
  return (value >>> 0) / 4294967295;
}

export class HorizonDirector {
  constructor(scene, camera, options = {}) {
    if (!scene?.add || !camera?.isCamera) throw new TypeError('HorizonDirector requires a scene and camera.');
    this.scene = scene;
    this.camera = camera;
    this.near = options.near ?? 850;
    this.far = options.far ?? 3600;
    this.cameraFar = options.cameraFar ?? 9000;
    this.fogDensity = options.fogDensity ?? 0.00082;
    this.snap = options.snap ?? 400;
    this.root = new THREE.Group();
    this.root.name = 'DragonStorm_HorizonDirector';
    this.root.userData.visualOnly = true;
    const geometry = new THREE.ConeGeometry(1, 1, 7, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x20283a, roughness: .92, flatShading: true, fog: true });
    this.masses = new THREE.InstancedMesh(geometry, material, 30);
    this.masses.name = 'DragonStorm_HorizonMasses';
    this.masses.frustumCulled = false;
    this.root.add(this.masses);
    this.scene.add(this.root);
    this.matrix = new THREE.Matrix4();
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3();
    this._lastCellX = Infinity;
    this._lastCellZ = Infinity;
    this.update(new THREE.Vector3(), 0, 0);
  }

  configureFog(sceneFog) {
    if (sceneFog?.isFogExp2) sceneFog.density = this.fogDensity;
    this.camera.far = this.cameraFar;
    this.camera.updateProjectionMatrix();
  }

  rebuild(center) {
    const baseX = Math.floor(center.x / this.snap) * this.snap;
    const baseZ = Math.floor(center.z / this.snap) * this.snap;
    for (let index = 0; index < 30; index += 1) {
      const random = seeded(index);
      const angle = index / 30 * TAU + random * .22;
      const radius = this.near + random * (this.far - this.near);
      const width = 80 + seeded(index + 47) * 190;
      const height = 80 + seeded(index + 101) * 300;
      this.position.set(baseX + Math.cos(angle) * radius, height * .46 - 14, baseZ + Math.sin(angle) * radius);
      this.quaternion.setFromEuler(new THREE.Euler(0, angle + Math.PI * .5, 0));
      this.scale.set(width, height, width * (.55 + seeded(index + 211) * .55));
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.masses.setMatrixAt(index, this.matrix);
    }
    this.masses.instanceMatrix.needsUpdate = true;
  }

  update(cameraPosition, time = 0, dayAmount = 0) {
    if (!cameraPosition?.isVector3) return;
    const cellX = Math.floor(cameraPosition.x / this.snap);
    const cellZ = Math.floor(cameraPosition.z / this.snap);
    if (cellX !== this._lastCellX || cellZ !== this._lastCellZ) {
      this._lastCellX = cellX;
      this._lastCellZ = cellZ;
      this.rebuild(cameraPosition);
    }
    this.configureFog(this.scene.fog);
    this.masses.material.color.setHSL(.61 + dayAmount * .05, .26, .18 + (1 - dayAmount) * .07);
    this.masses.material.emissive?.setHSL(.68, .18, .008 + Math.sin(time * .15) * .003);
  }

  getSnapshot() {
    return { cameraFar: this.cameraFar, fogDensity: this.fogDensity, instances: 30, drawCalls: 1, visualOnly: true };
  }

  dispose() {
    this.scene.remove(this.root);
    this.masses.geometry.dispose();
    this.masses.material.dispose();
  }
}
