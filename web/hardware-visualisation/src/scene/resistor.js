import * as THREE from 'three';
import { cylinderBetween } from './primitives.js';

export function makeResistor(parent, id, start, end) {
  const group = new THREE.Group(); group.name = id; parent.add(group);
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const point = t => a.clone().lerp(b,t).toArray();
  cylinderBetween(group,start,point(0.28),1.25,'#b4bdc3',{metalness:0.8,roughness:0.25});
  cylinderBetween(group,point(0.72),end,1.25,'#b4bdc3',{metalness:0.8,roughness:0.25});
  cylinderBetween(group,point(0.28),point(0.72),6.5,'#dfc89d',{roughness:0.9});
  // Brown, black, orange, gold = 10 kΩ ±5% (four-band example).
  for(const [t,color] of [[0.34,'#743c27'],[0.42,'#1b2024'],[0.50,'#e37b25'],[0.64,'#bf9740']]) {
    cylinderBetween(group,point(t-0.014),point(t+0.014),6.65,color);
  }
  group.userData.resistor={id,ohms:10000,start,end};
  return group;
}
