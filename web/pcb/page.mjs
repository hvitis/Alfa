// A real static page lets social crawlers read PCB-specific metadata without JS.
export function pcbPage(html) {
  let page=html.includes('<base ')?html:html.replace('<head>','<head>\n  <base href="../">');
  const title='Alfa · Raspi 3 PCB shield', description='Zintegrowany shield Raspberry Pi 3: ADC, wzmacniacz i dzielnik na jednej płytce. Model 3D i pliki KiCad prototypu.';
  page=page.replace(/<title[^>]*>[\s\S]*?<\/title>/,`<title>${title}</title>`);
  for(const [attribute,name,value] of [
    ['property','og:title',title],['property','og:description',description],
    ['property','og:url','https://hvitis.github.io/Alfa/pcb/'],
    ['property','og:image','https://hvitis.github.io/Alfa/og-pcb.png'],
    ['property','og:image:alt','Alfa Raspberry Pi 3 shield rendered from the KiCad PCB'],
    ['name','description',description],['name','twitter:title',title],['name','twitter:description',description],
    ['name','twitter:image','https://hvitis.github.io/Alfa/og-pcb.png'],
    ['name','twitter:image:alt','Alfa Raspberry Pi 3 shield rendered from KiCad'],
  ]) {
    const tag=new RegExp(`<meta ${attribute}="${name}"[^>]*>`);
    page=page.replace(tag,`<meta ${attribute}="${name}" content="${value}">`);
  }
  return page.replace(/<link rel="canonical"[^>]*>/,'<link rel="canonical" href="https://hvitis.github.io/Alfa/pcb/">');
}
