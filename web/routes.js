// Keep shareable selections in the URL. Unrecognized values use safe defaults.
export const routeFields = [
  ['controller','hardware-controller','raspberry',['raspberry','pico','pcb']],
  ['pcb-mode','pcb-mode','assembled',['assembled','board','exploded']],
  ['project','plywood-project','house',['house','case']],
  ['assembly','assembly-mode','assembled',['assembled','roof_open','inside','exploded','enclosure','internals']],
  ['cloud-mode','cloud-mode','assembled',['assembled','exploded','inside','battery_open']],
  ['software','software-view','design',['design','implementation','teaching']],
  ['circuit','circuit-filter','all',['all','LCD','Audio','ADC','Keypad','Power']],
];

export function readRoute(url) {
  const pcbPage=/(?:^|\/)pcb(?:\/|\/index\.html)?$/.test(url.pathname);
  const values=Object.fromEntries(routeFields.map(([key,id,fallback,allowed])=>{
    const requested=url.searchParams.get(key);
    return [id,allowed.includes(requested)?requested:key==='controller'&&pcbPage?'pcb':fallback];
  }));
  const tab=url.hash.slice(1);
  return {tab:['3dprint','plywood','hardware','software'].includes(tab)?tab:pcbPage||url.searchParams.has('controller')?'hardware':'3dprint',values};
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
