import { t } from '../i18n.js';

const PARTS = ['front', 'rear'];
const PALETTES = [
  ['cloud-blue', ['#86bfea', '#70acd9', '#fff0b5']],
  ['candy-cloud', ['#ffd6e6', '#d7c6f5', '#fff0b5']],
  ['mint-arcade', ['#bcebd8', '#a9cde7', '#ffd2a8']],
  ['lavender-dream', ['#d9ccf3', '#b7c7ed', '#f6c8dc']],
  ['peach-pop', ['#ffd2b7', '#efb6c3', '#bcebd8']],
  ['lemon-fizz', ['#fff0ad', '#c9e9db', '#cbbef0']],
];
// Opaque PETG swatches from Prusa's official HueForge color reference.
const FILAMENT_COLORS = [
  ['black', '#292b2b'], ['white', '#e5e0e1'], ['grey', '#95908c'], ['dark-grey', '#3f4646'],
  ['matte-black', '#303635'], ['orange', '#eb5403'], ['red', '#bb2e32'], ['yellow', '#f2b706'],
  ['gold', '#9a8523'], ['forest-green', '#007248'], ['pistachio', '#93a682'], ['chalky-blue', '#6f9aa9'],
  ['ocean-blue', '#1a4c54'], ['sky-blue', '#346ce3'], ['violet', '#1d1991'], ['terracotta', '#b87f69'],
];
const STORAGE = 'alfa.cloud-colors.v1';

function partName(id) { return t(`part.${id}`); }
function filamentName(id) { return t(`filament.${id}`); }

