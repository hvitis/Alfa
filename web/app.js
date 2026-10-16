import adrHTML from './.generated/adr.html?raw';
import './cloud/style.css';
import architecture from './content/architecture.mmd?raw';
import raspberryData from './hardware-visualisation/src/data/setup.json' with { type: 'json' };
import houseData from './hardware-visualisation/src/data/radio-house.json' with { type: 'json' };
import caseData from './hardware-visualisation/src/data/case-routing.json' with { type: 'json' };
import { createPicoData } from './hardware-visualisation/src/data/picoSetup.js';

const $ = selector => document.querySelector(selector);
const tabs = [...document.querySelectorAll('[data-tab]')];
const status = $('#app-status'), viewerStatus = $('#viewer-status');
const models = {
  house: { title: 'Little House Radio', description: 'A plywood enclosure with an opening roof, room for the electronics, and a carry handle.', modes: [['assembled', 'Assembled'], ['roof_open', 'Roof open'], ['inside', 'Inside'], ['exploded', 'Exploded']], size: houseData.outer_mm, folder: 'house-radio' },
  case: { title: 'Original plywood case', description: 'A compact 6 mm plywood enclosure with a removable rear cover and space for the Pi, screen, buttons, and power bank.', modes: [['enclosure', 'Assembled'], ['internals', 'Inside'], ['exploded', 'Exploded']], size: [caseData.parameters.case.width, caseData.parameters.case.height, caseData.parameters.case.depth], folder: 'wooden-case' },
};
const picoData = createPicoData();
let activeTab = 'plywood', viewerPromise, viewer, diagramPromise, transition = 0, selectedWire = '', repository;

function fail(error) {
  status.textContent = `Unable to complete this view: ${error.message}`;
  viewerStatus.textContent = status.textContent; viewerStatus.dataset.error = 'true';
  console.error(error);
}
function handle(promise) { Promise.resolve(promise).catch(fail); }
function hardwareData() { return $('#hardware-controller').value === 'pico' ? picoData : raspberryData; }

function endpoint(key, data) {
  if (/^P\d+$/.test(key)) return data.pinNames?.[key] ? `Pico ${data.pinNames[key]}` : `Raspberry Pi physical pin ${key.slice(1)}`;
  const names = { GND_JOIN: 'Shared ground join', V3: 'Shared 3.3 V join', V5: 'Shared USB 5 V join', RIN: 'R1 input', J: 'R1 / R2 / ADC A0 join', RGND: 'R2 ground end', POWER: '5 V USB supply', USB: 'Controller USB input', 'M+': 'Speaker +', 'M-': 'Speaker −' };
  if (names[key]) return names[key];
  const modules = { L: 'LCD', A: 'ADC', M: 'Amplifier', K: 'Keypad', S: 'Speaker' };
  return modules[key[0]] ? `${modules[key[0]]} ${key.slice(1)}` : key;
}

async function ensureViewer() {
  if (!viewerPromise) viewerPromise = import('./viewer.js').then(({ createViewer }) => {
    viewer = createViewer($('#viewport'), selection => {
      if (selection.wire) {
        if (activeTab === 'hardware') selectWire(selection.wire.id);
        else viewerStatus.textContent = `${selection.wire.id} · ${selection.wire.title}`;
      } else if (selection.frame) {
        viewerStatus.textContent = `${selection.frame.id} · ${selection.frame.title}`;
      } else if (selection.module) {
        const model = viewer.current?.data.components?.find(component => component.id === selection.module);
        viewerStatus.textContent = model?.title || `Selected component: ${selection.module}`;
      }
    });
    return viewer;
  });
  return viewerPromise;
}

