import base from './setup.json' with { type: 'json' };
import { routeAudio } from './amplifier.js';

// Physical DIP pin numbers, with USB at the top. Never reuse Pi 3 pin numbers.
export const PICO_PIN_NAMES = ['GP0','GP1','GND','GP2','GP3','GP4','GP5','GND','GP6','GP7','GP8','GP9','GND','GP10','GP11','GP12','GP13','GND','GP14','GP15','GP16','GP17','GND','GP18','GP19','GP20','GP21','GND','GP22','RUN','GP26','GP27','AGND','GP28','ADC_VREF','3V3 OUT','3V3_EN','GND','VSYS','VBUS'];
export const PICO_CONNECTIONS = {
  LVCC:36, LGND:3, LDIN:25, LCLK:24, LCS:22, LDC:21, LRST:26, LBL:27,
  MVIN:40, MGND:13, MBCLK:14, MLRC:15, MDIN:16,
  AVDD:36, AGND:8, ASDA:6, ASCL:7, KVCC:40, KGND:18,
};
export const PICO_DIFFERENCES = [
  {title:'Controller replaced',detail:'Pi 3 → Pico 2 W with fitted headers (WH). RP2350, WiFi and Bluetooth are on the Pico board.',module:'pi'},
  {title:'Every controller connection changes',detail:'19 header connections move to Pico pins. Physical pin numbers and GP numbers are both shown in the cable list.',module:'pi'},
  {title:'Two shared power connections',detail:'One 3V3 pin supplies the LCD and ADC. One USB VBUS pin supplies the keypad and MAX98357A. The two marked joins split these supplies.',module:'supply'},
  {title:'Audio needs PIO firmware',detail:'GP10 = BCLK, GP11 = LRC, GP12 = DIN. Firmware must generate I2S through the Pico’s programmable I/O (PIO).',module:'amp'},
  {title:'Software and media handling change',detail:'The Linux/SSH Python app cannot run on the Pico. Pico firmware must manage images and sound in its limited flash and RAM.',module:'pi'},
  {title:'Other modules stay the same',detail:'The LCD wire colors, ADC, keypad, R1/R2 divider, MAX98357A and speaker connections stay the same at their module ends. PAM8403 stays unused.',module:'lcd'},
];

export function createPicoData() {
  const data=structuredClone(base);data.controller='pico';data.pinNames={};
  const component=data.components.find(c=>c.id==='pi');
  Object.assign(component,{title:'Pico 2 WH · changed controller',size:[88,210],color:'#168467'});
  for(let n=1;n<=40;n++){
    data.points['P'+n]=[n<=20?-35:35,24,-54+(n<=20?n-1:40-n)*10.4];
    data.pinNames['P'+n]=`pin ${n} · ${PICO_PIN_NAMES[n-1]}`;
  }
  data.points.USB=[0,16,-73];data.points.V3=[133,18,24];data.points.V5=[133,18,78];
  for(const wire of data.wires){
    const old=base.wires.find(w=>w.id===wire.id);
    wire.previousTitle=old.title;
    if(/^P\d+$/.test(wire.from)){
      const number=PICO_CONNECTIONS[wire.to];wire.previousPin=wire.from;wire.controllerPin='P'+number;
      wire.from=['LVCC','AVDD'].includes(wire.to)?'V3':['MVIN','KVCC'].includes(wire.to)?'V5':wire.controllerPin;
      wire.changed=true;
      const functionName=wire.to==='LDIN'?'SPI0 MOSI':wire.to==='LCLK'?'SPI0 SCK':wire.to==='ASDA'?'I2C0 SDA':wire.to==='ASCL'?'I2C0 SCL':wire.to==='MBCLK'?'PIO BCLK':wire.to==='MLRC'?'PIO LRC':wire.to==='MDIN'?'PIO DIN':wire.to.slice(1);
      wire.title=`${functionName} → Pico ${data.pinNames[wire.controllerPin]}`+(wire.from==='V3'?' via 3.3 V join':wire.from==='V5'?' via USB 5 V join':'');
      const p=data.points[wire.from],end=data.points[wire.to];
      const lane=60+(wire.local??0)*6;
      const routeZ=wire.group==='LCD'?-210-(wire.local??0)*18:wire.group==='Audio'?-165-(wire.local??0)*16:185+(wire.local??0)*24;
      const outside=p[0]<0?-205:205;
      wire.path=[p,[p[0],lane,p[2]],[outside,lane,p[2]],[outside,lane,routeZ],[end[0],lane,routeZ],[end[0],lane,end[2]],end];
    }else if(wire.id==='USB'){
      wire.changed=true;wire.title='5 V micro-USB → Pico power / programming port';
      wire.path=[data.points.POWER,[5,50,310],[-108,50,310],[-108,50,-104],[0,50,-104],data.points.USB];
    }
  }
  for(const [id,from,to,color,title]of [
    ['PWR3','P36','V3','#dc8119','NEW · pin 36 (3V3 OUT) → shared 3.3 V join'],
    ['PWR5','P40','V5','#d43235','NEW · pin 40 (VBUS) → shared USB 5 V join'],
  ]){
    const p=data.points[from],end=data.points[to];
    data.wires.push({id,from,to,color,title,group:'Power',changed:true,added:true,controllerPin:from,path:[p,[p[0],48,p[2]],[end[0],48,p[2]],[end[0],48,end[2]],end]});
  }
  return routeAudio(data);
}
