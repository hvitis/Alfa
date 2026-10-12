import * as THREE from 'three';

export function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.1, ...options });
}
export function box(group, position, size, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, options));
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
export function sphere(group, position, radius, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material(color, options));
  mesh.position.set(...position); mesh.castShadow = true; group.add(mesh); return mesh;
}
export function cylinderBetween(group, start, end, radius, color, options = {}) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 20), material(color, options));
  mesh.position.copy(a.add(b).multiplyScalar(0.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true; group.add(mesh); return mesh;
}
export function terminal(group, position, color = '#d9b96c') {
  const [x,y,z] = position;
  box(group, [x,y-4,z], [6,5,6], '#253747');
  cylinderBetween(group, [x,y-3,z], [x,y+2,z], 1.5, color, { metalness: 0.65, roughness: 0.25 });
}
export function board(group, position, size, color) {
  const [x,y,z] = position, [width,depth] = size;
  box(group, position, [width,5,depth], color);
  for(const dx of [-1,1]) for(const dz of [-1,1]) {
    cylinderBetween(group, [x+dx*(width/2-7),y+2,z+dz*(depth/2-7)], [x+dx*(width/2-7),y+3,z+dz*(depth/2-7)], 3, '#d9b96c', { metalness: 0.65 });
  }
}
