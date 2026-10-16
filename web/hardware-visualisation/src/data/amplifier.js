// Viewed from the component side: green speaker terminal at the top,
// yellow header at the bottom, as in photos/max4.jpg.
export const AMPLIFIER = {
  size:[150,156],headerZ:64,pitch:20,
  references:['max4.jpg','max1.jpg','max2.jpg','max3.jpg'],
  pins:[
    {key:'MLRC',name:'LRC',x:-60,cable:'S4',pi:35,pico:15,signal:'GPIO19 / GP11',purpose:'I2S left/right clock',color:'#229a69'},
    {key:'MBCLK',name:'BCLK',x:-40,cable:'S3',pi:12,pico:14,signal:'GPIO18 / GP10',purpose:'I2S bit clock',color:'#247cc4'},
    {key:'MDIN',name:'DIN',x:-20,cable:'S5',pi:40,pico:16,signal:'GPIO21 / GP12',purpose:'Digital sound samples',color:'#8850c7'},
    {key:'MGAIN',name:'GAIN',x:0,cable:null,purpose:'Leave unwired: board default gain',color:'#8b9093'},
    {key:'MSD',name:'SD',x:20,cable:null,purpose:'Leave unwired: board default mode',color:'#8b9093'},
    {key:'MGND',name:'GND',x:40,cable:'S2',pi:9,pico:13,signal:'Ground',purpose:'Shared ground',color:'#293440'},
    {key:'MVIN',name:'VIN',x:60,cable:'S1',pi:2,pico:40,signal:'5 V / USB VBUS',purpose:'Amplifier power',color:'#d43235'},
  ],
};
export function routeAudio(data){
  for(const wire of data.wires.filter(w=>w.group==='Audio')){
    const start=data.points[wire.from],end=data.points[wire.to];
    const index=AMPLIFIER.pins.findIndex(p=>p.key===wire.to);
    if(index>=0){
      const height=68+index*6,laneZ=end[2]+70+index*17;
      wire.path=[start,[start[0],height,start[2]],[start[0],height,laneZ],[end[0],height,laneZ],[end[0],height,end[2]],end];
    }else{
      const height=wire.from==='M+'?21:30,x=wire.from==='M+'?455:442;
      wire.path=[start,[start[0],start[1],start[2]-15],[start[0],height,start[2]-15],[x,height,start[2]-15],[x,height,end[2]],[end[0],height,end[2]],end];
    }
  }
  return data;
}
export function amplifierConnection(pin,view){
  if(!pin.cable)return 'No cable — leave unconnected';
  const number=view==='pico'?pin.pico:pin.pi;
  if(view==='pico'&&pin.key==='MVIN')return 'Pico pin 40 · VBUS, via USB 5 V join';
  const signal=pin.signal.split(' / ')[view==='pico'?1:0]??pin.signal;
  return (view==='pico'?'Pico':'Pi 3')+' physical pin '+number+' · '+signal;
}
