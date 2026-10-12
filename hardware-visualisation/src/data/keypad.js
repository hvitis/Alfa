// Photo _003: component side up, three right-angle pins at bottom-right.
export const KEYPAD = {
  size:[110,250],headerX:50,pinY:12,connectorX:105,
  reference:'signal-2026-10-11-22-16-05-518_003.jpg',
  buttons:[[0,-88],[-29,-29],[29,-29],[0,29],[0,94]],
  pins:[
    {key:'KOUT',name:'OUT',z:58,cable:'K3',color:'#b79510'},
    {key:'KVCC',name:'VCC',z:72,cable:'K1',color:'#d43235',pi:4,pico:40},
    {key:'KGND',name:'GND',z:86,cable:'K2',color:'#293440',pi:14,pico:18},
  ],
};
export function keypadPoints(position){
  const [x,y,z]=position;
  return Object.fromEntries(KEYPAD.pins.map(p=>[p.key,[x+KEYPAD.connectorX,y+KEYPAD.pinY,z+p.z]]));
}
export function routeKeypad(data){
  const component=data.components.find(c=>c.id==='keypad');Object.assign(data.points,keypadPoints(component.position));
  for(const wire of data.wires.filter(w=>['K1','K2','K3'].includes(w.id))){
    const start=data.points[wire.from],end=data.points[wire.to];
    if(wire.id==='K3'){
      wire.path=[start,[start[0]+22,start[1],start[2]],[start[0]+22,end[1]+20,start[2]],[end[0],end[1]+20,start[2]],[end[0],end[1]+20,end[2]],end];
    }else{
      const height=wire.id==='K1'?70:90,exitX=end[0]+32+(wire.id==='K1'?0:18),laneZ=component.position[2]+155+(wire.id==='K1'?0:22);
      wire.path=[start,[start[0],height,start[2]],[start[0],height,laneZ],[exitX,height,laneZ],[exitX,height,end[2]],[exitX,end[1],end[2]],end];
    }
  }
  return data;
}
export function keypadConnection(pin,view){
  if(pin.key==='KOUT')return 'R1 leg A → R1/R2 join → ADC A0';
  if(view==='divider')return pin.key==='KVCC'?'Controller 5 V supply':'Controller / ADC common ground';
  if(view==='pico'&&pin.key==='KVCC')return 'Pico pin 40 · VBUS, via USB 5 V join';
  return (view==='pico'?'Pico':'Pi 3')+' physical pin '+(view==='pico'?pin.pico:pin.pi)+' · '+(pin.key==='KVCC'?'5 V':'GND');
}
