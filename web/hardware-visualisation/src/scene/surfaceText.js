import * as THREE from 'three';

// Text belongs to the PCB surface and remains legible when the camera rotates.
export function surfaceText(parent,text,position,width,depth,color='#eff7ed',size=25){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const context=canvas.getContext('2d');context.clearRect(0,0,1024,256);context.fillStyle=color;context.font=`600 ${size*4}px sans-serif`;context.textAlign='center';context.textBaseline='middle';context.fillText(text,512,128,980);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(...position);parent.add(mesh);return mesh;
}
