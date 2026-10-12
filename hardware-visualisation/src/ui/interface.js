import { KEYPAD, keypadConnection } from '../data/keypad.js';
import { ADC, adcConnection } from '../data/adc.js';
import { STEPS } from '../data/divider.js';
import { moduleInfo } from '../data/modules.js';
import { PICO_DIFFERENCES } from '../data/picoSetup.js';
import { AMPLIFIER, amplifierConnection } from '../data/amplifier.js';

export function createInterface(actions) {
  const q=id=>document.getElementById(id);let currentView='divider';
  for(const view of ['divider','setup','pico'])q('view-'+view).onclick=()=>actions.setView(view);
  q('focus-keypad').onclick=()=>actions.focusKeypad();
  q('keypad-close-up').onclick=()=>actions.focusModule();
  for(const pin of KEYPAD.pins)q('keypad-pin-'+pin.key).onclick=()=>actions.selectKeypadPin(pin.key);
  const keypadPhoto=q('keypad-photo'),photoPath=(window.MOOMIN_LIVE_RELOAD?'/reference/':'../photos/')+KEYPAD.reference;keypadPhoto.src=photoPath;keypadPhoto.parentElement.href=photoPath;
  q('focus-adc').onclick=()=>actions.focusAdc();q('adc-close-up').onclick=()=>actions.adcCloseUp();
  for(const button of document.querySelectorAll('[data-adc-mode]'))button.onclick=()=>actions.setAdcMode(button.dataset.adcMode);
  for(const [index,file]of ADC.references.entries()){
    const link=document.createElement('a'),photo=document.createElement('img');const path=(window.MOOMIN_LIVE_RELOAD?'/reference/':'../photos/')+file;
    link.href=path;link.target='_blank';link.rel='noopener';photo.src=path;photo.alt=index===0?'but2: printed ADC pin labels and solder joints':'but1: ADC component side and fitted black header';photo.loading='lazy';link.append(photo);q('adc-photos').append(link);
  }
  q('focus-amplifier').onclick=()=>actions.focusAmplifier();q('amp-close-up').onclick=()=>actions.amplifierCloseUp();
  for(const button of document.querySelectorAll('[data-amp-mode]'))button.onclick=()=>actions.setAssemblyMode(button.dataset.ampMode);
  for(const button of document.querySelectorAll('[data-amp-pin]'))button.onclick=()=>actions.selectAmpPin(button.dataset.ampPin);
  for(const [index,file]of AMPLIFIER.references.entries()){
    const link=document.createElement('a'),photo=document.createElement('img');const path=(window.MOOMIN_LIVE_RELOAD?'/reference/':'../photos/')+file;link.href=path;link.target='_blank';link.rel='noopener';
    photo.src=path;photo.alt=['max4: clear LRC-first header labels and speaker terminal leads','max1: angled view with yellow header and green terminal','max2: component side of your MAX98357A','max3: back of your MAX98357A, with unsoldered header legs'][index];photo.loading='lazy';link.append(photo);q('amp-photos').append(link);
  }
  q('focus-join').onclick=()=>actions.focusJoin();q('reset-camera').onclick=()=>actions.resetCamera();q('top-view').onclick=()=>actions.top();
  q('focus-module').onclick=()=>actions.focusModule();q('module-picker').onchange=e=>actions.selectModule(e.target.value);
  q('camera-mode').onchange=e=>actions.setCameraMode(e.target.value);q('show-labels').onchange=e=>actions.showLabels(e.target.checked);
  q('clear-selection').onclick=()=>actions.clear();q('cable-group').onchange=e=>actions.setGroup(e.target.value);
  for(const [index,step]of STEPS.entries()) {
    const li=document.createElement('li'),button=document.createElement('button');button.dataset.step=step.id;
    const number=document.createElement('span');number.className='step-number';number.textContent=index+1;
    const title=document.createElement('span');title.textContent=step.title;button.append(number,title);
    button.onclick=()=>actions.selectStep(step.id);li.append(button);q('connection-steps').append(li);
  }
  for(const difference of PICO_DIFFERENCES){
    const button=document.createElement('button');button.className='difference-card';
    const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=difference.title;detail.textContent=difference.detail;
    button.append(title,detail);button.onclick=()=>actions.selectModule(difference.module);q('pico-difference-list').append(button);
  }
  for(const button of document.querySelectorAll('[data-move]')){
    button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);actions.move(button.dataset.move,true);};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>actions.move(button.dataset.move,false));
  }
  function showModule(id,view){
    const info=moduleInfo(id,view);if(info)q('module-picker').closest('aside').scrollTo({top:0,behavior:'smooth'});q('module-picker').value=id??'';q('focus-module').disabled=!info;
    q('module-title').textContent=info?.title??'What does each module do?';
    q('module-purpose').textContent=info?.purpose??'Click a board, speaker, resistor, or purple join in 3D. You can also choose a module above.';
    q('module-details').replaceChildren();for(const text of info?.details??[]){const li=document.createElement('li');li.textContent=text;q('module-details').append(li);}
    q('module-change').hidden=!info?.changes;q('module-change').textContent=info?.changes??'';
  }
  return {
    setView(view,modules){
      currentView=view;q('adc-guide').hidden=true;q('adc-pin-table').replaceChildren();
      for(const pin of ADC.pins){
        const row=document.createElement('tr'),name=document.createElement('td'),destination=document.createElement('td'),button=document.createElement('button');
        button.textContent=pin.name;button.dataset.adcPin=pin.key;button.style.borderLeft='4px solid '+pin.color;button.onclick=()=>actions.selectAdcPin(pin.key);name.append(button);destination.textContent=adcConnection(pin,view);row.classList.toggle('unused-pin',!pin.cables.length);row.append(name,destination);q('adc-pin-table').append(row);
      }
      q('amplifier-guide').hidden=true;q('amp-stage').hidden=true;
      q('amp-controller-heading').textContent=view==='pico'?'Pico connection':'Pi 3 connection';q('amp-pin-table').replaceChildren();
      for(const pin of AMPLIFIER.pins){
        const row=document.createElement('tr'),name=document.createElement('td'),destination=document.createElement('td'),button=document.createElement('button');
        button.textContent=pin.name;button.dataset.ampPin=pin.key;button.style.borderLeft='4px solid '+pin.color;button.onclick=()=>actions.selectAmpPin(pin.key);name.append(button);
        destination.textContent=amplifierConnection(pin,view);row.classList.toggle('unused-pin',!pin.cable);row.append(name,destination);q('amp-pin-table').append(row);
      }
      for(const name of ['divider','setup','pico']){q('view-'+name).classList.toggle('active',view===name);q('view-'+name).setAttribute('aria-pressed',String(view===name));}
      q('divider-guide').hidden=view!=='divider';q('setup-guide').hidden=view==='divider';q('group-control').hidden=view==='divider';
      for(const id of ['pico-differences','pico-banner','pico-guide'])q(id).hidden=view!=='pico';
      q('pin-convention').textContent=view==='pico'?'Pico numbers are physical pins; GP numbers name the GPIO. USB is at the top, pin 1 is top-left, pin 40 is top-right.': 'Pi numbers are physical header pins.';
      q('module-picker').replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a module…';q('module-picker').append(placeholder);
      for(const id of Object.keys(modules)){const option=document.createElement('option');option.value=id;option.textContent=moduleInfo(id,view)?.title??id;q('module-picker').append(option);}
      showModule(null,view);
    },
    module:showModule,
    keypad(show,view){
      q('keypad-guide').hidden=!show;
      for(const pin of KEYPAD.pins)q('keypad-connection-'+pin.key).textContent=keypadConnection(pin,view);
    },
    adc(show,mode,key){
      q('adc-guide').hidden=!show;
      for(const button of document.querySelectorAll('[data-adc-mode]')){button.classList.toggle('active',button.dataset.adcMode===mode);button.setAttribute('aria-pressed',String(button.dataset.adcMode===mode));}
      for(const button of document.querySelectorAll('[data-adc-pin]')){button.classList.toggle('active',button.dataset.adcPin===key);button.setAttribute('aria-pressed',String(button.dataset.adcPin===key));}
      q('adc-instructions').textContent=mode==='components'?'Component face from but1. Board flipped for inspection; ADC wires are hidden. Return to Labels & wiring to trace connections.':'Printed face from but2. Jumper sockets fit the long pins underneath. Click a pin to trace its connections; G shows all three ground branches.';
    },
    amplifier(show,mode){
      q('amplifier-guide').hidden=!show||currentView==='divider';q('amp-stage').hidden=!show||currentView==='divider';
      for(const button of document.querySelectorAll('[data-amp-mode]')){button.classList.toggle('active',button.dataset.ampMode===mode);button.setAttribute('aria-pressed',String(button.dataset.ampMode===mode));}
      const instructions={wiring:'After soldering: fit five female jumper connectors to BCLK, LRC, DIN, GND and VIN. GAIN and SD have no jumper. Click a label below to trace its cable.',before:'The header is lifted to show how its seven short legs enter the PCB holes. The yellow plastic and long pins stay on the component side. Merely inserting the pins does not make a reliable connection.',underside:'The board is raised so you can see the back. Solder all seven short header legs to their separate circular pads. Each joint must join its pin and pad; adjacent pads must remain separate. The back view reverses the left-to-right pin order.'};
      q('amp-instructions').textContent=instructions[mode];q('amp-stage').textContent=mode==='wiring'?'AUDIO WIRING · five header jumpers + two speaker wires':mode==='before'?'ASSEMBLY PREVIEW · header lifted · audio cables hidden':'SOLDER UNDERSIDE · board raised · seven separate joints';
    },
    amplifierPin(key){for(const button of document.querySelectorAll('[data-amp-pin]')){button.classList.toggle('active',button.dataset.ampPin===key);button.setAttribute('aria-pressed',String(button.dataset.ampPin===key));}},
    comparison(cables,data){
      q('pin-comparison-body').replaceChildren();for(const cable of cables.filter(c=>c.previousPin)){
        const row=document.createElement('tr');for(const value of [(cable.circuitGroup==='Audio'?'Amp':cable.circuitGroup)+' '+(cable.to==='GND_JOIN'?'G via ground join':cable.to.slice(1)),cable.previousPin.slice(1),data.pinNames[cable.controllerPin]]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}q('pin-comparison-body').append(row);
      }
    },
    detail(text){q('selection-detail').textContent=text;},
    step(id){for(const button of document.querySelectorAll('[data-step]'))button.classList.toggle('active',button.dataset.step===id);},
    camera(mode){q('camera-help').textContent=mode==='free'?'Left-drag: look around · Right/Shift-drag: pan · Wheel: move forward/back · WASD: move · Q/E: down/up · Shift: faster':'Left-drag: orbit · Right/Shift-drag: pan · Wheel: zoom · WASD: move camera · Q/E: down/up';},
    wires(wires,onSelect){
      q('wire-list').replaceChildren();for(const wire of wires){
        const button=document.createElement('button');button.className='wire-row'+(wire.changed?' changed-wire':'');button.style.borderLeft='4px solid '+wire.color;
        if(wire.changed){const badge=document.createElement('span');badge.className='wire-status';badge.textContent=wire.added?'NEW':'CHANGED';button.append(badge);}
        const title=document.createElement('span');title.textContent=wire.id+' · '+wire.title;button.append(title);button.onclick=()=>onSelect(wire.id);q('wire-list').append(button);
      }
    },
  };
}
