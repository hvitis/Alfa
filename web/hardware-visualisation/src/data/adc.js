// but2.jpg: label side up, header on the right, V at the top.
// The long header legs and black spacer are on the component side (but1).
export const ADC_WIRE_COLORS={controllerGround:'#e3b51f',resistorGround:'#e3b51f',address:'#e3b51f'};
export const ADC = {
  size:[78,210], headerX:25, pitch:20, connectorY:-45,
  references:['but2.jpg','but1.jpg'],
  pins:[
    {key:'AVDD',name:'V',signal:'VDD',z:-90,pi:17,pico:36,color:'#dc8119',purpose:'3.3 V supply',cables:['A1']},
    {key:'AGND',name:'G',signal:'GND',z:-70,pi:20,pico:8,color:ADC_WIRE_COLORS.controllerGround,purpose:'Common ground for controller, ADDR and R2',cables:['A2','A5','K5','A6']},
    {key:'ASCL',name:'SCL',z:-50,pi:5,pico:7,color:'#229a69',purpose:'I2C clock',cables:['A4']},
    {key:'ASDA',name:'SDA',z:-30,pi:3,pico:6,color:'#247cc4',purpose:'I2C data',cables:['A3']},
    {key:'AADDR',name:'ADDR',z:-10,color:ADC_WIRE_COLORS.address,purpose:'Connect to G to select I2C address 0x48',cables:['A5']},
    {key:'AALERT',name:'ALERT',z:10,color:'#8b9093',purpose:'No external connection in this setup',cables:[]},
    {key:'AA0',name:'A0',z:30,color:'#8850c7',purpose:'Input from the shared R1 / R2 join',cables:['K4']},
    {key:'AA1',name:'A1',z:50,color:'#8b9093',purpose:'Unused analog input',cables:[]},
    {key:'AA2',name:'A2',z:70,color:'#8b9093',purpose:'Unused analog input',cables:[]},
    {key:'AA3',name:'A3',z:90,color:'#8b9093',purpose:'Unused analog input',cables:[]},
  ],
};
export function adcPoints(position){
  const [x,y,z]=position;
  return Object.fromEntries(ADC.pins.map(pin=>[pin.key,[x+ADC.headerX,y+ADC.connectorY,z+pin.z]]));
}
export function isAdcWire(wire){return wire.from.startsWith('A')||wire.to.startsWith('A')||wire.to==='GND_JOIN';}
export function adcGroundJoin(position){return [position[0]+100,position[1]+ADC.connectorY,position[2]-70];}
export function routeAdc(data){
  const component=data.components.find(c=>c.id==='adc');
  Object.assign(data.points,adcPoints(component.position));data.points.GND_JOIN=adcGroundJoin(component.position);
  for(const wire of data.wires.filter(isAdcWire)){
    const start=data.points[wire.from],end=data.points[wire.to];
    if(wire.id==='A6'){
      wire.path=[start,end];
    }else if(wire.id==='A5'){
      // ADDR reaches the join vertically. The other branches enter on X and Z.
      wire.path=[start,[start[0]+22,start[1],start[2]],[start[0]+22,35,start[2]],[end[0],35,start[2]],[end[0],35,end[2]],end];
    }else{
      const index=wire.id==='K4'?4:wire.id==='K5'?5:wire.local??0,height=85+index*11;
      const lane=component.position[0]+135+index*16,routeZ=component.position[2]+140+index*20;
      if(wire.id==='A2'){
        wire.path=[start,[start[0],height,start[2]],[start[0],height,routeZ],[lane,height,routeZ],[lane,height,end[2]-18],[end[0],height,end[2]-18],[end[0],end[1],end[2]-18],end];
      }else if(wire.id==='K5'){
        wire.path=[start,[start[0],height,start[2]],[start[0],height,routeZ],[lane,height,routeZ],[lane,height,end[2]],[lane,end[1],end[2]],end];
      }else{
        // Every pin has a short, separate exit before its wire rises to a lane.
        const exitX=end[0]+22;
        wire.path=[start,[start[0],height,start[2]],[start[0],height,routeZ],[lane,height,routeZ],[lane,height,end[2]],[exitX,height,end[2]],[exitX,end[1],end[2]],end];
      }
    }
  }
  return data;
}
export function adcConnection(pin,view){
  if(!pin.cables.length)return 'Leave unconnected';
  if(pin.name==='ADDR')return 'G pin on this board · I2C address 0x48';
  if(pin.name==='A0')return 'Shared join: R1 leg B + R2 leg A';
  if(view==='divider')return pin.name==='V'?'Pi 3.3 V supply':pin.name==='G'?'R2 + keypad + controller common ground':'Controller I2C · see Pi / Pico setup';
  if(view==='pico'&&pin.name==='V')return 'Pico pin 36 · 3V3 OUT, via 3.3 V join';
  const signal=pin.name==='V'?'3.3 V':pin.name==='G'?'GND':view==='pico'?(pin.name==='SCL'?'GP5':'GP4'):(pin.name==='SCL'?'GPIO3':'GPIO2');
  return (view==='pico'?'Pico':'Pi 3')+' physical pin '+(view==='pico'?pin.pico:pin.pi)+' · '+signal;
}
