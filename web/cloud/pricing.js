/**
 * Interactive build cost & component estimate configuration and table sorting.
 */
import { getLocale, messages, t } from '../i18n.js';

export const PRICING_ITEMS = [
  // Controllers
  {
    id: 'ctrl-pi3',
    name: 'Raspberry Pi 3 Model B / B+',
    function: 'Main controller running offline Python player & alphabet engine',
    priceText: '~150 – 180 zł',
    min: 150,
    max: 180,
    caseType: 'all',
    controllerType: 'pi3',
    links: [
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/komputery-stacjonarne-raspberry-pi-i-akcesoria-257211?string=Raspberry%20Pi%203%20Model%20B' },
      { name: 'Botland ↗', url: 'https://botland.com.pl/16-moduly-glowne-raspberry-pi' }
    ]
  },
  {
    id: 'ctrl-pico',
    name: 'Raspberry Pi Pico 2 WH',
    function: 'Microcontroller running lightweight player with PIO I2S audio & SPI LCD',
    priceText: '~38 – 45 zł',
    min: 38,
    max: 45,
    caseType: 'all',
    controllerType: 'pico',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/szukaj?s=Raspberry+Pi+Pico+2+WH' },
      { name: 'Kamami ↗', url: 'https://kamami.pl/szukaj?s=Pico+2+WH' }
    ]
  },
  // Shared electronic peripherals
  {
    id: 'periph-lcd',
    name: 'Waveshare 2″ IPS LCD (ST7789, SPI)',
    function: '240×320 colour display for letter animations & feedback (SKU 17344)',
    priceText: '~45 – 50 zł',
    min: 45,
    max: 50,
    caseType: 'all',
    controllerType: 'all',
    links: [
      { name: 'Kamami (17344) ↗', url: 'https://kamami.pl/wyswietlacze-lcd-tft/577038-wyswietlacz-lcd-ips-2-240x320-spi-waveshare-17344.html' },
      { name: 'Botland ↗', url: 'https://botland.com.pl/wyswietlacze-lcd-tft-i-ips/16016-wyswietlacz-ips-tft-2-240x320px-spi-waveshare-17344.html' }
    ]
  },
  {
    id: 'periph-arcade-buttons',
    name: '6 × Arcade Push Button 33mm (SPST)',
    function: 'Six durable arcade push buttons with microswitches wired directly to Pi GPIO',
    priceText: '~47,31 zł (7,60–8,10 zł / pcs)',
    min: 47.31,
    max: 48,
    caseType: 'all',
    controllerType: 'all',
    links: [
      { name: 'Allegro / Botland ↗', url: 'https://allegro.pl/kategoria/elektronika?string=Arcade%20Push%20Button%2033mm' },
      { name: 'Gotronik ↗', url: 'https://www.gotronik.pl' }
    ]
  },
  {
    id: 'periph-speaker',
    name: 'Universal speaker 40 mm 4Ω 3W',
    function: 'Front-firing sound reproduction with soft gasket',
    priceText: '~6,70 – 10 zł',
    min: 6.70,
    max: 10,
    caseType: 'all',
    controllerType: 'all',
    links: [
      { name: 'Kamami ↗', url: 'https://kamami.pl/glosniki/577543-glosnik-uniwersalny-3w-40mm.html' },
      { name: 'Botland ↗', url: 'https://botland.com.pl/74-glosniki' }
    ]
  },
  {
    id: 'periph-powerbank',
    name: 'Baseus 5000 mAh power bank (slim)',
    function: 'Removable internal battery bank (exact fit: 69 × 106 × 14 mm)',
    priceText: '~75 – 89 zł',
    min: 75,
    max: 89,
    caseType: 'all',
    controllerType: 'all',
    links: [
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/akcesoria-gsm-powerbanki-250157?string=Baseus%20Magnetic%20Mini%205000mAh' },
      { name: 'Media Expert ↗', url: 'https://www.mediaexpert.pl/smartfony-i-zegarki/akcesoria-do-telefonow/powerbanki/powerbank-baseus-magnetic-mini-5000mah-20w-czarny' }
    ]
  },
  {
    id: 'periph-switch',
    name: 'Power switch (slide / rocker)',
    function: 'Main battery power disconnect switch on rear upper shoulder',
    priceText: '~3 – 6 zł',
    min: 3,
    max: 6,
    caseType: 'all',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/58-przelaczniki-kolyskowe' }
    ]
  },
  // 3D printed case parts
  {
    id: 'case-3d-filament',
    name: 'PETG filament 1 kg spool',
    function: 'Rosa3D / Devil Design / Fiberlogy for durable printable shells (~440 g needed)',
    priceText: '~59 – 79 zł',
    min: 59,
    max: 79,
    caseType: '3d-print',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/701-filamenty-petg' },
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/druk-3d-filamenty-259163?string=filament%20PETG%201kg' }
    ]
  },
  {
    id: 'case-3d-fasteners',
    name: 'Fasteners, perfboard & wiring',
    function: '3× M3×55, 1× M3×12, 4× M3 nuts, 8× M2.5×6 screws, 10kΩ resistors, perfboard, cable ties',
    priceText: '~15 – 20 zł',
    min: 15,
    max: 20,
    caseType: '3d-print',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/921-sruby-nakretki-podkladki' }
    ]
  },
  // Plywood Little House Radio parts
  {
    id: 'case-ply-house-sheet',
    name: 'Birch plywood 6 mm sheet (600 × 400 mm)',
    function: 'Laser-cut or CNC milled body, opening roof & carry handle',
    priceText: '~35 – 50 zł',
    min: 35,
    max: 50,
    caseType: 'plywood-house',
    controllerType: 'all',
    links: [
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/materialy-plyty-sklejki-319524?string=sklejka%20brzozowa%206mm' }
    ]
  },
  {
    id: 'case-ply-house-hw',
    name: 'Hardware: brass hinges, handle & screws',
    function: '2× brass hinges for opening roof, wooden handle dowel, magnets & M3 wood screws',
    priceText: '~20 – 30 zł',
    min: 20,
    max: 30,
    caseType: 'plywood-house',
    controllerType: 'all',
    links: [
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/okucia-i-akcesoria-zawiasy-111956?string=zawias%20mosiezny%20maly' }
    ]
  },
  {
    id: 'case-ply-house-wiring',
    name: 'Perfboard, resistors & internal wiring',
    function: 'Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires',
    priceText: '~10 – 15 zł',
    min: 10,
    max: 15,
    caseType: 'plywood-house',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/plytki-uniwersalne/2005-plytka-uniwersalna-pcb-drukowana-5x7cm-jednostronna.html' }
    ]
  },
  // Plywood Original Case parts
  {
    id: 'case-ply-case-sheet',
    name: 'Birch plywood 6 mm sheet (600 × 300 mm)',
    function: 'Laser-cut front faceplate, frame ribs and removable rear cover',
    priceText: '~30 – 45 zł',
    min: 30,
    max: 45,
    caseType: 'plywood-case',
    controllerType: 'all',
    links: [
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/materialy-plyty-sklejki-319524?string=sklejka%20brzozowa%206mm' }
    ]
  },
  {
    id: 'case-ply-case-hw',
    name: 'Hardware: brass standoffs, brackets & screws',
    function: '4× M3 brass standoffs, corner brackets & machine screws for mounting',
    priceText: '~15 – 25 zł',
    min: 15,
    max: 25,
    caseType: 'plywood-case',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/921-sruby-nakretki-podkladki' },
      { name: 'Allegro ↗', url: 'https://allegro.pl/kategoria/narzedzia-i-artykuly-montazowe-okucia-i-laczniki-254425' }
    ]
  },
  {
    id: 'case-ply-case-wiring',
    name: 'Perfboard, resistors & internal wiring',
    function: 'Carrier board for DAC/ADC, 2× 10kΩ divider resistors & silicone jumper wires',
    priceText: '~10 – 15 zł',
    min: 10,
    max: 15,
    caseType: 'plywood-case',
    controllerType: 'all',
    links: [
      { name: 'Botland ↗', url: 'https://botland.com.pl/plytki-uniwersalne/2005-plytka-uniwersalna-pcb-drukowana-5x7cm-jednostronna.html' }
    ]
  }
];

