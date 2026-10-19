import {getLocale} from '../i18n.js';

const copy = {
  pl: {
    title: 'Od pliku do gotowej skorupy', label: 'Wybierz drukarkę', default: 'domyślnie',
    note: 'Pliki 3MF zawierają modele. Ustawienia druku wybierz w profilu swojej drukarki; skalę pozostaw na 100%.',
    ender: [
      ['Profil Endera', 'W Cura lub OrcaSlicer wybierz dokładny model Endera i dyszę 0,4 mm. Skorupa z brimem mieści się w polu 220 × 220 mm.'],
      ['Wczytaj jedną skorupę', 'Otwórz front.stl albo rear.stl. Zewnętrzna strona leży na stole, skala 100%. Drukuj każdą skorupę osobno.'],
      ['PETG i podpory', 'Warstwa 0,2 mm, 5 ścian, 25% gyroid, brim 2 mm. Dodaj lokalne podpory otworów bocznych; zachowaj wolne szczeliny zatrzasków.'],
      ['Kupony → skorupy', 'Potnij model i obejrzyj warstwy. Najpierw wydrukuj kupony pasowania. Po sprawdzeniu wydrukuj skorupy, używając G-code dla swojego Endera.'],
    ],
    bambu: [
      ['Bambu Studio · P2S', 'Wybierz Bambu Lab P2S, dyszę 0,4 mm i profil PETG zgodny z używanym filamentem.'],
      ['Importuj jako model', 'Wczytaj STL lub 3MF jako geometrię i zachowaj profil P2S. Skala 100%, zewnętrzną stroną w dół; jedna skorupa na płytę.'],
      ['Ustawienia obiektu', 'Warstwa 0,2 mm, 5 ścian, 25% gyroid i brim 2 mm. Podpory tylko tam, gdzie są potrzebne; nie w szczelinach zatrzasków.'],
      ['Podgląd → druk', 'Sprawdź warstwy i podpory w Bambu Studio. Najpierw wydrukuj kupony. Po sprawdzeniu pasowania wyślij do P2S po jednej skorupie.'],
    ],
    link: 'Pobierz Bambu Studio ↗',
  },
  en: {
    title: 'From file to finished shell', label: 'Choose a printer', default: 'default',
    note: 'The 3MF files contain models. Select print settings in your own printer profile and keep the scale at 100%.',
    ender: [
      ['Ender profile', 'In Cura or OrcaSlicer, select your exact Ender model and a 0.4 mm nozzle. The shell plus brim fits within 220 × 220 mm.'],
      ['Load one shell', 'Open front.stl or rear.stl. The outside face rests on the bed at 100% scale. Print each shell separately.'],
      ['PETG and supports', 'Use 0.2 mm layers, 5 walls, 25% gyroid and a 2 mm brim. Add local supports at side bores; keep snap gaps clear.'],
      ['Coupons → shells', 'Slice and inspect the layers. Print the fit coupons first. Once they fit, print the shells using G-code for your Ender.'],
    ],
    bambu: [
      ['Bambu Studio · P2S', 'Select Bambu Lab P2S, a 0.4 mm nozzle and the PETG profile matching your filament.'],
      ['Import as a model', 'Load STL or 3MF as geometry and retain the P2S profile. Use 100% scale, outside face down, one shell per plate.'],
      ['Object settings', 'Use 0.2 mm layers, 5 walls, 25% gyroid and a 2 mm brim. Support only where needed; keep snap gaps clear.'],
      ['Preview → print', 'Inspect layers and supports in Bambu Studio. Print the coupons first. Once the fit is checked, send one shell at a time to the P2S.'],
    ],
    link: 'Download Bambu Studio ↗',
  },
};

export function initPrintRoadmap(root = document.querySelector('#print-roadmap')) {
  if (!root) return;
  const text = copy[getLocale()] || copy.pl;
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  };
  const heading = node('div', 'print-roadmap-heading');
  heading.append(node('h4', '', text.title));
  const tabs = node('div', 'print-printer-tabs');
  tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', text.label);
  heading.append(tabs);
  root.replaceChildren(heading);
  const buttons = [], panels = [];
  for (const [index, [id, title]] of [['ender', 'Ender'], ['bambu', 'Bambu Lab P2S']].entries()) {
    const button = node('button', 'print-printer-tab', title);
    button.type = 'button'; button.id = `print-tab-${id}`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', `print-panel-${id}`);
    button.dataset.printer = id;
    if (!index) button.append(node('small', '', text.default));
    tabs.append(button); buttons.push(button);
    const panel = node('div', 'print-roadmap-panel');
    panel.id = `print-panel-${id}`; panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    const steps = node('ol', 'print-roadmap-steps');
    for (const [step, [title, body]] of text[id].entries()) {
      const item = node('li', 'print-roadmap-step');
      const number = node('span', 'print-step-number', String(step + 1)); number.setAttribute('aria-hidden', 'true');
      item.append(number, node('strong', '', title), node('p', '', body));
      steps.append(item);
    }
    panel.append(steps);
    if (id === 'bambu') {
      const link = node('a', 'text-link', text.link);
      link.href = 'https://bambulab.com/en/download/studio';
      panel.append(link);
    }
    panels.push(panel); root.append(panel);
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      const next = {ArrowRight: (index + 1) % 2, ArrowLeft: (index + 1) % 2, Home: 0, End: 1}[event.key];
      if (next === undefined) return;
      event.preventDefault(); select(next); buttons[next].focus();
    });
  }
  root.append(node('p', 'print-roadmap-note', text.note));
  function select(index) {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  select(0);
}
