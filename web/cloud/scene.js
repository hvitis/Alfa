import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { tr } from '../i18n.js';

// One CAD assembly is shared by all four modes. No geometry is created when
// changing views, so repeated tab changes keep a bounded GPU resource count.
export function createCloudScene() {
  const root = new THREE.Group();
  root.name = 'cloud';
  const frontLight = new THREE.DirectionalLight('#f4faff', 2.2);
  frontLight.position.set(100, 220, -400);
  root.add(frontLight);
  const labels = new THREE.Group(), clearances = new THREE.Group();
  root.add(labels, clearances);
  const pickables = [], shells = {}, data = { components: [] }, labelAnchors = [];
  const partMaterials = {}, colors = {front:'#86bfea',rear:'#70acd9',battery_door:'#fff0b5'};
  function applyColors() { for(const [part,materials] of Object.entries(partMaterials)) for(const material of materials) material.color.set(colors[part]); }
  let mode = 'assembled', showLabels = false, showClearances = false, request = 0;
  function apply() {
    for (const [name, node] of Object.entries(shells)) {
      node.position.copy(node.userData.home);
      node.visible = mode !== 'inside';
      if (mode === 'exploded') node.position.z += name === 'front' ? -48 : name === 'rear' ? 60 : 115;
      if (mode === 'battery_open' && name === 'battery_door') { node.position.z += 90; node.position.y -= 15; }
    }
    for (const {label, home, part} of labelAnchors) {
      label.position.copy(home);
      if (part && shells[part]) label.position.add(shells[part].position).sub(shells[part].userData.home);
      label.visible = !part || mode !== 'inside';
    }
    labels.visible = showLabels;
    clearances.visible = showClearances;
  }
  const readyPromise = (async () => {
    const response = await fetch('./cloud/manifest.json');
    if (!response.ok) throw new Error(`Cloud specifications returned HTTP ${response.status}`);
    Object.assign(data, await response.json());
    const gltf = await new GLTFLoader().loadAsync(new URL('./cloud/cloud-radio.glb', document.baseURI).href);
    const model = gltf.scene;
    // build123d glTF uses metres and the CAD exporter rotates its frame.
    model.rotation.x = Math.PI / 2;
    model.scale.setScalar(1000);
    root.add(model);
    root.updateMatrixWorld(true);
    for (const name of data.print_parts) {
      const node = model.getObjectByName(name);
      if (!node) throw new Error(`CAD assembly is missing ${name}`);
      root.attach(node);
      node.userData.home = node.position.clone();
      shells[name] = node;
      // Clone once per printed part so recoloring never changes electronics.
      const clones=new Map();
      node.traverse(child=>{
        if(!child.isMesh)return;
        function clone(material){if(!clones.has(material))clones.set(material,material.clone());return clones.get(material)}
        child.material=Array.isArray(child.material)?child.material.map(clone):clone(child.material);
      });
      partMaterials[name]=[...clones.values()];
    }
    applyColors();
    const hardware = new Map([...data.components, ...data.keepouts].map(item => [item.id, item]));
    root.traverse(object => {
      if (!object.isMesh) return;
      object.material.roughness = .72;
      object.material.metalness = 0;
      let node = object;
      while (node && node !== root) {
        if (shells[node.name]) {
          object.userData.partId = node.name;
          pickables.push(object); break;
        }
        const id = node.name.startsWith('component_') ? node.name.slice(10)
          : node.name.startsWith('connector_') ? node.name.slice(10)
          : node.name === 'screen' ? 'lcd'
          : node.name.startsWith('cap_button_') ? node.name.slice(4)
          : node.name.startsWith('bezel_button_') ? node.name.slice(6)
          : node.name.startsWith('button_') ? node.name
          : null;
        if (id && hardware.has(id)) {
          object.userData.moduleId = hardware.get(id).parent || id;
          object.userData.hoverInfo = { id, title: tr(hardware.get(id).title), kind: tr('Hardware') };
          pickables.push(object); break;
        }
        node = node.parent;
      }
    });
    function addLabel(text, position, part) {
      const element = document.createElement('span');
      element.className = 'annotation'; element.textContent = text;
      const label = new CSS2DObject(element), home = new THREE.Vector3(...position);
      label.position.copy(home); labels.add(label); labelAnchors.push({label, home, part});
    }
    for (const item of data.components) {
      addLabel(tr(item.title), item.origin.map((value,axis) => value + item.size[axis]/2));
    }
    for (const item of data.frame_parts || []) {
      const bounds = new THREE.Box3().setFromObject(shells[item.name]);
      const position = bounds.getCenter(new THREE.Vector3());
      position.z = item.name === 'front' ? bounds.min.z : bounds.max.z;
      addLabel(`${item.id} · ${tr(item.title)}`, position.toArray(), item.name);
    }
    for (const feature of data.frame_features || []) {
      addLabel(feature.id, feature.origin.map((value,axis) => value + feature.size[axis]/2), feature.part);
    }
    for (const item of [...data.components, ...data.keepouts]) {
      if (!item.uncertain) continue;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...item.size.map(size => size + data.allowance_mm)),
        new THREE.MeshBasicMaterial({ color: '#d98735', wireframe: true, transparent: true, opacity: .65, depthTest: false }));
      mesh.position.set(...item.origin.map((value, axis) => value + item.size[axis]/2));
      clearances.add(mesh);
    }
    apply();
  })();
  return {
    root, data, pickables, readyPromise,
    getMode: () => mode,
    async setMode(value) {
      if (!['assembled', 'exploded', 'inside', 'battery_open'].includes(value)) throw new Error(`Unknown cloud view: ${value}`);
      const token = ++request;
      await readyPromise;
      if (token !== request) return;
      mode = value; apply();
    },
    setPartColors(values) {
      for(const part of Object.keys(colors)) if(/^#[\da-f]{6}$/i.test(values[part])) colors[part]=values[part].toLowerCase();
      applyColors();
    },
    getColors:()=>({...colors}),
    getHoverInfo(hit) {
      if (hit.object.userData.hoverInfo) return hit.object.userData.hoverInfo;
      const part = hit.object.userData.partId, node = shells[part];
      if (!node) return null;
      const point = root.worldToLocal(hit.point.clone()).sub(node.position).add(node.userData.home);
      // Classify the actual visible CAD surface; hidden features cannot be
      // selected through a shell. Bounds travel with their shell on explosion.
      const candidates = (data.frame_features || []).filter(feature => feature.part === part &&
        feature.origin.every((value,axis) => point.getComponent(axis) >= value-.15 && point.getComponent(axis) <= value+feature.size[axis]+.15));
      candidates.sort((a,b) => a.size.reduce((v,n) => v*n,1)-b.size.reduce((v,n) => v*n,1));
      const feature = candidates[0] || data.frame_parts?.find(item => item.name === part);
      return feature ? { id: feature.id, title: tr(feature.title), kind: tr('Frame') } : null;
    },
    setLabels(value) { showLabels = value; apply(); },
    setClearances(value) { showClearances = value; apply(); },
    selectModule() {},
    getCameraPreset: () => ({ position: mode === 'battery_open' ? new THREE.Vector3(-140,155,420) : new THREE.Vector3(140,155,-420), target: new THREE.Vector3(0,85,43) }),
  };
}
