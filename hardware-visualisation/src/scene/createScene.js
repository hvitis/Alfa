import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { createDividerScene } from './dividerScene.js';
import { createSetupScene } from './setupScene.js';

export function createScene(container) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f9fbfc');
  const camera=new THREE.PerspectiveCamera(42,1,0.2,12000);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}
  catch{renderer=new SVGRenderer();renderer.setQuality('high');renderer.setPrecision(2);}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  if(renderer.shadowMap){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
  renderer.setClearColor(new THREE.Color('#f9fbfc'));
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D hardware scene. WASD and Q/E move the camera.');
  container.append(renderer.domElement);
  const labels=new CSS2DRenderer();labels.domElement.style.position='absolute';labels.domElement.style.inset='0';labels.domElement.style.pointerEvents='none';container.append(labels.domElement);
  scene.add(new THREE.HemisphereLight('#ffffff','#c0cdd8',2.5));
  const light=new THREE.DirectionalLight('#ffffff',3.2);light.position.set(-450,850,450);light.castShadow=true;
  light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-850;light.shadow.camera.right=850;light.shadow.camera.top=650;light.shadow.camera.bottom=-650;light.shadow.camera.far=2500;light.shadow.bias=-0.0003;scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:'#f8fafb',roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-17;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(3000,100,'#dde6ed','#edf1f5');grid.position.y=-16.9;scene.add(grid);
  const divider=createDividerScene(),setup=createSetupScene(),pico=createSetupScene('pico');
  scene.add(divider.root,setup.root,pico.root);setup.root.visible=false;pico.root.visible=false;
  function resize(){const width=container.clientWidth,height=container.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);labels.setSize(width,height);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function render(){renderer.render(scene,camera);labels.render(scene,camera);}
  return {scene,camera,renderer,labels,divider,setup,pico,render,dispose:()=>{observer.disconnect();renderer.dispose?.();}};
}
