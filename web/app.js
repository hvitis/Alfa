import adrEn from './.generated/adr.html?raw';
import adrPl from './.generated/adr.pl.html?raw';
import teachingEn from './.generated/teaching-adr.html?raw';
import teachingPl from './.generated/teaching-adr.pl.html?raw';
import './cloud/style.css';
import './pcb/style.css';
import {createCloudColorControls} from './cloud/colors.js';
import {createStlViewer} from './cloud/stl-viewer.js';
import {initPricing} from './cloud/pricing.js';
import architecture from './content/architecture.mmd?raw';
import raspberryData from './hardware-visualisation/src/data/setup.json' with { type: 'json' };
import houseData from './hardware-visualisation/src/data/radio-house.json' with { type: 'json' };
import caseData from './hardware-visualisation/src/data/case-routing.json' with { type: 'json' };
import { createPicoData } from './hardware-visualisation/src/data/picoSetup.js';
import { getLocale, t, tr } from './i18n.js';
import {readRoute,writeRoute,routeFields} from './routes.js';
import pcbSpecification from '../design/pi3-shield/generated/design.json' with {type: 'json'};
import pcbArchive from '../design/pi3-shield/generated/alfa-pi3-shield-prototype.zip?url';
import pcbSchematic from '../design/pi3-shield/generated/schematic.pdf?url';
import pcbStep from '../design/pi3-shield/generated/shield.step?url';
import pcbGerbers from '../design/pi3-shield/generated/fabrication-draft.zip?url';

const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-tab]')];
const status = $('#app-status'), viewerStatus = $('#viewer-status');
const adrHTML = () => getLocale() === 'en' ? adrEn : adrPl;
const teachingHTML = () => getLocale() === 'en' ? teachingEn : teachingPl;

function plywoodModels() {
  return {
    case: { title: t('plywood.model.case.title'), description: t('plywood.model.case.description'), modes: [['enclosure', t('plywood.mode.assembled')], ['internals', t('plywood.mode.internals')], ['exploded', t('plywood.mode.exploded')]], size: [caseData.parameters.case.width, caseData.parameters.case.height, caseData.parameters.case.depth], folder: 'wooden-case' },
    house: { title: t('plywood.model.house.title'), description: t('plywood.model.house.description'), modes: [['assembled', t('plywood.mode.assembled')], ['roof_open', t('plywood.mode.roof')], ['inside', t('plywood.mode.inside')], ['exploded', t('plywood.mode.exploded')]], size: houseData.outer_mm, folder: 'house-radio' },
  };
}
const picoData = createPicoData();
let cloudColorControls, stlViewer;
let activeTab = 'glowna', viewerPromise, viewer, diagramPromise, teachingPromise, devicePromise, transition = 0, selectedWire = '', repository;

