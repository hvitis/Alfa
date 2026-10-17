import adrEn from './.generated/adr.html?raw';
import adrPl from './.generated/adr.pl.html?raw';
import teachingEn from './.generated/teaching-adr.html?raw';
import teachingPl from './.generated/teaching-adr.pl.html?raw';
import './cloud/style.css';
import {createCloudColorControls} from './cloud/colors.js';
import {createStlViewer} from './cloud/stl-viewer.js';
import {initPricing} from './cloud/pricing.js';
import architecture from './content/architecture.mmd?raw';
import raspberryData from './hardware-visualisation/src/data/setup.json' with { type: 'json' };
import houseData from './hardware-visualisation/src/data/radio-house.json' with { type: 'json' };
import caseData from './hardware-visualisation/src/data/case-routing.json' with { type: 'json' };
import { createPicoData } from './hardware-visualisation/src/data/picoSetup.js';
import { getLocale, t, tr } from './i18n.js';

const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-tab]')];
const status = $('#app-status'), viewerStatus = $('#viewer-status');
const adrHTML = () => getLocale() === 'en' ? adrEn : adrPl;
const teachingHTML = () => getLocale() === 'en' ? teachingEn : teachingPl;
function plywoodModels() {
  return {
    house: { title: t('plywood.model.house.title'), description: t('plywood.model.house.description'), modes: [['assembled', t('plywood.mode.assembled')], ['roof_open', t('plywood.mode.roof')], ['inside', t('plywood.mode.inside')], ['exploded', t('plywood.mode.exploded')]], size: houseData.outer_mm, folder: 'house-radio' },
    case: { title: t('plywood.model.case.title'), description: t('plywood.model.case.description'), modes: [['enclosure', t('plywood.mode.assembled')], ['internals', t('plywood.mode.internals')], ['exploded', t('plywood.mode.exploded')]], size: [caseData.parameters.case.width, caseData.parameters.case.height, caseData.parameters.case.depth], folder: 'wooden-case' },
  };
}
const picoData = createPicoData();
let cloudColorControls, stlViewer;
let activeTab = '3dprint', viewerPromise, viewer, diagramPromise, teachingPromise, transition = 0, selectedWire = '', repository;

function fail(error) {
  status.textContent = t('error.view', { message: error.message });
  viewerStatus.textContent = status.textContent; viewerStatus.dataset.error = 'true';
  console.error(error);
}
function handle(promise) { Promise.resolve(promise).catch(fail); }
function hardwareData() { return $('#hardware-controller').value === 'pico' ? picoData : raspberryData; }

function endpoint(key, data) {
  if (/^P\d+$/.test(key)) return data.pinNames?.[key] ? t('endpoint.picoNamed', { name: data.pinNames[key] }) : t('endpoint.piPin', { pin: key.slice(1) });
  const names = { GND_JOIN: 'endpoint.gndJoin', V3: 'endpoint.v3', V5: 'endpoint.v5', RIN: 'endpoint.rin', J: 'endpoint.join', RGND: 'endpoint.rgnd', POWER: 'endpoint.power', USB: 'endpoint.usb', 'M+': 'endpoint.speakerPlus', 'M-': 'endpoint.speakerMinus' };
  if (names[key]) return t(names[key]);
  const modules = { L: 'endpoint.module.L', A: 'endpoint.module.A', M: 'endpoint.module.M', K: 'endpoint.module.K', S: 'endpoint.module.S' };
  return modules[key[0]] ? `${t(modules[key[0]])} ${key.slice(1)}` : key;
}

async function ensureViewer() {
  if (!viewerPromise) viewerPromise = import('./viewer.js').then(({ createViewer }) => {
    viewer = createViewer($('#viewport'), selection => {
      if (selection.wire) {
        if (activeTab === 'hardware') selectWire(selection.wire.id);
        else viewerStatus.textContent = `${selection.wire.id} · ${tr(selection.wire.title)}`;
      } else if (selection.frame) {
        viewerStatus.textContent = `${selection.frame.id} · ${selection.frame.title}`;
      } else if (selection.module) {
        const model = viewer.current?.data.components?.find(component => component.id === selection.module);
        viewerStatus.textContent = model?.title ? tr(model.title) : t('selection.component', { id: selection.module });
      }
    });
    return viewer;
  });
  return viewerPromise;
}

