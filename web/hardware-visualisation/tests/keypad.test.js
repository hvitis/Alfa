import test from 'node:test';
import assert from 'node:assert/strict';
import base from '../src/data/setup.json' with {type:'json'};
import {KEYPAD,keypadPoints,keypadConnection} from '../src/data/keypad.js';
import {createPicoData} from '../src/data/picoSetup.js';
import {DIVIDER,DIVIDER_KEYPAD_POSITION} from '../src/data/divider.js';

test('photo _003 has five buttons and a right-hand OUT / VCC / GND header',()=>{
  assert.deepEqual(KEYPAD.pins.map(p=>p.name),['OUT','VCC','GND']);assert.equal(KEYPAD.buttons.length,5);
  assert(KEYPAD.buttons[0][1]<KEYPAD.buttons[1][1]);assert.equal(KEYPAD.buttons[1][1],KEYPAD.buttons[2][1]);
  assert(KEYPAD.buttons[1][0]<0&&KEYPAD.buttons[2][0]>0);assert(KEYPAD.buttons[4][1]>KEYPAD.buttons[3][1]);
  for(const data of [base,createPicoData()]){
    const c=data.components.find(c=>c.id==='keypad'),points=keypadPoints(c.position);
    for(const pin of KEYPAD.pins){
      assert.deepEqual(data.points[pin.key],points[pin.key],pin.name);
      const wire=data.wires.find(w=>w.id===pin.cable);assert.equal(wire.color,pin.color,pin.name);
      assert.deepEqual(wire.path[0],data.points[wire.from]);assert.deepEqual(wire.path.at(-1),data.points[wire.to]);
    }
    assert(data.points.KOUT[2]<data.points.KVCC[2]);assert(data.points.KVCC[2]<data.points.KGND[2]);
    assert.equal(data.wires.find(w=>w.id==='K3').to,'RIN');
    assert(!data.wires.some(w=>w.from==='KOUT'&&w.to==='AA0'),'OUT must enter R1 before reaching A0');
    assert.equal(data.wires.find(w=>w.id==='K2').color,'#293440');
  }
});
test('button power and ground use the correct controller pins and the divider shares the same model',()=>{
  assert.equal(base.wires.find(w=>w.id==='K1').from,'P4');assert.equal(base.wires.find(w=>w.id==='K2').from,'P14');
  const pico=createPicoData();assert.equal(pico.wires.find(w=>w.id==='K1').from,'V5');assert.equal(pico.wires.find(w=>w.id==='K2').from,'P18');
  const p=keypadPoints(DIVIDER_KEYPAD_POSITION);assert.deepEqual(DIVIDER.points.OUT,p.KOUT);assert.deepEqual(DIVIDER.points.KEY_VCC,p.KVCC);assert.deepEqual(DIVIDER.points.KEY_GND,p.KGND);
  assert.match(keypadConnection(KEYPAD.pins[1],'pico'),/pin 40.*VBUS.*join/);
  assert.match(keypadConnection(KEYPAD.pins[2],'setup'),/pin 14.*GND/);
});
