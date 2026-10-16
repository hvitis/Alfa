import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import setup from '../src/data/setup.json' with { type:'json' };
import { DIVIDER } from '../src/data/divider.js';
import { lookAround, moveCamera } from '../src/controls/cameraMath.js';
import { makeResistor } from '../src/scene/resistor.js';

test('shared join contains exactly R1, R2 and A0; GND is a separate net',()=>{
  assert.deepEqual(DIVIDER.netMembers.join,['R1_B','R2_A','A0']);
  assert.equal(DIVIDER.resistors.find(r=>r.id==='R1').b,'JOIN');
  assert.equal(DIVIDER.resistors.find(r=>r.id==='R2').a,'JOIN');
  assert.equal(DIVIDER.resistors.find(r=>r.id==='R2').b,'R2_B');
  assert.notDeepEqual(DIVIDER.points.JOIN,DIVIDER.points.R2_B);
  assert(DIVIDER.netMembers.ground.includes('ADC_GND'));
  assert(DIVIDER.resistors.every(r=>r.ohms===10000));
});
test('all 27 setup cables retain exact endpoint assignments',()=>{
  assert.equal(setup.wires.length,27);
  const expected={LVCC:1,LGND:6,LDIN:19,LCLK:23,LCS:24,LDC:22,LRST:13,LBL:18,MVIN:2,MGND:9,MBCLK:12,MLRC:35,MDIN:40,AVDD:17,GND_JOIN:20,ASDA:3,ASCL:5,KVCC:4,KGND:14};
  for(const [key,pin]of Object.entries(expected))assert(setup.wires.some(w=>w.from==='P'+pin&&w.to===key),key);
  for(const wire of setup.wires){assert.deepEqual(wire.path[0],setup.points[wire.from]);assert.deepEqual(wire.path.at(-1),setup.points[wire.to]);}
  assert(setup.wires.some(w=>w.from==='J'&&w.to==='AA0'));
  assert(setup.wires.some(w=>w.from==='RGND'&&w.to==='GND_JOIN'));
  assert.deepEqual(setup.wires.filter(w=>w.from==='M-').map(w=>w.to),['S-']);
});
test('LCD cable colors match photos/colors.jpg, including white ground',()=>{
  const expected={LVCC:['purple','#8050be'],LGND:['white','#f4f4f0'],LDIN:['green','#157c6e'],LCLK:['orange','#ef7b19'],LCS:['yellow','#ecc52b'],LDC:['blue','#2f51b5'],LRST:['brown','#93522d'],LBL:['gray','#a2a6a8']};
  for(const wire of setup.wires.filter(w=>w.group==='LCD'))assert.deepEqual([wire.colorName,wire.color],expected[wire.to]);
});
test('camera movement translates position and target, rather than rotating around the model',()=>{
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,80,150);camera.lookAt(0,0,0);
  const target=new THREE.Vector3(0,0,0),position=camera.position.clone(),beforeTarget=target.clone();
  const rotation=camera.quaternion.clone();
  const delta=moveCamera(camera,target,'right',20);
  assert(Math.abs(camera.position.distanceTo(position)-20)<1e-9);
  assert(target.clone().sub(beforeTarget).distanceTo(delta)<1e-9);
  assert(camera.quaternion.equals(rotation));
});
test('free movement follows view direction; look does not move the camera',()=>{
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,0,100);camera.lookAt(100,0,100);
  moveCamera(camera,null,'forward',25);assert(Math.abs(camera.position.x-25)<1e-9);
  const position=camera.position.clone(),rotation=camera.quaternion.clone();
  lookAround(camera,100,40);assert(camera.position.equals(position));assert(!camera.quaternion.equals(rotation));
  moveCamera(camera,null,'up',15);assert.equal(camera.position.y,15);
  moveCamera(camera,null,'down',15);assert.equal(camera.position.y,0);
});
test('each resistor has metal legs and an explicit 10k body with four bands',()=>{
  const scene=new THREE.Group();
  const resistor=makeResistor(scene,'R1',DIVIDER.points.R1_A,DIVIDER.points.JOIN);
  assert.equal(resistor.children.length,7);
  assert.equal(resistor.userData.resistor.ohms,10000);
  assert.deepEqual(resistor.userData.resistor.start,DIVIDER.points.R1_A);
  assert.deepEqual(resistor.userData.resistor.end,DIVIDER.points.JOIN);
});
