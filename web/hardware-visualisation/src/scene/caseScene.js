import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import facts from '../data/case-routing.json' with { type: 'json' };
import { addLabel as placeLabel } from './labels.js';
import { tr } from '../../../i18n.js';
import { highlightModule } from './modules.js';

function addLabel(group, text, position, className = '') {
  return placeLabel(group, tr(text), position, className);
}

export function createCaseScene(initialMode = 'enclosure') {
  const root = new THREE.Group();
  root.name = 'case';
  // Lift the case geometry so the bottom of the enclosure rests directly on the grid floor at y = -17
  root.position.y = 183;

  const cables = new THREE.Group();
  cables.name = 'case-cables';
  root.add(cables);

  const tagsGroup = new THREE.Group();
  tagsGroup.name = 'case-tags';
  root.add(tagsGroup);

  const hitVolumes = new THREE.Group();
  hitVolumes.name = 'case-hit-volumes';
  root.add(hitVolumes);

  const loader = new GLTFLoader();
  const cached = new Map();
  const pickables = [];
  const modules = {};

  let mode = initialMode;
  let currentModel = null;
  let woodVisible = true;
  let labelsVisible = false;
  let filter = 'all';
  let selectedWireId = '';
  let selectionHelper = null;

  const wireColors = new Set(facts.wires.map(w => w.color.toLowerCase()));
  const p = facts.parameters;
  const toCad = v => new THREE.Vector3(v[0], -v[1], -v[2]);

  const TAG_DEFS = [
    ['lcd', 'LCD 240 × 320'],
    ['speaker', '40 mm speaker'],
    ['keypad', 'Five buttons'],
    ['pi', 'Raspberry Pi 3'],
    ['battery', 'Baseus 5000 mAh'],
    ['amp', 'MAX98357A'],
    ['adc', 'ADS'],
    ['divider', '2 × 10 kΩ'],
    ['switch', 'USB switch · measure housing'],
  ];

  const MODES = ['enclosure', 'internals', 'exploded'];
  function loadModel(name) {
    if (!MODES.includes(name)) name = 'enclosure';
    if (cached.has(name)) return Promise.resolve(cached.get(name));
    if (typeof window !== 'undefined' && window.__CASE_GLB__ && window.__CASE_GLB__[name]) {
      return new Promise((resolve, reject) => {
        const raw = window.__CASE_GLB__[name];
        const bin = typeof raw === 'string'
          ? Uint8Array.from(atob(raw), c => c.charCodeAt(0)).buffer
          : raw;
        loader.parse(
          bin,
          '',
          gltf => {
            const scene = gltf.scene;
            scene.rotation.x = Math.PI / 2;
            scene.scale.setScalar(1000);
            scene.traverse(obj => {
              if (obj.isMesh) {
                const mat = obj.material;
                const color = ('#' + mat.color.getHexString(THREE.SRGBColorSpace)).toLowerCase();
                obj.userData.sourceColor = color;
                if (wireColors.has(color)) obj.userData.originalWire = true;
                obj.userData.wood = ['#cfab76', '#ae8e60'].includes(color);
                mat.roughness = 0.84;
              }
            });
            cached.set(name, scene);
            resolve(scene);
          },
          reject
        );
      });
    }
    if (typeof window === 'undefined') {
      // Node.js test environment
      return import('node:fs/promises').then(fs => {
        const fileUrl = new URL(`../data/case-glb/${name}.glb`, import.meta.url);
        return fs.readFile(fileUrl).then(buf => {
          return new Promise((resolve, reject) => {
            loader.parse(
              buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
              '',
              gltf => {
                const scene = gltf.scene;
                scene.rotation.x = Math.PI / 2;
                scene.scale.setScalar(1000);
                scene.traverse(obj => {
                  if (obj.isMesh) {
                    const mat = obj.material;
                    const color = ('#' + mat.color.getHexString(THREE.SRGBColorSpace)).toLowerCase();
                    obj.userData.sourceColor = color;
                    if (wireColors.has(color)) obj.userData.originalWire = true;
                    obj.userData.wood = ['#cfab76', '#ae8e60'].includes(color);
                    mat.roughness = 0.84;
                  }
                });
                cached.set(name, scene);
                resolve(scene);
              },
              reject
            );
          });
        });
      });
    }
    const glbUrl = new URL(`../data/case-glb/${name}.glb`, import.meta.url).href;
    return new Promise((resolve, reject) => {
      loader.load(
        glbUrl,
        gltf => {
          const scene = gltf.scene;
          scene.rotation.x = Math.PI / 2;
          scene.scale.setScalar(1000);
          scene.traverse(obj => {
            if (obj.isMesh) {
              const mat = obj.material;
              const color = ('#' + mat.color.getHexString(THREE.SRGBColorSpace)).toLowerCase();
              obj.userData.sourceColor = color;
              if (wireColors.has(color)) obj.userData.originalWire = true;
              obj.userData.wood = ['#cfab76', '#ae8e60'].includes(color);
              mat.roughness = 0.84;
            }
          });
          cached.set(name, scene);
          resolve(scene);
        },
        undefined,
        reject
      );
    });
  }


  function cableRoute(w) {
    const pts = w.route.map(a => a.slice());
    if (mode === 'exploded') {
      pts.forEach((v, i) => {
        if (i === 0 && w.from.startsWith('P')) v[2] += 65;
        else if (i === pts.length - 1 && w.to === 'USB') v[2] += 65;
        else if (i === 0 || i === pts.length - 1) v[2] -= 65;
      });
    }
    return pts.map(toCad);
  }

  function rebuildCables() {
    for (const g of [...cables.children]) {
      g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      cables.remove(g);
    }

    // Clear previous cable pickables from pickables array
    const nonCablePickables = pickables.filter(p => !p.userData.wire);
    pickables.length = 0;
    pickables.push(...nonCablePickables);

    for (const w of facts.wires) {
      const pts = cableRoute(w);
      const g = new THREE.Group();
      g.userData.wire = w;
      const isSelected = w.id === selectedWireId;
      const color = isSelected ? '#ffb84c' : w.color;
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        emissive: isSelected ? 0x553300 : 0,
      });

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const len = a.distanceTo(b);
        if (!len) continue;
        const radius = w.group === 'Power' ? 1.6 : 0.45;
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), mat);
        mesh.position.copy(a).add(b).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        mesh.userData.wire = w;
        mesh.userData.cableId = w.id;
        g.add(mesh);
        pickables.push(mesh);
      }
      cables.add(g);
    }
    updateVisibility();
  }

  function rebuildTags() {
    for (const child of [...tagsGroup.children]) {
      tagsGroup.remove(child);
    }
    if (typeof document === 'undefined') {
      updateVisibility();
      return;
    }
    for (const [key, title] of TAG_DEFS) {
      const c = p[key];
      if (!c) continue;
      const point = [c.origin[0] + c.size[0] / 2, c.origin[1] + c.size[1] / 2, c.origin[2]];
      if (mode === 'exploded' && key !== 'switch') {
        point[2] += key === 'pi' ? 65 : -65;
      }
      const cadPoint = toCad(point);
      addLabel(tagsGroup, title, cadPoint.toArray(), 'small');
    }
    updateVisibility();
  }

  function rebuildHitVolumes() {
    for (const child of [...hitVolumes.children]) {
      hitVolumes.remove(child);
    }
    // Remove existing hit volume pickables
    const nonVolumePickables = pickables.filter(p => !p.userData.moduleId);
    pickables.length = 0;
    pickables.push(...nonVolumePickables);

    for (const [key] of TAG_DEFS) {
      const c = p[key];
      if (!c) continue;
      const origin = c.origin, size = c.size;
      const center = [origin[0] + size[0] / 2, origin[1] + size[1] / 2, origin[2] + (size[2] || 0) / 2];
      if (mode === 'exploded' && key !== 'switch') {
        center[2] += key === 'pi' ? 65 : -65;
      }
      const cadCenter = toCad(center);
      const boxSize = new THREE.Vector3(size[0], size[1], Math.max(size[2] || 0, 8));
      const geom = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(cadCenter);
      mesh.userData.moduleId = key;
      hitVolumes.add(mesh);
      modules[key] = mesh;
      pickables.push(mesh);
    }
  }

  function updateVisibility() {
    if (currentModel) {
      currentModel.traverse(o => {
        if (o.isMesh) {
          o.visible = !o.userData.originalWire && (!o.userData.wood || woodVisible);
        }
      });
    }
    for (const group of cables.children) {
      const gName = group.userData.wire.group;
      group.visible = filter !== 'None' && (filter === 'all' || filter === 'All' || gName === filter);
    }
    tagsGroup.visible = labelsVisible;
  }

  async function setMode(newMode) {
    mode = newMode;
    const model = await loadModel(newMode);
    if (currentModel && currentModel !== model) {
      root.remove(currentModel);
    }
    currentModel = model;
    root.add(model);
    rebuildCables();
    rebuildTags();
    rebuildHitVolumes();
    updateVisibility();
    return model;
  }

  function setWood(val) {
    woodVisible = val;
    updateVisibility();
  }

  function setLabels(val) {
    labelsVisible = val;
    updateVisibility();
  }

  function setFilter(val) {
    filter = val;
    updateVisibility();
  }

  function selectWire(id) {
    selectedWireId = id || '';
    rebuildCables();
  }

  function selectModule(id) {
    selectionHelper?.dispose();
    selectionHelper = null;
    const target = modules[id];
    if (target) {
      selectionHelper = highlightModule(root, target, '#2c8bb5');
    }
  }

  function getCameraPreset(name = 'iso') {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const center = bounds.getCenter(new THREE.Vector3());
    const span = bounds.getSize(new THREE.Vector3()).length() || 260;
    const dir = new THREE.Vector3(
      ...(name === 'front' ? [0, 0, 1] : name === 'rear' ? [0, 0, -1] : [0.65, 0.45, mode === 'internals' ? -1 : 1])
    ).normalize();
    const position = center.clone().add(dir.multiplyScalar(span * 1.45));
    return { position, target: center };
  }

  // Initial load
  const readyPromise = setMode(initialMode);

  return {
    root,
    cables,
    pickables,
    modules,
    data: facts,
    readyPromise,
    setMode,
    setWood,
    setLabels,
    setFilter,
    selectWire,
    selectModule,
    getCameraPreset,
    getMode: () => mode,
    getWood: () => woodVisible,
    getLabels: () => labelsVisible,
    getFilter: () => filter,
    getSelectedWire: () => selectedWireId,
  };
}
