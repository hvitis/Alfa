import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function getBase64Image(filePath) {
  const buf = await readFile(resolve(root, filePath));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function cleanSvg(raw) {
  return raw
    .replace(/<\?xml.*?\?>/g, '')
    .replace(/<!DOCTYPE.*?>/gi, '')
    .replace(/<\/?(?:ns0|svg):/g, m => (m.startsWith('</') ? '</' : '<'))
    .replace(/xmlns:(?:ns0|svg)=/g, 'xmlns=')
    .replace(/(?:ns0|svg):/g, '');
}

export async function exportPlywoodGuide(destination) {
  const prebuilt = resolve(root, 'design/cloud-radio/generated/cloud/plywood-assembly-guide.pdf');
  const requiredSources = [
    'design/wooden-case/previews/enclosure.png',
    'design/wooden-case/previews/internals.png',
    'design/wooden-case/previews/exploded.png',
    'docs/images/hardware-connections.png',
    'design/house-radio/previews/house_iso.png',
    'design/house-radio/previews/house_roof_open.png',
    'design/wooden-case/SVG/a4_sheet_1.svg',
    'design/wooden-case/SVG/a4_sheet_2.svg',
    'design/wooden-case/SVG/a4_sheet_3.svg',
    'design/wooden-case/SVG/a4_sheet_4.svg',
    'design/house-radio/SVG/sheet_1.svg',
    'design/house-radio/SVG/sheet_2.svg',
    'design/house-radio/SVG/sheet_3.svg',
    'design/house-radio/SVG/sheet_4.svg',
    'web/assets/wiring-diagram.svg'
  ];

  const hasSources = (await Promise.all(requiredSources.map(async file => {
    try { await access(resolve(root, file)); return true; } catch { return false; }
  }))).every(Boolean);

  if (!hasSources) {
    try {
      await access(prebuilt);
      await mkdir(dirname(destination), { recursive: true });
      if (resolve(destination) !== prebuilt) {
        await copyFile(prebuilt, destination);
      }
      console.log(`Using prebuilt Plywood Assembly Guide PDF: ${destination}`);
      return destination;
    } catch {
      // Proceed to try loading assets if prebuilt is missing as well
    }
  }

  console.log('Loading assets for Plywood Assembly Guide PDF...');
  
  // Vector wiring schematic diagram
  const svgWiringDiagram = cleanSvg(await readFile(resolve(root, 'web/assets/wiring-diagram.svg'), 'utf8'));
  
  // Case preview renders
  const imgEnclosure = await getBase64Image('design/wooden-case/previews/enclosure.png');
  const imgInternals = await getBase64Image('design/wooden-case/previews/internals.png');
  const imgExploded = await getBase64Image('design/wooden-case/previews/exploded.png');
  const imgWiring = await getBase64Image('docs/images/hardware-connections.png');
  
  // House radio preview renders
  const imgHouseIso = await getBase64Image('design/house-radio/previews/house_iso.png');
  const imgHouseRoofOpen = await getBase64Image('design/house-radio/previews/house_roof_open.png');
  
  // Load SVG blueprint sheets for Original Plywood Case (Attachment 1)
  const svgSheet1 = cleanSvg(await readFile(resolve(root, 'design/wooden-case/SVG/a4_sheet_1.svg'), 'utf8'));
  const svgSheet2 = cleanSvg(await readFile(resolve(root, 'design/wooden-case/SVG/a4_sheet_2.svg'), 'utf8'));
  const svgSheet3 = cleanSvg(await readFile(resolve(root, 'design/wooden-case/SVG/a4_sheet_3.svg'), 'utf8'));
  const svgSheet4 = cleanSvg(await readFile(resolve(root, 'design/wooden-case/SVG/a4_sheet_4.svg'), 'utf8'));

  // Load SVG blueprint sheets for Little House Radio Case (Attachment 2)
  const svgHouse1 = cleanSvg(await readFile(resolve(root, 'design/house-radio/SVG/sheet_1.svg'), 'utf8'));
  const svgHouse2 = cleanSvg(await readFile(resolve(root, 'design/house-radio/SVG/sheet_2.svg'), 'utf8'));
  const svgHouse3 = cleanSvg(await readFile(resolve(root, 'design/house-radio/SVG/sheet_3.svg'), 'utf8'));
  const svgHouse4 = cleanSvg(await readFile(resolve(root, 'design/house-radio/SVG/sheet_4.svg'), 'utf8'));

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Alfa · Plywood Radio Enclosure Assembly & Hardware Guide</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fdf7ed;
      color: #39305b;
      font-family: 'Trebuchet MS', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
    }
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      padding: 14mm 16mm 16mm 16mm;
      position: relative;
      break-after: page;
      page-break-after: always;
      background: #fdf7ed;
    }
    .page.blueprint-page {
      padding: 0;
      margin: 0;
      background: #ffffff;
    }
    .blueprint-page svg {
      width: 210mm;
      height: 297mm;
      display: block;
    }

    /* Running Header & Footer */
    header.doc-header {
      display: flex;
      gap: 12px;
      align-items: center;
      border-bottom: 1.5px dashed #c8b7d9;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .doc-logo {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 1.5px solid #39305b;
      border-radius: 9px;
      background: #fff0b5;
      font: bold 22px/.8 Verdana, sans-serif;
      padding-bottom: 3px;
      transform: rotate(-5deg);
      box-shadow: 2px 2px 0 #39305b;
    }
    .doc-header .doc-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #39305b;
    }
    .doc-header .doc-subtitle {
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #6a5e7b;
      margin-left: 6px;
    }
    .doc-header .doc-section-badge {
      margin-left: auto;
      font-size: 7pt;
      font-weight: 800;
      letter-spacing: 0.8px;
      background: #e7ddfa;
      border: 1px solid #39305b;
      border-radius: 6px;
      padding: 3px 8px;
      text-transform: uppercase;
    }

    footer.doc-footer {
      position: absolute;
      bottom: 8mm;
      left: 16mm;
      right: 16mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      border-top: 1px dashed #c8b7d9;
      padding-top: 6px;
      color: #6a5e7b;
    }

    /* Headings */
    h1 {
      font: 900 32px/1.1 'Trebuchet MS', sans-serif;
      letter-spacing: -1px;
      margin: 0 0 8px 0;
      color: #39305b;
    }
    h2 {
      font-size: 15pt;
      line-height: 1.25;
      margin: 14px 0 8px;
      padding: 6px 10px;
      background: #e7ddfa;
      border: 1.2px solid #39305b;
      border-radius: 8px;
      color: #39305b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3 {
      font-size: 11pt;
      margin: 10px 0 5px;
      color: #39305b;
      font-weight: 800;
    }
    p {
      margin: 0 0 8px;
      line-height: 1.45;
    }

    /* Cover Page */
    .cover-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .cover-badge {
      display: inline-block;
      align-self: flex-start;
      border: 1.5px solid #39305b;
      border-radius: 20px;
      background: #d6f2e3;
      padding: 5px 12px;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .cover-title {
      font: 900 36px/1.08 'Trebuchet MS', sans-serif;
      margin-bottom: 10px;
    }
    .cover-title span {
      color: #7b4f9d;
    }
    .cover-lead {
      font-size: 11.5pt;
      color: #5c4f74;
      line-height: 1.45;
      margin-bottom: 14px;
      max-width: 520px;
    }
    .cover-image-card {
      height: 110mm;
      background: #fff0b5;
      border: 2px solid #39305b;
      border-radius: 20px;
      box-shadow: 4px 5px 0 #c8b7d9;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .cover-image-card img {
      width: 92%;
      height: 92%;
      object-fit: contain;
      filter: drop-shadow(0 10px 8px rgba(57, 48, 91, 0.2));
    }
    .cover-tag {
      position: absolute;
      right: 14px;
      top: 14px;
      background: #ffd6e6;
      border: 1.5px solid #39305b;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 8pt;
      font-weight: 800;
      transform: rotate(3deg);
    }
    .spec-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .spec-box {
      background: #ffffff;
      border: 1.2px solid #39305b;
      border-radius: 8px;
      padding: 8px 10px;
      box-shadow: 2px 2px 0 #d9cde5;
    }
    .spec-box .label {
      font-size: 6.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #7b6d91;
      margin-bottom: 2px;
    }
    .spec-box .val {
      font-size: 9.5pt;
      font-weight: 800;
      color: #39305b;
    }

    /* Callout & Alert Boxes */
    .callout {
      border: 1.5px solid #39305b;
      border-radius: 10px;
      padding: 8px 12px;
      margin: 8px 0 10px;
      font-size: 8.8pt;
      line-height: 1.4;
    }
    .callout-warning {
      background: #ffe3e3;
      border-color: #ba2d2d;
      color: #631212;
    }
    .callout-warning strong {
      color: #9c1515;
    }
    .callout-tip {
      background: #d6f2e3;
      border-color: #277755;
      color: #174b34;
    }
    .callout-note {
      background: #e7ddfa;
      border-color: #5d4285;
      color: #31214c;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin: 8px 0 12px;
      background: #ffffff;
      border: 1.2px solid #39305b;
      border-radius: 6px;
      overflow: hidden;
    }
    th, td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2d9ec;
      text-align: left;
      vertical-align: middle;
    }
    th {
      background: #dcecff;
      color: #223854;
      font-weight: 800;
      border-bottom: 1.5px solid #39305b;
    }
    tr:nth-child(even) {
      background: #faf6fd;
    }
    code {
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 7.8pt;
      background: #eee6fa;
      padding: 1px 4px;
      border-radius: 4px;
      color: #2b1f47;
    }

    /* Lists */
    ol, ul {
      margin: 4px 0 8px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
      line-height: 1.4;
    }

    /* Image figure layouts */
    .figure-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 10px 0;
    }
    .figure-card {
      background: #ffffff;
      border: 1.2px solid #39305b;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 2px 3px 0 #c8b7d9;
    }
    .figure-card img {
      width: 100%;
      height: 48mm;
      object-fit: cover;
      display: block;
      background: #fdf2d0;
    }
    .figure-caption {
      padding: 5px 8px;
      font-size: 7.5pt;
      font-weight: 700;
      color: #5c4f74;
      background: #faf7ff;
      border-top: 1px solid #dcd1ea;
    }

    /* TOC list */
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 14px 0;
    }
    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 6px 0;
      border-bottom: 1px dotted #a89bc2;
      font-size: 9.5pt;
    }
    .toc-num {
      font-weight: 900;
      color: #7b4f9d;
      width: 32px;
      flex-shrink: 0;
    }
    .toc-title {
      font-weight: 700;
      color: #39305b;
    }
    .toc-desc {
      font-size: 7.8pt;
      color: #6a5e7b;
      margin-left: 8px;
    }
    .toc-page {
      margin-left: auto;
      font-weight: 800;
      color: #39305b;
      background: #e7ddfa;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #39305b;
      font-size: 8pt;
    }

    .badge-pin {
      display: inline-block;
      font-weight: 800;
      background: #fff0b5;
      border: 1px solid #39305b;
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 7.5pt;
      color: #39305b;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER ================= -->
  <section class="page">
    <div class="cover-layout">
      <span class="cover-badge">FABRICATION & HARDWARE WORKSHOP GUIDE</span>
      <h1 class="cover-title">Alfa Radio<br><span>Plywood Box & Raspi 3 Guide</span></h1>
      <p class="cover-lead">Complete step-by-step instructions for fabricating the 6 mm birch plywood enclosure, configuring the Raspberry Pi 3 hardware, wiring the complete 27-lead atlas, and two sets of 1:1 printable cutting blueprints (Original Box & Little House Radio Case).</p>
      
      <div class="cover-image-card">
        <img src="${imgEnclosure}" alt="Alfa Plywood Case Assembled">
        <span class="cover-tag">REV A · WORKSHOP READY</span>
      </div>

      <div class="spec-grid">
        <div class="spec-box">
          <div class="label">Outer Dimensions</div>
          <div class="val">156 × 200 × 64 mm</div>
        </div>
        <div class="spec-box">
          <div class="label">Primary Material</div>
          <div class="val">6 mm Birch Plywood</div>
        </div>
        <div class="spec-box">
          <div class="label">Core Controller</div>
          <div class="val">Raspberry Pi 3 B / B+</div>
        </div>
        <div class="spec-box">
          <div class="label">Audio & Display</div>
          <div class="val">I²S 3W + 2.0" IPS LCD</div>
        </div>
      </div>

      <div class="callout callout-note" style="margin-top:auto;">
        <strong>Safety & Printing Notice:</strong> Both blueprint sets (Attachments 1 and 2) are exact 1:1 scale (Actual Size / 100%). Measure the 100 mm calibration line on each sheet before cutting. Never solder or change wiring with power connected.
      </div>

      <footer class="doc-footer">
        <span>Alfa Radio · Plywood Enclosure & Hardware Manual</span>
        <span>Page 1 / 18</span>
      </footer>
    </div>
  </section>

  <!-- ================= PAGE 2: TABLE OF CONTENTS & OVERVIEW ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">WORKSHOP MANUAL</span></div>
      <span class="doc-section-badge">Contents</span>
    </header>

    <h2>Table of Contents</h2>
    <ul class="toc-list">
      <li class="toc-item">
        <span class="toc-num">01</span>
        <div><span class="toc-title">Bill of Materials (List of Items Needed)</span><span class="toc-desc">Plywood, fasteners, electronics, wiring, tools</span></div>
        <span class="toc-page">Page 3</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">02</span>
        <div><span class="toc-title">Plywood Enclosure Fabrication & Assembly</span><span class="toc-desc">Step-by-step woodworking, cut list, gluing, fitting</span></div>
        <span class="toc-page">Page 4</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">03</span>
        <div><span class="toc-title">Internal Hardware Layout & Assembly Photos</span><span class="toc-desc">Component placement, power chain, rear cover standoffs</span></div>
        <span class="toc-page">Page 5</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">04</span>
        <div><span class="toc-title">Raspberry Pi 3 Hardware Setup & Linux Config</span><span class="toc-desc">OS setup, Device Tree overlays, SPI/I2S, GPIO reassignments</span></div>
        <span class="toc-page">Page 6</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">05</span>
        <div><span class="toc-title">Detailed Wiring Diagram & System Architecture</span><span class="toc-desc">Comprehensive visual schematic and electrical principles</span></div>
        <span class="toc-page">Page 7</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">06</span>
        <div><span class="toc-title">Complete 27-Wire Connection Atlas Table</span><span class="toc-desc">Pin-to-pin wiring table with colors and critical cautions</span></div>
        <span class="toc-page">Page 8</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">07</span>
        <div><span class="toc-title">Attachment 1: Original Plywood Case Blueprints</span><span class="toc-desc">Overview & four 1:1 cutting stencils (150 × 200 × 64 mm)</span></div>
        <span class="toc-page">Page 9</span>
      </li>
      <li class="toc-item">
        <span class="toc-num">08</span>
        <div><span class="toc-title">Attachment 2: Little House Radio Case Blueprints</span><span class="toc-desc">Overview & four 1:1 cutting stencils (Gable house with split roof)</span></div>
        <span class="toc-page">Page 14</span>
      </li>
    </ul>

    <h3>Project Architectural Concept</h3>
    <p>Alfa is an autonomous offline educational radio designed for toddlers and young children. It features physical tactile control (five sturdy arcade-style buttons), a 2.0-inch color IPS screen, rich audio output, and a self-contained battery power system. The plywood enclosure provides an organic, repairable chassis that protects internal electronics while allowing tool-assisted opening for maintenance.</p>

    <div class="callout callout-tip">
      <strong>Two Enclosure Options Included:</strong>
      <ul>
        <li><strong>Original Plywood Case (Attachment 1, Pages 9–13):</strong> Compact rectangular box (150 × 200 × 64 mm) using 4 standard A4 sheets and straight butt joints.</li>
        <li><strong>Little House Radio Case (Attachment 2, Pages 14–18):</strong> Gable house silhouette with dual split-opening roof wings on brass hinges, magnetic closure, and a 22 mm beech dowel carry handle.</li>
      </ul>
      Both designs accommodate the identical internal electronics, Raspberry Pi 3 hardware, and 27-wire connection atlas.
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Table of Contents</span>
      <span>Page 2 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 3: BILL OF MATERIALS ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">BILL OF MATERIALS</span></div>
      <span class="doc-section-badge">Section 1</span>
    </header>

    <h2>1. List of Items Needed (Bill of Materials)</h2>
    <p>Every component required to build and wire the complete Alfa offline radio with the plywood enclosure:</p>

    <h3>1.1. Wood & Structural Materials</h3>
    <table>
      <thead>
        <tr><th>Item</th><th>Specification</th><th>Qty</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Birch Plywood</strong></td><td>6 mm thickness, Grade BB/BB or B/BB</td><td>4 sheets</td><td>Four 210 × 297 mm (A4) blanks or 1× 600×300 mm sheet</td></tr>
        <tr><td><strong>Wood Glue</strong></td><td>PVA / Aliphatic resin (e.g. Titebond II / D3)</td><td>1 bottle</td><td>Permanent frame butt joints & laminated corner blocks</td></tr>
        <tr><td><strong>Sandpaper</strong></td><td>120, 180, and 240 grit sheets</td><td>1 pack</td><td>Deburring edges and opening smoothing</td></tr>
        <tr><td><strong>Foam & Velcro</strong></td><td>3 mm high-density foam + adhesive Velcro</td><td>~15 cm</td><td>Battery retention pad and non-slip mounting</td></tr>
      </tbody>
    </table>

    <h3>1.2. Fasteners, Spacers & Standoffs</h3>
    <table>
      <thead>
        <tr><th>Item</th><th>Specification</th><th>Qty</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Rear Cover Screws</strong></td><td>M3 × 25 mm machine screws (pan/countersunk)</td><td>4</td><td>Secures removable rear cover into threaded corner blocks</td></tr>
        <tr><td><strong>Captive Hex Nuts</strong></td><td>M3 standard steel hex nuts</td><td>4</td><td>Embedded into inner face of four laminated corner blocks</td></tr>
        <tr><td><strong>Switch Clamp Screws</strong></td><td>M3 × 35 mm machine screws + washers + nuts</td><td>2</td><td>Fastens side switch cover and inside retaining clamp</td></tr>
        <tr><td><strong>Switch Spacers</strong></td><td>12 mm M3 insulating nylon/brass spacers</td><td>2</td><td>Maintains correct spacing between side wall and switch clamp</td></tr>
        <tr><td><strong>Pi Standoffs</strong></td><td>8 mm M2.5 brass/nylon standoffs + M2.5 screws</td><td>4</td><td>Mounts Raspberry Pi 3 portrait to inside of rear cover</td></tr>
        <tr><td><strong>LCD Spacers</strong></td><td>4 mm M2.5 or M3 insulating spacers</td><td>4</td><td>Sets screen flush against 6 mm front panel window</td></tr>
        <tr><td><strong>Module Hardware</strong></td><td>Small M2/M2.5 screws, nuts & insulating washers</td><td>8</td><td>Mounting MAX98357A, ADS1115, keypad & divider board</td></tr>
      </tbody>
    </table>

    <h3>1.3. Electronics & Development Modules</h3>
    <table>
      <thead>
        <tr><th>Item</th><th>Specification</th><th>Qty</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Raspberry Pi 3</strong></td><td>Raspberry Pi 3 Model B (or 3 B+) + 16GB MicroSD</td><td>1</td><td>Main system computer running Alfa Linux player</td></tr>
        <tr><td><strong>Waveshare LCD</strong></td><td>2.0-inch IPS LCD, 240×320, SPI ST7789, SKU 17344</td><td>1</td><td>Character drawing and visual learning display</td></tr>
        <tr><td><strong>Audio Amplifier</strong></td><td>MAX98357A I²S 3.2W Class D mono breakout</td><td>1</td><td>Drives speaker directly from Raspberry Pi digital I²S audio</td></tr>
        <tr><td><strong>Analog ADC</strong></td><td>ADS1115 16-bit 4-channel I²C ADC breakout</td><td>1</td><td>Reads analog stepped voltage from 5-button keypad</td></tr>
        <tr><td><strong>5-Button Keypad</strong></td><td>AD-Key module with 5 tactile switches, 1 analog OUT</td><td>1</td><td>Tactile child controls (Left, Right, Up, Down, Center)</td></tr>
        <tr><td><strong>Speaker</strong></td><td>3 W / 4 Ω passive dynamic speaker (40 × 40 mm)</td><td>1</td><td>Clear vocal letter pronunciation and sound cues</td></tr>
        <tr><td><strong>Resistor Divider</strong></td><td>2× 10 kΩ 1/4W resistors + 16×20 mm perfboard</td><td>1</td><td>Halves keypad 0–5V signal down to safe 0–2.5V for ADC</td></tr>
        <tr><td><strong>Power Bank</strong></td><td>Baseus 5000 mAh ultra-slim (69 × 106 × 14 mm)</td><td>1</td><td>Internal rechargeable 5V power supply</td></tr>
        <tr><td><strong>Switched USB Lead</strong></td><td>Micro-USB cable with latching push-switch</td><td>1</td><td>Physical power disconnect switch on left side</td></tr>
        <tr><td><strong>Short USB-C Lead</strong></td><td>USB-C male to Micro-USB male cable (15–20 cm)</td><td>1</td><td>Connects Baseus bank to switched extension lead</td></tr>
        <tr><td><strong>Hookup Wiring</strong></td><td>24–26 AWG multi-strand wire + Dupont connectors</td><td>As req.</td><td>27 electrical connections with 100 mm service loop</td></tr>
      </tbody>
    </table>

    <h3>1.4. Required Workshop Tools</h3>
    <p>Coping saw / fret saw / jigsaw; drill with 3.0 mm, 3.5 mm, and 4.0 mm bits; soldering iron & solder; wire strippers; calipers; try square; 4× quick-grip clamps.</p>

    <footer class="doc-footer">
      <span>Alfa Radio · Bill of Materials</span>
      <span>Page 3 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 4: PLYWOOD BOX ASSEMBLY ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">FABRICATION & ASSEMBLY</span></div>
      <span class="doc-section-badge">Section 2</span>
    </header>

    <h2>2. How to Assemble the Plywood Box</h2>
    <p>Follow this verified workshop order to build the enclosure accurately and ensure all internal components fit perfectly.</p>

    <h3>2.1. Cut List Summary (Four A4 Sheets of 6 mm Plywood)</h3>
    <table>
      <thead>
        <tr><th>Sheet</th><th>Part Name</th><th>Dimensions</th><th>Qty</th><th>Features</th></tr>
      </thead>
      <tbody>
        <tr><td>Sheet 1</td><td>Front Panel</td><td>150 × 200 × 6 mm</td><td>1</td><td>32×46 LCD cutout, 28×63 keypad cutout, 21-hole speaker grille</td></tr>
        <tr><td>Sheet 2</td><td>Rear Cover</td><td>150 × 200 × 6 mm</td><td>1</td><td>4× M3 screw holes, 10 cooling vents, 49×58 Pi mount pattern</td></tr>
        <tr><td>Sheet 3</td><td>Left & Right Walls</td><td>52 × 188 × 6 mm</td><td>2</td><td>5× vent holes per wall; left wall has 26×44 mm switch window</td></tr>
        <tr><td>Sheet 3</td><td>Top & Bottom</td><td>150 × 52 × 6 mm</td><td>2</td><td>6× vent holes per panel; spans full 150 mm box width</td></tr>
        <tr><td>Sheet 4</td><td>Switch Cover</td><td>40 × 72 × 6 mm</td><td>1</td><td>Outer cover with Ø16 mm hole for push-button actuator</td></tr>
        <tr><td>Sheet 4</td><td>Inside Switch Clamp</td><td>22 × 64 × 6 mm</td><td>1</td><td>Inner clamping bar securing switch body against left wall</td></tr>
        <tr><td>Sheet 4</td><td>Corner Block Pads</td><td>12 × 12 × 6 mm</td><td>8</td><td>Glued in pairs to make four 12 mm corner blocks with M3 nuts</td></tr>
      </tbody>
    </table>

    <h3>2.2. Step-by-Step Woodworking Instructions</h3>
    <ol>
      <li><strong>Print and Verify Templates:</strong> Print Sheets 1–4 from Attachment 1 at <strong>100% (Actual Size)</strong>. Measure the 100 mm calibration line with a steel ruler. If it is not exactly 100 mm, adjust printer scale settings. Fix the templates to the plywood with removable spray adhesive or tape.</li>
      <li><strong>Cut Out Outer Panels:</strong> Cut the outer borders using a fine-toothed hand saw or jigsaw, cutting slightly to the waste side of the line, then sanding flat to the template boundary.</li>
      <li><strong>Cut Internal Apertures:</strong> For closed cutouts (LCD window 32 × 46 mm, stepped keypad opening 28 × 63 mm, side switch slot 26 × 44 mm), drill a 4 mm starter hole inside the waste area, feed your coping or fret saw blade through, and carefully cut out the opening. Pay close attention to the stepped keypad tabs—do not cut away the four corner support tabs.</li>
      <li><strong>Drill Ventilation & Mounting Holes:</strong>
        <ul>
          <li>Speaker grille: drill 21 holes (Ø4.0 mm) on a 6 mm grid at X112 Y32.</li>
          <li>Cooling vents: drill ten Ø4.0 mm holes on rear cover, five on each side wall, and six on top and bottom panels.</li>
          <li>Mounting holes: drill four Ø3.0 mm holes for LCD, four Ø3.0 mm holes on rear cover for Pi 3 (49 × 58 mm pattern), and four Ø3.5 mm holes in the rear cover corners for M3 screws.</li>
        </ul>
      </li>
      <li><strong>Fabricate Laminated Corner Blocks:</strong> Glue pairs of 12 × 12 × 6 mm pads together to form four 12 mm thick blocks. Drill a Ø3.5 mm center hole through each block. Press an M3 hex nut into the inward face and secure with a tiny drop of cyanoacrylate (superglue), keeping glue away from the internal threads.</li>
      <li><strong>Glue the Main Frame:</strong> Apply wood glue to the ends of the left and right walls (52 × 188 mm) and join them between the top and bottom panels (150 × 52 mm). Use a try square to ensure all corners are exactly 90°. Clamp firmly and allow to cure for 60 minutes.</li>
      <li><strong>Attach the Front Panel:</strong> Apply glue along the front perimeter of the rectangular frame and position the front panel (150 × 200 mm) flush with all outer edges. Clamp and let cure.</li>
      <li><strong>Install Corner Blocks:</strong> Glue the four threaded corner blocks into the inner rear corners of the box, flush with the rear opening plane. <em>Do not glue the rear cover!</em> The rear cover must remain removable.</li>
    </ol>

    <div class="callout callout-warning">
      <strong>Provisional Hole Pitch Warning:</strong> Amber markings on templates are placement guides based on standard module drawings. Always place your actual purchased components (LCD, keypad, switch) over the paper templates to verify mounting hole positions before drilling!
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Plywood Box Fabrication</span>
      <span>Page 4 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 5: INTERNAL COMPONENT ASSEMBLY ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">INTERNAL ASSEMBLY</span></div>
      <span class="doc-section-badge">Section 2 (Cont.)</span>
    </header>

    <h2>2.3. Internal Component Installation & Power Setup</h2>
    <p>The clear inside volume is 138 × 188 × 52 mm. The components are organized in layered depth zones to prevent mechanical interference while maintaining accessibility.</p>

    <div class="figure-row">
      <div class="figure-card">
        <img src="${imgInternals}" alt="Internal Component Placement">
        <div class="figure-caption">Internal layout: LCD & buttons on front; Pi 3 on rear cover.</div>
      </div>
      <div class="figure-card">
        <img src="${imgExploded}" alt="Exploded Enclosure Assembly">
        <div class="figure-caption">Exploded view: Removable rear cover and side switch clamp.</div>
      </div>
    </div>

    <h3>Step-by-Step Installation Order</h3>
    <ol start="9">
      <li><strong>Mount Front Panel Electronics:</strong>
        <ul>
          <li><strong>LCD:</strong> Place Waveshare 2.0" display into the window from inside using 4 mm nylon spacers. Screen faces the opening. Fasten gently with M2.5/M3 screws.</li>
          <li><strong>Speaker:</strong> Center 40 × 40 mm speaker over the 21-hole grille. Secure with corner brackets or foam gasket and small screws.</li>
          <li><strong>Keypad:</strong> Seat the 5-button keypad board behind the stepped window. Check that all 5 button caps travel freely through the 6 mm plywood without sticking. Fasten to the corner plywood tabs.</li>
          <li><strong>Small Boards:</strong> Mount MAX98357A amplifier and ADS1115 ADC on 4 mm and 3 mm insulating standoffs. Mount the small 16 × 20 mm resistor divider perfboard beside the keypad.</li>
        </ul>
      </li>
      <li><strong>Install Power Bank:</strong> Apply 3 mm foam pad and adhesive Velcro at X73 Y82 (right side of inside front). Place Baseus 5000 mAh battery with its USB-C port facing upward. Fasten two retaining straps around the bank. Ensure the power button on the bank is accessible when the rear cover is opened.</li>
      <li><strong>Assemble Side USB Power Switch:</strong> Place the body of the switched micro-USB cable into the 26 × 44 mm side slot in the left wall. Place the inside plywood clamp (22 × 64 mm) over the switch body, separated by two 12 mm M3 spacers. Insert two M3 × 35 mm screws through the outer switch cover (40 × 72 mm), through the wall, through the spacers, and through the clamp. Tighten nuts until the switch is firmly retained without crushing its plastic housing.</li>
      <li><strong>Mount Raspberry Pi 3 on Rear Cover:</strong> Thread four 8 mm M2.5 brass standoffs into the rear cover holes. Fasten Raspberry Pi 3 portrait orientation, components facing inward into the box, USB/Ethernet ports facing down/left.</li>
      <li><strong>Power Chain Connection:</strong> Connect: Baseus USB-C port &rarr; short USB-C to micro-USB cable &rarr; switched cable female socket &rarr; cable switch body &rarr; micro-USB male connector &rarr; Raspberry Pi 3 power input.</li>
      <li><strong>Signal Wire Service Loop (CRITICAL):</strong> Wire all connections following the wiring atlas. Add <strong>100 mm of extra wire length</strong> on all leads running from the front panel to the Raspberry Pi GPIO header. This allows lifting the rear cover by ~20 mm to disconnect power before full opening.</li>
      <li><strong>Initial Testing & Closure:</strong> Test all 5 buttons, display rendering, and audio before closing. Lift and lower the rear cover to verify no wires pinch against the frame or battery. Fasten with four M3 × 25 mm screws into the corner blocks.</li>
    </ol>

    <div class="callout callout-tip">
      <strong>Battery Charging Procedure:</strong> The Baseus power bank shares its single USB-C port for both output and recharging. To recharge: shut down the Pi via software, turn off the side switch, remove the 4 rear screws, open the rear cover 20 mm, unplug the power lead from the bank, and plug in a USB-C charger.
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Internal Assembly</span>
      <span>Page 5 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 6: RASPI 3 HARDWARE SETUP ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">RASPI 3 HARDWARE SETUP</span></div>
      <span class="doc-section-badge">Section 3</span>
    </header>

    <h2>3. Raspberry Pi 3 Hardware Setup & Linux Configuration</h2>
    <p>The Alfa player runs on Raspberry Pi OS (Debian Bookworm or newer, 64-bit Lite recommended). Follow this configuration guide to set up kernel drivers, Device Tree overlays, and audio subsystems.</p>

    <h3>3.1. Kernel Overlays &amp; Configuration (<code>/boot/firmware/config.txt</code>)</h3>
    <p>Open <code>/boot/firmware/config.txt</code> (or <code>/boot/config.txt</code> on older OS releases) and add the following configuration lines:</p>
    
    <div style="background:#ffffff; border:1.2px solid #39305b; border-radius:8px; padding:10px 14px; margin:8px 0; font-family:ui-monospace,monospace; font-size:8pt; line-height:1.45;">
      # --- Alfa Radio Hardware Configuration ---<br>
      # 1. Enable SPI for Waveshare 2.0-inch ST7789 LCD<br>
      <strong style="color:#1d6fa5;">dtparam=spi=on</strong><br><br>
      # 2. Enable I2C for ADS1115 ADC Keypad Reader<br>
      <strong style="color:#1d6fa5;">dtparam=i2c_arm=on</strong><br>
      <strong style="color:#1d6fa5;">dtparam=i2c_arm_baudrate=400000</strong><br><br>
      # 3. Enable MAX98357A I2S DAC Mono Amplifier<br>
      <strong style="color:#1d6fa5;">dtoverlay=max98357a</strong><br><br>
      # 4. Disable onboard analog headphone audio (prevents ALSA card index confusion)<br>
      <strong style="color:#ba2d2d;">dtparam=audio=off</strong>
    </div>

    <h3>3.2. CRITICAL GPIO PIN CONFLICT RESOLUTION</h3>
    <div class="callout callout-warning">
      <strong>PIN CONFLICT WARNING:</strong> Waveshare's standard LCD documentation specifies connecting the display Backlight (<code>BL</code>) to physical <strong>Pin 12 (GPIO18)</strong>.<br>
      However, the MAX98357A I²S digital audio amplifier requires physical <strong>Pin 12 (GPIO18)</strong> as its <strong>Bit Clock (BCLK)</strong>!<br>
      If both modules were wired to Pin 12, the audio clock would rapidly toggle the display backlight, causing audio failure and display flickering.
    </div>
    <p><strong>The Alfa Solution:</strong></p>
    <ul>
      <li>Physical <strong>Pin 12 (GPIO18)</strong> is dedicated exclusively to the MAX98357A audio Bit Clock (<code>BCLK</code>).</li>
      <li>Waveshare LCD Backlight (<code>BL</code>) is moved to physical <strong>Pin 18 (GPIO24)</strong>.</li>
      <li>The Alfa software application (<code>app/display.py</code>) initializes GPIO24 as the backlight PWM/digital control pin.</li>
    </ul>

    <h3>3.3. Audio Configuration (ALSA & Volume Ceiling)</h3>
    <p>The MAX98357A is a digital I²S amplifier without hardware volume registers. Software volume scaling is handled by ALSA via <code>/etc/asound.conf</code>:</p>
    <div style="background:#ffffff; border:1.2px solid #39305b; border-radius:8px; padding:8px 12px; margin:6px 0; font-family:ui-monospace,monospace; font-size:7.5pt; line-height:1.4;">
      pcm.!default {<br>
      &nbsp;&nbsp;type plug<br>
      &nbsp;&nbsp;slave.pcm "softvol"<br>
      }<br>
      pcm.softvol {<br>
      &nbsp;&nbsp;type softvol<br>
      &nbsp;&nbsp;slave.pcm "hw:0,0"<br>
      &nbsp;&nbsp;control { name "Master"; card 0; }<br>
      &nbsp;&nbsp;max_dB 0.0; min_dB -50.0<br>
      }
    </div>
    <p>Because the MAX98357A can deliver up to 3.2 Watts into a 4 Ω speaker, set initial volume to ~65% via <code>alsamixer</code> to protect children's hearing and avoid speaker clipping.</p>

    <h3>3.4. Inactivity Timer & Power Management</h3>
    <p>Alfa implements an automatic power-saving routine: after <strong>5 minutes of inactivity</strong>, the player smoothly fades out audio, shows a goodbye screen, and executes a clean Linux shutdown (<code>sudo poweroff</code>). When the green Pi activity LED stops flashing, the user presses the side inline USB push-switch to disconnect battery power completely.</p>

    <footer class="doc-footer">
      <span>Alfa Radio · Raspi 3 Hardware Setup</span>
      <span>Page 6 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 7: DETAILED WIRING DIAGRAM ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">WIRING DIAGRAM</span></div>
      <span class="doc-section-badge">Section 4</span>
    </header>

    <h2>4. Detailed Connection Diagram & System Architecture</h2>
    <p>This diagram illustrates how all peripheral modules interface with the Raspberry Pi 3 40-pin GPIO header and power distribution.</p>

    <div style="background:#ffffff; border:1.5px solid #39305b; border-radius:12px; padding:6px; margin:6px 0 10px; box-shadow:3px 4px 0 #c8b7d9;">
      <div style="width:100%; height:116mm; display:flex; align-items:center; justify-content:center; overflow:hidden;">
        ${svgWiringDiagram}
      </div>
      <div style="font-size:7.2pt; font-weight:700; color:#5c4f74; padding-top:4px; border-top:1px dashed #dcd1ea; margin-top:4px; text-align:center;">
        Complete schematic wiring diagram: Raspberry Pi 3 40-pin GPIO, Waveshare 2" LCD (SPI), MAX98357A (I²S), 3W Speaker, ADS1115 ADC (I²C), 5-Button Keypad, 10k Divider &amp; Battery Power.
      </div>
    </div>

    <h3>Electrical Principles & Grounding Rules</h3>
    <ul>
      <li><strong>Star Grounding:</strong> Connect module grounds directly to dedicated Pi GND pins (Pin 6, 9, 14, 20, 25). Do not daisy-chain ground wires in a loop to avoid digital switching noise from bleeding into the audio amplifier.</li>
      <li><strong>Keypad Voltage Divider:</strong> The 5-button AD-Key module operates at 5V, outputting analog signals from 0V to 5V. The Raspberry Pi and ADS1115 ADC logic cannot tolerate 5V on their signal pins. Two 10 kΩ resistors in series halve the voltage to 0–2.5V, well within the ADS1115 3.3V reference window.</li>
      <li><strong>Speaker Differential Output:</strong> The MAX98357A uses Bridge-Tied Load (BTL) output. Neither <code>OUT+</code> nor <code>OUT-</code> connects to ground. Connecting <code>OUT-</code> to GND will cause an immediate short circuit and destroy the amplifier IC.</li>
    </ul>

    <div class="callout callout-warning">
      <strong>CRITICAL WIRING RULES:</strong>
      <ol style="margin:4px 0 0; padding-left:16px;">
        <li><strong>NEVER connect Speaker (-) to GND.</strong> It connects ONLY to MAX98357A <code>OUT-</code>.</li>
        <li><strong>NEVER connect Keypad OUT directly to the ADC or Pi without the 10k/10k divider.</strong></li>
        <li><strong>Always double-check pin numbers against physical header positions</strong> before turning on battery power.</li>
      </ol>
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Detailed Wiring Diagram</span>
      <span>Page 7 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 8: 27-WIRE CONNECTION ATLAS TABLE ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">CONNECTION ATLAS</span></div>
      <span class="doc-section-badge">Section 4 (Cont.)</span>
    </header>

    <h2>4.1. Complete 27-Wire Connection Atlas</h2>
    <p>Every wire in the Alfa player with its wire ID, circuit group, endpoints, physical pin numbers, and suggested color:</p>

    <table style="font-size:7.4pt; margin:6px 0;">
      <thead>
        <tr>
          <th>Wire</th><th>Circuit</th><th>From (Component Pin)</th><th>To (Destination / Pi Pin)</th><th>Signal Function</th><th>Color</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>W01</strong></td><td>LCD</td><td>Waveshare LCD <code>VCC</code></td><td><span class="badge-pin">Pin 1</span> (3.3V)</td><td>3.3V Logic Power</td><td>Red</td></tr>
        <tr><td><strong>W02</strong></td><td>LCD</td><td>Waveshare LCD <code>GND</code></td><td><span class="badge-pin">Pin 6</span> (GND)</td><td>Ground</td><td>Black</td></tr>
        <tr><td><strong>W03</strong></td><td>LCD</td><td>Waveshare LCD <code>DIN</code></td><td><span class="badge-pin">Pin 19</span> (GPIO10)</td><td>SPI0 MOSI Data</td><td>Blue</td></tr>
        <tr><td><strong>W04</strong></td><td>LCD</td><td>Waveshare LCD <code>CLK</code></td><td><span class="badge-pin">Pin 23</span> (GPIO11)</td><td>SPI0 SCLK Clock</td><td>Orange</td></tr>
        <tr><td><strong>W05</strong></td><td>LCD</td><td>Waveshare LCD <code>CS</code></td><td><span class="badge-pin">Pin 24</span> (GPIO8)</td><td>SPI0 CE0 Chip Select</td><td>Yellow</td></tr>
        <tr><td><strong>W06</strong></td><td>LCD</td><td>Waveshare LCD <code>DC</code></td><td><span class="badge-pin">Pin 22</span> (GPIO25)</td><td>Data/Command Select</td><td>Green</td></tr>
        <tr><td><strong>W07</strong></td><td>LCD</td><td>Waveshare LCD <code>RST</code></td><td><span class="badge-pin">Pin 13</span> (GPIO27)</td><td>Display Hardware Reset</td><td>Purple</td></tr>
        <tr><td><strong>W08</strong></td><td>LCD</td><td>Waveshare LCD <code>BL</code></td><td><span class="badge-pin">Pin 18</span> (GPIO24)</td><td>Backlight PWM (Relocated)</td><td>White</td></tr>

        <tr><td><strong>W09</strong></td><td>Audio</td><td>MAX98357A <code>VIN</code></td><td><span class="badge-pin">Pin 2</span> (5V)</td><td>5V Amplifier Power</td><td>Red</td></tr>
        <tr><td><strong>W10</strong></td><td>Audio</td><td>MAX98357A <code>GND</code></td><td><span class="badge-pin">Pin 9</span> (GND)</td><td>Audio Ground</td><td>Black</td></tr>
        <tr><td><strong>W11</strong></td><td>Audio</td><td>MAX98357A <code>LRC</code></td><td><span class="badge-pin">Pin 35</span> (GPIO19)</td><td>I²S Frame Clock (PCM_FS)</td><td>Yellow</td></tr>
        <tr><td><strong>W12</strong></td><td>Audio</td><td>MAX98357A <code>BCLK</code></td><td><span class="badge-pin">Pin 12</span> (GPIO18)</td><td>I²S Bit Clock (PCM_CLK)</td><td>Green</td></tr>
        <tr><td><strong>W13</strong></td><td>Audio</td><td>MAX98357A <code>DIN</code></td><td><span class="badge-pin">Pin 40</span> (GPIO21)</td><td>I²S Data (PCM_DOUT)</td><td>Blue</td></tr>

        <tr><td><strong>W14</strong></td><td>Speaker</td><td>MAX98357A <code>OUT+</code></td><td>Speaker (+) Terminal</td><td>Positive Audio Phase</td><td>Gray</td></tr>
        <tr><td><strong>W15</strong></td><td>Speaker</td><td>MAX98357A <code>OUT-</code></td><td>Speaker (-) Terminal</td><td>Negative Audio Phase (NOT GND!)</td><td>Purple</td></tr>

        <tr><td><strong>W16</strong></td><td>ADC</td><td>ADS1115 <code>VDD</code></td><td><span class="badge-pin">Pin 17</span> (3.3V)</td><td>3.3V ADC Power</td><td>Red</td></tr>
        <tr><td><strong>W17</strong></td><td>ADC</td><td>ADS1115 <code>GND</code></td><td><span class="badge-pin">Pin 20</span> (GND)</td><td>ADC Ground (ADDR to GND)</td><td>Black</td></tr>
        <tr><td><strong>W18</strong></td><td>ADC</td><td>ADS1115 <code>SCL</code></td><td><span class="badge-pin">Pin 5</span> (GPIO3)</td><td>I²C Clock (I2C1_SCL)</td><td>Orange</td></tr>
        <tr><td><strong>W19</strong></td><td>ADC</td><td>ADS1115 <code>SDA</code></td><td><span class="badge-pin">Pin 3</span> (GPIO2)</td><td>I²C Data (I2C1_SDA)</td><td>Green</td></tr>

        <tr><td><strong>W20</strong></td><td>Keypad</td><td>AD-Keypad <code>VCC</code></td><td><span class="badge-pin">Pin 4</span> (5V)</td><td>5V Button Ladder Bias</td><td>Red</td></tr>
        <tr><td><strong>W21</strong></td><td>Keypad</td><td>AD-Keypad <code>GND</code></td><td><span class="badge-pin">Pin 14</span> (GND)</td><td>Button Ladder Ground</td><td>Black</td></tr>
        <tr><td><strong>W22</strong></td><td>Divider</td><td>AD-Keypad <code>OUT</code></td><td>Divider Perfboard R1 In</td><td>Raw 0–5V Keypad Signal</td><td>Yellow</td></tr>
        <tr><td><strong>W23</strong></td><td>Divider</td><td>Divider Midpoint (R1/R2)</td><td>ADS1115 <code>A0</code> Input</td><td>Divided 0–2.5V Safe Signal</td><td>Orange</td></tr>
        <tr><td><strong>W24</strong></td><td>Divider</td><td>Divider R2 Ground End</td><td><span class="badge-pin">Pin 25</span> (GND)</td><td>Divider Ground Return</td><td>Black</td></tr>

        <tr><td><strong>W25</strong></td><td>Power</td><td>Switched Micro-USB (+)</td><td>Pi Micro-USB Power In (+)</td><td>Switched 5V Power Supply</td><td>Red</td></tr>
        <tr><td><strong>W26</strong></td><td>Power</td><td>Switched Micro-USB (-)</td><td>Pi Micro-USB Power In (-)</td><td>Main Power Ground</td><td>Black</td></tr>
        <tr><td><strong>W27</strong></td><td>Power</td><td>Baseus USB-C Output</td><td>Switched Lead Female Socket</td><td>Upstream 5V Battery Connection</td><td>Black</td></tr>
      </tbody>
    </table>

    <div class="callout callout-note" style="margin-top:auto;">
      <strong>Wire Preparation Tip:</strong> Twist wire pairs W11/W12/W13 (I²S clocks/data) together, and twist W14/W15 (Speaker outputs) together. Twisting reduces electromagnetic radiation and hum. Ensure all leads connecting to the Raspberry Pi have at least 100 mm service slack.
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · 27-Wire Connection Atlas</span>
      <span>Page 8 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGE 9: ATTACHMENT 1 OVERVIEW ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">ATTACHMENT 1: ORIGINAL PLYWOOD CASE</span></div>
      <span class="doc-section-badge">Attachment 1</span>
    </header>

    <h2>Attachment 1: Original Plywood Case Blueprints</h2>
    <p>This attachment provides the complete set of four 1:1 cutting and drilling stencils for the original rectangular Alfa plywood enclosure (150 × 200 × 64 mm). Fabricated from four A4 sheets of 6 mm birch plywood.</p>

    <div class="figure-row">
      <div class="figure-card">
        <img src="${imgEnclosure}" alt="Assembled Original Plywood Case">
        <div class="figure-caption">Original case: clean rectangular chassis with side switch cover.</div>
      </div>
      <div class="figure-card">
        <img src="${imgExploded}" alt="Exploded View of Original Case">
        <div class="figure-caption">Exploded view: Butt joints, 4 corner blocks, removable rear cover.</div>
      </div>
    </div>

    <h3>Blueprint Index (Sheets 1–4)</h3>
    <ul>
      <li><strong>Sheet 1 (Page 10):</strong> Front Panel (150 × 200 mm) with LCD window (32 × 46 mm), stepped 5-button keypad cutout (28 × 63 mm), 21-hole speaker grille (Ø4 mm), and 100 mm calibration line.</li>
      <li><strong>Sheet 2 (Page 11):</strong> Removable Rear Cover (150 × 200 mm) with four corner M3 screw clearance holes, ten cooling vents, Raspberry Pi 3 mounting holes (49 × 58 mm pattern), and 100 mm calibration line.</li>
      <li><strong>Sheet 3 (Page 12):</strong> Left & Right Walls (52 × 188 mm) with side vents and switch slot; Top & Bottom Panels (150 × 52 mm) with vents; vertical 100 mm calibration gauge.</li>
      <li><strong>Sheet 4 (Page 13):</strong> Side Switch Cover (40 × 72 mm), Inside Switch Clamp (22 × 64 mm), eight Corner Block Pads (12 × 12 mm), and 100 mm calibration gauge.</li>
    </ul>

    <div class="callout callout-warning">
      <strong>Printing Scale Calibration:</strong>
      Every sheet includes a <strong>100 mm calibration line</strong>. You MUST measure this gauge with a ruler before cutting any wood. Set your printer software to <strong>"Actual Size" / 100% scaling</strong>. Never select "Fit to Printable Area" or "Shrink Oversized Pages".
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Attachment 1 Overview</span>
      <span>Page 9 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGES 10-13: ATTACHMENT 1 BLUEPRINTS ================= -->
  <!-- Sheet 1: Front Panel -->
  <section class="page blueprint-page">
    ${svgSheet1}
  </section>

  <!-- Sheet 2: Rear Cover -->
  <section class="page blueprint-page">
    ${svgSheet2}
  </section>

  <!-- Sheet 3: Side, Top & Bottom Walls -->
  <section class="page blueprint-page">
    ${svgSheet3}
  </section>

  <!-- Sheet 4: Switch Cover, Clamp & Corner Blocks -->
  <section class="page blueprint-page">
    ${svgSheet4}
  </section>

  <!-- ================= PAGE 14: ATTACHMENT 2 OVERVIEW ================= -->
  <section class="page">
    <header class="doc-header">
      <div class="doc-logo">α</div>
      <div><span class="doc-title">Alfa Radio</span><span class="doc-subtitle">ATTACHMENT 2: HOUSE CASE BLUEPRINTS</span></div>
      <span class="doc-section-badge">Attachment 2</span>
    </header>

    <h2>Attachment 2: Little House Radio Case Blueprints</h2>
    <p>This attachment provides the complete set of four 1:1 cutting and drilling stencils for the Little House Radio enclosure (178.3 × 278 × 100 mm). Designed around a gable silhouette with a split opening roof on brass hinges and a sturdy 22 mm beech dowel carry handle.</p>

    <div class="figure-row">
      <div class="figure-card">
        <img src="${imgHouseIso}" alt="Little House Radio Enclosure">
        <div class="figure-caption">Gable house silhouette with chimney tabs and 22 mm dowel handle.</div>
      </div>
      <div class="figure-card">
        <img src="${imgHouseRoofOpen}" alt="Little House Radio Split Roof Open">
        <div class="figure-caption">Split roof opens like wings for battery charging; clicks shut with magnets.</div>
      </div>
    </div>

    <h3>Architectural Features & Cut List</h3>
    <ul>
      <li><strong>Split Roof Mechanism:</strong> Two identical roof boards (120 × 86 mm) open on 25 × 20 mm brass butt hinges. Overhang lands on the wall at 90° as a positive stop. Neodymium magnets (Ø10 × 3 mm) in wooden wedges click the roof shut.</li>
      <li><strong>Central Battery Stand:</strong> Baseus 5000 mAh power bank stands upright on the floor against the back gable, held by a wooden fence, with its USB-C port right below the ridge for easy charging access.</li>
      <li><strong>Internal Layout:</strong> Raspberry Pi 3 mounts to the inside of the left wall; QUARKZMAN push switch mounts high in the back gable.</li>
    </ul>

    <table>
      <thead>
        <tr><th>Sheet</th><th>Part Name</th><th>Dimensions</th><th>Qty</th><th>Features</th></tr>
      </thead>
      <tbody>
        <tr><td>Sheet 1 (P.15)</td><td>Front Gable (Part A)</td><td>150 × 278 × 6 mm</td><td>1</td><td>LCD window, button opening, attic speaker grille</td></tr>
        <tr><td>Sheet 2 (P.16)</td><td>Back Gable (Part B)</td><td>150 × 278 × 6 mm</td><td>1</td><td>Removable service panel, switch hole, dowel mount</td></tr>
        <tr><td>Sheet 3 (P.17)</td><td>Floor &amp; Walls (Parts C, D, E)</td><td>88 × 138 mm / 88 × 121.5 mm</td><td>3</td><td>Floor, left/right walls, switch clamp, 8 corner blocks</td></tr>
        <tr><td>Sheet 4 (P.18)</td><td>Roof Boards &amp; Wedges (F, H, J)</td><td>86 × 120.1 mm / 16 × 16 mm</td><td>15</td><td>2 roof boards, 12 magnet wedges, battery fence</td></tr>
      </tbody>
    </table>

    <div class="callout callout-warning">
      <strong>Printing Scale Calibration:</strong>
      Print Sheets 1–4 at <strong>100% (Actual Size)</strong>. Measure the 100 mm calibration gauge with a ruler on every page before making saw cuts.
    </div>

    <footer class="doc-footer">
      <span>Alfa Radio · Attachment 2 Overview</span>
      <span>Page 14 / 18</span>
    </footer>
  </section>

  <!-- ================= PAGES 15-18: ATTACHMENT 2 BLUEPRINTS ================= -->
  <!-- House Sheet 1: Front Gable -->
  <section class="page blueprint-page">
    ${svgHouse1}
  </section>

  <!-- House Sheet 2: Back Gable -->
  <section class="page blueprint-page">
    ${svgHouse2}
  </section>

  <!-- House Sheet 3: Floor, Walls, Clamp & Corner Blocks -->
  <section class="page blueprint-page">
    ${svgHouse3}
  </section>

  <!-- House Sheet 4: Roof Boards, Magnet Wedges & Battery Fence -->
  <section class="page blueprint-page">
    ${svgHouse4}
  </section>

</body>
</html>`;

  console.log('Rendering 18-page PDF via Playwright...');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });
    
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, pdf);
    console.log(`Plywood Assembly Guide PDF generated successfully: ${destination} (${pdf.length} bytes)`);
    return destination;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dest = resolve(process.argv[2] || resolve(root, 'docs/plywood-assembly-guide.pdf'));
  await exportPlywoodGuide(dest);
}
