import base from './setup.json' with { type: 'json' };

export function createPi3ArcadeData() {
  const data = structuredClone(base);
  data.controller = 'pi3';

  // Remove legacy analog keypad and ADC components
  data.components = data.components.filter(c => c.id !== 'keypad' && c.id !== 'adc');

  // Add 6 Arcade Push Buttons assembly
  data.components.push({
    id: 'arcade_buttons',
    title: '6 × Arcade Push Buttons (33 mm)',
    position: [-420, 0, 190],
    size: [240, 240],
    color: '#e2e8f0'
  });

  // Terminal connection points for each arcade button
  data.points.BTN_TOP = [-420, 12, 100];
  data.points.BTN_BTM = [-420, 12, 280];
  data.points.BTN_L = [-500, 12, 190];
  data.points.BTN_R = [-340, 12, 190];
  data.points.BTN_SL = [-520, 12, 100];
  data.points.BTN_SR = [-520, 12, 280];
  data.points.BTN_GND = [-420, 12, 190];

  // Direct GPIO wires from Pi 3 to Arcade Buttons
  const buttonWires = [
    {
      id: 'B1', from: 'P29', to: 'BTN_TOP', color: '#2563eb',
      title: 'GPIO 5 (Pin 29) → Top Arcade Button (Blue)',
      group: 'Buttons',
      path: [data.points.P29, [data.points.P29[0], 52, data.points.P29[2]], [-280, 52, data.points.P29[2]], [-280, 52, 100], data.points.BTN_TOP]
    },
    {
      id: 'B2', from: 'P31', to: 'BTN_BTM', color: '#dc2626',
      title: 'GPIO 6 (Pin 31) → Bottom Arcade Button (Red)',
      group: 'Buttons',
      path: [data.points.P31, [data.points.P31[0], 54, data.points.P31[2]], [-270, 54, data.points.P31[2]], [-270, 54, 280], data.points.BTN_BTM]
    },
    {
      id: 'B3', from: 'P33', to: 'BTN_L', color: '#94a3b8',
      title: 'GPIO 13 (Pin 33) → Left Arcade Button (White)',
      group: 'Buttons',
      path: [data.points.P33, [data.points.P33[0], 56, data.points.P33[2]], [-260, 56, data.points.P33[2]], [-260, 56, 190], data.points.BTN_L]
    },
    {
      id: 'B4', from: 'P37', to: 'BTN_R', color: '#64748b',
      title: 'GPIO 26 (Pin 37) → Right Arcade Button (White)',
      group: 'Buttons',
      path: [data.points.P37, [data.points.P37[0], 58, data.points.P37[2]], [-250, 58, data.points.P37[2]], [-250, 58, 190], data.points.BTN_R]
    },
    {
      id: 'B5', from: 'P36', to: 'BTN_SL', color: '#16a34a',
      title: 'GPIO 16 (Pin 36) → Side Left Arcade Button (Green)',
      group: 'Buttons',
      path: [data.points.P36, [data.points.P36[0], 60, data.points.P36[2]], [120, 60, data.points.P36[2]], [120, 60, 340], [-520, 60, 340], data.points.BTN_SL]
    },
    {
      id: 'B6', from: 'P32', to: 'BTN_SR', color: '#1d4ed8',
      title: 'GPIO 12 (Pin 32) → Side Right Arcade Button (Blue)',
      group: 'Buttons',
      path: [data.points.P32, [data.points.P32[0], 63, data.points.P32[2]], [130, 63, data.points.P32[2]], [130, 63, 350], [-520, 63, 350], data.points.BTN_SR]
    },
    {
      id: 'B7', from: 'P30', to: 'BTN_GND', color: '#1e293b',
      title: 'GND (Pin 30) → Arcade Buttons Common Ground Bus',
      group: 'Buttons',
      path: [data.points.P30, [data.points.P30[0], 66, data.points.P30[2]], [140, 66, data.points.P30[2]], [140, 66, 360], [-420, 66, 360], data.points.BTN_GND]
    },
  ];

  // Keep only LCD, Audio, and Power wires + add Buttons wires
  data.wires = [
    ...data.wires.filter(w => !w.id.startsWith('A') && !w.id.startsWith('K')),
    ...buttonWires
  ];

  return data;
}
