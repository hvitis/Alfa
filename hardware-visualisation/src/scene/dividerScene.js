import * as THREE from 'three';
import { COLORS, DIVIDER } from '../data/divider.js';
import { board, box, cylinderBetween, sphere, terminal } from './primitives.js';
import { addLabel } from './labels.js';
import { makeResistor } from './resistor.js';
import { makeCable } from './cables.js';
import { registerModule, highlightModule } from './modules.js';

export function createDividerScene() {
  const root=new THREE.Group(); root.name='divider'; const parts={}, pickables=[],modules={};
  const p=DIVIDER.points;
  const keypad=new THREE.Group(),adc=new THREE.Group();root.add(keypad,adc);
  board(keypad,[-200,0,0],[90,125],'#262c37');
  for(const [x,z] of [[-225,-25],[-195,-25],[-170,-25],[-213,17],[-180,17]]) cylinderBetween(keypad,[x,3,z],[x,10,z],11,'#f0ca32');
  addLabel(keypad,'KEYPAD',[-205,15,-98],'title');
  addLabel(keypad,'VCC = Pi 5 V',[-196,17,-59],'small',COLORS.power);
  addLabel(keypad,'GND',[-175,17,71],'small');
  terminal(keypad,p.OUT,COLORS.signal);terminal(keypad,p.KEY_GND);terminal(keypad,p.KEY_VCC,COLORS.power);
  addLabel(keypad,'OUT (up to 5 V)',[-130,30,-33],'net',COLORS.signal);
  board(adc,[201,0,37],[94,175],'#685499');
  box(adc,[212,6,48],[23,8,30],'#2b3441');
  terminal(adc,p.A0,COLORS.join); terminal(adc,p.ADC_GND); terminal(adc,p.ADC_VDD,COLORS.v33);
  addLabel(adc,'ADC',[202,15,-98],'title');
  addLabel(adc,'VDD = Pi 3.3 V',[196,17,-59],'small');
  addLabel(adc,'A0',[168,23,-19],'net',COLORS.join);
  addLabel(adc,'GND',[177,23,115],'net',COLORS.ground);
  addLabel(adc,'Match the printed labels',[201,14,144],'small');
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
    {id:'out',path:[p.OUT,p.R1_A],color:COLORS.signal},
    {id:'a0',path:[p.JOIN,[15,14,0],[127,14,0],p.A0],color:COLORS.join},
    {id:'ground',path:[p.R2_B,p.ADC_GND],color:COLORS.ground},
    {id:'ground-links',path:[p.KEY_GND,[-148,14,162],[76,14,162],[150,14,162],p.ADC_GND],color:COLORS.ground},
  ];
  for(const cable of cables){const object=makeCable(root,cable);parts[cable.id]=object.group;pickables.push(object.mesh);}
  addLabel(parts.a0,'To ADC A0 · about half of OUT',[98,22,-41],'net',COLORS.join);
  addLabel(parts.ground,'To ADC GND',[94,23,136],'net',COLORS.ground);
  addLabel(parts['ground-links'],'Common ground · also to Pi GND',[0,21,185],'small');
  sphere(root,p.PI_GND,3.2,COLORS.ground);
  addLabel(root,'Pi GND',[78,23,163],'net',COLORS.ground);
  let selection=null;
  function selectModule(id){selection?.dispose();selection=modules[id]?highlightModule(root,modules[id],'#2c8bb5'):null;}
  return {root,parts,pickables,points:p,modules,selectModule};
}
