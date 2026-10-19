// Render the same verified CAD assembly and default palette as the live preview.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCloudScene } from './cloud/scene.js';
import { createSetupScene } from './hardware-visualisation/src/scene/setupScene.js';

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
const setup=createSetupScene('pi3');setup.root.visible=false;scene.add(setup.root);
const shellMaterials=new Map();

document.body.append(renderer.domElement);
window.renderCloud=async({view='assembled',width=1400,height=1200}={})=>{
  await cloud.readyPromise;
  for(const name of ['front','rear']) cloud.root.getObjectByName(name).traverse(mesh=>{
    if(!mesh.isMesh)return;
    if(!shellMaterials.has(mesh))shellMaterials.set(mesh,mesh.material);
    if(mesh.material!==shellMaterials.get(mesh)){
      mesh.material.dispose();mesh.material=shellMaterials.get(mesh);
    }
  });
  cloud.root.traverse(node=>{if(node.isDirectionalLight)node.intensity=.8});
  cloud.root.visible = false; setup.root.visible = false;

  if (view === 'case_inside') view = 'inside_back';
  if (view === 'case_roentgen') view = 'roentgen';
  cloud.setPartColors(cloud.getColors());
  let activeRoot = cloud.root;
  let direction = new THREE.Vector3(.44,.28,-1).normalize();

  if (view === 'connections' || view === 'hardware') {
    activeRoot = setup.root;
    setup.root.visible = true;
    direction = new THREE.Vector3(.06, .78, .92).normalize();
  } else {
    activeRoot = cloud.root;
    cloud.root.visible = true;
    await cloud.setMode(view==='rear'?'assembled':view==='side'||view==='inside_back'||view==='roentgen'?'assembled':view);

    if (view === 'inside_back') {
      const front = cloud.root.getObjectByName('front');
      const rear = cloud.root.getObjectByName('rear');
      if (front) front.visible = false;
      if (rear) rear.visible = true;
      direction = new THREE.Vector3(.55, .40, -1).normalize();
    } else if (view === 'roentgen') {
      for (const name of ['front', 'rear']) {
        const node = cloud.root.getObjectByName(name);
        if (node) {
          node.visible = true;
          node.traverse(child => {
            if (!child.isMesh) return;
            child.material = new THREE.MeshPhysicalMaterial({
              color: '#6aa8d9',
              transparent: true,
              opacity: 0.24,
              roughness: 0.16,
              metalness: 0.05,
              transmission: 0.8,
              ior: 1.25,
              depthWrite: false,
            });
          });
        }
      }
      direction = new THREE.Vector3(.44, .28, -1).normalize();
    } else {
      // Restore normal shell colors & visibility
      cloud.setPartColors(cloud.getColors());
      if(view==='exploded'){
        cloud.root.getObjectByName('front').position.x+=170;
        cloud.root.getObjectByName('rear').position.x-=140;
      }
      direction = (view==='rear'?new THREE.Vector3(-.6,.3,1):view==='side'?new THREE.Vector3(1,.22,-.68):view==='exploded'?new THREE.Vector3(.5,.25,-1):new THREE.Vector3(.44,.28,-1)).normalize();
    }
  }

  renderer.setSize(width,height);
  const camera=new THREE.PerspectiveCamera(30,width/height,1,5000);
  const target=new THREE.Vector3(0,94,43);
  const bounds=new THREE.Box3().setFromObject(activeRoot);
  bounds.getCenter(target);
  const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
  const fov=Math.min(camera.fov*Math.PI/180,2*Math.atan(Math.tan(camera.fov*Math.PI/360)*width/height));
  camera.position.copy(target).addScaledVector(direction,radius/Math.sin(fov/2)*1.02);
  camera.lookAt(target);camera.updateProjectionMatrix();

  const right=new THREE.Vector3(),up=new THREE.Vector3(),vertex=new THREE.Vector3();
  for(let pass=0;pass<2;pass++){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    activeRoot.traverse(mesh=>{
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
  return {colors:cloud.getColors(),revision:cloud.data.revision,checks:cloud.data.checks_count,scene:activeRoot.name,view,
    visibleParts:cloud.data.print_parts.filter(name=>cloud.root.visible&&cloud.root.getObjectByName(name).visible),
    hardware:activeRoot===cloud.root?cloud.data.components.map(item=>item.id):setup.data.components.map(item=>item.id)};
};
window.renderReady=cloud.readyPromise.then(()=>true);

