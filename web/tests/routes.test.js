import assert from 'node:assert/strict';
import test from 'node:test';
import {readRoute,writeRoute} from '../routes.js';

test('a shared PCB URL opens the selected hardware and assembly',()=>{
  const route=readRoute(new URL('https://example.test/Alfa/?controller=pcb&pcb-mode=exploded#elektronika'));
  assert.equal(route.tab,'elektronika');
  assert.equal(route.values['hardware-controller'],'pcb');
  assert.equal(route.values['pcb-mode'],'exploded');
});
test('legacy #hardware hash maps to elektronika',()=>{
  const route=readRoute(new URL('https://example.test/Alfa/?controller=pcb#hardware'));
  assert.equal(route.tab,'elektronika');
  assert.equal(route.values['hardware-controller'],'pcb');
});
test('static PCB landing page opens the PCB without JavaScript redirects',()=>{
  const route=readRoute(new URL('https://example.test/Alfa/pcb/'));
  assert.equal(route.tab,'elektronika');assert.equal(route.values['hardware-controller'],'pcb');
});
test('all hardware choices round trip through a shareable URL',()=>{
  for(const controller of ['raspberry','pico','pcb']) {
    const url=writeRoute(new URL('https://example.test/Alfa/pcb/'),'elektronika',{'hardware-controller':controller});
    assert.equal(readRoute(url).values['hardware-controller'],controller);
  }
});
test('shared obudowa subviews and plywood selections work under repository subpaths',()=>{
  const url=writeRoute(new URL('https://example.test/repo/en/'),'obudowa',{'obudowa-view':'plywood','plywood-project':'case','assembly-mode':'exploded'});
  const route=readRoute(url);assert.equal(route.values['plywood-project'],'case');assert.equal(route.values['assembly-mode'],'exploded');assert.equal(url.pathname,'/repo/en/');
});
test('unknown selection values cannot become a scene name',()=>{
  const route=readRoute(new URL('https://example.test/?controller=missing&pcb-mode=unknown#missing'));
  assert.equal(route.values['hardware-controller'],'raspberry');assert.equal(route.values['pcb-mode'],'assembled');
  assert.equal(route.tab,'glowna');
});
