import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { CameraRig } from './controls/CameraRig.js';
import { createInterface } from './ui/interface.js';
import { KEYPAD, keypadConnection } from './data/keypad.js';
import { ADC, adcConnection, isAdcWire } from './data/adc.js';
import { STEPS } from './data/divider.js';
import { AMPLIFIER, amplifierConnection } from './data/amplifier.js';
import { installLiveReload } from './ui/liveReload.js';
import { isVisible } from './scene/modules.js';
import radioConcepts from './data/radio-concepts.json' with { type: 'json' };

function boot() {
  const viewport=document.getElementById('viewport');
  const world=createScene(viewport),rig=new CameraRig(world.camera,world.renderer.domElement);
  let view='divider',group='all',selectedCable=null,selectedModule=null,assemblyMode='wiring',selectedAmpPin=null,adcMode='labels',selectedAdcPin=null;
  const activeScene=()=>world[view==='case'?'boxCase':view];
  const workshop=()=>view==='case'||view==='radio';
  const activeSetup=()=>view==='pico'?world.pico:world.setup;
  const labelsVisible=visible=>{world.labels.domElement.style.display=visible?'':'none';};
  const opacity=(object,value)=>object.traverse(child=>{if(child.isMesh){child.material.transparent=value<1;child.material.opacity=value;child.material.depthWrite=value>=1;}});
  function updateAmpGuide(){
    if(workshop())return;
    const show=view!=='divider'&&(selectedModule==='amp'||group==='Audio');
    activeSetup().amplifier.setDetailed(show);activeSetup().root.traverse(object=>{if(object.userData.amplifierOverview)object.visible=assemblyMode!=='underside';});
    ui.amplifier(show,assemblyMode);ui.amplifierPin(selectedAmpPin);
    activeScene().keypad.setDetailed(selectedModule==='keypad'||view!=='divider'&&group==='Keypad');
    ui.keypad(selectedModule==='keypad',view);
    ui.adc(selectedModule==='adc'||group==='ADC',adcMode,selectedAdcPin);
  }
  function updateCables(){
    if(view==='radio')return;
    if(view==='case'){
      world.boxCase.setFilter(group);
      return;
    }
    const setup=activeSetup();
    const unused=selectedModule==='amp'&&['MGAIN','MSD'].includes(selectedAmpPin);
    for(const cable of setup.cables)cable.group.visible=(group==='all'||cable.circuitGroup===group||group==='ADC'&&isAdcWire(cable))&&(!selectedCable||selectedCable===cable.id)&&(!selectedAdcPin||!isAdcWire(cable)||ADC.pins.find(p=>p.key===selectedAdcPin)?.cables.includes(cable.id))&&(adcMode==='labels'||!isAdcWire(cable))&&(assemblyMode==='wiring'||cable.circuitGroup!=='Audio')&&(!unused||cable.circuitGroup!=='Audio');
    setup.setVisibleLabels(selectedCable,group,selectedAdcPin);
  }
  function refreshWireList(){
    if(workshop())return;
    ui.wires(activeSetup().cables.filter(c=>group==='all'||c.circuitGroup===group||group==='ADC'&&isAdcWire(c)),selectCable);
  }
  function clear(){
    if(view==='radio'){
      selectedCable=null;selectedModule=null;world.radio.selectModule(null);world.radio.selectWire('');ui.selectRadioWire('');ui.module(null,'radio');
      ui.detail('Alfa, the little house radio. Click a part or a wire; try Roof open to see how charging works.');
      return;
    }
    if(view==='case'){
      selectedCable=null;selectedModule=null;
      world.boxCase.selectWire('');world.boxCase.selectModule(null);
      ui.selectCaseWire('');ui.module(null,'case');
      ui.detail('27 electrical connections match the project wiring atlas. Click a cable or component to inspect it.');
      return;
    }
    activeScene().keypad.selectPin(null);
    selectedCable=null;group='all';selectedAmpPin=null;selectedAdcPin=null;activeScene().adc.selectPin(null);document.getElementById('cable-group').value='all';refreshWireList();activeSetup().amplifier.selectPin(null);
    for(const part of Object.values(world.divider.parts))opacity(part,1);ui.step(null);updateCables();updateAmpGuide();
    ui.detail(view==='divider'?'Purple join = R1 leg B + R2 leg A + the ADC A0 wire.':view==='pico'?'PICO VIEW · Amber marks the replaced controller and changed pins. Click a module for its purpose, or a cable to trace it.':'Click a module for its purpose. Click a cable to trace its endpoints.');
  }
  function selectCaseWire(id){
    selectedCable=id;
    world.boxCase.selectWire(id);
    ui.selectCaseWire(id);
    const wire=world.boxCase.data.wires.find(w=>w.id===id);
    if(wire){
      ui.detail(`${wire.id} · ${wire.group}\n${wire.title}\n${wire.from} → ${wire.to}\nPlanned route: ${wire.route_length_mm} mm. Suggested lead: ${wire.suggested_length_mm} mm, including service allowance. Check the actual cable before cutting.`);
      if(group!=='all'&&group!==wire.group){
        group=wire.group;
        document.getElementById('cable-group').value=group;
        world.boxCase.setFilter(group);
      }
    }else{
      clear();
    }
  }

  function selectModule(id){
    const scene=activeScene();
    if(!scene.modules[id])id=null;
    // Only the wiring scenes have keypad and ADC pin models.
    if(id!=='keypad')scene.keypad?.selectPin(null);
    if(id!=='adc'){selectedAdcPin=null;scene.adc?.selectPin(null);}
    selectedModule=id;scene.selectModule(id);ui.module(id,view);updateCables();updateAmpGuide();
  }
  function selectStep(id){
    const step=STEPS.find(s=>s.id===id);if(!step)return;
    for(const [name,part]of Object.entries(world.divider.parts))opacity(part,step.parts.includes(name)?1:0.16);
    ui.step(id);ui.detail(step.detail);
  }
  function selectCable(id){
    const setup=activeSetup(),cable=setup.cables.find(c=>c.id===id);if(!cable)return;
    selectedAdcPin=null;activeScene().adc.selectPin(null);
    if(isAdcWire(cable)&&adcMode!=='labels')setAdcMode('labels');
    if(cable.circuitGroup==='Audio'&&assemblyMode!=='wiring'){assemblyMode='wiring';setup.amplifier.setMode('wiring');rig.focusGroup('Audio');}
    if(cable.circuitGroup==='Audio')selectedAmpPin=cable.to.startsWith('M')?cable.to:cable.from;
    selectedCable=id;updateCables();const endpoint=key=>setup.data.pinNames?.[key]??key;
    ui.detail((cable.changed?'CHANGED · ':'')+cable.id+' · '+cable.title+' · '+endpoint(cable.from)+' ↔ '+endpoint(cable.to)+(cable.previousTitle?' · Pi 3: '+cable.previousTitle:''));
    if(isAdcWire(cable)){selectedAdcPin=cable.from.startsWith('A')?cable.from:cable.to==='GND_JOIN'?'AGND':cable.to;activeScene().adc.selectPin(selectedAdcPin);selectModule('adc');}
    const keypadPin=KEYPAD.pins.find(p=>p.cable===id);
    if(keypadPin){selectModule('keypad');activeScene().keypad.selectPin(keypadPin.key);}
    if(cable.circuitGroup==='Audio'){
      selectedAmpPin=cable.to.startsWith('M')?cable.to:cable.from;setup.amplifier.selectPin(selectedAmpPin);
      selectModule('amp');
    }
  }
  function setView(next){
    view=next;for(const name of ['divider','setup','pico','boxCase','radio'])world[name].root.visible=(name==='boxCase'?'case':name)===view;
    if(view==='radio'){
      ui.setView('radio',world.radio.modules);
      ui.radioMode(world.radio.getMode());
      ui.radioWood(world.radio.getWood());ui.radioLabels(world.radio.getLabels());
      rig.focus('radio');setRadioCamera('iso');clear();
      return;
    }
    if(view==='case'){
      ui.setView('case',world.boxCase.modules);
      ui.caseWires(world.boxCase.data.wires);
      ui.caseMode(world.boxCase.getMode());
      ui.caseWood(world.boxCase.getWood());
      ui.caseLabels(world.boxCase.getLabels());
      rig.focus('case');
      clear();
      return;
    }
    activeSetup().amplifier.setMode(assemblyMode);activeScene().adc.setMode(adcMode);
    for(const id of ['a0','ground','ground-links','address','gnd-pin'])world.divider.parts[id].visible=adcMode==='labels';
    ui.setView(view,activeScene().modules);rig.focus(view);selectModule(null);clear();
  }

  function setGroup(next){
    group=next;selectedCable=null;selectedAdcPin=null;activeScene().adc.selectPin(null);document.getElementById('cable-group').value=group;updateCables();rig.focusGroup(group);refreshWireList();updateAmpGuide();
  }
  function focusKeypad(){
    if(view==='divider')setView('setup');setGroup('Keypad');selectModule('keypad');rig.inspectKeypad(activeScene().keypad);
  }
  function selectKeypadPin(key){
    const pin=KEYPAD.pins.find(p=>p.key===key);if(!pin)return;
    if(view==='divider'){
      selectModule('keypad');activeScene().keypad.selectPin(key);
      if(key==='KOUT')selectStep('out');else if(key==='KGND')selectStep('ground');
      else {for(const [name,part]of Object.entries(world.divider.parts))opacity(part,name==='keypad-power'?1:0.16);ui.step(null);}
    }else {setGroup('Keypad');selectCable(pin.cable);}
    ui.detail(pin.name+' · '+keypadConnection(pin,view));
  }
  function focusAdc(){
    if(view==='divider')setView('setup');
    adcMode='labels';activeScene().adc.setMode(adcMode);setGroup('ADC');selectModule('adc');rig.inspectAdc(activeScene().adc);
  }
  function adcCloseUp(){selectModule('adc');rig.inspectAdc(activeScene().adc);}
  function setAdcMode(next){
    if(!['labels','components'].includes(next))return;
    adcMode=next;activeScene().adc.setMode(next);selectedCable=null;selectedAdcPin=null;activeScene().adc.selectPin(null);selectModule('adc');
    for(const id of ['a0','ground','ground-links','address','gnd-pin'])world.divider.parts[id].visible=next==='labels';
    updateCables();rig.inspectAdc(activeScene().adc);
    ui.detail(next==='components'?'ADC component side · but1 · return to the label side to trace cables.':'ADC label side · but2 · V = VDD, G = GND · click a header pin to trace it.');
  }
  function selectAdcPin(key){
    const pin=ADC.pins.find(p=>p.key===key);if(!pin)return;
    selectedCable=null;selectedAdcPin=key;selectModule('adc');activeScene().adc.selectPin(key);
    if(view==='divider'){
      if(key==='AA0')selectStep('a0');else if(key==='AGND'||key==='AADDR')selectStep('ground');
      else {for(const part of Object.values(world.divider.parts))opacity(part,0.16);ui.step(null);}
      if(key==='AGND'||key==='AADDR')opacity(world.divider.parts.address,1);
    }else {group='ADC';document.getElementById('cable-group').value=group;updateCables();refreshWireList();}
    updateAmpGuide();ui.detail(pin.name+' · '+pin.purpose+' · '+adcConnection(pin,view)+(adcMode==='components'?' · component inspection: cables hidden':''));
  }
  function focusAmplifier(){
    if(view==='divider')setView('setup');assemblyMode='wiring';activeSetup().amplifier.setMode(assemblyMode);setGroup('Audio');selectModule('amp');
  }
  function amplifierCloseUp(){
    selectModule('amp');rig.inspectAmplifier(activeSetup().amplifier,assemblyMode);
  }
  function setAssemblyMode(next){
    if(!['wiring','before','underside'].includes(next))return;
    if(view==='divider')setView('setup');
    assemblyMode=next;selectedCable=null;selectedAmpPin=null;activeSetup().amplifier.selectPin(null);activeSetup().amplifier.setMode(next);setGroup('Audio');selectModule('amp');rig.inspectAmplifier(activeSetup().amplifier,next);
    ui.detail(next==='wiring'?'Five header jumpers + two speaker wires. GAIN and SD stay unwired.':'Assembly preview: audio cables are hidden. Solder all seven separate header pads on the underside.');
  }
  function selectAmpPin(key){
    if(view==='divider')focusAmplifier();
    selectedAmpPin=key;selectModule('amp');activeSetup().amplifier.selectPin(key);ui.amplifierPin(key);
    const pin=AMPLIFIER.pins.find(p=>p.key===key);
    if(assemblyMode==='wiring'&&pin?.cable){selectCable(pin.cable);return;}
    if(assemblyMode==='wiring'&&['M+','M-'].includes(key)){selectCable(key==='M+'?'S6':'S7');return;}
    if(pin&&!pin.cable){selectedCable=null;updateCables();}
    if(pin)ui.detail(pin.name+' · '+pin.purpose+' · '+amplifierConnection(pin,view)+(assemblyMode==='wiring'?'':' · Solder this header pin even if it has no jumper.'));
  }
  async function setCaseMode(mode){
    await world.boxCase.setMode(mode);
    ui.caseMode(mode);
    setCaseCamera('iso');
  }
  function applyCamera({position,target}){
    rig.camera.position.copy(position);
    rig.orbit.target.copy(target);
    rig.camera.lookAt(rig.orbit.target);
    rig.camera.updateMatrixWorld();
    rig.orbit.update();
  }
  function setCaseCamera(preset){applyCamera(world.boxCase.getCameraPreset(preset));}
  function setRadioCamera(preset){applyCamera(world.radio.getCameraPreset(preset));}
  async function setRadioMode(mode){
    const loading=world.radio.setMode(mode);
    ui.radioMode(world.radio.getMode());
    if(view==='radio'){ui.setView('radio',world.radio.modules);clear();if(mode==='roof_open')setRadioCamera('top');}
    await loading;
  }
  function selectRadioWire(id){
    const wire=world.radio.data.wires.find(w=>w.id===id);
    world.radio.selectWire(wire?id:'');ui.selectRadioWire(wire?id:'');selectedCable=wire?id:null;
    if(!wire){clear();return;}
    if(world.radio.getFilter()!=='all'&&world.radio.getFilter()!==wire.group)setRadioGroup(wire.group);
    ui.detail(`${wire.id} · ${wire.group}\n${wire.title}\n${wire.from} → ${wire.to}\nPlanned route ${wire.route_length_mm} mm; cut the lead at ${wire.suggested_length_mm} mm, including service slack.`);
  }
  function setRadioGroup(group){world.radio.setFilter(group);ui.radioGroup(group);}
  function setRadioWood(val){world.radio.setWood(val);ui.radioWood(val);}
  function setRadioLabels(val){world.radio.setLabels(val);ui.radioLabels(val);}
  function setCaseWood(val){world.boxCase.setWood(val);ui.caseWood(val);}
  function setCaseLabels(val){world.boxCase.setLabels(val);ui.caseLabels(val);}

  function focusDivider(){
    setView('divider');
  }

  const ui=createInterface({
    setView,selectModule,setGroup,focusKeypad,selectKeypadPin,focusAdc,adcCloseUp,setAdcMode,selectAdcPin,focusAmplifier,amplifierCloseUp,setAssemblyMode,selectAmpPin,
    setCaseMode,setCaseCamera,setCaseWood,setCaseLabels,selectCaseWire,
    setRadioMode,setRadioCamera,setRadioWood,setRadioLabels,selectRadioWire,setRadioGroup,
    focusDivider,
    focusModule(){
      if(workshop()){
        const object=activeScene().modules[selectedModule];
        if(object)rig.focusModule(object);
        return;
      }
      const object=activeScene().modules[selectedModule];if(selectedModule==='keypad')rig.inspectKeypad(activeScene().keypad);else if(selectedModule==='adc')rig.inspectAdc(activeScene().adc);else if(selectedModule==='amp')rig.inspectAmplifier(activeSetup().amplifier,assemblyMode);else if(object)rig.focusModule(object);
    },
    focusJoin:()=>rig.focusJoin(),resetCamera:()=>{if(view==='case')setCaseCamera('iso');else if(view==='radio')setRadioCamera('iso');else rig.focus(view);},top:()=>rig.top(),
    setCameraMode(mode){rig.setMode(mode);ui.camera(mode);},showLabels:labelsVisible,
    move(direction,on){on?rig.moving.add(direction):rig.moving.delete(direction);},clear,selectStep,
  });
  ui.comparison(world.pico.cables,world.pico.data);ui.radioSetup(world.radio.data,radioConcepts.concepts);
  const urlParams=typeof window!=='undefined'?new URLSearchParams(window.location.search):null;
  const requestedView=urlParams?.get('view')||(typeof window!=='undefined'&&window.location.hash?window.location.hash.slice(1):null);
  const initialView=['divider','setup','pico','case','radio'].includes(requestedView)?requestedView:'setup';
  setView(initialView);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
  function hitAt(e){
    const rect=world.renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,world.camera);
    return raycaster.intersectObjects(activeScene().pickables.filter(isVisible),false)[0]?.object;
  }
  world.renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=e.button===0?[e.clientX,e.clientY]:null;});
  world.renderer.domElement.addEventListener('pointermove',e=>{world.renderer.domElement.style.cursor=hitAt(e)?'pointer':rig.mode==='free'?'crosshair':'grab';});
  world.renderer.domElement.addEventListener('pointerup',e=>{
    if(e.button!==0||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;
    const hit=hitAt(e);pointerStart=null;if(!hit)return;
    if(view==='radio'){if(hit.userData.wire)selectRadioWire(hit.userData.wire.id);else if(hit.userData.moduleId)selectModule(hit.userData.moduleId);return;}
    if(view==='case'){
      if(hit.userData.wire){selectCaseWire(hit.userData.wire.id);return;}
      if(hit.userData.moduleId){selectModule(hit.userData.moduleId);return;}
      return;
    }
    if(hit.userData.keypadPin){selectKeypadPin(hit.userData.keypadPin);return;}
    if(hit.userData.adcPin){selectAdcPin(hit.userData.adcPin);return;}
    if(hit.userData.amplifierPin){selectAmpPin(hit.userData.amplifierPin);return;}
    if(hit.userData.moduleId){selectModule(hit.userData.moduleId);return;}
    const id=hit.userData.cableId;
    if(view==='divider'&&id==='keypad-power'){selectKeypadPin('KVCC');return;}
    if(view!=='divider')selectCable(id);else selectStep({out:'out',a0:'a0',ground:'ground','ground-links':'ground',address:'ground','gnd-pin':'ground'}[id]);
  });
  let previous=performance.now();
  function frame(time){const delta=(time-previous)/1000;previous=time;rig.update(delta);world.render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.hardwareViewer={world,rig,setView,selectModule,selectCable,selectStep,clear,focusKeypad,selectKeypadPin,focusAdc,setAdcMode,selectAdcPin,focusAmplifier,setAssemblyMode,selectAmpPin,setCaseMode,setCaseCamera,setCaseWood,setCaseLabels,selectCaseWire,setRadioMode,setRadioCamera,setRadioWood,setRadioLabels,selectRadioWire,setRadioGroup,getState:()=>({view,group,selectedModule,selectedCable,assemblyMode,selectedAmpPin,adcMode,selectedAdcPin,caseMode:world.boxCase.getMode(),caseWood:world.boxCase.getWood(),caseLabels:world.boxCase.getLabels(),selectedCaseWire:world.boxCase.getSelectedWire(),radioMode:world.radio.getMode(),radioWood:world.radio.getWood(),radioLabels:world.radio.getLabels(),radioWire:world.radio.getSelectedWire(),radioGroup:world.radio.getFilter()})};
  installLiveReload({
    getState:()=>({...window.hardwareViewer.getState(),mode:rig.mode,position:world.camera.position.toArray(),quaternion:world.camera.quaternion.toArray(),target:rig.orbit.target.toArray(),labels:document.getElementById('show-labels').checked}),
    restoreState(state){
      if(!state||!['divider','setup','pico','case','radio'].includes(state.view))return;
      if(['labels','components'].includes(state.adcMode))adcMode=state.adcMode;
      if(['wiring','before','underside'].includes(state.assemblyMode))assemblyMode=state.assemblyMode;
      setView(state.view);
      if(state.view==='case'){
        if(state.caseMode)setCaseMode(state.caseMode);
        if(state.caseWood!==undefined)setCaseWood(state.caseWood);
        if(state.caseLabels!==undefined)setCaseLabels(state.caseLabels);
        if(state.selectedCaseWire)selectCaseWire(state.selectedCaseWire);
      }
      if(state.view==='radio'){
        if(state.radioMode)setRadioMode(state.radioMode);
        if(state.radioGroup)setRadioGroup(state.radioGroup);
        if(state.radioWire)selectRadioWire(state.radioWire);
        if(state.radioWood!==undefined)setRadioWood(state.radioWood);
        if(state.radioLabels!==undefined)setRadioLabels(state.radioLabels);
      }
      if(state.mode==='free'){document.getElementById('camera-mode').value='free';rig.setMode('free');ui.camera('free');}
      if(Array.isArray(state.position)&&state.position.length===3)world.camera.position.fromArray(state.position);
      if(Array.isArray(state.quaternion)&&state.quaternion.length===4)world.camera.quaternion.fromArray(state.quaternion);
      if(Array.isArray(state.target)&&state.target.length===3)rig.orbit.target.fromArray(state.target);
      if(state.labels===false){document.getElementById('show-labels').checked=false;labelsVisible(false);}
      if(['all','LCD','Audio','ADC','Keypad','Power'].includes(state.group)){group=state.group;document.getElementById('cable-group').value=group;updateCables();refreshWireList();}
      if(state.selectedModule)selectModule(state.selectedModule);
      if(state.view!=='case'&&state.selectedCable&&activeSetup().cables.some(c=>c.id===state.selectedCable))selectCable(state.selectedCable);
      if(state.selectedAmpPin){selectedAmpPin=state.selectedAmpPin;activeSetup().amplifier.selectPin(selectedAmpPin);}
      if(state.selectedAdcPin&&!state.selectedCable)selectAdcPin(state.selectedAdcPin);
      if(state.view!=='case')for(const id of ['a0','ground','ground-links','address','gnd-pin'])world.divider.parts[id].visible=adcMode==='labels';
      updateCables();updateAmpGuide();
      world.camera.updateMatrixWorld();if(rig.mode==='inspect')rig.orbit.update();
    },
  });

}
try{boot();}catch(error){
  console.error(error);const box=document.getElementById('graphics-error');box.hidden=false;
  box.textContent='The 3D viewer could not start. Use a browser with WebGL enabled, or open output/resistor-divider-clear.png. '+error.message;
}
