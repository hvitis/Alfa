import test from 'node:test';
import assert from 'node:assert/strict';
import base from '../src/data/setup.json' with {type:'json'};
import { ADC, adcPoints, adcConnection, isAdcWire } from '../src/data/adc.js';
import { createPicoData } from '../src/data/picoSetup.js';
import { DIVIDER, DIVIDER_ADC_POSITION } from '../src/data/divider.js';

test('but2 header order includes ALERT between ADDR and A0, with all ten pins on one edge',()=>{
  assert.deepEqual(ADC.pins.map(p=>p.name),['V','G','SCL','SDA','ADDR','ALERT','A0','A1','A2','A3']);
  for(const data of [base,createPicoData()]){
    const component=data.components.find(c=>c.id==='adc'),points=adcPoints(component.position);
    for(const pin of ADC.pins){
      assert.deepEqual(data.points[pin.key],points[pin.key],pin.name);
      assert.deepEqual(data.wires.filter(w=>w.from===pin.key||w.to===pin.key).map(w=>w.id).sort(),(pin.key==='AGND'?['A6']:[...pin.cables]).sort(),pin.name);
    }
    for(const wire of data.wires.filter(isAdcWire)){
      assert.deepEqual(wire.path[0],data.points[wire.from],wire.id);
      assert.deepEqual(wire.path.at(-1),data.points[wire.to],wire.id);
      assert(wire.path.every(p=>p.every(Number.isFinite)));
    }
  }
});
test('divider and controller scenes connect to the same photographed pin positions',()=>{
  const p=adcPoints(DIVIDER_ADC_POSITION);
  assert.deepEqual(DIVIDER.points.A0,p.AA0);assert.deepEqual(DIVIDER.points.ADC_GND,p.AGND);assert.deepEqual(DIVIDER.points.ADC_VDD,p.AVDD);
  assert.equal(base.wires.find(w=>w.id==='A5').from,'AADDR');assert.equal(base.wires.find(w=>w.id==='A5').to,'GND_JOIN');
  assert.equal(base.wires.find(w=>w.id==='K4').from,'J');assert.equal(base.wires.find(w=>w.id==='K4').to,'AA0');
  assert.match(adcConnection(ADC.pins[0],'setup'),/pin 17.*3.3 V/);
  assert.match(adcConnection(ADC.pins[0],'pico'),/pin 36.*3V3 OUT.*join/);
  assert.match(adcConnection(ADC.pins[2],'pico'),/pin 7.*GP5/);
  assert.match(adcConnection(ADC.pins[3],'pico'),/pin 6.*GP4/);
  assert.match(adcConnection(ADC.pins[4],'setup'),/0x48/);
  for(const pin of ADC.pins.filter(p=>!p.cables.length))assert.match(adcConnection(pin,'setup'),/unconnected/);
});

test('all ground join branches stay yellow in both controller views',()=>{
  for(const data of [base,createPicoData()]){
    const ground=data.wires.filter(w=>['A2','A5','K5','A6'].includes(w.id));
    assert.equal(ground.length,4);
    for(const wire of ground)assert.equal(wire.color,'#e3b51f',wire.id);
  }
});

test('ground branches meet only at the explicit join and one lead connects the G pin',()=>{
  for(const data of [base,createPicoData()]){
    const lead=data.wires.find(w=>w.id==='A6');assert.equal(lead.from,'AGND');assert.equal(lead.to,'GND_JOIN');
    assert.deepEqual(lead.path,[data.points.AGND,data.points.GND_JOIN]);
    assert.equal(lead.color,'#e3b51f');assert.equal(data.wires.find(w=>w.id==='A2').color,lead.color);
    for(const id of ['A2','A5','K5'])assert.equal(data.wires.find(w=>w.id===id).to,'GND_JOIN');
    // Collinear overlap makes two differently colored tubes fight for the same pixels.
    const wires=data.wires.filter(isAdcWire);
    for(let i=0;i<wires.length;i++)for(let j=i+1;j<wires.length;j++){
      for(let a=1;a<wires[i].path.length;a++)for(let b=1;b<wires[j].path.length;b++){
        const p=wires[i].path[a-1],q=wires[i].path[a],r=wires[j].path[b-1],s=wires[j].path[b];
        const axis=p.findIndex((v,k)=>v!==q[k]);
        if(axis<0||r.findIndex((v,k)=>v!==s[k])!==axis)continue;
        if(!p.every((v,k)=>k===axis||v===r[k]))continue;
        const overlap=Math.min(Math.max(p[axis],q[axis]),Math.max(r[axis],s[axis]))-Math.max(Math.min(p[axis],q[axis]),Math.min(r[axis],s[axis]));
        assert(overlap<=0,`${wires[i].id} and ${wires[j].id} overlap by ${overlap}`);
      }
    }
  }
});