function fillPlywood() {
  const project = plywoodModels()[$('#plywood-project').value];
  $('#plywood-title').textContent = project.title; $('#plywood-description').textContent = project.description;
  $('#plywood-source').href = `${repository}/tree/main/design/${project.folder}`;
  $('#assembly-mode').replaceChildren(...project.modes.map(([value, title]) => new Option(title, value)));
  $('#plywood-facts').replaceChildren();
  for (const [label, value] of [[t('facts.width'), `${project.size[0]} mm`], [t('facts.height'), `${project.size[1]} mm`], [t('facts.depth'), `${project.size[2]} mm`], [t('facts.material'), t('facts.plywood')]]) {
    const item = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; item.append(term, detail); $('#plywood-facts').append(item);
  }
}

async function showScene() {
  const token = ++transition, hardware = activeTab === 'hardware', cloud = activeTab === '3dprint';
  if (!hardware && !cloud && activeTab !== 'plywood') return;
  $(`#${cloud ? "print" : activeTab}-slot`).append($('#viewer-card'));
  $('#assembly-mode').disabled = true;
  $('#viewport').dataset.loaded = 'false';
  viewerStatus.textContent = hardware ? t('viewer.loadingWiring') : t('viewer.loadingCad');
  delete viewerStatus.dataset.error;
  $('#scene-label').textContent = cloud ? t('viewer.sceneCloud') : hardware ? t('viewer.sceneHardware') : t('viewer.scenePlywood');
  const world = await ensureViewer();
  if (token !== transition) return;
  world.setActive(true);
  const model = await world.setScene(cloud ? 'cloud' : hardware ? $('#hardware-controller').value : $('#plywood-project').value);
  if (!model || token !== transition) return;
  if (cloud) {
    await world.setMode($('#cloud-mode').value);
    world.setLabels($('#cloud-labels').checked); world.setClearances($('#cloud-clearances').checked);
    fillCloud(model.data);
    world.setPartColors(cloudColorControls.getColors());
  } else if (!hardware) {
    const mode = $('#assembly-mode').value;
    if (model.getMode() !== mode) await world.setMode(mode);
    world.setWood($('#show-wood').checked); world.setLabels($('#show-labels').checked);
  } else {
    world.filter($('#circuit-filter').value);
    if (selectedWire) world.selectWire(selectedWire);
  }
  if (token === transition) {
    $('#assembly-mode').disabled = false;
    viewerStatus.textContent = hardware ? t('viewer.readyHardware') : cloud ? t('viewer.readyCloud') : t('viewer.readyPlywood');
    status.textContent = t('status.ready');
    document.documentElement.dataset.ready = 'true';
  }
}

function fillCloud(data) {
  $('#cloud-revision').textContent = t('cloud.revision', { revision: data.revision.replace('prototype-', 'PROTOTYPE ') });
  $('#cloud-facts').replaceChildren();
  for (const [label, value] of [[t('facts.width'), `${data.outer_mm[0]} mm`], [t('facts.height'), `${data.outer_mm[1]} mm`], [t('facts.depth'), `${data.outer_mm[2]} mm`], [t('facts.material'), data.material], ...(data.handle?.grip_depth ? [[t('facts.grip'), `${data.handle.grip_depth} mm`], [t('facts.battery'), t('facts.batteryHorizontal')]] : [])]) {
    const item = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; item.append(term, detail); $('#cloud-facts').append(item);
  }
  $('#cloud-verification').textContent = t('cloud.checks', { count: data.checks_count });
  $('#cloud-hardware').replaceChildren();
  for (const part of data.components) {
    const row = document.createElement('tr');
    for (const text of [`${part.id} · ${tr(part.title)}`, part.size.join(' × '), `${part.uncertain ? t('cloud.provisionalPrefix') : ''}${tr(part.source)}`]) {
      const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
    }
    $('#cloud-hardware').append(row);
  }
  $('#cloud-frame').replaceChildren();
  for (const feature of [...(data.frame_parts || []).map(part => ({...part, part: part.name})), ...(data.frame_features || [])]) {
    const row = document.createElement('tr');
    for (const text of [feature.id, tr(feature.title), t(`part.${feature.part}`)]) {
      const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
    }
    $('#cloud-frame').append(row);
  }
}

