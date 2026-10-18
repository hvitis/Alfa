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
    size: [280, 240],
    color: '#334155'
  });

  // Terminal connection points for each arcade button
  data.points.BTN_TOP = [-420, 12, 100];
  data.points.BTN_BTM = [-420, 12, 280];
  data.points.BTN_L = [-490, 12, 190];
  data.points.BTN_R = [-350, 12, 190];
  data.points.BTN_SL = [-540, 12, 140];
  data.points.BTN_SR = [-300, 12, 140];
  data.points.BTN_GND = [-420, 12, 190];

  // Direct GPIO wires from Pi 3 to Arcade Buttons
  const buttonWires = [
    {
      id: 'B1', from: 'P29', to: 'BTN_TOP', color: '#2563eb',
      title: 'GPIO 5 (Pin 29) → Top Arcade Button (Blue)',
      group: 'Buttons',
      path: [data.points.P29, [data.points.P29[0], 54, data.points.P29[2]], [-200, 54, data.points.P29[2]], [-200, 54, 100], data.points.BTN_TOP]
    },
    {
      id: 'B2', from: 'P31', to: 'BTN_BTM', color: '#dc2626',
      title: 'GPIO 6 (Pin 31) → Bottom Arcade Button (Red)',
      group: 'Buttons',
      path: [data.points.P31, [data.points.P31[0], 56, data.points.P31[2]], [-190, 56, data.points.P31[2]], [-190, 56, 280], data.points.BTN_BTM]
    },
    {
      id: 'B3', from: 'P33', to: 'BTN_L', color: '#f8fafc',
      title: 'GPIO 13 (Pin 33) → Left Arcade Button (White)',
      group: 'Buttons',
      path: [data.points.P33, [data.points.P33[0], 58, data.points.P33[2]], [-180, 58, data.points.P33[2]], [-180, 58, 190], data.points.BTN_L]
    },
    {
      id: 'B4', from: 'P37', to: 'BTN_R', color: '#f8fafc',
      title: 'GPIO 26 (Pin 37) → Right Arcade Button (White)',
      group: 'Buttons',
      path: [data.points.P37, [data.points.P37[0], 60, data.points.P37[2]], [-170, 60, data.points.P37[2]], [-170, 60, 190], data.points.BTN_R]
    },
    {
      id: 'B5', from: 'P36', to: 'BTN_SL', color: '#16a34a',
      title: 'GPIO 16 (Pin 36) → Side Left Arcade Button (Green)',
      group: 'Buttons',
      path: [data.points.P36, [data.points.P36[0], 62, data.points.P36[2]], [145, 62, data.points.P36[2]], [145, 62, 40], [-160, 62, 40], [-160, 62, 140], data.points.BTN_SL]
    },
    {
      id: 'B6', from: 'P32', to: 'BTN_SR', color: '#1d4ed8',
      title: 'GPIO 12 (Pin 32) → Side Right Arcade Button (Blue)',
      group: 'Buttons',
      path: [data.points.P32, [data.points.P32[0], 64, data.points.P32[2]], [150, 64, data.points.P32[2]], [150, 64, 48], [-150, 64, 48], [-150, 64, 140], data.points.BTN_SR]
    },
    {
      id: 'B7', from: 'P30', to: 'BTN_GND', color: '#1e293b',
      title: 'GND (Pin 30) → Arcade Buttons Common Ground Bus',
      group: 'Buttons',
      path: [data.points.P30, [data.points.P30[0], 66, data.points.P30[2]], [155, 66, data.points.P30[2]], [155, 66, 56], [-140, 66, 56], [-140, 66, 190], data.points.BTN_GND]
    },
  ];

  // Keep only LCD, Audio, and Power wires + add Buttons wires
  data.wires = [
    ...data.wires.filter(w => !w.id.startsWith('A') && !w.id.startsWith('K')),
    ...buttonWires
  ];

  return data;
}
