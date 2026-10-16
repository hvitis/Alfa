import * as THREE from 'three';
import { ADC } from '../data/adc.js';
import { box, cylinderBetween, material, sphere } from './primitives.js';
import { surfaceText } from './surfaceText.js';

function ring(parent,x,y,z,outer,inner){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(inner,outer,32),material('#c4c7c5',{metalness:0.85,roughness:0.25,side:THREE.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
export function makeAdc(parent,position){
  const hardware=new THREE.Group();hardware.position.set(...position);parent.add(hardware);
  const shape=new THREE.Shape();shape.moveTo(-39,-105);shape.lineTo(39,-105);shape.lineTo(39,105);shape.lineTo(-39,105);shape.closePath();
  for(const [x,z,r]of [[-19,-81,12],[-19,81,12],...ADC.pins.map(p=>[25,p.z,2.7])]){
    const hole=new THREE.Path();hole.absarc(x,-z,r,0,Math.PI*2,true);shape.holes.push(hole);
  }
  const pcb=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:4,bevelEnabled:false,curveSegments:32}),material('#48205f'));
  pcb.rotation.x=-Math.PI/2;pcb.position.y=-2;pcb.castShadow=true;pcb.receiveShadow=true;hardware.add(pcb);
  for(const z of [-81,81])for(const y of [-2.1,2.1])ring(hardware,-19,y,z,14,12);
  const plugs=new THREE.Group(),components=new THREE.Group();hardware.add(plugs,components);
  const pinMeshes={};
  for(const pin of ADC.pins){
    for(const y of [-2.1,2.1]){const pad=ring(hardware,25,y,pin.z,5,2.7);pad.userData.adcPin=pin.key;}
    const housing=box(hardware,[25,-9,pin.z],[14,12,19],'#202326');housing.userData.adcPin=pin.key;
    const leg=box(hardware,[25,-11,pin.z],[2.8,34,2.8],'#c2c8ca',{metalness:0.95,roughness:0.22});leg.userData.adcPin=pin.key;pinMeshes[pin.key]=leg;
    const bead=sphere(hardware,[25,3,pin.z],4.4,'#c4cbce',{metalness:0.95,roughness:0.23});bead.scale.y=0.45;bead.userData.adcPin=pin.key;
    const label=surfaceText(hardware,pin.name,[-1,2.25,pin.z],pin.name.length>3?37:30,12,'#f2ecf6',25);label.userData.adcPin=pin.key;
    if(pin.cables.length){
      const boot=box(plugs,[25,-35,pin.z],[11,18,12],'#26323c');boot.userData.adcPin=pin.key;
      const stripe=box(plugs,[31,-35,pin.z],[0.8,4,10],pin.color);stripe.userData.adcPin=pin.key;
      const neck=cylinderBetween(plugs,[25,-44,pin.z],[25,-45,pin.z],1.9,pin.color);neck.userData.adcPin=pin.key;
    }
  }
  // Component face is the reverse of the printed V / G / SCL / SDA side.
  const chip=box(components,[-9,-7,44],[24,9,28],'#24262b');
  for(const z of [34,39,44,49,54])for(const x of [-24,6])box(components,[x,-4,z],[7,2,2],'#bbc1c3',{metalness:0.85});
  const marking=surfaceText(components,'TI',[-9,-11.6,44],16,9,'#bdc5c5',22);marking.rotation.x=Math.PI/2;
  for(const [x,z,w,d,color]of [[-8,-53,16,8,'#c4b591'],[-8,-36,16,8,'#c4b591'],[-8,-19,16,8,'#c4b591'],[-9,3,18,23,'#24262b'],[-26,48,9,15,'#c4b591']]){
    box(components,[x,-5,z],[w,5,d],color);
    for(const dx of [-1,1])box(components,[x+dx*(w/2-1),-4,z],[3,3,d],'#c1c7c8',{metalness:0.8});
  }
  const partLabel=surfaceText(components,'103',[-9,-7.6,3],15,18,'#e4e5df',22);partLabel.rotation.x=Math.PI/2;
  const reverse=surfaceText(components,'ADS1115 / ADS1015',[-29,-2.3,0],153,10,'#f2ecf6',25);reverse.rotation.x=Math.PI/2;reverse.rotation.z=Math.PI/2;
  for(const pin of ADC.pins){
    const geometry=new THREE.BufferGeometry().setFromPoints([[25,-2.2,pin.z],[13,-2.2,pin.z],[6,-2.2,pin.z+4],[-5,-2.2,Math.max(-58,Math.min(56,pin.z))]].map(p=>new THREE.Vector3(...p)));
    components.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#973d9f'})));
  }
  let mode='labels';
  function setMode(next){mode=next;hardware.rotation.z=next==='components'?Math.PI:0;plugs.visible=next==='labels';}
  function selectPin(key){hardware.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.adcPin&&mesh.material.emissive)mesh.material.emissive.set(mesh.userData.adcPin===key?'#996719':'#000000');});}
  setMode('labels');
  return {hardware,plugs,components,pinMeshes,setMode,selectPin,get mode(){return mode;}};
}
