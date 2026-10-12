import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { CameraRig } from './controls/CameraRig.js';
import { createInterface } from './ui/interface.js';
import { STEPS } from './data/divider.js';
import { AMPLIFIER, amplifierConnection } from './data/amplifier.js';
import { installLiveReload } from './ui/liveReload.js';
import { isVisible } from './scene/modules.js';

function boot() {
  const viewport=document.getElementById('viewport');
  const world=createScene(viewport),rig=new CameraRig(world.camera,world.renderer.domElement);
  let view='divider',group='all',selectedCable=null,selectedModule=null,assemblyMode='wiring',selectedAmpPin=null;
  const activeScene=()=>world[view];
  const activeSetup=()=>view==='pico'?world.pico:world.setup;
  const labelsVisible=visible=>{world.labels.domElement.style.display=visible?'':'none';};
  const opacity=(object,value)=>object.traverse(child=>{if(child.isMesh){child.material.transparent=value<1;child.material.opacity=value;child.material.depthWrite=value>=1;}});
  function updateAmpGuide(){
    const show=view!=='divider'&&(selectedModule==='amp'||group==='Audio');
    activeSetup().amplifier.setDetailed(show);activeSetup().root.traverse(object=>{if(object.userData.amplifierOverview)object.visible=assemblyMode!=='underside';});
    ui.amplifier(show,assemblyMode);ui.amplifierPin(selectedAmpPin);
  }
  function updateCables(){
    const setup=activeSetup();
    const unused=selectedModule==='amp'&&['MGAIN','MSD'].includes(selectedAmpPin);
    for(const cable of setup.cables)cable.group.visible=(group==='all'||cable.circuitGroup===group)&&(!selectedCable||selectedCable===cable.id)&&(assemblyMode==='wiring'||cable.circuitGroup!=='Audio')&&(!unused||cable.circuitGroup!=='Audio');
    setup.setVisibleLabels(selectedCable,group);
  }
  function refreshWireList(){ui.wires(activeSetup().cables.filter(c=>group==='all'||c.circuitGroup===group),selectCable);}
  function clear(){
    selectedCable=null;group='all';selectedAmpPin=null;document.getElementById('cable-group').value='all';refreshWireList();activeSetup().amplifier.selectPin(null);
    for(const part of Object.values(world.divider.parts))opacity(part,1);ui.step(null);updateCables();updateAmpGuide();
    ui.detail(view==='divider'?'Purple join = R1 leg B + R2 leg A + the ADC A0 wire.':view==='pico'?'PICO VIEW · Amber marks the replaced controller and changed pins. Click a module for its purpose, or a cable to trace it.':'Click a module for its purpose. Click a cable to trace its endpoints.');
  }
  function selectModule(id){
    if(!activeScene().modules[id])id=null;
    selectedModule=id;activeScene().selectModule(id);ui.module(id,view);updateCables();updateAmpGuide();
  }
  function selectStep(id){
    const step=STEPS.find(s=>s.id===id);if(!step)return;
    for(const [name,part]of Object.entries(world.divider.parts))opacity(part,step.parts.includes(name)?1:0.16);
    ui.step(id);ui.detail(step.detail);
  }
  function selectCable(id){
    const setup=activeSetup(),cable=setup.cables.find(c=>c.id===id);if(!cable)return;
    if(cable.circuitGroup==='Audio'&&assemblyMode!=='wiring'){assemblyMode='wiring';setup.amplifier.setMode('wiring');rig.focusGroup('Audio');}
    if(cable.circuitGroup==='Audio')selectedAmpPin=cable.to.startsWith('M')?cable.to:cable.from;
    selectedCable=id;updateCables();const endpoint=key=>setup.data.pinNames?.[key]??key;
    ui.detail((cable.changed?'CHANGED · ':'')+cable.id+' · '+cable.title+' · '+endpoint(cable.from)+' ↔ '+endpoint(cable.to)+(cable.previousTitle?' · Pi 3: '+cable.previousTitle:''));
    if(cable.circuitGroup==='Audio'){
      selectedAmpPin=cable.to.startsWith('M')?cable.to:cable.from;setup.amplifier.selectPin(selectedAmpPin);
      selectModule('amp');
    }
  }
  function setView(next){
    view=next;for(const name of ['divider','setup','pico'])world[name].root.visible=name===view;
    activeSetup().amplifier.setMode(assemblyMode);ui.setView(view,activeScene().modules);rig.focus(view);selectModule(null);clear();
  }
  function setGroup(next){
    group=next;selectedCable=null;document.getElementById('cable-group').value=group;updateCables();rig.focusGroup(group);refreshWireList();updateAmpGuide();
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
  const ui=createInterface({
    setView,selectModule,setGroup,focusAmplifier,amplifierCloseUp,setAssemblyMode,selectAmpPin,
    focusModule(){const object=activeScene().modules[selectedModule];if(selectedModule==='amp')rig.inspectAmplifier(activeSetup().amplifier,assemblyMode);else if(object)rig.focusModule(object);},
    focusJoin:()=>rig.focusJoin(),resetCamera:()=>rig.focus(view),top:()=>rig.top(),
    setCameraMode(mode){rig.setMode(mode);ui.camera(mode);},showLabels:labelsVisible,
    move(direction,on){on?rig.moving.add(direction):rig.moving.delete(direction);},clear,selectStep,
  });
  ui.comparison(world.pico.cables,world.pico.data);setView('divider');
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
    if(hit.userData.amplifierPin){selectAmpPin(hit.userData.amplifierPin);return;}
    if(hit.userData.moduleId){selectModule(hit.userData.moduleId);return;}
    const id=hit.userData.cableId;
    if(view!=='divider')selectCable(id);else selectStep({out:'out',a0:'a0',ground:'ground','ground-links':'ground'}[id]);
  });
  let previous=performance.now();
  function frame(time){const delta=(time-previous)/1000;previous=time;rig.update(delta);world.render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.hardwareViewer={world,rig,setView,selectModule,selectCable,selectStep,clear,focusAmplifier,setAssemblyMode,selectAmpPin,getState:()=>({view,group,selectedModule,selectedCable,assemblyMode,selectedAmpPin})};
  installLiveReload({
    getState:()=>({...window.hardwareViewer.getState(),mode:rig.mode,position:world.camera.position.toArray(),quaternion:world.camera.quaternion.toArray(),target:rig.orbit.target.toArray(),labels:document.getElementById('show-labels').checked}),
    restoreState(state){
      if(!state||!['divider','setup','pico'].includes(state.view))return;
      if(['wiring','before','underside'].includes(state.assemblyMode))assemblyMode=state.assemblyMode;
      setView(state.view);
      if(state.mode==='free'){document.getElementById('camera-mode').value='free';rig.setMode('free');ui.camera('free');}
      if(Array.isArray(state.position)&&state.position.length===3)world.camera.position.fromArray(state.position);
      if(Array.isArray(state.quaternion)&&state.quaternion.length===4)world.camera.quaternion.fromArray(state.quaternion);
      if(Array.isArray(state.target)&&state.target.length===3)rig.orbit.target.fromArray(state.target);
      if(state.labels===false){document.getElementById('show-labels').checked=false;labelsVisible(false);}
      if(['all','LCD','Audio','ADC','Keypad','Power'].includes(state.group)){group=state.group;document.getElementById('cable-group').value=group;updateCables();refreshWireList();}
      if(state.selectedModule)selectModule(state.selectedModule);
      if(state.selectedCable&&activeSetup().cables.some(c=>c.id===state.selectedCable))selectCable(state.selectedCable);
      if(state.selectedAmpPin){selectedAmpPin=state.selectedAmpPin;activeSetup().amplifier.selectPin(selectedAmpPin);}updateCables();updateAmpGuide();
      world.camera.updateMatrixWorld();if(rig.mode==='inspect')rig.orbit.update();
    },
  });
}
try{boot();}catch(error){
  console.error(error);const box=document.getElementById('graphics-error');box.hidden=false;
  box.textContent='The 3D viewer could not start. Use a browser with WebGL enabled, or open output/resistor-divider-clear.png. '+error.message;
}
