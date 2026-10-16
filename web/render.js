// Render the same verified CAD assembly and default palette as the live preview.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCloudScene } from './cloud/scene.js';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.LinearToneMapping;
renderer.toneMappingExposure=.72;
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
const environment=pmrem.fromScene(room,.04);
scene.environment=environment.texture;scene.environmentIntensity=.65;
room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight('#fffdf8','#b8a4d7',.8));
const softbox=new THREE.DirectionalLight('#fffdf8',1.6);softbox.position.set(-100,250,-350);scene.add(softbox);
const rim=new THREE.DirectionalLight('#cce6ff',1);rim.position.set(180,170,250);scene.add(rim);
const cloud=createCloudScene();scene.add(cloud.root);
document.body.append(renderer.domElement);
window.renderCloud=async({view='assembled',width=1400,height=1200}={})=>{
  await cloud.readyPromise;
  cloud.root.traverse(node=>{if(node.isDirectionalLight)node.intensity=.8});
  await cloud.setMode(view==='rear'?'battery_open':view==='side'?'assembled':view);
  if(view==='exploded'){
    cloud.root.getObjectByName('front').position.x+=85;
    cloud.root.getObjectByName('rear').position.x-=25;
    cloud.root.getObjectByName('battery_door').position.x-=165;
    cloud.root.getObjectByName('battery_door').position.y+=25;
  }
  renderer.setSize(width,height);
  const camera=new THREE.PerspectiveCamera(30,width/height,1,3000);
  const target=new THREE.Vector3(0,94,43);
  const direction=(view==='rear'?new THREE.Vector3(-.6,.3,1):view==='side'?new THREE.Vector3(1,.22,-.68):view==='exploded'?new THREE.Vector3(.5,.25,-1):new THREE.Vector3(.44,.28,-1)).normalize();
  const bounds=new THREE.Box3().setFromObject(cloud.root);
  // Fit all separated parts, with consistent clear space for editorial crops.
  if(view==='exploded')bounds.getCenter(target);
  const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
  const fov=Math.min(camera.fov*Math.PI/180,2*Math.atan(Math.tan(camera.fov*Math.PI/360)*width/height));
  camera.position.copy(target).addScaledVector(direction,radius/Math.sin(fov/2)*1.02);
  camera.lookAt(target);camera.updateProjectionMatrix();
  // Fit the visible tessellated CAD surfaces. Hidden allowance boxes must
  // not shrink the render, particularly in the exploded composition.
  const right=new THREE.Vector3(),up=new THREE.Vector3(),vertex=new THREE.Vector3();
  for(let pass=0;pass<2;pass++){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    cloud.root.traverse(mesh=>{
      if(!mesh.isMesh)return;
      for(let parent=mesh;parent;parent=parent.parent)if(!parent.visible)return;
      const positions=mesh.geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        vertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(camera);
        minX=Math.min(minX,vertex.x);maxX=Math.max(maxX,vertex.x);
        minY=Math.min(minY,vertex.y);maxY=Math.max(maxY,vertex.y);
      }
    });
    const distance=camera.position.distanceTo(target),halfHeight=distance*Math.tan(camera.fov*Math.PI/360);
    right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
    target.addScaledVector(right,(minX+maxX)/2*halfHeight*camera.aspect).addScaledVector(up,(minY+maxY)/2*halfHeight);
    const fit=Math.max((maxX-minX)/1.72,(maxY-minY)/1.72);
    camera.position.copy(target).addScaledVector(direction,distance*fit);camera.lookAt(target);
  }
  renderer.render(scene,camera);
  return {colors:cloud.getColors(),revision:cloud.data.revision,checks:cloud.data.checks_count};
};
window.renderReady=cloud.readyPromise.then(()=>true);
