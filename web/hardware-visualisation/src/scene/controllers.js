import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { box, cylinderBetween, material, sphere } from './primitives.js';
import { surfaceText as print } from './surfaceText.js';

function rounded(parent,position,size,color,radius=5,options={}){
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,3,radius),material(color,options));mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function heatsink(parent,x,z,size=50){
  box(parent,[x,14,z],[size,18,size],'#3e454a',{metalness:0.85});
  for(let i=-size/2+3;i<size/2;i+=6)box(parent,[x+i,28,z],[2.5,12,size],'#87949a',{metalness:0.8});
}
function usbPair(parent,z){
  rounded(parent,[161,27,z],[48,46,49],'#bac6cb',2,{metalness:0.85,roughness:0.28});
  for(const y of [16,38]){
    box(parent,[185.2,y,z],[1.5,17,38],'#172126');
    box(parent,[186.2,y+3,z],[1,6,31],'#b6c1c4');
    box(parent,[187,y-3,z],[1,4,28],'#283943');
    for(let i=-9;i<=9;i+=6)box(parent,[188,y-4,z+i],[1,2,2],'#d9b86b',{metalness:0.9});
  }
}
function raspberry(parent,x,z){
  for(const [dx,dz,r]of [[-8,-7,5],[3,-7,5],[-12,3,5],[0,3,6],[11,3,5],[-6,13,5],[6,13,5],[0,21,4]])sphere(parent,[x+dx,4,z+dz],r,'#f0f5e9');
  const leaf=box(parent,[x+5,4,z-18],[15,1.2,7],'#e6f4e0');leaf.rotation.y=-0.45;
}
export function makePi3(parent){
  rounded(parent,[0,-8,45],[384,7,264],'#82b7d7',9,{transparent:true,opacity:0.55});
  rounded(parent,[0,0,45],[350,5,230],'#25865a',8);
  for(const [x,z]of [[-157,-48],[151,-48],[-157,141],[151,141]]){
    cylinderBetween(parent,[x,-4,z],[x,5,z],5,'#d8c88b',{metalness:0.7});
    cylinderBetween(parent,[x,5,z],[x,5.5,z],2.5,'#193e35');
    cylinderBetween(parent,[x,-12,z],[x,-3,z],5,'#407d9e');
  }
  box(parent,[-1.4,31,-43.2],[285,17,40],'#18252b');
  print(parent,'GPIO • 40 PINS',[-2,4,-9],168,13);
  heatsink(parent,-15,59,58);heatsink(parent,96,28,35);
  usbPair(parent,20);usbPair(parent,76);
  rounded(parent,[155,28,134],[60,50,54],'#bec9cd',2,{metalness:0.8});
  box(parent,[186,28,134],[2,31,40],'#253536');
  box(parent,[187,38,134],[2,9,30],'#374b49');
  for(let i=-12;i<=12;i+=3.5)box(parent,[187.5,20,134+i],[1,2,1.4],'#d6b453');
  box(parent,[188,13,117],[1,5,5],'#4cae64');box(parent,[188,13,151],[1,5,5],'#edbb37');
  rounded(parent,[-123,15,151],[35,23,27],'#c4cdd0',2,{metalness:0.85});
  box(parent,[-123,15,165],[26,10,1.5],'#26383c');
  rounded(parent,[-37,16,155],[63,28,28],'#b8c5ca',3,{metalness:0.85});
  box(parent,[-37,16,170],[48,14,2],'#213239');box(parent,[-37,14,171],[33,4,1],'#667078');
  box(parent,[37,15,150],[32,25,31],'#1a272c');
  cylinderBetween(parent,[37,15,158],[37,15,174],10,'#17252b');
  cylinderBetween(parent,[37,15,174],[37,15,175],5.5,'#465458');
  for(const [x,z]of [[-148,50],[61,101]]){
    box(parent,[x,8,z],[12,11,67],'#ede4cf');box(parent,[x-5,14,z],[4,3,60],'#344447');
  }
  box(parent,[-174,-4,58],[23,3,53],'#a4b0b3',{metalness:0.7});
  box(parent,[-185,-4,58],[5,2,41],'#293b40');
  for(const [x,z,w,d]of [[-77,48,20,16],[-111,-2,17,12],[71,-2,16,17],[-77,126,21,14],[101,111,20,13]]){
    box(parent,[x,6,z],[w,7,d],'#20312d');
    for(let side=-1;side<=1;side+=2)for(let n=-6;n<=6;n+=4)box(parent,[x+side*(w/2+1),4,z+n],[2,2,1.5],'#c8c5a9');
  }
  for(let i=0;i<12;i++){
    const x=-111+(i%4)*13,z=78+Math.floor(i/4)*11;
    box(parent,[x,4,z],[5,3,3],'#b9aa80');box(parent,[x+4,4,z],[2,3,3],'#d5d8c4');
  }
  raspberry(parent,-92,34);
  print(parent,'Raspberry Pi 3 Model B',[-39,4,115],176,19);
  print(parent,'HDMI',[-37,4,132],34,10);print(parent,'PWR',[-123,4,131],29,10);
  print(parent,'ETHERNET',[119,4,173],64,10);
}
export function makePico(parent){
  rounded(parent,[0,0,45],[88,5,210],'#14845d',5);
  for(const x of [-35,35])box(parent,[x,11,44.8],[8,9,208],'#1d2e32');
  rounded(parent,[0,14,-58],[33,22,28],'#b9c6cb',2,{metalness:0.85});
  box(parent,[0,14,-73],[25,12,1.5],'#233238');
  box(parent,[-12,7,-30],[17,8,15],'#e5ece5');box(parent,[-12,12,-30],[8,3,8],'#ecefde');
  sphere(parent,[-27,5,-49],2.2,'#b7e867',{emissive:'#8fbc44',emissiveIntensity:0.3});
  const chip=box(parent,[0,6,8],[28,8,28],'#203238');chip.rotation.y=Math.PI/4;
  print(parent,'RP2350',[0,13,8],25,8);
  rounded(parent,[0,8,79],[34,12,39],'#b9c4c5',2,{metalness:0.8});
  print(parent,'WiFi / BT',[0,15,80],31,8,'#293d42');
  for(const [x,z]of [[-15,45],[13,38],[-13,107],[12,111]])box(parent,[x,5,z],[7,5,9],'#253b35');
  // The PCB antenna is at the end opposite USB.
  for(let i=0;i<4;i++)box(parent,[-16+i*8,3.5,133],[3,1,18],'#d6c18a');
  box(parent,[-4,3.5,125],[27,1,3],'#d6c18a');box(parent,[-4,3.5,141],[27,1,3],'#d6c18a');
  print(parent,'Pico 2 W',[0,4,52],46,10);
  print(parent,'BOOTSEL',[-9,4,-16],36,6);print(parent,'ANTENNA',[0,4,118],41,6);
}