function selectWire(id) {
  const data = hardwareData(), wire = data.wires.find(item => item.id === id);
  selectedWire = wire?.id || '';
  if (wire) {
    $('#wire-detail').textContent = `${wire.id} · ${tr(wire.title)}\n${endpoint(wire.from, data)} → ${endpoint(wire.to, data)}`;
    if ($('#circuit-filter').value !== 'all' && $('#circuit-filter').value !== wire.group) {
      $('#circuit-filter').value = wire.group; viewer?.filter(wire.group); renderWires();
    }
  } else $('#wire-detail').textContent = t('hw.choose');
  viewer?.selectWire(selectedWire);
  for (const button of document.querySelectorAll('[data-wire]')) {
    button.setAttribute('aria-pressed', String(button.dataset.wire === selectedWire));
    button.closest('tr').dataset.selected = String(button.dataset.wire === selectedWire);
  }
}

function renderWires() {
  const data = hardwareData(), pico = $('#hardware-controller').value === 'pico', group = $('#circuit-filter').value;
  const wires = data.wires.filter(wire => group === 'all' || wire.group === group);
  $('#controller-title').textContent = pico ? t('controller.pico.title') : t('controller.pi.title');
  $('#controller-description').textContent = pico ? t('controller.pico.description') : t('controller.pi.description');
  $('#pico-notice').hidden = !pico;
  $('#wiring-caption').textContent = pico ? t('wiring.caption.pico') : t('wiring.caption.pi');
  $('#wire-count').textContent = t('hw.count', { shown: wires.length, total: data.wires.length });
  $('#wiring-body').replaceChildren();
  for (const wire of wires) {
    const row = document.createElement('tr'), control = document.createElement('td'), button = document.createElement('button');
    button.className = 'wire-button'; button.dataset.wire = wire.id;
    button.setAttribute('aria-label', t('hw.trace', { id: wire.id })); button.setAttribute('aria-pressed', String(selectedWire === wire.id));
    const dot = document.createElement('i'); dot.className = 'wire-dot'; dot.style.setProperty('--wire-color', wire.color);
    button.append(dot, document.createTextNode(wire.id)); button.addEventListener('click', () => selectWire(wire.id)); control.append(button); row.append(control);
    const signal = document.createElement('td'), groupLabel = document.createElement('small');
    signal.textContent = tr(wire.title); groupLabel.textContent = t(`group.${wire.group}`); signal.append(groupLabel); row.append(signal);
    for (const end of [wire.from, wire.to]) { const cell = document.createElement('td'); cell.textContent = endpoint(end, data); row.append(cell); }
    $('#wiring-body').append(row);
  }
}

// The teaching ADR keeps its diagram as Mermaid source; draw it on first view.
async function renderTeachingDiagram() {
  const source = $('#teaching-adr-content code.language-mermaid');
  if (!source) return;
  const container = document.createElement('div');
  container.className = 'teaching-diagram'; container.setAttribute('aria-busy', 'true');
  source.parentElement.replaceWith(container);
  const { renderArchitecture } = await import('./software.js');
  await renderArchitecture(container, source.textContent, { id: 'teaching-architecture', label: t('teaching.diagramLabel') });
}

async function showSoftware() {
  const view = $('#software-view').value;
  for (const name of ['design', 'implementation', 'teaching']) $(`#software-${name}`).hidden = view !== name;
  if (view === 'implementation') {
    diagramPromise ??= import('./software.js').then(({ renderArchitecture }) => renderArchitecture($('#architecture-diagram'), architecture, { label: t('software.diagramLabel') }));
    await diagramPromise;
  }
  if (view === 'teaching') {
    teachingPromise ??= renderTeachingDiagram();
    await teachingPromise;
  }
}

