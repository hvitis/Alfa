import * as THREE from 'three';
import { KEYPAD } from '../data/keypad.js';
import { box, cylinderBetween, material, sphere } from './primitives.js';
import { surfaceText } from './surfaceText.js';
import { addLabel } from './labels.js';

export function makeKeypad(parent,position){
  const hardware=new THREE.Group();hardware.position.set(...position);parent.add(hardware);
  const shape=new THREE.Shape();shape.moveTo(-55,-125);shape.lineTo(55,-125);shape.lineTo(55,125);shape.lineTo(-55,125);shape.closePath();
  for(const x of [-45,45])for(const z of [-115,115]){const hole=new THREE.Path();hole.absarc(x,-z,6,0,Math.PI*2,true);shape.holes.push(hole);}
  for(const pin of KEYPAD.pins){const hole=new THREE.Path();hole.absarc(KEYPAD.headerX,-pin.z,1.8,0,Math.PI*2,true);shape.holes.push(hole);}
  const pcb=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:4,bevelEnabled:false,curveSegments:32}),material('#151a20',{roughness:0.42}));
  pcb.rotation.x=-Math.PI/2;pcb.position.y=-2;pcb.castShadow=true;pcb.receiveShadow=true;hardware.add(pcb);
  for(const x of [-45,45])for(const z of [-115,115]){
    const ring=new THREE.Mesh(new THREE.RingGeometry(6,7.5,32),material('#bfc2bc',{metalness:0.75}));ring.rotation.x=-Math.PI/2;ring.position.set(x,2.1,z);hardware.add(ring);
  }
  const buttons=[];
  for(const [index,[x,z]]of KEYPAD.buttons.entries()){
    const button=new THREE.Group();button.name='button-'+(index+1);hardware.add(button);
    box(button,[x,6,z],[43,8,43],'#25282c');box(button,[x,10.3,z],[40,1,40],'#bdc1bc',{metalness:0.8});
    for(const dx of [-15,15])for(const dz of [-19,19]){
      box(button,[x+dx,3.5,z+dz],[5,2,6],'#c4c9c4',{metalness:0.85});
      sphere(button,[x+dx,4.8,z+dz],2.3,'#c4c9c4',{metalness:0.85});
    }
    cylinderBetween(button,[x,10.8,z],[x,15,z],24,'#b9940c');
    cylinderBetween(button,[x,15,z],[x,25,z],23,'#ebc925',{roughness:0.35});
    cylinderBetween(button,[x,25,z],[x,26,z],22,'#f5d443',{roughness:0.28});
    buttons.push(button);
    // White switch outlines follow the photograph.
    for(const dx of [-1,1])box(hardware,[x+dx*23,2.15,z],[0.6,0.2,45],'#c7cec9');
    for(const dz of [-1,1])box(hardware,[x,2.15,z+dz*23],[46,0.2,0.6],'#c7cec9');
  }
  for(const [x,z]of [[-8,-57],[8,-52],[-7,-8],[7,-4],[32,30],[-8,60],[11,61]]){
    box(hardware,[x,4,z],[5,3,10],'#928b72');
    for(const dz of [-4,4])box(hardware,[x,3.5,z+dz],[5,2,2],'#c5cbca',{metalness:0.8});
  }
  const pinMeshes={},labels=[];
  for(const pin of KEYPAD.pins){
    const housing=box(hardware,[50,9,pin.z],[10,14,13],'#22272c');housing.userData.keypadPin=pin.key;
    const vertical=box(hardware,[50,6,pin.z],[2.4,16,2.4],'#c3cccf',{metalness:0.95});vertical.userData.keypadPin=pin.key;
    const leg=box(hardware,[64,12,pin.z],[28,2.4,2.4],'#c3cccf',{metalness:0.95});leg.userData.keypadPin=pin.key;pinMeshes[pin.key]=leg;
    const bead=sphere(hardware,[50,-2.4,pin.z],3.2,'#c3cccf',{metalness:0.9});bead.scale.y=0.45;
    const plug=box(hardware,[88,12,pin.z],[24,10,10],'#26313b');plug.userData.keypadPin=pin.key;
    const stripe=box(hardware,[93,17.2,pin.z],[5,0.6,9],pin.color);stripe.userData.keypadPin=pin.key;
    const neck=cylinderBetween(hardware,[100,12,pin.z],[105,12,pin.z],1.7,pin.color);neck.userData.keypadPin=pin.key;neck.userData.keypadCableExit=pin.key;
    const printed=surfaceText(hardware,pin.name,[34,2.25,pin.z],24,9,'#edf2ed',25);printed.userData.keypadPin=pin.key;
    labels.push(addLabel(hardware,pin.name,[86,32,pin.z],'small',pin.color));
  }
  function selectPin(key){hardware.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.keypadPin&&mesh.material.emissive)mesh.material.emissive.set(mesh.userData.keypadPin===key?'#76521a':'#000000');});}
  function setDetailed(value){for(const label of labels)label.visible=value;}
  setDetailed(false);
  return {hardware,buttons,pinMeshes,labels,selectPin,setDetailed};
}
