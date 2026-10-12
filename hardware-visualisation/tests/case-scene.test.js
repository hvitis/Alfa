import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseScene } from '../src/scene/caseScene.js';
import facts from '../src/data/case-routing.json' with { type: 'json' };
import { moduleInfo, MODULE_IDS } from '../src/data/modules.js';

test('wooden case scene exposes all 27 routing wires and parameters', () => {
  const caseScene = createCaseScene();
  assert.equal(caseScene.data.wires.length, 27);
  assert.equal(caseScene.data.parameters.case.width, 150);
  assert.equal(caseScene.data.parameters.case.height, 200);
  assert.equal(caseScene.data.parameters.case.depth, 64);
  assert.equal(caseScene.getMode(), 'internals');
  assert.equal(caseScene.getWood(), true);
  assert.equal(caseScene.getLabels(), false);
});

test('case modules provide descriptions and details for workshop parts', () => {
  for (const id of ['pi', 'lcd', 'battery', 'amp', 'adc', 'speaker', 'keypad', 'divider', 'switch']) {
    const info = moduleInfo(id, 'case');
    assert.ok(info, `Module info should exist for ${id}`);
    assert.ok(info.title, `Title should exist for ${id}`);
    assert.ok(info.purpose, `Purpose should exist for ${id}`);
    assert.ok(info.details.length > 0, `Details should exist for ${id}`);
    assert.ok(MODULE_IDS.includes(id), `MODULE_IDS should include ${id}`);
  }
});

test('camera presets return valid positions and target', () => {
  const caseScene = createCaseScene();
  for (const preset of ['front', 'rear', 'iso']) {
    const cam = caseScene.getCameraPreset(preset);
    assert.ok(cam.position, `Position should exist for ${preset}`);
    assert.ok(cam.target, `Target should exist for ${preset}`);
    assert.ok(Number.isFinite(cam.position.x));
    assert.ok(Number.isFinite(cam.position.y));
    assert.ok(Number.isFinite(cam.position.z));
  }
});

test('mode, wood and labels toggles update scene state', async () => {
  const caseScene = createCaseScene();
  caseScene.setWood(false);
  assert.equal(caseScene.getWood(), false);
  caseScene.setLabels(true);
  assert.equal(caseScene.getLabels(), true);
  caseScene.selectWire('S3');
  assert.equal(caseScene.getSelectedWire(), 'S3');
  caseScene.setFilter('Audio');
  assert.equal(caseScene.getFilter(), 'Audio');
});
