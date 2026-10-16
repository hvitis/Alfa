import * as THREE from 'three';
import { COLORS, DIVIDER, DIVIDER_ADC_POSITION, DIVIDER_KEYPAD_POSITION } from '../data/divider.js';
import { board, box, cylinderBetween, sphere, terminal } from './primitives.js';
import { addLabel } from './labels.js';
import { makeResistor } from './resistor.js';
import { makeCable } from './cables.js';
import { registerModule, highlightModule } from './modules.js';
import { makeAdc } from './adc.js';
import { makeKeypad } from './keypad.js';
import { KEYPAD } from '../data/keypad.js';
import { adcPoints, adcGroundJoin, ADC_WIRE_COLORS } from '../data/adc.js';

export function createDividerScene() {
  const root=new THREE.Group(); root.name='divider'; const parts={}, pickables=[],modules={};
  const p=DIVIDER.points,groundJoin=adcGroundJoin(DIVIDER_ADC_POSITION);
  const keypad=new THREE.Group(),adc=new THREE.Group();root.add(keypad,adc);
  const keypadModel=makeKeypad(keypad,DIVIDER_KEYPAD_POSITION);
  addLabel(keypad,'AD-Key · your photographed board',[-270,38,-190],'title');
  const adcModel=makeAdc(adc,DIVIDER_ADC_POSITION);
  addLabel(adc,'ADC · your photographed board',[230,90,-109],'title');
  addLabel(adc,'V = 3.3 V · G = GND',[233,91,-80],'small');
  registerModule(modules,pickables,'keypad',keypad);registerModule(modules,pickables,'adc',adc);
  parts.R1=makeResistor(root,'R1',p.R1_A,p.JOIN);
  parts.R2=makeResistor(root,'R2',p.JOIN,p.R2_B);
  addLabel(parts.R1,'R1 · 10 kΩ',[-58,40,-28],'title');
  addLabel(parts.R1,'R1 A · from OUT',[-104,28,29],'leg');
  addLabel(parts.R1,'R1 B · to join',[-28,70,-55],'leg');
  addLabel(parts.R2,'R2 · 10 kΩ',[52,30,55],'title');
  addLabel(parts.R2,'R2 A · to same join',[-57,30,43],'leg');
  addLabel(parts.R2,'R2 B · to GND',[-39,29,114],'leg');
  parts.join=new THREE.Group();root.add(parts.join);
  sphere(parts.join,p.JOIN,7.5,COLORS.join,{emissive:COLORS.join,emissiveIntensity:0.16,metalness:0.3});
  addLabel(parts.join,'SHARED JOIN',[22,49,-12],'join');
  addLabel(parts.join,'R1 leg B + R2 leg A + A0 wire',[38,71,-12],'join small');
  for(const id of ['R1','R2','join'])registerModule(modules,pickables,id,parts[id]);
  const cables = [
    {id:'out',path:[p.OUT,[-137,12,p.OUT[2]],[-137,14,0],p.R1_A],color:'#b79510'},
    {id:'a0',path:[p.JOIN,[35,14,0],[315,30,0],[315,30,p.A0[2]],[277,30,p.A0[2]],[277,20,p.A0[2]],p.A0],color:COLORS.join},
    {id:'ground',path:[p.R2_B,[360,14,110],[360,20,groundJoin[2]],groundJoin],color:ADC_WIRE_COLORS.resistorGround},
    {id:'ground-links',path:[p.KEY_GND,[-120,12,p.KEY_GND[2]],[-120,14,162],[76,14,162],[390,14,162],[390,20,groundJoin[2]-18],[groundJoin[0],20,groundJoin[2]-18],groundJoin],color:KEYPAD.pins.find(p=>p.key==='KGND').color},
  ];
  for(const cable of cables){const object=makeCable(root,cable);parts[cable.id]=object.group;pickables.push(object.mesh);}
  const powerCable=makeCable(root,{id:'keypad-power',path:[p.KEY_SUPPLY,[-315,28,160],[-140,28,160],[-140,28,p.KEY_VCC[2]],[-140,12,p.KEY_VCC[2]],p.KEY_VCC],color:'#d43235'});
  parts['keypad-power']=powerCable.group;pickables.push(powerCable.mesh);
  sphere(root,p.KEY_SUPPLY,3.2,'#d43235');addLabel(root,'Controller 5 V → VCC',[-290,24,175],'small');
  addLabel(parts.a0,'To ADC A0 · about half of OUT',[98,22,-41],'net',COLORS.join);
  addLabel(parts.ground,'R2 → ADC G · yellow',[94,23,136],'net',ADC_WIRE_COLORS.resistorGround);
  addLabel(parts['ground-links'],'Common ground · also to Pi GND',[0,21,185],'small');
  sphere(root,p.PI_GND,3.2,COLORS.ground);
  addLabel(root,'Pi GND',[78,23,163],'net',COLORS.ground);
  const address=adcPoints(DIVIDER_ADC_POSITION).AADDR;
  const addrCable=makeCable(root,{id:'address',path:[address,[277,20,address[2]],[277,35,address[2]],[groundJoin[0],35,address[2]],[groundJoin[0],35,groundJoin[2]],groundJoin],color:ADC_WIRE_COLORS.address});
  parts.address=addrCable.group;pickables.push(addrCable.mesh);
  const gndPin=makeCable(root,{id:'gnd-pin',path:[p.ADC_GND,groundJoin],color:ADC_WIRE_COLORS.controllerGround});
  parts['gnd-pin']=gndPin.group;pickables.push(gndPin.mesh);sphere(root,groundJoin,4.5,'#cfb776',{metalness:0.8});
  addLabel(root,'Ground join',[groundJoin[0]+20,34,groundJoin[2]-24],'small');
  let selection=null;
  function selectModule(id){selection?.dispose();selection=modules[id]?highlightModule(root,modules[id],'#2c8bb5'):null;}
  return {root,parts,pickables,points:p,modules,selectModule,adc:adcModel,keypad:keypadModel};
}
