import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { addLabel } from './labels.js';
import { highlightModule } from './modules.js';

// A reusable scene for a woodkit design: one GLB per view mode, wires drawn from routing
// data so they can be traced, invisible hit boxes for each part, labels and camera presets.
// Config: { name, facts, glbUrl(mode), tags: {id: text}, defaultMode, floorY, wireModes, pickModes }.

export function prepareWorkshopModel(scene, woodColors) {
  // cadgen exports Z-up metres; turn back into the CAD frame (Y up, front +Z, mm).
  scene.rotation.x = Math.PI / 2;
  scene.scale.setScalar(1000);
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    const color = '#' + obj.material.color.getHexString(THREE.SRGBColorSpace);
    obj.userData.sourceColor = color;
    obj.userData.wood = woodColors.includes(color);
    obj.material.roughness = 0.84;
  });
  return scene;
}

export function createWorkshopScene(config) {
  const { facts, tags = {}, floorY = -17 } = config;
  const wireModes = config.wireModes ?? facts.modes.filter(m => m !== 'exploded');
  const pickModes = config.pickModes ?? wireModes;
  const root = new THREE.Group();
  root.name = config.name;
  root.position.y = floorY;
  const cables = new THREE.Group(), labels = new THREE.Group(), hits = new THREE.Group();
  root.add(cables, labels, hits);
  const loader = new GLTFLoader(), cached = new Map(), pickables = [], modules = {};
  let mode = config.defaultMode ?? facts.modes[0], model = null, wood = true, showLabels = false, filter = 'all', wire = '', selection = null;

  function load(name) {
    if (!facts.modes.includes(name)) name = config.defaultMode ?? facts.modes[0];
    if (cached.has(name)) return Promise.resolve(cached.get(name));
    if (typeof window === 'undefined') return Promise.resolve(null);   // Node tests: state only
    if (typeof window !== 'undefined' && window.__RADIO_GLB__ && window.__RADIO_GLB__[name]) {
      return new Promise((resolve, reject) => {
        const raw = window.__RADIO_GLB__[name];
        const bin = typeof raw === 'string'
          ? Uint8Array.from(atob(raw), c => c.charCodeAt(0)).buffer
          : raw;
        loader.parse(bin, '', gltf => {
          const scene = prepareWorkshopModel(gltf.scene, facts.wood_colors);
          cached.set(name, scene);
          resolve(scene);
        }, reject);
      });
    }
    return new Promise((resolve, reject) => loader.load(config.glbUrl(name), gltf => {
      const scene = prepareWorkshopModel(gltf.scene, facts.wood_colors);
      cached.set(name, scene);
      resolve(scene);
    }, undefined, reject));
  }

  function clearGroup(group) {
    for (const child of [...group.children]) {
      child.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
      group.remove(child);
    }
  }

  function buildWires() {
    clearGroup(cables);
    for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.wire) pickables.splice(i, 1);
    if (!wireModes.includes(mode)) return;
    for (const w of facts.wires) {
      const g = new THREE.Group();
      g.userData.wire = w;
      const selected = w.id === wire;
      const material = new THREE.MeshStandardMaterial({ color: selected ? '#ffb84c' : w.color, roughness: .65, emissive: selected ? 0x553300 : 0 });
      const radius = w.group === 'Power' ? 1.7 : .55;
      for (let i = 1; i < w.route.length; i++) {
        const a = new THREE.Vector3(...w.route[i - 1]), b = new THREE.Vector3(...w.route[i]);
        const length = a.distanceTo(b);
        if (!length) continue;
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
        mesh.position.copy(a).add(b).multiplyScalar(.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        mesh.userData.wire = w;
        g.add(mesh);
        pickables.push(mesh);
      }
      cables.add(g);
    }
  }

  function buildParts() {
    clearGroup(hits);
    for (const child of [...labels.children]) labels.remove(child);
    for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.moduleId) pickables.splice(i, 1);
    for (const key of Object.keys(modules)) delete modules[key];
    if (!pickModes.includes(mode)) return;
    for (const [id, box] of Object.entries(facts.modules)) {
      const min = new THREE.Vector3(...box.min), max = new THREE.Vector3(...box.max);
      const size = max.clone().sub(min), centre = min.clone().add(max).multiplyScalar(.5);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 4), Math.max(size.y, 4), Math.max(size.z, 4)),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      mesh.position.copy(centre);
      mesh.userData.moduleId = id;
      hits.add(mesh);
      modules[id] = mesh;
      pickables.push(mesh);
      if (tags[id] && typeof document !== 'undefined') addLabel(labels, tags[id], [centre.x, centre.y, max.z], 'small');
    }
  }

  function update() {
    model?.traverse(o => { if (o.isMesh) o.visible = wood || !o.userData.wood; });
    for (const g of cables.children) g.visible = filter !== 'None' && (filter === 'all' || g.userData.wire.group === filter);
    labels.visible = showLabels;
  }

  async function setMode(next) {
    if (!facts.modes.includes(next)) return model;
    mode = next;
    selectModule(null);
    buildWires();
    buildParts();
    const loaded = await load(next);
    if (mode !== next) return model;          // a later click chose another mode meanwhile
    if (model && model !== loaded) root.remove(model);
    model = loaded;
    if (model) root.add(model);
    update();
    return model;
  }

  function selectModule(id) {
    selection?.dispose();
    selection = modules[id] ? highlightModule(root, modules[id], '#2c8bb5') : null;
  }

  function getCameraPreset(name = 'iso') {
    root.updateMatrixWorld(true);
    const [W, H, D] = facts.outer_mm;
    const bounds = new THREE.Box3(new THREE.Vector3(-W / 2, 0, -D), new THREE.Vector3(W / 2, H, 0)).applyMatrix4(root.matrixWorld);
    const centre = bounds.getCenter(new THREE.Vector3()), span = bounds.getSize(new THREE.Vector3()).length();
    const dirs = { front: [0, .05, 1], side: [1, .05, 0], back: [0, .1, -1], top: [.25, 1.6, .7], iso: [.65, .45, 1] };
    const dir = new THREE.Vector3(...(dirs[name] ?? dirs.iso)).normalize();
    return { position: centre.clone().add(dir.multiplyScalar(span * 1.3)), target: centre };
  }

  buildWires();
  buildParts();
  const readyPromise = setMode(mode);
  return {
    root, cables, pickables, modules, data: facts, readyPromise, setMode, selectModule, getCameraPreset,
    setWood(v) { wood = v; update(); }, setLabels(v) { showLabels = v; update(); },
    setFilter(v) { filter = v; update(); },
    selectWire(id) { wire = id || ''; buildWires(); update(); },
    getMode: () => mode, getWood: () => wood, getLabels: () => showLabels, getFilter: () => filter, getSelectedWire: () => wire,
  };
}
