import { KEYPAD, keypadConnection } from '../data/keypad.js';
import { ADC, adcConnection } from '../data/adc.js';
import { STEPS } from '../data/divider.js';
import { moduleInfo } from '../data/modules.js';
import { PICO_DIFFERENCES } from '../data/picoSetup.js';
import { AMPLIFIER, amplifierConnection } from '../data/amplifier.js';

const radioImage=name=>(typeof window!=='undefined'&&window.__RADIO_IMAGES__?.[name])?window.__RADIO_IMAGES__[name]:new URL(`../data/radio-images/${name}.png`,import.meta.url).href;
const listItems=texts=>texts.map(text=>{const li=document.createElement('li');li.textContent=text;return li;});

export function createInterface(actions) {
  const q=id=>document.getElementById(id);let currentView='setup';
    for(const view of ['divider','setup','pico','case','radio'])if(q('view-'+view))q('view-'+view).onclick=()=>actions.setView(view==='divider'?'setup':view);
    for(const button of document.querySelectorAll('[data-case-mode]'))button.onclick=()=>actions.setCaseMode(button.dataset.caseMode);
    for(const button of document.querySelectorAll('[data-case-camera]'))button.onclick=()=>actions.setCaseCamera(button.dataset.caseCamera);
    q('case-wood').onchange=e=>actions.setCaseWood(e.target.checked);
    q('case-tags').onchange=e=>actions.setCaseLabels(e.target.checked);
    q('case-wire').onchange=e=>actions.selectCaseWire(e.target.value);
    for(const button of document.querySelectorAll('[data-radio-camera]'))button.onclick=()=>actions.setRadioCamera(button.dataset.radioCamera);
    for(const button of document.querySelectorAll('[data-radio-mode]'))button.onclick=()=>actions.setRadioMode(button.dataset.radioMode);
    for(const button of document.querySelectorAll('[data-radio-focus]'))button.onclick=()=>actions.selectModule(button.dataset.radioFocus);
    q('radio-wood').onchange=e=>actions.setRadioWood(e.target.checked);
    q('radio-tags').onchange=e=>actions.setRadioLabels(e.target.checked);
    q('radio-group').onchange=e=>actions.setRadioGroup(e.target.value);
    q('radio-wire').onchange=e=>actions.selectRadioWire(e.target.value);
    
    // Pi 3 subnav
    q('focus-keypad').onclick=()=>actions.focusKeypad();
    q('focus-adc').onclick=()=>actions.focusAdc();
    q('focus-amplifier').onclick=()=>actions.focusAmplifier();
    if(q('focus-divider'))q('focus-divider').onclick=()=>actions.focusDivider();
    q('focus-join').onclick=()=>actions.focusJoin();
    q('reset-camera').onclick=()=>actions.resetCamera();
    q('top-view').onclick=()=>actions.top();

    // Pi Zero subnav
    if(q('focus-keypad-pico'))q('focus-keypad-pico').onclick=()=>actions.focusKeypad();
    if(q('focus-adc-pico'))q('focus-adc-pico').onclick=()=>actions.focusAdc();
    if(q('focus-amplifier-pico'))q('focus-amplifier-pico').onclick=()=>actions.focusAmplifier();
    if(q('focus-divider-pico'))q('focus-divider-pico').onclick=()=>actions.focusDivider();
    if(q('focus-join-pico'))q('focus-join-pico').onclick=()=>actions.focusJoin();
    if(q('reset-camera-pico'))q('reset-camera-pico').onclick=()=>actions.resetCamera();
    if(q('top-view-pico'))q('top-view-pico').onclick=()=>actions.top();

    // Wooden Case subnav
    if(q('case-cam-iso'))q('case-cam-iso').onclick=()=>actions.setCaseCamera('iso');
    if(q('case-cam-front'))q('case-cam-front').onclick=()=>actions.setCaseCamera('front');
    if(q('case-cam-rear'))q('case-cam-rear').onclick=()=>actions.setCaseCamera('rear');
    if(q('case-focus-keypad'))q('case-focus-keypad').onclick=()=>actions.selectModule('keypad');
    if(q('case-focus-screen'))q('case-focus-screen').onclick=()=>actions.selectModule('lcd');
    if(q('case-focus-speaker'))q('case-focus-speaker').onclick=()=>actions.selectModule('speaker');
    if(q('case-focus-battery'))q('case-focus-battery').onclick=()=>actions.selectModule('battery');
    if(q('case-focus-switch'))q('case-focus-switch').onclick=()=>actions.selectModule('switch');
    if(q('case-focus-amp'))q('case-focus-amp').onclick=()=>actions.selectModule('amp');
    if(q('case-focus-adc'))q('case-focus-adc').onclick=()=>actions.selectModule('adc');
    if(q('reset-camera-case'))q('reset-camera-case').onclick=()=>actions.resetCamera();

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
      for(const name of ['setup','pico','case','radio']){
        const btn=q('view-'+name);
        if(btn){
          const isActive=(view==='divider'&&name==='setup')||view===name;
          btn.classList.toggle('active',isActive);
          btn.setAttribute('aria-pressed',String(isActive));
          btn.setAttribute('aria-selected',String(isActive));
        }
      }
      if(q('subnav-setup'))q('subnav-setup').hidden=view!=='setup'&&view!=='divider';
      if(q('subnav-pico'))q('subnav-pico').hidden=view!=='pico';
      if(q('subnav-case'))q('subnav-case').hidden=view!=='case';
      q('subnav-radio').hidden=view!=='radio';
      const workshop=view==='case'||view==='radio';
      q('divider-guide').hidden=view!=='divider';q('setup-guide').hidden=view==='divider'||workshop;q('group-control').hidden=workshop;
      for(const id of ['pico-differences','pico-banner','pico-guide'])q(id).hidden=view!=='pico';
      q('case-banner').hidden=view!=='case';q('case-guide').hidden=view!=='case';
      q('radio-banner').hidden=view!=='radio';q('radio-guide').hidden=view!=='radio';
      q('pin-convention').textContent=view==='pico'?'Pi Zero / Pico numbers are physical pins; GP numbers name the GPIO. USB is at the top, pin 1 is top-left, pin 40 is top-right.': 'Pi numbers are physical header pins.';
      q('module-picker').replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a module…';q('module-picker').append(placeholder);
      for(const id of Object.keys(modules)){const option=document.createElement('option');option.value=id;option.textContent=moduleInfo(id,view)?.title??id;q('module-picker').append(option);}
      showModule(null,view);
    },
    module:showModule,
    caseMode(mode){
      for(const button of document.querySelectorAll('[data-case-mode]')){button.classList.toggle('active',button.dataset.caseMode===mode);button.setAttribute('aria-pressed',String(button.dataset.caseMode===mode));}
      const descriptions={internals:'Inside: rear and right wall removed',enclosure:'Assembled · front facing you',exploded:'Exploded: 65 mm separation · cable lengths are schematic'};
      q('case-status-text').textContent=descriptions[mode]||mode;
    },
    caseWood(wood){q('case-wood').checked=wood;},
    caseLabels(labels){q('case-tags').checked=labels;},
    caseWires(wires){
      const sel=q('case-wire');sel.replaceChildren();const opt=document.createElement('option');opt.value='';opt.textContent='Select a wire…';sel.append(opt);
      for(const w of wires){const o=document.createElement('option');o.value=w.id;o.textContent=`${w.id}: ${w.from} → ${w.to}`;sel.append(o);}
    },
    selectCaseWire(id){q('case-wire').value=id||'';},
    radioSetup(house,concepts){
      const rows=[['Size',`${house.outer_mm.join(' × ')} mm`],['Weight',`about ${house.mass_g} g with electronics`],
        ['Plywood',`6 mm · ${house.cut_list.reduce((n,c)=>n+c.quantity,0)} pieces`],
        ['Fixings',`${house.fasteners.reduce((n,f)=>n+f.count,0)} screws in ${house.fasteners.length} sizes, calculated`],
        ['Handle',`${house.handle.grip_length} mm grip · ${house.handle.finger_gap} mm finger space`],
        ['Stability',`tilts ${Math.min(...Object.values(house.tip_angles_deg)).toFixed(0)}° before tipping`],
        ['CAD checks',house.checks.passed?`all ${house.checks.count} pass`:'FAILING: rebuild and read verification.json']];
      q('radio-facts').replaceChildren(...rows.flatMap(([term,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;return [dt,dd];}));
      const docs=[['plan','Moomin.pdf: plan + 1:1 templates'],['assembly','Assembly booklet'],['templates','Cut templates, print 100 %'],['step','STEP CAD']];
      q('radio-documents').replaceChildren(...docs.map(([key,text])=>{const a=document.createElement('a');a.href=house.documents[key];a.target='_blank';a.rel='noopener';a.textContent=text+' ↗';if(key==='step')a.download='';return a;}));
      q('radio-fasteners').replaceChildren(...listItems(house.fasteners.map(f=>`${f.id} · ${f.title}: ${f.count} × ${f.designation}`)));
      const select=q('radio-wire');select.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='Select a wire…';select.append(none);
      for(const w of house.wires){const o=document.createElement('option');o.value=w.id;o.textContent=`${w.id}: ${w.from} → ${w.to}`;select.append(o);}
      q('radio-concepts').replaceChildren(...concepts.map(c=>{
        const card=document.createElement('a'),image=document.createElement('img'),title=document.createElement('strong');
        card.className='radio-card'+(c.id==='house'?' active':'');card.href=radioImage('sheet_'+c.id);card.target='_blank';card.rel='noopener';
        image.src=radioImage(c.id);image.alt=`Concept ${c.letter}, ${c.name}`;image.loading='lazy';title.textContent=`${c.letter} · ${c.name}${c.id==='house'?' (chosen)':''}`;
        card.append(image,title);return card;}));
      q('radio-banner-note').textContent=`${house.outer_mm.join(' × ')} mm · 6 mm plywood · rev ${house.revision}`;
      q('radio-cover').src=radioImage('page_cover');q('radio-cover-link').href=house.documents.plan;
    },
    radioMode(mode){
      for(const button of document.querySelectorAll('[data-radio-mode]')){const on=button.dataset.radioMode===mode;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));}
      q('radio-mode-text').textContent={assembled:'Assembled · front facing you',roof_open:'Roof open · both halves stand upright for charging',
        inside:'Inside · right wall and roof taken off',exploded:'Exploded · panels pulled apart, wires hidden'}[mode]||mode;
    },
    selectRadioWire(id){q('radio-wire').value=id||'';},
    radioGroup(group){q('radio-group').value=group;},
    radioWood(wood){q('radio-wood').checked=wood;},
    radioLabels(labels){q('radio-tags').checked=labels;},
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