export const MATERIAL_SPECS = {
  '3d-print': {
    sectionNumber: 'FILAMENT USAGE',
    title: '3D Print filament estimation',
    badge: 'PETG · ~440 g total',
    desc: 'Calculated from the production CAD solid models for PETG (density 1.27 g/cm³), sliced with 0.4 mm nozzle, 0.2 mm layer height, 5 perimeters (2.0 mm wall), 6 top/bottom layers, and 25% infill:',
    stats: [
      { dt: 'Front shell (F-00)', dd: '~195 g', small: 'Solid volume: 208 cm³' },
      { dt: 'Rear shell (R-00)', dd: '~165 g', small: 'Solid volume: 170 cm³' },
      { dt: 'Battery door (B-00)', dd: '~32 g', small: 'Solid volume: 34 cm³' },
      { dt: 'Supports & brim', dd: '~45–55 g', small: 'Bed supports & 2 mm brim' },
      { dt: 'Spool requirement', dd: '1 × 1 kg spool', small: '~59 – 79 PLN · covers build + tests', isTotal: true }
    ]
  },
  'plywood-house': {
    sectionNumber: 'MATERIAL USAGE',
    title: 'Little House Radio plywood estimation',
    badge: '6 mm Birch plywood · ~1.2 kg',
    desc: 'Calculated from the 2D DXF cut sheets for 6 mm birch plywood panels, with kerf compensation for laser cutting or 2 mm CNC router bit:',
    stats: [
      { dt: 'Body & walls', dd: '6 panels', small: 'Front, back, 2 sides, base, divider' },
      { dt: 'Opening roof', dd: '2 panels', small: 'Pitched lid with hinge mounts' },
      { dt: 'Carry handle', dd: '3 pieces', small: 'Curved wood handle & side braces' },
      { dt: 'Internal shelf', dd: '1 panel', small: 'Removable floor with battery slot' },
      { dt: 'Sheet requirement', dd: '1 × 600×400 mm', small: '~35 – 50 PLN · single plywood sheet', isTotal: true }
    ]
  },
  'plywood-case': {
    sectionNumber: 'MATERIAL USAGE',
    title: 'Original plywood case material estimation',
    badge: '6 mm Birch plywood · ~0.9 kg',
    desc: 'Calculated from the 2D DXF cut sheets for 6 mm birch plywood panels with laser-cut finger joints and brass standoff hardware:',
    stats: [
      { dt: 'Front faceplate', dd: '1 panel', small: 'Screen & 5-button key openings' },
      { dt: 'Perimeter frame', dd: '4 panels', small: 'Finger-jointed side walls' },
      { dt: 'Rear slide cover', dd: '1 panel', small: 'Removable back with ventilation' },
      { dt: 'Internal brackets', dd: '4 mounts', small: 'Brass standoff mounting blocks' },
      { dt: 'Sheet requirement', dd: '1 × 600×300 mm', small: '~30 – 45 PLN · single plywood sheet', isTotal: true }
    ]
  }
};