async function activate(name, updateHash = true) {
  if (!tabs.some(tab => tab.dataset.tab === name)) name = '3dprint';
  activeTab = name;
  $('#viewer-card').hidden = !['plywood', 'hardware', '3dprint'].includes(name);
  for (const tab of tabs) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    $(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
  }
  if (updateHash) history.replaceState(null, '', `#${name}`);
  stlViewer?.setActive(name === '3dprint');
  if (['plywood', 'hardware', '3dprint'].includes(name)) await showScene();
  else {
    transition++; viewer?.setActive(false); status.textContent = '';
    if (name === 'software') await showSoftware();
  }
}

async function start() {
  const response = await fetch('./data/manifest.json');
  if (!response.ok) throw new Error(`Specifications returned HTTP ${response.status}`);
  repository = (await response.json()).repository;
  $('#adr-content').innerHTML = adrHTML(); // Build-time Markdown rendering, with raw HTML disabled.
  $('#teaching-adr-content').innerHTML = teachingHTML();
  $('#mermaid-source').textContent = architecture;
  fillPlywood(); renderWires();
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => handle(activate(tab.dataset.tab)));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus(); handle(activate(tabs[next].dataset.tab));
    });
  });
  $('#plywood-project').addEventListener('change', () => { fillPlywood(); handle(showScene()); });
  $('#assembly-mode').addEventListener('change', () => {
    const select = $('#assembly-mode'); select.disabled = true;
    handle(viewer.setMode(select.value).finally(() => { select.disabled = false; }));
  });
  $('#show-wood').addEventListener('change', () => viewer?.setWood($('#show-wood').checked));
  $('#show-labels').addEventListener('change', () => viewer?.setLabels($('#show-labels').checked));
  $('#cloud-mode').addEventListener('change', () => {
    const select = $('#cloud-mode'); select.disabled = true;
    handle(viewer.setMode(select.value).finally(() => { select.disabled = false; }));
  });
  $('#cloud-labels').addEventListener('change', () => viewer?.setLabels($('#cloud-labels').checked));
  $('#cloud-clearances').addEventListener('change', () => viewer?.setClearances($('#cloud-clearances').checked));
  $('#hardware-controller').addEventListener('change', () => { selectedWire = ''; $('#circuit-filter').value = 'all'; renderWires(); $('#wire-detail').textContent = t('hw.choose'); handle(showScene()); });
  $('#circuit-filter').addEventListener('change', () => { selectedWire = ''; viewer?.filter($('#circuit-filter').value); renderWires(); selectWire(''); });
  $('#clear-wire').addEventListener('click', () => { $('#circuit-filter').value = 'all'; viewer?.filter('all'); selectedWire = ''; renderWires(); selectWire(''); });
  $('#reset-camera').addEventListener('click', () => viewer?.reset());
  $('#software-view').addEventListener('change', () => handle(showSoftware()));
  window.addEventListener('hashchange', () => handle(activate(location.hash.slice(1), false)));
  window.addEventListener('pagehide', () => { viewer?.dispose(); stlViewer?.dispose(); }, { once: true });
  cloudColorControls = createCloudColorControls($('#cloud-colors'), colors => {
    viewer?.setPartColors(colors);
    stlViewer?.setPartColors(colors);
  });
  const stlContainer = $('#stl-viewer');
  if (stlContainer) {
    stlViewer = createStlViewer(stlContainer, { initialColors: cloudColorControls.getColors() });
  }
  initPricing($('#cloud-pricing'));
  await activate(location.hash.slice(1) || '3dprint', false);
  document.documentElement.dataset.ready = 'true';
}
start().catch(fail);

// Vite is present only in development. Static exports need no server connection.
if (import.meta.hot) {
  const liveStatus = document.createElement('p');
  liveStatus.className = 'dev-cad-status'; liveStatus.setAttribute('role', 'status');
  document.body.append(liveStatus);
  import.meta.hot.on('cloud:building', () => { liveStatus.textContent = t('dev.building'); });
  import.meta.hot.on('cloud:error', event => { liveStatus.textContent = t('dev.error', { message: event.message }); });
  import.meta.hot.on('cloud:ready', () => location.reload());
  window.__cloudViewerStats = () => viewer?.stats;
}
