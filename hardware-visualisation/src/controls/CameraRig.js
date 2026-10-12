import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lookAround, moveCamera } from './cameraMath.js';

export class CameraRig {
  constructor(camera,canvas) {
    this.camera=camera;this.canvas=canvas;this.mode='inspect';this.speed=140;this.view='divider';this.keys=new Set();this.moving=new Set();
    this.orbit=new OrbitControls(camera,canvas);this.orbit.enableDamping=true;this.orbit.dampingFactor=0.1;
    this.orbit.enablePan=true;this.orbit.screenSpacePanning=true;this.orbit.minDistance=12;this.orbit.maxDistance=9000;
    this.orbit.maxPolarAngle=Math.PI*0.96;this.orbit.zoomToCursor=true;
    this.orbit.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
    this.orbit.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
    this.drag=null;
    canvas.addEventListener('pointerdown',e=>{
      canvas.focus({preventScroll:true});
      if(this.mode==='free'){this.drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey};canvas.setPointerCapture(e.pointerId);}
    });
    canvas.addEventListener('pointermove',e=>{
      if(!this.drag||this.mode!=='free')return;
      const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.x=e.clientX;this.drag.y=e.clientY;
      if(this.drag.pan){
        moveCamera(camera,null,'right',-dx*this.speed*0.004);
        const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(up,dy*this.speed*0.004);
      }else lookAround(camera,dx,dy);
      this.syncTarget();
    });
    const release=()=>{this.drag=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{
      if(this.mode!=='free')return;e.preventDefault();
      moveCamera(camera,null,e.deltaY<0?'forward':'backward',Math.min(Math.abs(e.deltaY),150)*this.speed*0.0015);this.syncTarget();
    },{passive:false});
    this.keyDown=e=>{
      if(document.activeElement!==canvas)return;
      if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}
    };
    this.keyUp=e=>this.keys.delete(e.code);
    window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);
    window.addEventListener('blur',()=>{this.keys.clear();this.moving.clear();this.drag=null;});
    canvas.addEventListener('blur',()=>this.keys.clear());
    this.focus('divider');
  }
  syncTarget(){
    const forward=this.camera.getWorldDirection(new THREE.Vector3());this.orbit.target.copy(this.camera.position).addScaledVector(forward,200);
  }
  setMode(mode) {
    if(mode===this.mode)return;
    if(mode==='inspect')this.syncTarget();
    this.mode=mode;this.orbit.enabled=mode==='inspect';this.drag=null;
    this.keys.clear();this.orbit.update();
  }
  focus(view='divider') {
    this.view=view;this.speed=view!=='divider'?440:140;
    if(view!=='divider'){this.camera.position.set(0,800,1010);this.orbit.target.set(0,12,45);}
    else {this.camera.position.set(175,390,540);this.orbit.target.set(35,22,25);}
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  focusModule(object){
    const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
    const distance=Math.max(size.x,size.y,size.z,65)*1.65;
    this.orbit.target.copy(center);this.camera.position.copy(center).add(new THREE.Vector3(distance*0.35,distance*0.9,distance));
    this.camera.lookAt(center);this.camera.updateMatrixWorld();this.orbit.update();
  }
  inspectAmplifier(amplifier,mode){
    const center=amplifier.hardware.getWorldPosition(new THREE.Vector3());
    if(mode==='underside'){
      this.orbit.target.copy(center).add(new THREE.Vector3(0,-2,15));
      this.camera.position.set(center.x-50,8,center.z-235);
    }else {
      this.orbit.target.copy(center).add(new THREE.Vector3(0,mode==='before'?32:15,0));
      this.camera.position.copy(center).add(new THREE.Vector3(55,mode==='before'?210:190,255));
    }
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  inspectKeypad(keypad){
    const center=keypad.hardware.getWorldPosition(new THREE.Vector3());
    this.orbit.target.copy(center).add(new THREE.Vector3(25,10,0));
    this.camera.position.copy(center).add(new THREE.Vector3(155,305,325));
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  inspectAdc(adc){
    const center=adc.hardware.getWorldPosition(new THREE.Vector3());
    this.orbit.target.copy(center).add(new THREE.Vector3(0,-12,0));
    this.camera.position.copy(center).add(new THREE.Vector3(190,240,265));
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  focusJoin(){
    const target=this.view!=='divider'?[-240,14,245]:[0,14,0];
    this.orbit.target.set(...target);this.camera.position.copy(this.orbit.target).add(new THREE.Vector3(100,165,220));this.camera.lookAt(this.orbit.target);
    this.camera.updateMatrixWorld();this.orbit.update();
  }
  focusGroup(group){
    const views={LCD:[[-210,470,380],[-210,30,-120]],Audio:[[210,420,370],[210,28,-95]],ADC:[[145,540,650],[145,20,135]],Keypad:[[-100,600,940],[-100,20,240]]};
    if(!views[group]){this.focus(this.view);return;}
    const [position,target]=views[group];this.camera.position.set(...position);this.orbit.target.set(...target);
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  top(){
    const target=this.view!=='divider'?[0,10,55]:[0,10,35];
    this.orbit.target.set(...target);this.camera.position.set(target[0],this.view!=='divider'?1750:650,target[2]+0.1);
    this.camera.lookAt(this.orbit.target);this.camera.updateMatrixWorld();this.orbit.update();
  }
  update(delta) {
    const direction={KeyW:'forward',KeyS:'backward',KeyA:'left',KeyD:'right',KeyQ:'down',KeyE:'up'};
    const distance=this.speed*Math.min(delta,0.05)*(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?2.5:1);
    const moves=new Set(this.moving);for(const key of this.keys)if(direction[key])moves.add(direction[key]);
    for(const move of moves)moveCamera(this.camera,this.mode==='inspect'?this.orbit.target:null,move,distance);
    if(this.mode==='free'&&moves.size)this.syncTarget();
    if(this.mode==='inspect')this.orbit.update();
  }
}
