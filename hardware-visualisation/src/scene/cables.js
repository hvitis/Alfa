import * as THREE from 'three';
import { addLabel } from './labels.js';

export function makeCable(parent, { id, path, color, label, labelPosition, radius = 1.4 }) {
  const group = new THREE.Group(); group.name = id; parent.add(group);
  const vertices = path.map(p => new THREE.Vector3(...p));
  // Straight lane sections preserve the intended routing and exact endpoints.
  const curve = new THREE.CurvePath();
  for(let i=1;i<vertices.length;i++) if(vertices[i].distanceTo(vertices[i-1])>0.001) curve.add(new THREE.LineCurve3(vertices[i-1],vertices[i]));
  const geometry = new THREE.TubeGeometry(curve, Math.max(32, path.length*12), radius, 8, false);
  if(['#f4f4f0','#a2a6a8'].includes(color)){
    const outline=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(32,path.length*12),radius+0.6,8,false),new THREE.MeshBasicMaterial({color:'#59646b',side:THREE.BackSide}));
    group.add(outline);
  }
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  mesh.userData.cableId=id; mesh.castShadow=true; group.add(mesh);
  if(label){const tag=addLabel(group,label,labelPosition || vertices[Math.floor(vertices.length/2)].toArray(),'net',color);tag.userData.wireTag=true;}
  return { id, group, mesh, path, color };
}