export function createCloudColorControls(container, onChange) {
  const colors = Object.fromEntries(PARTS.map((id, i) => [id, PALETTES[0][1][i]]));
  try {
    let saved = JSON.parse(localStorage.getItem(STORAGE));
    const legacyDefaults = [['#dae9ed', '#b7d2da', '#f3c96d'], ['#b9dcf5', '#a9cde7', '#fff0b5']];
    if (legacyDefaults.some(palette => PARTS.every((id, i) => saved?.[id]?.toLowerCase() === palette[i]))) saved = null;
    for (const id of PARTS) if (/^#[\da-f]{6}$/i.test(saved?.[id])) colors[id] = saved[id].toLowerCase();
  } catch { /* Preview controls also work when browser storage is unavailable. */ }
  const heading = document.createElement('div');
  heading.className = 'color-heading';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = t('colors.eyebrow');
  const title = document.createElement('h3');
  title.textContent = t('colors.title');
  const hint = document.createElement('p');
  hint.textContent = t('colors.hint');
  heading.append(eyebrow, title, hint);
  const controls = document.createElement('div');
  controls.className = 'color-controls';
  const picker = document.createElement('details');
  picker.className = 'palette-picker';
  const summary = document.createElement('summary');
  const current = document.createElement('span');
  current.className = 'palette-current';
  const paletteName = document.createElement('span');
  paletteName.className = 'palette-name';
  const chevron = document.createElement('span');
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';
  summary.append(current, paletteName, chevron);
  const options = document.createElement('div');
  options.className = 'palette-options';
  options.setAttribute('aria-label', t('colors.palettes'));
  picker.append(summary, options);
  const partColors = document.createElement('div');
  partColors.className = 'part-colors';
  controls.append(picker, partColors);
  container.replaceChildren(heading, controls);
  const fields = new Map();
  function swatches(values) {
    const group = document.createElement('span');
    group.className = 'palette-swatches';
    group.setAttribute('aria-hidden', 'true');
    for (const value of values) {
      const square = document.createElement('i');
      square.style.backgroundColor = value;
      group.append(square);
    }
    return group;
  }
  function update() {
    const values = PARTS.map(id => colors[id]);
    const selected = PALETTES.find(([, palette]) => PARTS.every((_, i) => palette[i] === values[i]));
    const selectedName = selected ? t(`palette.${selected[0]}`) : t('colors.custom');
    paletteName.textContent = selectedName;
    current.replaceChildren(swatches(values));
    summary.setAttribute('aria-label', t('colors.palettePrefix', { name: selectedName }));
    for (const id of PARTS) {
      const { input, hex, preview, choice, summary: partSummary, menu } = fields.get(id);
      input.value = colors[id];
      hex.textContent = colors[id].toUpperCase();
      preview.style.backgroundColor = colors[id];
      const filament = FILAMENT_COLORS.find(([, value]) => value === colors[id]);
      const choiceName = filament ? filamentName(filament[0]) : t('colors.customShort');
      choice.textContent = choiceName;
      partSummary.setAttribute('aria-label', t('colors.partChoice', { part: partName(id), choice: choiceName }));
      for (const button of menu.querySelectorAll('[data-color]')) button.setAttribute('aria-pressed', String(button.dataset.color === colors[id]));
    }
    for (const button of picker.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.palette === selected?.[0]));
    try { localStorage.setItem(STORAGE, JSON.stringify(colors)); } catch { /* Optional preference storage. */ }
    onChange({ ...colors });
  }
  for (const [id, values] of PALETTES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.palette = id;
    const text = document.createElement('span');
    text.textContent = t(`palette.${id}`);
    button.append(swatches(values.slice(0, PARTS.length)), text);
    button.addEventListener('click', () => {
      PARTS.forEach((part, i) => { colors[part] = values[i]; });
      update();
      picker.open = false;
      summary.focus();
    });
    options.append(button);
  }
  for (const id of PARTS) {
    const dropdown = document.createElement('details');
    dropdown.className = 'part-color-picker';
    dropdown.dataset.part = id;
    const partSummary = document.createElement('summary');
    partSummary.className = 'part-color-button';
    const preview = document.createElement('i');
    preview.className = 'part-swatch';
    preview.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    const name = document.createElement('strong');
    const choice = document.createElement('small');
    const hex = document.createElement('small');
    name.textContent = partName(id);
    hex.className = 'color-hex';
    text.append(name, choice, hex);
    const arrow = document.createElement('span');
    arrow.textContent = '⌄';
    arrow.setAttribute('aria-hidden', 'true');
    partSummary.append(preview, text, arrow);
    const menu = document.createElement('div');
    menu.className = 'filament-menu';
    const menuHeading = document.createElement('strong');
    menuHeading.className = 'filament-heading';
    menuHeading.textContent = t('colors.petg');
    menu.append(menuHeading);
    const grid = document.createElement('div');
    grid.className = 'filament-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', t('colors.partColors', { part: partName(id) }));
    for (const [colorId, value] of FILAMENT_COLORS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.color = value;
      button.className = 'filament-color';
      button.setAttribute('aria-label', t('colors.swatch', { part: partName(id), color: filamentName(colorId) }));
      const square = document.createElement('i');
      square.style.backgroundColor = value;
      square.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = filamentName(colorId);
      button.append(square, label);
      button.addEventListener('click', () => {
        colors[id] = value;
        update();
        dropdown.open = false;
        partSummary.focus();
      });
      grid.append(button);
    }
    menu.append(grid);
    const custom = document.createElement('label');
    custom.className = 'custom-filament-color';
    const input = document.createElement('input');
    input.type = 'color';
    input.id = `cloud-color-${id}`;
    input.setAttribute('aria-label', t('colors.partColor', { part: partName(id) }));
    custom.append(input, document.createTextNode(t('colors.customColor')));
    menu.append(custom);
    const note = document.createElement('p');
    note.className = 'filament-note';
    note.append(document.createTextNode(t('colors.approximate')));
    const source = document.createElement('a');
    source.href = 'https://help.prusa3d.com/article/hueforge-filament-transparency-values-and-hexcodes_762314';
    source.textContent = t('colors.reference');
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    note.append(source);
    menu.append(note);
    dropdown.append(partSummary, menu);
    partColors.append(dropdown);
    fields.set(id, { input, hex, preview, choice, summary: partSummary, menu });
    input.addEventListener('input', () => { colors[id] = input.value; update(); });
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) {
        picker.open = false;
        for (const other of container.querySelectorAll('.part-color-picker')) if (other !== dropdown) other.open = false;
      }
    });
    document.addEventListener('pointerdown', event => { if (!dropdown.contains(event.target)) dropdown.open = false; });
    dropdown.addEventListener('keydown', event => { if (event.key === 'Escape') { dropdown.open = false; partSummary.focus(); } });
  }
  document.addEventListener('pointerdown', event => { if (!picker.contains(event.target)) picker.open = false; });
  picker.addEventListener('keydown', event => { if (event.key === 'Escape') { picker.open = false; summary.focus(); } });
  update();
  return { getColors: () => ({ ...colors }) };
}
