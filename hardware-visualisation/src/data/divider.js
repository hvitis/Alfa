export const COLORS = { signal: '#c39714', join: '#8754ce', ground: '#26394b', power: '#d44842', v33: '#d88831' };
export const DIVIDER = {
  points: {
    OUT: [-148, 14, 0], R1_A: [-104, 14, 0], JOIN: [0, 14, 0],
    R2_B: [0, 14, 110], A0: [150, 14, 0], ADC_GND: [150, 14, 110],
    KEY_GND: [-148, 14, 36], PI_GND: [76, 14, 162],
    KEY_VCC: [-148, 14, -36], ADC_VDD: [150, 14, -36],
  },
  resistors: [
    { id: 'R1', ohms: 10000, a: 'R1_A', b: 'JOIN', netA: 'out', netB: 'join' },
    { id: 'R2', ohms: 10000, a: 'JOIN', b: 'R2_B', netA: 'join', netB: 'ground' },
  ],
  netMembers: {
    out: ['OUT', 'R1_A'],
    join: ['R1_B', 'R2_A', 'A0'],
    ground: ['R2_B', 'ADC_GND', 'KEY_GND', 'PI_GND'],
  },
};
export const STEPS = [
  { id: 'out', title: 'Keypad OUT → R1 leg A', detail: 'Connect keypad OUT to either leg of R1 (10 kΩ). That end is leg A in this drawing.', parts: ['out', 'R1'], focus: [-93, 14, 0] },
  { id: 'r1-join', title: 'R1 leg B → shared join', detail: 'R1’s other leg joins R2 leg A and the ADC A0 wire. All three must make electrical contact.', parts: ['R1', 'join', 'a0'], focus: [-12, 14, 0] },
  { id: 'r2-join', title: 'R2 leg A → the same shared join', detail: 'One leg of R2 connects to exactly the same join as R1 leg B and ADC A0.', parts: ['R2', 'join', 'a0'], focus: [0, 14, 28] },
  { id: 'a0', title: 'Shared join → ADC A0', detail: 'Run one wire from the shared join to ADC A0. Do not connect ADC A0 directly to keypad OUT.', parts: ['join', 'a0'], focus: [65, 14, 0] },
  { id: 'ground', title: 'R2 leg B → ADC GND', detail: 'R2’s other leg connects to GND. ADC GND, keypad GND, and Pi GND share the same ground connection.', parts: ['R2', 'ground', 'ground-links'], focus: [56, 14, 110] },
];
