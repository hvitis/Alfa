import * as THREE from 'three';
import { AMPLIFIER } from '../data/amplifier.js';
import { box, cylinderBetween, material, sphere } from './primitives.js';
import { surfaceText } from './surfaceText.js';
import { addLabel } from './labels.js';

function ring(parent,x,y,z,outer,inner,color){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(inner,outer,32),material(color,{metalness:0.75,side:THREE.DoubleSide}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function plate(parent){
  const shape=new THREE.Shape();
  shape.moveTo(-68,-78);shape.lineTo(68,-78);shape.lineTo(75,-71);shape.lineTo(75,71);shape.lineTo(68,78);shape.lineTo(-68,78);shape.lineTo(-75,71);shape.lineTo(-75,-71);shape.closePath();
  for(const [x,z,r]of [[-57,-59,9],[57,-59,9],...AMPLIFIER.pins.map(pin=>[pin.x,64,2.5])]){
    const hole=new THREE.Path();hole.absarc(x,-z,r,0,Math.PI*2,true);shape.holes.push(hole);
  }
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:5,bevelEnabled:false,curveSegments:24}),material('#382455'));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=-2.5;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  for(const x of [-57,57]){ring(parent,x,2.6,-59,10.5,9,'#d1c9bb');ring(parent,x,-2.6,-59,10.5,9,'#d1c9bb');}
  for(const pin of AMPLIFIER.pins){ring(parent,pin.x,2.6,64,5,2.5,'#cfbd8a');ring(parent,pin.x,-2.6,64,5,2.5,'#cfbd8a');}
}
export function makeAmplifier(parent,position){
  const hardware=new THREE.Group();hardware.position.set(...position);parent.add(hardware);
  plate(hardware);
  const header=new THREE.Group(),plugs=new THREE.Group(),solder=new THREE.Group(),alignment=new THREE.Group(),annotations=new THREE.Group();
  hardware.add(header,plugs,solder,alignment,annotations);
  const pinMeshes={},jointMeshes={},solderLabels={};
  for(const pin of AMPLIFIER.pins){
    const housing=box(header,[pin.x,9,64],[19,10,12],'#e6cc42');housing.userData.amplifierPin=pin.key;
    const metal=box(header,[pin.x,12,64],[3,40,3],'#b7c0c2',{metalness:0.95,roughness:0.25});metal.userData.amplifierPin=pin.key;pinMeshes[pin.key]=metal;
    // All seven header pins need solder, including the two without jumper wires.
    const bead=sphere(solder,[pin.x,-3.3,64],4.5,'#bac4c8',{metalness:0.95,roughness:0.24});bead.scale.y=0.45;bead.userData.amplifierPin=pin.key;jointMeshes[pin.key]=bead;
    solderLabels[pin.key]=addLabel(annotations,pin.name,[pin.x,-18,72],'small');
    const label=surfaceText(hardware,pin.name,[pin.x,2.8,31],44,11,pin.cable?'#f8f1e7':'#b6aba3',20);label.rotation.z=Math.PI/2;
    if(pin.cable){
      const boot=box(plugs,[pin.x,40,64],[10,18,11],'#24313b');boot.userData.amplifierPin=pin.key;
      const band=box(plugs,[pin.x,45,69.6],[9,3,0.8],pin.color);band.userData.amplifierPin=pin.key;
      const neck=cylinderBetween(plugs,[pin.x,49,64],[pin.x,53,64],2.2,pin.color);neck.userData.amplifierPin=pin.key;
    }
    const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pin.x,3,64),new THREE.Vector3(pin.x,38,64)]);
    const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:'#b58a27',dashSize:3,gapSize:3}));line.computeLineDistances();alignment.add(line);
  }
  // max4.jpg: − left / + right; wire entries face away from the yellow header.
  const terminal=new THREE.Group();hardware.add(terminal);
  box(terminal,[0,18,-58],[65,31,36],'#70ac78');
  const topShape=new THREE.Shape();topShape.moveTo(-32.5,-18);topShape.lineTo(32.5,-18);topShape.lineTo(32.5,18);topShape.lineTo(-32.5,18);topShape.closePath();
  for(const x of [-16,16]){const hole=new THREE.Path();hole.absarc(x,-9,10.5,0,Math.PI*2,true);topShape.holes.push(hole);}
  const top=new THREE.Mesh(new THREE.ExtrudeGeometry(topShape,{depth:14,bevelEnabled:false,curveSegments:24}),material('#70ac78'));
  top.rotation.x=-Math.PI/2;top.position.set(0,33.5,-58);top.castShadow=true;terminal.add(top);
  box(terminal,[0,37,-73],[66,8,5],'#5b9b68');
  for(const [x,key]of [[-16,'M-'],[16,'M+']]){
    const hole=cylinderBetween(terminal,[x,33.7,-49],[x,34,-49],11,'#284933');hole.userData.amplifierPin=key;
    const screw=cylinderBetween(terminal,[x,41,-49],[x,42,-49],7,'#c4ccca',{metalness:0.75,roughness:0.32});screw.userData.amplifierPin=key;
    const slot=box(terminal,[x,42.4,-49],[10,0.8,1.4],'#5e696a');slot.rotation.y=0.35;slot.userData.amplifierPin=key;
    const opening=box(terminal,[x,21,-76.5],[17,16,1],'#233d2b');opening.userData.amplifierPin=key;
    const clamp=box(terminal,[x,18,-77],[13,4,2],'#b4bbaf',{metalness:0.8});clamp.userData.amplifierPin=key;
    cylinderBetween(plugs,[x,21,-76],[x,21,-85],1.9,'#c0b495',{metalness:0.8});
    ring(hardware,x,-2.6,-58,5,1.8,'#b4bfbe');
  }
  surfaceText(hardware,'−',[-43,2.8,-33],17,17);surfaceText(hardware,'+',[43,2.8,-33],17,17);
  const chip=box(hardware,[16,7,-9],[28,9,28],'#29323a');
  for(let i=-10;i<=10;i+=5)for(const side of [-1,1]){
    box(hardware,[16+side*16,4,-9+i],[4,2,2],'#c3c8c6',{metalness:0.7});box(hardware,[16+i,4,-9+side*16],[2,2,4],'#c3c8c6',{metalness:0.7});
  }
  surfaceText(hardware,'AKK',[16,11.7,-12],20,8,'#9ca9ad',22);surfaceText(hardware,'BEX',[16,11.7,-4],20,8,'#9ca9ad',22);
  surfaceText(hardware,'MAX98357A',[-39,2.8,-15],51,10);surfaceText(hardware,'I2S AMP',[-39,2.8,-1],49,11);
  for(const [x,z,w,d,color]of [[-55,-28,13,9,'#c1b694'],[-27,-28,11,8,'#4b5660'],[4,-30,11,8,'#4b5660'],[53,-27,13,9,'#c1b694'],[51,-5,9,15,'#d1c096'],[54,16,10,14,'#8d9b9e'],[-53,19,14,8,'#53595b']]){
    box(hardware,[x,5,z],[w,5,d],color);box(hardware,[x,4,z-d/2],[w,3,2],'#c0c8c6');box(hardware,[x,4,z+d/2],[w,3,2],'#c0c8c6');
  }
  // Printed notes on the reverse follow max3.jpg.
  for(const [text,z,width]of [['4–8 Ω · 3 W',-59,77],['MAX98357A',-31,111],['I2S Mono Amp.',-13,116],['VIN: 2.5–5.5 V',5,117],['Default 9 dB gain',24,125],['(L + R) / 2 out',43,111]]){
    const label=surfaceText(hardware,text,[0,-2.8,z],width,11,'#f3eee7',25);label.rotation.x=Math.PI/2;label.rotation.z=Math.PI;
  }
  const rowTag=addLabel(annotations,AMPLIFIER.pins.map(pin=>pin.name).join(' · '),[0,72,91],'amp-row');
  const speakerTag=addLabel(annotations,'Speaker −     Speaker +',[0,66,-91],'small');
  const solderTag=addLabel(annotations,'SOLDER HERE · all seven header pins',[0,-32,108],'changed');
  const stageTag=addLabel(annotations,'Header lifted for clarity · solder the short legs underneath',[0,89,103],'small changed');
  const undersideLight=new THREE.DirectionalLight('#ffffff',2);undersideLight.position.set(-80,-100,-160);undersideLight.target=solder;hardware.add(undersideLight);
  let mode='wiring';
  function setMode(next){
    mode=next;hardware.position.y=position[1]+(next==='underside'?110:0);header.position.y=next==='before'?43:0;plugs.visible=next==='wiring';solder.visible=next!=='before';alignment.visible=next==='before';
    undersideLight.visible=next==='underside';for(const label of Object.values(solderLabels))label.visible=next==='underside';
    rowTag.visible=next==='wiring';speakerTag.visible=next==='wiring';solderTag.visible=next==='underside';stageTag.visible=next==='before';
  }
  function selectPin(key){
    hardware.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.amplifierPin&&mesh.material.emissive)mesh.material.emissive.set(mesh.userData.amplifierPin===key?'#9b7019':'#000000');});
  }
  function setDetailed(value){annotations.visible=value;}
  setMode('wiring');setDetailed(false);
  return {hardware,header,plugs,solder,alignment,pinMeshes,jointMeshes,solderLabels,setMode,setDetailed,selectPin,get mode(){return mode;}};
}
