import * as THREE from 'three';

// Translate the camera, not the model. Forward follows the current view direction.
export function movementVector(camera, direction, distance) {
  const vector=new THREE.Vector3();
  if(direction==='forward'||direction==='backward'){
    camera.getWorldDirection(vector);
    return vector.multiplyScalar(direction==='forward'?distance:-distance);
  }
  if(direction==='left'||direction==='right'){
    vector.set(1,0,0).applyQuaternion(camera.quaternion);
    return vector.multiplyScalar(direction==='right'?distance:-distance);
  }
  return vector.set(0,direction==='up'?distance:-distance,0);
}
export function moveCamera(camera,target,direction,distance){
  const translation=movementVector(camera,direction,distance);
  camera.position.add(translation);
  if(target)target.add(translation);
  camera.updateMatrixWorld();
  return translation;
}
export function lookAround(camera,dx,dy){
  const rotation=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');
  rotation.y-=dx*0.003;rotation.x=Math.max(-1.53,Math.min(1.53,rotation.x-dy*0.003));
  camera.quaternion.setFromEuler(rotation);camera.updateMatrixWorld();
}