function itemField(item, field) {
  return messages[getLocale()]?.[`item.${item.id}.${field}`] ?? item[field];
}

function getSubtext(caseVal, controllerVal, totalMin, totalMax) {
  const euroMin = Math.round(totalMin / 4.3);
  const euroMax = Math.round(totalMax / 4.3);
  const controller = controllerVal === 'pico' ? 'pico' : 'pi3';
  return t(`pricing.sub.${caseVal}.${controller}`, { euroMin, euroMax });
}

export function initPricing(container = document.querySelector('#cloud-pricing')) {
  if (!container) return;

  const caseSelect = container.querySelector('#pricing-case');
  const controllerSelect = container.querySelector('#pricing-controller');
  const totalValueEl = container.querySelector('.pricing-total-value');
  const subtextEl = container.querySelector('.pricing-subtext');
  const tbodyEl = container.querySelector('#pricing-tbody');
  const sortButtons = container.querySelectorAll('.pricing-sort-btn');

  // Material card elements
  const materialCard = container.querySelector('#pricing-material-card');
  const materialSecNum = container.querySelector('#material-section-number');
  const materialTitle = container.querySelector('#material-title');
  const materialBadge = container.querySelector('#material-badge');
  const materialDesc = container.querySelector('#material-desc');
  const materialStats = container.querySelector('#material-stats');

  let currentSort = { key: null, direction: 'asc' };

  function renderMaterialCard(caseType) {
    if (!materialCard || !messages.en[`material.${caseType}.section`]) return;

    if (materialSecNum) materialSecNum.textContent = t(`material.${caseType}.section`);
    if (materialTitle) materialTitle.textContent = t(`material.${caseType}.title`);
    if (materialBadge) materialBadge.textContent = t(`material.${caseType}.badge`);
    if (materialDesc) materialDesc.textContent = t(`material.${caseType}.desc`);

    if (materialStats) {
      materialStats.replaceChildren();
      for (let index = 0; index < 5; index++) {
        const div = document.createElement('div');
        div.className = `filament-stat${index === 4 ? ' total' : ''}`;

        const dt = document.createElement('dt');
        dt.textContent = t(`material.${caseType}.s${index}.dt`);

        const dd = document.createElement('dd');
        dd.textContent = t(`material.${caseType}.s${index}.dd`);

        const small = document.createElement('small');
        small.textContent = t(`material.${caseType}.s${index}.small`);

        div.append(dt, dd, small);
        materialStats.append(div);
      }
    }
  }

  function getFilteredItems() {
    const caseVal = caseSelect ? caseSelect.value : '3d-print';
    const controllerVal = controllerSelect ? controllerSelect.value : 'pi3';

    return PRICING_ITEMS.filter(item => {
      const matchCase = item.caseType === 'all' || item.caseType === caseVal;
      const matchCtrl = item.controllerType === 'all' || item.controllerType === controllerVal;
      return matchCase && matchCtrl;
    });
  }

  function sortItems(items) {
    if (!currentSort.key) return items;

    const { key, direction } = currentSort;
    const factor = direction === 'desc' ? -1 : 1;

    return [...items].sort((a, b) => {
      const locale = getLocale() === 'en' ? 'en' : 'pl';
      if (key === 'name') {
        return factor * itemField(a, 'name').localeCompare(itemField(b, 'name'), locale, { sensitivity: 'base' });
      }
      if (key === 'function') {
        return factor * itemField(a, 'function').localeCompare(itemField(b, 'function'), locale, { sensitivity: 'base' });
      }
      if (key === 'price') {
        const priceA = a.min;
        const priceB = b.min;
        if (priceA !== priceB) return factor * (priceA - priceB);
        return factor * (a.max - b.max);
      }
      if (key === 'supplier') {
        const suppA = a.links.map(l => l.name).join(' ');
        const suppB = b.links.map(l => l.name).join(' ');
        return factor * suppA.localeCompare(suppB, getLocale() === 'en' ? 'en' : 'pl', { sensitivity: 'base' });
      }
      return 0;
    });
  }

  function update() {
    const caseVal = caseSelect ? caseSelect.value : '3d-print';
    const controllerVal = controllerSelect ? controllerSelect.value : 'pi3';

    const filtered = getFilteredItems();
    const sorted = sortItems(filtered);

    // Sum calculation
    const rawMin = filtered.reduce((acc, item) => acc + item.min, 0);
    const rawMax = filtered.reduce((acc, item) => acc + item.max, 0);
    const totalMin = Math.floor(rawMin / 10) * 10;
    const totalMax = Math.ceil(rawMax / 10) * 10;

    if (totalValueEl) {
      totalValueEl.innerHTML = `~${totalMin} – ${totalMax} <small>PLN</small>`;
    }
    if (subtextEl) {
      subtextEl.innerHTML = getSubtext(caseVal, controllerVal, totalMin, totalMax);
    }

    renderMaterialCard(caseVal);

    // Render table rows
    if (tbodyEl) {
      tbodyEl.replaceChildren();
      for (const item of sorted) {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        const strongName = document.createElement('strong');
        strongName.textContent = itemField(item, 'name');
        nameCell.append(strongName);

        const funcCell = document.createElement('td');
        funcCell.textContent = itemField(item, 'function');

        const priceCell = document.createElement('td');
        const strongPrice = document.createElement('strong');
        strongPrice.textContent = item.priceText;
        priceCell.append(strongPrice);

        const shopCell = document.createElement('td');
        const shopLinks = document.createElement('div');
        shopLinks.className = 'shop-links-cell';
        for (const link of item.links) {
          const a = document.createElement('a');
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'shop-badge';
          a.textContent = link.name;
          shopLinks.append(a);
        }
        shopCell.append(shopLinks);

        row.append(nameCell, funcCell, priceCell, shopCell);
        tbodyEl.append(row);
      }
    }

    // Update sort button headers
    for (const btn of sortButtons) {
      const key = btn.dataset.sortKey;
      const th = btn.closest('th');
      const icon = btn.querySelector('.sort-icon');

      if (currentSort.key === key) {
        btn.classList.add('is-sorted');
        if (th) th.setAttribute('aria-sort', currentSort.direction === 'asc' ? 'ascending' : 'descending');
        if (icon) icon.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
      } else {
        btn.classList.remove('is-sorted');
        if (th) th.setAttribute('aria-sort', 'none');
        if (icon) icon.textContent = '↕';
      }
    }
  }

  // Hook up sort button clicks
  for (const btn of sortButtons) {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sortKey;
      if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
      }
      update();
    });
  }

  if (caseSelect) caseSelect.addEventListener('change', update);
  if (controllerSelect) controllerSelect.addEventListener('change', update);

  update();
}