function fillPlywood() {
  const project = models[$('#plywood-project').value];
  $('#plywood-title').textContent = project.title; $('#plywood-description').textContent = project.description;
  $('#plywood-source').href = `${repository}/tree/main/design/${project.folder}`;
  $('#assembly-mode').replaceChildren(...project.modes.map(([value, title]) => new Option(title, value)));
  $('#plywood-facts').replaceChildren();
  for (const [label, value] of [['Width', `${project.size[0]} mm`], ['Height', `${project.size[1]} mm`], ['Depth', `${project.size[2]} mm`], ['Material', '6 mm plywood']]) {
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
  viewerStatus.textContent = hardware ? 'Loading wiring…' : 'Loading the CAD model…';
  delete viewerStatus.dataset.error;
  $('#scene-label').textContent = cloud ? 'CLOUD RADIO / PRINTABLE CAD' : hardware ? 'HARDWARE / WIRING ATLAS' : 'PLYWOOD / 3D MODEL';
  const world = await ensureViewer();
  if (token !== transition) return;
  world.setActive(true);
  const model = await world.setScene(cloud ? 'cloud' : hardware ? $('#hardware-controller').value : $('#plywood-project').value);
  if (!model || token !== transition) return;
  if (cloud) {
    await world.setMode($('#cloud-mode').value);
    world.setLabels($('#cloud-labels').checked); world.setClearances($('#cloud-clearances').checked);
    fillCloud(model.data);
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
    viewerStatus.textContent = hardware ? 'All connections are available in the wiring table below.' : cloud ? 'Hover or tap for frame IDs and hardware names · drag to rotate.' : 'Model loaded · drag to inspect the actual CAD geometry.';
    status.textContent = 'Ready · 3D models, wiring, and documents load from this static website.';
    document.documentElement.dataset.ready = 'true';
  }
}

function fillCloud(data) {
  $('#cloud-revision').textContent = `PETG / ${data.revision.replace('prototype-', 'PROTOTYPE ')}`;
  $('#cloud-facts').replaceChildren();
  for (const [label, value] of [['Width', `${data.outer_mm[0]} mm`], ['Height', `${data.outer_mm[1]} mm`], ['Depth', `${data.outer_mm[2]} mm`], ['Material', data.material], ...(data.handle?.grip_depth ? [['Grip depth', `${data.handle.grip_depth} mm`], ['Battery', 'Horizontal']] : [])]) {
    const item = document.createElement('div'), term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; item.append(term, detail); $('#cloud-facts').append(item);
  }
  $('#cloud-verification').textContent = `${data.checks_count} digital checks passed · physical print tests pending`;
  $('#cloud-hardware').replaceChildren();
  for (const part of data.components) {
    const row = document.createElement('tr');
    for (const text of [`${part.id} · ${part.title}`, part.size.join(' × '), `${part.uncertain ? 'Provisional · +5 mm allowance. ' : ''}${part.source}`]) {
      const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
    }
    $('#cloud-hardware').append(row);
  }
  $('#cloud-frame').replaceChildren();
  for (const feature of [...(data.frame_parts || []).map(part => ({...part, part: part.name})), ...(data.frame_features || [])]) {
    const row = document.createElement('tr');
    for (const text of [feature.id, feature.title, feature.part.replaceAll('_',' ')]) {
      const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
    }
    $('#cloud-frame').append(row);
  }
}

function selectWire(id) {
  const data = hardwareData(), wire = data.wires.find(item => item.id === id);
  selectedWire = wire?.id || '';
  if (wire) {
    $('#wire-detail').textContent = `${wire.id} · ${wire.title}\n${endpoint(wire.from, data)} → ${endpoint(wire.to, data)}`;
    if ($('#circuit-filter').value !== 'all' && $('#circuit-filter').value !== wire.group) {
      $('#circuit-filter').value = wire.group; viewer?.filter(wire.group); renderWires();
    }
  } else $('#wire-detail').textContent = 'Choose a wire in the diagram or the table below.';
  viewer?.selectWire(selectedWire);
  for (const button of document.querySelectorAll('[data-wire]')) {
    button.setAttribute('aria-pressed', String(button.dataset.wire === selectedWire));
    button.closest('tr').dataset.selected = String(button.dataset.wire === selectedWire);
  }
}

function renderWires() {
  const data = hardwareData(), pico = $('#hardware-controller').value === 'pico', group = $('#circuit-filter').value;
  const wires = data.wires.filter(wire => group === 'all' || wire.group === group);
  $('#controller-title').textContent = pico ? 'Pico 2 WH' : 'Raspberry Pi 3';
  $('#controller-description').textContent = pico ? 'The same peripherals, with the Pico physical pin and GP assignments shown at each controller connection.' : 'The active Linux controller. Inspect every display, audio, button, ADC, and power connection.';
  $('#pico-notice').hidden = !pico;
  $('#wiring-caption').textContent = pico ? 'Pico wiring · physical pin and GP names are shown together. Proposed firmware pin assignment.' : 'Raspberry Pi 3 wiring · controller numbers are physical header pins.';
  $('#wire-count').textContent = `${wires.length} / ${data.wires.length} connections`;
  $('#wiring-body').replaceChildren();
  for (const wire of wires) {
    const row = document.createElement('tr'), control = document.createElement('td'), button = document.createElement('button');
    button.className = 'wire-button'; button.dataset.wire = wire.id;
    button.setAttribute('aria-label', `Trace wire ${wire.id}`); button.setAttribute('aria-pressed', String(selectedWire === wire.id));
    const dot = document.createElement('i'); dot.className = 'wire-dot'; dot.style.setProperty('--wire-color', wire.color);
    button.append(dot, document.createTextNode(wire.id)); button.addEventListener('click', () => selectWire(wire.id)); control.append(button); row.append(control);
    const signal = document.createElement('td'), groupLabel = document.createElement('small');
    signal.textContent = wire.title; groupLabel.textContent = wire.group; signal.append(groupLabel); row.append(signal);
    for (const end of [wire.from, wire.to]) { const cell = document.createElement('td'); cell.textContent = endpoint(end, data); row.append(cell); }
    $('#wiring-body').append(row);
  }
}

async function showSoftware() {
  const implementation = $('#software-view').value === 'implementation';
  $('#software-design').hidden = implementation; $('#software-implementation').hidden = !implementation;
  if (implementation) {
    diagramPromise ??= import('./software.js').then(({ renderArchitecture }) => renderArchitecture($('#architecture-diagram'), architecture));
    await diagramPromise;
  }
}

async function activate(name, updateHash = true) {
  if (!tabs.some(tab => tab.dataset.tab === name)) name = 'plywood';
  activeTab = name;
  $('#viewer-card').hidden = !['plywood', 'hardware', '3dprint'].includes(name);
  for (const tab of tabs) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    $(`#${tab.getAttribute('aria-controls')}`).hidden = !selected;
  }
  if (updateHash) history.replaceState(null, '', `#${name}`);
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
  $('#adr-content').innerHTML = adrHTML; // Build-time Markdown rendering, with raw HTML disabled.
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
  $('#hardware-controller').addEventListener('change', () => { selectedWire = ''; $('#circuit-filter').value = 'all'; renderWires(); $('#wire-detail').textContent = 'Choose a wire in the diagram or the table below.'; handle(showScene()); });
  $('#circuit-filter').addEventListener('change', () => { selectedWire = ''; viewer?.filter($('#circuit-filter').value); renderWires(); selectWire(''); });
  $('#clear-wire').addEventListener('click', () => { $('#circuit-filter').value = 'all'; viewer?.filter('all'); selectedWire = ''; renderWires(); selectWire(''); });
  $('#reset-camera').addEventListener('click', () => viewer?.reset());
  $('#software-view').addEventListener('change', () => handle(showSoftware()));
  window.addEventListener('hashchange', () => handle(activate(location.hash.slice(1), false)));
  window.addEventListener('pagehide', () => viewer?.dispose(), { once: true });
  await activate(location.hash.slice(1) || 'plywood', false);
  document.documentElement.dataset.ready = 'true';
}
start().catch(fail);

// Vite is present only in development. Static exports need no server connection.
if (import.meta.hot) {
  const liveStatus = document.createElement('p');
  liveStatus.className = 'dev-cad-status'; liveStatus.setAttribute('role', 'status');
  document.body.append(liveStatus);
  import.meta.hot.on('cloud:building', () => { liveStatus.textContent = 'Rebuilding cloud CAD… Last valid model remains available.'; });
  import.meta.hot.on('cloud:error', event => { liveStatus.textContent = `Cloud rebuild failed: ${event.message}`; });
  import.meta.hot.on('cloud:ready', () => location.reload());
  window.__cloudViewerStats = () => viewer?.stats;
}
