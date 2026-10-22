import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { t } from '../i18n.js';

export const STL_PARTS = {
  front: { id: 'front', file: 'front.stl', name: 'Front shell', defaultColor: '#86bfea' },
  rear: { id: 'rear', file: 'rear.stl', name: 'Rear shell', defaultColor: '#70acd9' },
};

export function createStlViewer(container, options = {}) {
  const viewport = container.querySelector('#stl-viewport');
  const nameEl = container.querySelector('#stl-current-name');
  const statusEl = container.querySelector('#stl-viewer-status');
  const fileInfoEl = container.querySelector('#stl-file-info');
  const resetBtn = container.querySelector('#stl-reset-camera');
  const partBtns = container.querySelectorAll('[data-stl-select]');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#fff8eb');

  const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', t('stl.aria'));
  viewport.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minDistance = 30;
  controls.maxDistance = 2500;

  // Gentle studio lights highlighting the printed CAD geometry
  const ambient = new THREE.HemisphereLight('#ffffff', '#9aaa8e', 2.3);
  const sun = new THREE.DirectionalLight('#fff8eb', 2.8);
  sun.position.set(200, 400, 350);
  const fill = new THREE.DirectionalLight('#dce7ff', 1.6);
  fill.position.set(-200, -100, -300);
  scene.add(ambient, sun, fill);

  // Subtle ground grid
  const grid = new THREE.GridHelper(800, 40, '#e5d8b8', '#ede3ca');
  grid.position.y = -60;
  scene.add(grid);

  const loader = new STLLoader();
  const geometryCache = new Map();
  let currentPart = 'front';
  let currentColors = { ...options.initialColors };
  let mesh = null;
  let active = true;

  function resize() {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);

  function resetCamera() {
    if (!mesh) return;
    resize();
    mesh.geometry.computeBoundingSphere();
    const sphere = mesh.geometry.boundingSphere;
    const distance = (sphere?.radius || 100) * 2.3;
    if (currentPart === 'front') {
      camera.position.set(distance * 0.45, distance * 0.35, -distance * 1.1);
    } else {
      camera.position.set(distance * 0.7, distance * 0.6, distance * 0.9);
    }
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function getPartColor(partId) {
    return currentColors[partId] || STL_PARTS[partId]?.defaultColor || '#86bfea';
  }

  function syncUI(partId) {
    const meta = STL_PARTS[partId];
    if (!meta) return;
    const partLabel = t(`part.${partId}`);
    if (nameEl) nameEl.textContent = partLabel;
    if (fileInfoEl) fileInfoEl.textContent = meta.file;
    if (statusEl) statusEl.textContent = t('stl.loaded', { name: partLabel });

    partBtns.forEach(btn => {
      const isSelected = btn.dataset.stlSelect === partId;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    document.querySelectorAll('.stl-view-button').forEach(btn => {
      const isSelected = btn.dataset.stl === partId;
      btn.setAttribute('aria-pressed', String(isSelected));
    });
  }

  async function loadPart(partId) {
    if (!STL_PARTS[partId]) partId = 'front';
    currentPart = partId;
    syncUI(partId);

    if (statusEl) statusEl.textContent = t('stl.loading', { file: STL_PARTS[partId].file });

    let geometry = geometryCache.get(partId);
    if (!geometry) {
      try {
        const url = new URL(`./cloud/${STL_PARTS[partId].file}?v=v3`, document.baseURI).href;
        geometry = await loader.loadAsync(url);
        geometry.computeVertexNormals();
        geometry.center();
        geometryCache.set(partId, geometry);
      } catch (err) {
        if (statusEl) statusEl.textContent = t('stl.failed', { file: STL_PARTS[partId].file, message: err.message });
        return;
      }
    }

    if (!mesh) {
      const material = new THREE.MeshStandardMaterial({
        color: getPartColor(partId),
        roughness: 0.65,
        metalness: 0.08,
      });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    } else {
      mesh.geometry = geometry;
      mesh.material.color.set(getPartColor(partId));
    }

    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      grid.position.y = geometry.boundingBox.min.y - 1;
    }

    resetCamera();
    syncUI(partId);
  }

  function setPartColors(colors) {
    currentColors = { ...currentColors, ...colors };
    if (mesh && currentPart) {
      mesh.material.color.set(getPartColor(currentPart));
    }
  }

  renderer.setAnimationLoop(() => {
    if (!active || document.hidden || !viewport.clientWidth) return;
    controls.update();
    renderer.render(scene, camera);
  });

  resetBtn?.addEventListener('click', resetCamera);

  partBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      loadPart(btn.dataset.stlSelect);
    });
  });

  // Bind all eye preview buttons in the download section
  document.querySelectorAll('.stl-view-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const part = btn.dataset.stl;
      if (part) {
        loadPart(part);
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // By default, load the front shell
  loadPart('front');

  return {
    loadPart,
    setPartColors,
    resetCamera,
    setActive(value) {
      active = value;
      if (value) resize();
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      renderer.setAnimationLoop(null);
      geometryCache.forEach(geo => geo.dispose());
      geometryCache.clear();
      mesh?.material?.dispose();
      renderer.dispose();
    },
  };
}
