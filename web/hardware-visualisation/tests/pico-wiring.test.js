import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import base from '../src/data/setup.json' with { type: 'json' };
import { createPicoData, PICO_PIN_NAMES } from '../src/data/picoSetup.js';
import { moduleInfo } from '../src/data/modules.js';
import { isVisible, registerModule } from '../src/scene/modules.js';

const pico=createPicoData();
test('Pico pin assignments use physical DIP pins and valid SPI / I2C / PIO functions',()=>{
  const expected={LVCC:[36,'3V3 OUT'],LGND:[3,'GND'],LDIN:[25,'GP19'],LCLK:[24,'GP18'],LCS:[22,'GP17'],LDC:[21,'GP16'],LRST:[26,'GP20'],LBL:[27,'GP21'],MVIN:[40,'VBUS'],MGND:[13,'GND'],MBCLK:[14,'GP10'],MLRC:[15,'GP11'],MDIN:[16,'GP12'],AVDD:[36,'3V3 OUT'],GND_JOIN:[8,'GND'],ASDA:[6,'GP4'],ASCL:[7,'GP5'],KVCC:[40,'VBUS'],KGND:[18,'GND']};
  const changed=pico.wires.filter(w=>w.previousPin);assert.equal(changed.length,19);
  for(const [terminal,[pin,name]]of Object.entries(expected)){
    const wire=changed.find(w=>w.to===terminal);assert.equal(wire.controllerPin,'P'+pin,terminal);assert.equal(PICO_PIN_NAMES[pin-1],name,terminal);assert(wire.changed);
  }
  assert.equal(Number(PICO_PIN_NAMES[14].slice(2)),Number(PICO_PIN_NAMES[13].slice(2))+1,'PIO clock pins must be adjacent');
  const signals=changed.map(w=>w.controllerPin).filter(p=>PICO_PIN_NAMES[Number(p.slice(1))-1].startsWith('GP'));
  assert.equal(new Set(signals).size,signals.length,'no conflicting GPIO assignments');
  assert(!signals.some(p=>[23,24,25,29].includes(Number(PICO_PIN_NAMES[Number(p.slice(1))-1].slice(2)))),'wireless GPIO remain reserved');
});
test('separate Pico power joins keep USB 5 V and 3.3 V electrically separate',()=>{
  assert.deepEqual(pico.wires.filter(w=>w.from==='V3').map(w=>w.to).sort(),['AVDD','LVCC']);
  assert.deepEqual(pico.wires.filter(w=>w.from==='V5').map(w=>w.to).sort(),['KVCC','MVIN']);
  assert(pico.wires.some(w=>w.from==='P36'&&w.to==='V3'));assert(pico.wires.some(w=>w.from==='P40'&&w.to==='V5'));
  assert(!pico.wires.some(w=>w.from==='P39'||w.to==='P39'),'VSYS is not a 5 V peripheral output');
  assert(!pico.wires.some(w=>w.from==='V3'&&w.to==='V5'||w.from==='V5'&&w.to==='V3'));
});
test('Pico retains every module, LCD harness color, divider net and speaker polarity',()=>{
  assert.deepEqual(pico.components.map(c=>c.id),base.components.map(c=>c.id));
  for(const wire of pico.wires){assert.deepEqual(wire.path[0],pico.points[wire.from],wire.id);assert.deepEqual(wire.path.at(-1),pico.points[wire.to],wire.id);}
  for(const wire of base.wires.filter(w=>!/^P\d+$/.test(w.from)&&w.id!=='USB'))assert.deepEqual(pico.wires.find(w=>w.id===wire.id).path,wire.path,wire.id);
  for(const wire of base.wires.filter(w=>w.group==='LCD'))assert.equal(pico.wires.find(w=>w.id===wire.id).color,wire.color);
  assert.equal(pico.wires.find(w=>w.from==='M-').to,'S-');assert.equal(pico.wires.filter(w=>w.added).length,2);assert.equal(base.wires.length,27);
});
test('Pico headers follow DIP numbering, with USB between pins 1 and 40',()=>{
  const p=pico.points;assert(p.P1[0]<0);assert(p.P40[0]>0);assert.equal(p.P1[2],p.P40[2]);
  assert.equal(p.P20[2],p.P21[2]);assert(p.P20[2]>p.P1[2]);assert(p.USB[2]<p.P1[2]);
});
test('module picking excludes meshes beneath hidden scene or cable groups',()=>{
  const root=new THREE.Group(),module=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  root.add(module);module.add(mesh);const modules={},pickables=[];registerModule(modules,pickables,'lcd',module);
  assert.equal(mesh.userData.moduleId,'lcd');assert.equal(pickables[0],mesh);assert(isVisible(mesh));root.visible=false;assert(!isVisible(mesh));
  root.visible=true;module.visible=false;assert(!isVisible(mesh));
});
test('Pico module explanations state the firmware and PIO requirements',()=>{
  assert.match(moduleInfo('pi','pico').details.join(' '),/existing Linux\/SSH app does not run/);
  assert.match(moduleInfo('amp','pico').changes,/PIO/);assert.match(moduleInfo('supply','pico').details.join(' '),/VBUS/);
  assert.equal(moduleInfo('pi','setup').title,'Raspberry Pi 3 Model B');
});
