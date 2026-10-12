import * as THREE from 'three';
import base from '../data/setup.json' with { type: 'json' };
import { createPicoData } from '../data/picoSetup.js';
import { board, box, cylinderBetween, sphere, terminal } from './primitives.js';
import { makeResistor } from './resistor.js';
import { makeCable } from './cables.js';
import { addLabel } from './labels.js';
import { makePi3, makePico } from './controllers.js';
import { registerModule, highlightModule } from './modules.js';
import { makeAmplifier } from './amplifier.js';
import { makeAdc } from './adc.js';
import { ADC } from '../data/adc.js';
import { makeKeypad } from './keypad.js';

function portName(key,data) {
  if(/^P\d+$/.test(key))return data.pinNames?.[key]??'pin '+key.slice(1);
  if(['POWER','USB','RIN','J','RGND'].includes(key))return '';
  if(key==='V3')return 'NEW · 3.3 V join';if(key==='V5')return 'NEW · USB 5 V join';
  return key.slice(1);
}
export function createSetupScene(controller='pi3') {
  const pico=controller==='pico',data=pico?createPicoData():base;
  const root=new THREE.Group();root.name=pico?'pico-setup':'complete-setup';const pickables=[],cables=[],modules={};let amplifier,adc,keypad;
  for(const component of data.components) {
    const model=new THREE.Group();root.add(model);model.name=component.id;
    const [x,y,z]=component.position;
    if(component.id==='pi'){
      if(pico)makePico(model);else makePi3(model);
      addLabel(model,pico?'CHANGED · Pico 2 WH':'Raspberry Pi 3 Model B',[x,y+29,z-component.size[1]/2-38],pico?'title changed':'title');
      addLabel(model,pico?'USB end · pins 1 / 40':'PIN 1',pico?[0,34,-103]:[data.points.P1[0]-25,42,-109],'small');
      if(pico)addLabel(model,'20 pins each side · GP ≠ physical pin',[0,20,181],'small changed');
    }else if(component.id==='keypad'){
      keypad=makeKeypad(model,component.position);
      addLabel(model,'AD-Key · your five-button board',[x,y+35,z-152],'title');
    }else if(component.id==='adc'){
      adc=makeAdc(model,component.position);
      addLabel(model,'ADS1115 / ADS1015 · photo-matched',[x,y+28,z-140],'title');
    }else if(component.id==='amp'){
      amplifier=makeAmplifier(model,component.position);
      const overview=addLabel(model,'MAX98357A · photo-matched',[x,90,z-component.size[1]/2-35],'title');overview.userData.amplifierOverview=true;
    }else {
      board(model,component.position,component.size,component.color);
      addLabel(model,component.title,[x,y+22,z-component.size[1]/2-32],'title');
      if(component.id==='speaker'){
        cylinderBetween(model,[x,3,z],[x,25,z],34,'#15202a');
        cylinderBetween(model,[x,25,z],[x,28,z],27,'#303a42');
        cylinderBetween(model,[x,28,z],[x,31,z],11,'#1b242b');
      }else if(component.id==='lcd'){
        box(model,[x,8,z-20],[90,10,20],'#e5dbbd');
        box(model,[x,5,z+10],[57,6,28],'#25313c');
      }else box(model,[x+12,7,z+8],[26,8,25],'#25313c');
    }
    registerModule(modules,pickables,component.id,model);
  }
  if(pico){
    const supply=new THREE.Group();root.add(supply);board(supply,[133,0,51],[47,91],'#f1e1b5');
    for(const key of ['V3','V5']){
      sphere(supply,data.points[key],6,key==='V3'?'#dc8119':'#d43235');
      addLabel(supply,portName(key,data),[173,29,data.points[key][2]],'small changed');
    }
    registerModule(modules,pickables,'supply',supply);
  }
  for(const [key,point]of Object.entries(data.points)){
    if(['RIN','J','RGND','POWER','USB','V3','V5','GND_JOIN'].includes(key)||key.startsWith('M')||key.startsWith('A')||key.startsWith('K'))continue;
    const id=/^P\d+$/.test(key)?'pi':key.startsWith('L')?'lcd':key.startsWith('K')?'keypad':key.startsWith('A')?'adc':key.startsWith('M')?'amp':'speaker';
    const port=new THREE.Group();root.add(port);terminal(port,point);
    const changed=pico&&data.wires.some(w=>w.changed&&(w.controllerPin===key||w.from===key));
    if(changed)cylinderBetween(port,[point[0],point[1]-5,point[2]],[point[0],point[1]-4,point[2]],4.5,'#efad22',{emissive:'#efa522',emissiveIntensity:0.25});
    port.traverse(child=>{if(child.isMesh){child.userData.moduleId=id;pickables.push(child);}});
    const name=portName(key,data);
    if(name){
      const zOffset=/^P\d+$/.test(key)?(pico?0:Number(key.slice(1))%2?17:-17):10;
      const tag=addLabel(root,name,[point[0],point[1]+11,point[2]+zOffset],'small'+(changed?' changed':''));tag.userData.endpoint=key;
    }
  }
  sphere(root,data.points.GND_JOIN,4.5,'#cfb776',{metalness:0.8});
  const groundLabel=addLabel(root,'Ground join',[data.points.GND_JOIN[0]+18,38,data.points.GND_JOIN[2]-14],'small');groundLabel.userData.endpoint='GND_JOIN';
  board(root,[-285,0,292],[166,146],'#e5e3d9');
  for(const [id,start,end]of [['R1',data.points.RIN,data.points.J],['R2',data.points.J,data.points.RGND]])registerModule(modules,pickables,id,makeResistor(root,id,start,end));
  const join=new THREE.Group();root.add(join);sphere(join,data.points.J,7.5,'#8754ce');registerModule(modules,pickables,'join',join);
  addLabel(root,'R1 · 10 kΩ',[-310,38,222],'title');addLabel(root,'R2 · 10 kΩ',[-196,36,299],'title');addLabel(root,'Shared join → A0',[-220,46,244],'join');
  const power=new THREE.Group();root.add(power);box(power,[5,5,310],[60,14,26],'#e4ebef');box(power,[5,5,329],[16,6,10],'#b4c3cb');registerModule(modules,pickables,'power',power);
  for(const wire of data.wires){
    const mid=wire.path[Math.floor(wire.path.length/2)];
    const cable=makeCable(root,{...wire,label:wire.id,labelPosition:[mid[0],mid[1]+10,mid[2]],radius:1.7});
    cable.group.userData.group=wire.group;cables.push({...wire,...cable,circuitGroup:wire.group});pickables.push(cable.mesh);
  }
  addLabel(root,'5 V USB supply · connect last',[5,24,358],'small');
  for(const [key,point]of Object.entries(data.points).filter(([key])=>key.startsWith('M'))){
    const tag=addLabel(root,key==='M+'?'Speaker +':key==='M-'?'Speaker − (not GND)':key.slice(1),[point[0],point[1]+14,point[2]],'small');tag.userData.endpoint=key;
  }
  let selection=null;const replacement=pico?highlightModule(root,modules.pi):null;
  function selectModule(id){selection?.dispose();selection=modules[id]?highlightModule(root,modules[id],'#2c8bb5'):null;}
  function setVisibleLabels(selectedId,group,adcPin){
    const selected=cables.find(c=>c.id===selectedId),branches=adcPin?cables.filter(c=>ADC.pins.find(p=>p.key===adcPin)?.cables.includes(c.id)):[],keys=selected?[selected.from,selected.to,selected.controllerPin].filter(Boolean):branches.flatMap(c=>[c.from,c.to,c.controllerPin]).filter(Boolean);
    root.traverse(object=>{if(object.userData.endpoint)object.visible=keys.includes(object.userData.endpoint);});
    for(const cable of cables)cable.group.traverse(object=>{if(object.userData.wireTag)object.visible=group!=='all'||Boolean(selectedId);});
  }
  setVisibleLabels(null,'all');
  return {root,pickables,cables,data,modules,setVisibleLabels,selectModule,replacement,amplifier,adc,keypad};
}
