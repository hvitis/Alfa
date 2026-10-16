import facts from '../data/radio-house.json' with { type: 'json' };
import { createWorkshopScene, prepareWorkshopModel } from './workshopScene.js';

// Alfa, the little house radio. Data and meshes come from design/house-radio
// (build_all.py, then sync_viewer.py).
export const RADIO_TAGS = {
  lcd: 'LCD', keypad: 'Five buttons', speaker: 'Speaker', pi: 'Raspberry Pi 3', battery: 'Power bank',
  power: 'QUARKZMAN plug', switch: 'QUARKZMAN switch · measure', amp: 'MAX98357A', adc: 'ADS', divider: 'R1/R2', handle: 'Handle',
};

export function prepareRadioModel(scene) {
  return prepareWorkshopModel(scene, facts.wood_colors);
}

export function createRadioScene() {
  return createWorkshopScene({
    name: 'radio', facts, tags: RADIO_TAGS, defaultMode: 'assembled',
    glbUrl: mode => new URL(`../data/radio-glb/house_${mode}.glb`, import.meta.url).href,
  });
}