function syncPillGroup(groupEl, value) {
  if (!groupEl) return;
  for (const btn of groupEl.querySelectorAll('.pill-btn')) {
    const active = btn.dataset.value === value;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
}

function initPillGroup(groupEl, inputEl, onChange) {
  if (!groupEl || !inputEl) return;
  groupEl.addEventListener('click', event => {
    const btn = event.target.closest('.pill-btn');
    if (!btn || !groupEl.contains(btn)) return;
    const val = btn.dataset.value;
    if (inputEl.value === val) return;
    inputEl.value = val;
    syncPillGroup(groupEl, val);
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (onChange) onChange(val);
  });
}

function languageLinks() {
  for (const link of document.querySelectorAll('a[hreflang][lang]')) {
    const isEn = link.getAttribute('lang') === 'en';
    const basePath = isEn ? 'en/' : '';
    const url = new URL(basePath, document.baseURI);
    url.search = location.search;
    url.hash = location.hash;
    link.href = url.href;
    if (/(?:^|\/)pcb\//.test(location.pathname)) {
      url.searchParams.set('controller', $('#hardware-controller').value);
      url.hash = location.hash || 'elektronika';
      link.href = url.href;
    }
  }
}

function syncRoute() {
  const values = Object.fromEntries(routeFields.map(([,id]) => [id, document.getElementById(id)?.value || '']));
  history.replaceState(null, '', writeRoute(new URL(location.href), activeTab, values));
  languageLinks();
}

function setEnclosureSubView(subview, sync = true) {
  const input = $('#obudowa-view');
  if (input) input.value = subview;
  for (const btn of document.querySelectorAll('[data-subview]')) {
    const active = btn.dataset.subview === subview;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  const filamentPanel = $('#subview-filament');
  const sklejkaPanel = $('#subview-sklejka');
  if (filamentPanel) filamentPanel.hidden = subview !== 'filament';
  if (sklejkaPanel) sklejkaPanel.hidden = subview !== 'sklejka';
  stlViewer?.setActive(activeTab === 'obudowa' && subview === 'filament');
  if (activeTab === 'obudowa') handle(showScene());
  if (sync) syncRoute();
}

function setController(controller, sync = true) {
  const input = $('#hardware-controller');
  if (input) input.value = controller;
  for (const btn of document.querySelectorAll('[data-controller]')) {
    const active = btn.dataset.controller === controller;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }
  selectedWire = '';
  $('#circuit-filter').value = 'all';
  syncPillGroup(document.querySelector('[data-for="circuit-filter"]'), 'all');
  renderWires();
  $('#wire-detail').textContent = t('hw.choose');
  if (activeTab === 'elektronika') handle(showScene());
  if (sync) syncRoute();
}

function restoreRoute() {
  const route = readRoute(new URL(location.href));
  activeTab = route.tab;
  for (const [,id] of routeFields) {
    if (id === 'assembly-mode') continue;
    const input = document.getElementById(id);
    if (!input) continue;
    input.value = route.values[id];
    const group = document.querySelector(`[data-for="${id}"]`);
    if (group) syncPillGroup(group, route.values[id]);
  }
  setEnclosureSubView(route.values['obudowa-view'] || 'filament', false);
  setController(route.values['hardware-controller'] || 'raspberry', false);
  fillPlywood();
  const project = plywoodModels()[$('#plywood-project').value];
  const curAssembly = route.values['assembly-mode'];
  const validAssembly = project.modes.some(([val]) => val === curAssembly) ? curAssembly : project.modes[0][0];
  const assembly = $('#assembly-mode');
  if (assembly) {
    assembly.value = validAssembly;
    syncPillGroup($('#assembly-mode-group'), validAssembly);
  }
  renderWires();
  selectedWire = '';
  languageLinks();
  return route;
}

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
        if (activeTab === 'elektronika') selectWire(selection.wire.id);
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
  $('#plywood-title').textContent = project.title;
  $('#plywood-description').textContent = project.description;
  $('#plywood-source').href = `${repository}/tree/main/design/${project.folder}`;
  const group = $('#assembly-mode-group');
  if (group) {
    const curVal = $('#assembly-mode').value;
    const validVal = project.modes.some(([val]) => val === curVal) ? curVal : project.modes[0][0];
    $('#assembly-mode').value = validVal;
    group.replaceChildren(...project.modes.map(([value, title]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pill-btn ${value === validVal ? 'active' : ''}`;
      btn.dataset.value = value;
      btn.setAttribute('aria-pressed', String(value === validVal));
      btn.textContent = title;
      btn.addEventListener('click', () => {
        $('#assembly-mode').value = value;
        syncPillGroup(group, value);
        handle(viewer?.setMode(value));
        $('#assembly-mode').dispatchEvent(new Event('change', { bubbles: true }));
      });
      return btn;
    }));
  }
  $('#plywood-facts').replaceChildren();
  for (const [label, value] of [[t('facts.width'), `${project.size[0]} mm`], [t('facts.height'), `${project.size[1]} mm`], [t('facts.depth'), `${project.size[2]} mm`], [t('facts.material'), t('facts.plywood')]]) {
    const item = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; item.append(term, detail); $('#plywood-facts').append(item);
  }
}

async function showScene() {
  const token = ++transition;
  const isObudowa = activeTab === 'obudowa';
  const isElektronika = activeTab === 'elektronika';
  if (!isObudowa && !isElektronika) return;
  const isFilament = isObudowa && $('#obudowa-view').value === 'filament';
  const isPlywood = isObudowa && $('#obudowa-view').value === 'sklejka';
  const slot = isFilament ? $('#print-slot') : isPlywood ? $('#plywood-slot') : $('#hardware-slot');
  slot.append($('#viewer-card'));
  $('#viewport').dataset.loaded = 'false';
  viewerStatus.textContent = isElektronika ? t('viewer.loadingWiring') : t('viewer.loadingCad');
  delete viewerStatus.dataset.error;
  $('#scene-label').textContent = isFilament ? t('viewer.sceneCloud') : isElektronika ? t('viewer.sceneHardware') : t('viewer.scenePlywood');
  const world = await ensureViewer();
  if (token !== transition) return;
  world.setActive(true);
  const sceneName = isFilament ? 'cloud' : isElektronika ? $('#hardware-controller').value : $('#plywood-project').value;
  const model = await world.setScene(sceneName);
  if (!model || token !== transition) return;
  if (isFilament) {
    await world.setMode($('#cloud-mode').value);
    world.setLabels($('#cloud-labels').checked);
    world.setClearances($('#cloud-clearances').checked);
    fillCloud(model.data);
    world.setPartColors(cloudColorControls.getColors());
  } else if (isPlywood) {
    const mode = $('#assembly-mode').value;
    if (model.getMode() !== mode) await world.setMode(mode);
    world.setWood($('#show-wood').checked);
    world.setLabels($('#show-labels').checked);
  } else if ($('#hardware-controller').value === 'pcb') {
    await world.setMode($('#pcb-mode').value);
    world.setLabels($('#pcb-labels').checked);
  } else {
    world.filter($('#circuit-filter').value);
    if (selectedWire) world.selectWire(selectedWire);
  }
  if (token === transition) {
    viewerStatus.textContent = isElektronika && $('#hardware-controller').value === 'pcb' ? t('pcb.ready') : isElektronika ? t('viewer.readyHardware') : isFilament ? t('viewer.readyCloud') : t('viewer.readyPlywood');
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
      $('#circuit-filter').value = wire.group;
      syncPillGroup(document.querySelector('[data-for="circuit-filter"]'), wire.group);
      viewer?.filter(wire.group);
      renderWires();
    }
  } else $('#wire-detail').textContent = t('hw.choose');
  viewer?.selectWire(selectedWire);
  for (const button of document.querySelectorAll('[data-wire]')) {
    button.setAttribute('aria-pressed', String(button.dataset.wire === selectedWire));
    button.closest('tr').dataset.selected = String(button.dataset.wire === selectedWire);
  }
}

function renderWires() {
  const pcb = $('#hardware-controller').value === 'pcb';
  const pcbWip = $('#pcb-wip-card');
  if (pcbWip) pcbWip.hidden = !pcb;
  $('#pcb-controls').hidden = !pcb; $('#pcb-details').hidden = !pcb;
  for (const element of document.querySelectorAll('#panel-elektronika .wiring-heading, #wiring-table, #panel-elektronika .selected-wire, #panel-elektronika [data-for="circuit-filter"], #panel-elektronika .field-label[data-i18n="hw.circuitLabel"], #hardware-wiring-note, #hardware-diagram-card')) element.hidden = pcb;
  if (pcb) {
    $('#controller-title').textContent = t('pcb.title'); $('#controller-description').textContent = t('pcb.description');
    $('#pico-notice').hidden = true;
    $('#pcb-parts').replaceChildren(...pcbSpecification.components.filter(c => !c.ref.startsWith('TP')).map(c => {
      const row = document.createElement('tr');
      for (const value of [c.ref, c.value, c.ref === 'J1' ? t('pcb.bottom') : c.ref.startsWith('J') ? t('pcb.tht') : t('pcb.smt')]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      return row;
    }));
    for (const [id, url] of [['pcb-archive', pcbArchive], ['pcb-schematic', pcbSchematic], ['pcb-step', pcbStep], ['pcb-gerbers', pcbGerbers]]) $(id.startsWith('#') ? id : `#${id}`).href = url;
    return;
  }
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
  const diagramEl = $('#architecture-diagram');
  if (diagramEl) {
    diagramPromise ??= import('./software.js').then(({ renderArchitecture }) => renderArchitecture(diagramEl, architecture, { label: t('software.diagramLabel') }));
    await diagramPromise;
  }
  const deviceEl = $('#device-demo');
  if (deviceEl) {
    devicePromise ??= import('./device-app.js').then(({ mountDevice }) => mountDevice(deviceEl));
    (await devicePromise).setActive(true);
  }
}

async function activate(name, updateHash = true) {
  const allowed = ['glowna', 'obudowa', 'elektronika', 'oprogramowanie', 'inne'];
  if (!allowed.includes(name)) name = 'glowna';
  activeTab = name;
  $('#viewer-card').hidden = !['obudowa', 'elektronika'].includes(name);
  for (const tab of tabs) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.classList.toggle('active', selected);
    tab.tabIndex = selected ? 0 : -1;
    const panel = $(`#panel-${tab.dataset.tab}`);
    if (panel) panel.hidden = !selected;
  }
  if (updateHash) syncRoute();
  stlViewer?.setActive(name === 'obudowa' && $('#obudowa-view').value === 'filament');
  if (['obudowa', 'elektronika'].includes(name)) {
    const device = await devicePromise;
    device?.setActive(false);
    await showScene();
  } else {
    transition++; viewer?.setActive(false); status.textContent = '';
    const device = await devicePromise;
    if (name === 'oprogramowanie') {
      await showSoftware();
    } else {
      device?.setActive(false);
    }
    if (name === 'inne') {
      if (!$('#teaching-adr-content').hidden) {
        teachingPromise ??= renderTeachingDiagram();
        await teachingPromise;
      }
    }
  }
}

async function start() {
  const response = await fetch('./data/manifest.json');
  const manifest = await response.json();
  repository = manifest.repository;
  const adrEl = $('#adr-content');
  if (adrEl) adrEl.innerHTML = adrHTML();
  const teachingEl = $('#teaching-adr-content');
  if (teachingEl) teachingEl.innerHTML = teachingHTML();
  const mermaidEl = $('#mermaid-source');
  if (mermaidEl) mermaidEl.textContent = architecture;

  // Initialize pill groups
  initPillGroup($('[data-for="cloud-mode"]'), $('#cloud-mode'), () => handle(viewer?.setMode($('#cloud-mode').value)));
  initPillGroup($('[data-for="pricing-case"]'), $('#pricing-case'));
  initPillGroup($('[data-for="pricing-controller"]'), $('#pricing-controller'));
  initPillGroup($('[data-for="plywood-project"]'), $('#plywood-project'), () => { fillPlywood(); handle(showScene()); });
  initPillGroup($('[data-for="circuit-filter"]'), $('#circuit-filter'), val => { selectedWire = ''; viewer?.filter(val); renderWires(); selectWire(''); });
  initPillGroup($('[data-for="pcb-mode"]'), $('#pcb-mode'), val => handle(viewer?.setMode(val)));
  initPillGroup($('#assembly-mode-group'), $('#assembly-mode'), val => handle(viewer?.setMode(val)));
  $('#assembly-mode')?.addEventListener('change', () => handle(viewer?.setMode($('#assembly-mode').value)));

  // Subpage top navigation
  for (const btn of document.querySelectorAll('[data-subview]')) {
    btn.addEventListener('click', () => setEnclosureSubView(btn.dataset.subview));
  }
  for (const btn of document.querySelectorAll('[data-controller]')) {
    btn.addEventListener('click', () => setController(btn.dataset.controller));
  }

  // Version dropdown toggle
  const versionBtn = $('#version-btn');
  const versionSwitch = $('#version-switch');
  if (versionBtn && versionSwitch) {
    versionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = versionSwitch.classList.toggle('open');
      versionBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!versionSwitch.contains(e.target)) {
        versionSwitch.classList.remove('open');
        versionBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Main page feature card buttons
  for (const btn of document.querySelectorAll('.card-nav-btn')) {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) handle(activate(target));
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => handle(activate(tab.dataset.tab)));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus(); handle(activate(tabs[next].dataset.tab));
    });
  });

  $('#show-wood')?.addEventListener('change', () => viewer?.setWood($('#show-wood').checked));
  $('#show-labels')?.addEventListener('change', () => viewer?.setLabels($('#show-labels').checked));
  $('#cloud-labels')?.addEventListener('change', () => viewer?.setLabels($('#cloud-labels').checked));
  $('#cloud-clearances')?.addEventListener('change', () => viewer?.setClearances($('#cloud-clearances').checked));
  $('#pcb-labels')?.addEventListener('change', () => viewer?.setLabels($('#pcb-labels').checked));
  const teachingToggle = $('#show-teaching-adr-btn');
  const teachingContent = $('#teaching-adr-content');
  if (teachingToggle && teachingContent) {
    teachingToggle.addEventListener('click', async () => {
      const willShow = teachingContent.hidden;
      teachingContent.hidden = !willShow;
      teachingToggle.setAttribute('aria-expanded', String(willShow));
      teachingToggle.querySelector('span').textContent = willShow ? t('inne.hideAdr') : t('inne.showAdr');
      if (willShow) {
        teachingPromise ??= renderTeachingDiagram();
        await teachingPromise;
      }
    });
  }
  $('#clear-wire')?.addEventListener('click', () => {
    $('#circuit-filter').value = 'all';
    syncPillGroup(document.querySelector('[data-for="circuit-filter"]'), 'all');
    viewer?.filter('all');
    selectedWire = '';
    renderWires();
    selectWire('');
  });
  $('#reset-camera')?.addEventListener('click', () => viewer?.reset());

  for (const [, id] of routeFields) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', syncRoute);
  }

  function navigate() {
    const route = restoreRoute();
    handle(activate(route.tab, false));
  }
  window.addEventListener('hashchange', navigate);
  window.addEventListener('popstate', navigate);
  window.addEventListener('pagehide', () => {
    viewer?.dispose();
    stlViewer?.dispose();
    devicePromise?.then(device => device.setActive(false));
  }, { once: true });

  cloudColorControls = createCloudColorControls($('#cloud-colors'), colors => {
    viewer?.setPartColors(colors);
    stlViewer?.setPartColors(colors);
  });
  const stlContainer = $('#stl-viewer');
  if (stlContainer) {
    stlViewer = createStlViewer(stlContainer, { initialColors: cloudColorControls.getColors() });
  }
  initPricing($('#cloud-pricing'));

  const initialRoute = restoreRoute();
  await activate(initialRoute.tab, false);
  document.documentElement.dataset.ready = 'true';
}
start().catch(fail);

if (import.meta.hot) {
  const liveStatus = document.createElement('p');
  liveStatus.className = 'dev-cad-status'; liveStatus.setAttribute('role', 'status');
  document.body.append(liveStatus);
  import.meta.hot.on('cloud:building', () => { liveStatus.textContent = t('dev.building'); });
  import.meta.hot.on('cloud:error', event => { liveStatus.textContent = t('dev.error', { message: event.message }); });
  import.meta.hot.on('cloud:ready', () => location.reload());
  window.__cloudViewerStats = () => viewer?.stats;
}
