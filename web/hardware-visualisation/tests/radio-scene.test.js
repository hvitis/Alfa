import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRadioScene, prepareRadioModel, RADIO_TAGS } from '../src/scene/radioScene.js';
import house from '../src/data/radio-house.json' with { type: 'json' };
import atlas from '../src/data/setup.json' with { type: 'json' };
import concepts from '../src/data/radio-concepts.json' with { type: 'json' };
import { moduleInfo } from '../src/data/modules.js';

test('synced house passed its CAD checks and carries the working 27 nets', () => {
  assert.equal(house.name, 'Alfa');
  assert.ok(house.checks.passed && house.checks.count >= 50);
  assert.deepEqual(house.modes, ['assembled', 'roof_open', 'inside', 'exploded']);
  const keys = w => [w.id, w.group, w.from, w.to, w.color].join('|');
  assert.deepEqual(house.wires.map(keys), atlas.wires.map(keys));
  assert.ok(house.handle.finger_gap >= 34 && house.handle.grip_length >= 85);
  assert.ok(house.fasteners.every(f => f.count > 0 && f.designation));
  assert.ok(concepts.concepts.some(c => c.id === 'house'), 'the chosen concept is still listed');
});

test('every clickable part has an explanation in the radio view', () => {
  for (const id of Object.keys(house.modules)) {
    const info = moduleInfo(id, 'radio');
    assert.ok(info?.title && info.purpose && info.details.length, id);
    assert.ok(RADIO_TAGS[id], `${id} has a 3D label`);
  }
});

test('modes switch wires and hit boxes; exploded hides both', async () => {
  const radio = createRadioScene();
  await radio.readyPromise;
  assert.equal(radio.getMode(), 'assembled');
  assert.equal(radio.cables.children.length, 27);
  assert.equal(Object.keys(radio.modules).length, Object.keys(house.modules).length);
  await radio.setMode('exploded');
  assert.equal(radio.cables.children.length, 0);
  assert.equal(Object.keys(radio.modules).length, 0);
  await radio.setMode('roof_open');
  assert.equal(radio.cables.children.length, 27);
  await radio.setMode('missing');
  assert.equal(radio.getMode(), 'roof_open');
  radio.selectWire('USB');
  assert.equal(radio.getSelectedWire(), 'USB');
  radio.setFilter('Power');
  assert.equal(radio.cables.children.filter(g => g.visible).length, 1);
  radio.setWood(false);
  radio.setLabels(true);
  assert.equal(radio.getWood(), false);
  assert.equal(radio.getLabels(), true);
});

test('camera presets look at the house from finite positions', () => {
  const radio = createRadioScene();
  for (const name of ['iso', 'front', 'side', 'back', 'top']) {
    const { position, target } = radio.getCameraPreset(name);
    for (const v of [...position.toArray(), ...target.toArray()]) assert.ok(Number.isFinite(v), name);
    assert.ok(position.distanceTo(target) > Math.max(...house.outer_mm), name);
  }
});

test('each view mesh parses with plywood and non-plywood parts', async () => {
  const loader = new GLTFLoader();
  for (const mode of house.modes) {
    const buffer = await readFile(new URL(`../src/data/radio-glb/house_${mode}.glb`, import.meta.url));
    const gltf = await new Promise((resolve, reject) =>
      loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '', resolve, reject));
    const meshes = [];
    prepareRadioModel(gltf.scene).traverse(o => { if (o.isMesh) meshes.push(o); });
    assert.ok(meshes.some(m => m.userData.wood), `${mode} has plywood`);
    assert.ok(meshes.some(m => !m.userData.wood), `${mode} has electronics and hardware`);
  }
});
