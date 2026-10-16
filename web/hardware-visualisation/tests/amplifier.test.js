import test from 'node:test';
import assert from 'node:assert/strict';
import base from '../src/data/setup.json' with { type:'json' };
import { AMPLIFIER, amplifierConnection } from '../src/data/amplifier.js';
import { createPicoData } from '../src/data/picoSetup.js';

test('photographed header has seven positions, five jumpers, and two unconnected settings',()=>{
  assert.deepEqual(AMPLIFIER.pins.map(p=>p.name),['LRC','BCLK','DIN','GAIN','SD','GND','VIN']);
  assert.equal(AMPLIFIER.pins.filter(p=>p.cable).length,5);
  const amp=base.components.find(c=>c.id==='amp');
  for(const pin of AMPLIFIER.pins){
    const point=base.points[pin.key];assert.equal(point[0],amp.position[0]+pin.x);assert.equal(point[2],amp.position[2]+64);
    const wires=base.wires.filter(w=>w.from===pin.key||w.to===pin.key);
    assert.equal(wires.length,pin.cable?1:0,pin.name);
    if(pin.cable){assert.equal(wires[0].id,pin.cable);assert.equal(wires[0].from,'P'+pin.pi);}
  }
});
test('speaker plus is right and minus is left of the photographed green terminal',()=>{
  assert(base.points['M-'][0]<base.points['M+'][0]);assert.equal(base.points['M-'][2],base.points['M+'][2]);
  for(const data of [base,createPicoData()]){
    assert.equal(data.wires.find(w=>w.from==='M+').to,'S+');assert.equal(data.wires.find(w=>w.from==='M-').to,'S-');
    assert(!data.wires.some(w=>['M+','M-'].includes(w.from)&&/GND/.test(w.to)));
    for(const wire of data.wires.filter(w=>w.group==='Audio')){assert.deepEqual(wire.path[0],data.points[wire.from]);assert.deepEqual(wire.path.at(-1),data.points[wire.to]);}
  }
});
test('amplifier guide reports actual Pi and Pico destinations, including the shared VBUS supply',()=>{
  const pico=createPicoData();
  for(const pin of AMPLIFIER.pins){
    if(pin.cable){const wire=pico.wires.find(w=>w.id===pin.cable);assert.equal(wire.controllerPin,'P'+pin.pico);}
    else assert.match(amplifierConnection(pin,'setup'),/leave unconnected/);
  }
  assert.match(amplifierConnection(AMPLIFIER.pins.find(p=>p.name==='BCLK'),'setup'),/pin 12 · GPIO18/);
  assert.match(amplifierConnection(AMPLIFIER.pins.find(p=>p.name==='BCLK'),'pico'),/pin 14 · GP10/);
  assert.match(amplifierConnection(AMPLIFIER.pins[6],'pico'),/pin 40 · VBUS, via USB 5 V join/);
});
