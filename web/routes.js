// Keep shareable selections in the URL. Unrecognized values use safe defaults.
export const routeFields = [
  ['controller','hardware-controller','raspberry',['raspberry','pico','pcb']],
  ['enclosure','obudowa-view','filament',['filament','plywood']],
  ['pcb-mode','pcb-mode','assembled',['assembled','board','exploded']],
  ['project','plywood-project','case',['case','house']],
  ['assembly','assembly-mode','enclosure',['enclosure','internals','exploded','assembled','roof_open','inside']],
  ['cloud-mode','cloud-mode','assembled',['assembled','exploded','inside','battery_open']],
  ['circuit','circuit-filter','all',['all','LCD','Audio','ADC','Keypad','Buttons','Power']],
];

export function readRoute(url) {
  const pcbPage=/(?:^|\/)pcb(?:\/|\/index\.html)?$/.test(url.pathname);
  const values=Object.fromEntries(routeFields.map(([key,id,fallback,allowed])=>{
    const requested=url.searchParams.get(key);
    return [id,allowed.includes(requested)?requested:key==='controller'&&pcbPage?'pcb':fallback];
  }));
  let tab=url.hash.slice(1);
  if(tab==='3dprint'){tab='obudowa';values['obudowa-view']='filament';}
  else if(tab==='plywood'){tab='obudowa';values['obudowa-view']='plywood';}
  else if(tab==='hardware'){tab='elektronika';}
  else if(tab==='software'){tab='oprogramowanie';}
  const allowedTabs=['glowna','obudowa','elektronika','oprogramowanie','inne'];
  const hasValidController=['raspberry','pico','pcb'].includes(url.searchParams.get('controller'));
  const defaultTab=pcbPage||hasValidController?'elektronika':'glowna';
  return {tab:allowedTabs.includes(tab)?tab:defaultTab,values};
}

export function writeRoute(url,tab,values) {
  const next=new URL(url);
  for(const [key,id,fallback,allowed] of routeFields) {
    const value=values[id];
    if(!allowed.includes(value))continue;
    if(value===fallback && !(key==='controller'&&/(?:^|\/)pcb\//.test(next.pathname)))next.searchParams.delete(key);
    else next.searchParams.set(key,value);
  }
  next.hash=tab;
  return next;
}
