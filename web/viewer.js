import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createCaseScene } from './hardware-visualisation/src/scene/caseScene.js';
import { createRadioScene } from './hardware-visualisation/src/scene/radioScene.js';
import { createSetupScene } from './hardware-visualisation/src/scene/setupScene.js';
import { isVisible } from './hardware-visualisation/src/scene/modules.js';
import { createCloudScene } from './cloud/scene.js';
import { createPcbScene } from './pcb/scene.js';
import { t } from './i18n.js';

export function createViewer(container, onSelect) {
  const world = new THREE.Scene();
  world.background = new THREE.Color('#edf1fc');
  const camera = new THREE.PerspectiveCamera(40, 1, .2, 15000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', t('viewer.canvasAria'));
  container.append(renderer.domElement);
  const labels = new CSS2DRenderer();
  Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  container.append(labels.domElement);
  const tooltip = document.createElement('div');
  tooltip.className = 'model-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true;
  container.append(tooltip);
  function hideHover() { tooltip.hidden = true; delete container.dataset.hoverId; }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .12;
  controls.minDistance = 40;
  controls.maxDistance = 5000;
  controls.maxPolarAngle = Math.PI * .95;
  const ambient = new THREE.HemisphereLight('#ffffff', '#9aaa8e', 2.5);
  const sun = new THREE.DirectionalLight('#fff8eb', 3.1);
  sun.position.set(-400, 700, 600);
  world.add(ambient, sun);
  const grid = new THREE.GridHelper(3000, 100, '#d1cee4', '#e0def0');
  grid.position.y = -17;
  world.add(grid);
  const scenes = new Map();
  let current, sceneId, active = true, request = 0, filter = 'all', wireId = '';

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    labels.setSize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  function reset() {
    if (!current) return;
    resize();
    current.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(current.root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    const distance = sphere.radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.15;
    const direction = sceneId === 'raspberry' || sceneId === 'pico'
      ? new THREE.Vector3(.03, .85, 1).normalize()
      : current.getCameraPreset('iso').position.sub(current.getCameraPreset('iso').target).normalize();
    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).addScaledVector(direction, distance);
    camera.lookAt(controls.target);
    controls.update();
  }

  async function setScene(id) {
    hideHover();
    const token = ++request;
    if (!scenes.has(id)) {
      const model = id === 'pcb' ? createPcbScene() : id === 'cloud' ? createCloudScene() : id === 'house' ? createRadioScene() : id === 'case' ? createCaseScene('enclosure') : createSetupScene(id === 'pico' ? 'pico' : 'pi3');
      model.root.visible = false;
      scenes.set(id, model);
      world.add(model.root);
    }
    const model = scenes.get(id);
    await model.readyPromise;
    if (token !== request) return null;
    for (const [key, value] of scenes) value.root.visible = key === id;
    world.background.set(id === 'cloud' ? '#fff2c6' : '#edf1fc');
    current = model; sceneId = id; wireId = ''; filter = 'all';
    filterWires();
    reset();
    container.dataset.scene = id;
    let meshes = 0;
    model.root.traverse(object => { if (object.isMesh) meshes++; });
    container.dataset.meshes = String(meshes);
    container.dataset.mode = model.getMode?.() || 'wiring';
    container.dataset.loaded = 'true';
    return model;
  }

  function filterWires() {
    if (!current?.cables || !Array.isArray(current.cables)) return;
    for (const cable of current.cables) {
      cable.group.visible = (filter === 'all' || cable.circuitGroup === filter) && (!wireId || wireId === cable.id);
    }
    current.setVisibleLabels(wireId, filter);
  }

  let start;
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hitAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObjects(current.pickables.filter(isVisible), false)[0];
  }
  function showHover(event, hit) {
    const info = hit && current?.getHoverInfo?.(hit);
    if (!info) { hideHover(); return; }
    tooltip.textContent = `${info.kind} · ${info.id} · ${info.title}`;
    tooltip.hidden = false; container.dataset.hoverId = info.id;
    const rect = container.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8,Math.min(event.clientX-rect.left+14,rect.width-tooltip.offsetWidth-8))}px`;
    tooltip.style.top = `${Math.max(8,Math.min(event.clientY-rect.top+14,rect.height-tooltip.offsetHeight-8))}px`;
  }
  renderer.domElement.addEventListener('pointermove', event => {
    if (!current?.getHoverInfo || event.buttons || !active) { hideHover(); return; }
    showHover(event, hitAt(event));
  });
  renderer.domElement.addEventListener('pointerleave', hideHover);
  controls.addEventListener('start', hideHover);
  renderer.domElement.addEventListener('pointerdown', event => { hideHover(); start = [event.clientX, event.clientY, event.button]; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!start || start[2] !== 0 || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5 || !current) return;
    start = null;
    const intersection = hitAt(event), hit = intersection?.object;
    if (!hit) { hideHover(); return; }
    showHover(event, intersection);
    const frame = hit.userData.partId && current.getHoverInfo?.(intersection);
    if (frame) { onSelect({ frame, scene: sceneId }); return; }
    const wire = hit.userData.wire;
    if (wire) onSelect({ wire, scene: sceneId });
    else if (hit.userData.cableId) onSelect({ wire: current.data.wires.find(item => item.id === hit.userData.cableId), scene: sceneId });
    else if (hit.userData.moduleId) {
      current.selectModule(hit.userData.moduleId);
      onSelect({ module: hit.userData.moduleId, scene: sceneId });
    }
  });
  // Pause rendering while the document or a non-3D tab is hidden.
  renderer.setAnimationLoop(() => {
    if (!active || document.hidden || !container.clientWidth) return;
    controls.update();
    renderer.render(world, camera);
    labels.render(world, camera);
  });

  return {
    setScene, reset,
    get current() { return current; },
    setActive(value) { hideHover(); active = value; if (!value) request++; else resize(); },
    async setMode(mode) { hideHover(); const model = current; await model.setMode(mode); if (model === current) { container.dataset.mode = mode; reset(); } },
    setWood(value) { current?.setWood?.(value); },
    setLabels(value) { current?.setLabels?.(value); },
    setPartColors(values) { current?.setPartColors?.(values); },
    setClearances(value) { current?.setClearances?.(value); },
    get stats() { return { scenes: scenes.size, ...renderer.info.memory, camera: camera.position.toArray(), target: controls.target.toArray(), mode: current?.getMode?.() }; },
    filter(value) { filter = value; wireId = ''; filterWires(); },
    selectWire(id) { wireId = id; if (Array.isArray(current?.cables)) filterWires(); else current?.selectWire(id); },
    dispose() {
      tooltip.remove(); observer.disconnect(); controls.dispose(); renderer.setAnimationLoop(null);
      const geometries = new Set(), materials = new Set();
      world.traverse(object => { if (object.geometry) geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) if (material) materials.add(material); });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); renderer.dispose();
    },
  };
}
