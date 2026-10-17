import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import specification from '../../design/pi3-shield/generated/design.json' with {type: 'json'};
import modelURL from '../../design/pi3-shield/generated/shield.glb?url';
import {getLocale} from '../i18n.js';

// The shield geometry is KiCad's export of the routed PCB. The Pi and socket
// are dimension envelopes, kept separate from the actual exported shield.
export function createPcbScene() {
  const root = new THREE.Group(), shield = new THREE.Group(), pi = new THREE.Group();
  root.add(shield, pi);
  root.name = 'Raspi 3 PCB';
  const pickables = [], data = {components: []}, labelGroup = new THREE.Group();
  shield.add(labelGroup);
  const pl = getLocale() !== 'en';
  let mode = 'assembled', showLabels = true;
  function box(parent, id, title, size, position, color, metalness = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({color, roughness: .58, metalness}));
    mesh.position.set(...position); parent.add(mesh);
    mesh.userData.moduleId = id; mesh.userData.title = title; pickables.push(mesh);
    return mesh;
  }
  function part(id, title) {data.components.push({id, title});}
  part('pcb', pl ? 'Shield 65 × 56 mm · rzeczywisty eksport KiCad' : '65 × 56 mm shield · actual KiCad export');
  part('pi', pl ? 'Raspberry Pi 3 · uproszczony obrys mechaniczny' : 'Raspberry Pi 3 · simplified mechanical envelope');
  for (const c of specification.components) part(c.ref, `${c.ref} · ${c.value}`);
  box(pi, 'pi', 'Raspberry Pi 3', [85,1.6,56], [10,-11.8,0], '#277a49');
  box(pi, 'pi', 'GPIO', [50.8,2.54,5.08], [-1.37,-9.73,-24.5], '#222a32');
  box(pi, 'pi', 'CPU', [14,1.6,14], [-4,-10.2,0], '#353d47');
  for (const z of [-18,0]) box(pi, 'pi', 'USB', [17,16,15], [43,-3,z], '#b9c2ce', .65);
  box(pi, 'pi', 'Ethernet', [21,13.5,16], [42,-4.25,19], '#b9c2ce', .65);
  box(shield, 'J1', 'J1 · underside female GPIO socket · envelope', [51.3,8.5,5.6], [-1.37,-4.25,-24.5], '#202832');
  for(let n=0;n<40;n++) {
    const x=7+Math.floor(n/2)*2.54-32.5, z=(n%2?2.23:4.77)-28;
    box(pi,'pi','GPIO',[.64,6,.64],[x,-5.5,z],'#c9ac5d',.7);
  }
  for(const [x,z] of [[3.5,3.5],[61.5,3.5],[3.5,52.5],[61.5,52.5]]) {
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,11,12),new THREE.MeshStandardMaterial({color:'#ddd9cc',roughness:.7}));
    mount.position.set(x-32.5,-5.5,z-28);pi.add(mount);
  }
  for(const [id,title,x,y] of [['U1','ADS1115',27,29],['U2','MAX98357A',47,29],['J2',pl?'LCD · 8 pinów':'LCD · 8 pins',17,46],['J4',pl?'Przyciski · 3 piny':'Keypad · 3 pins',36,46],['J3',pl?'Głośnik · 2 piny':'Speaker · 2 pins',52,46]]) {
    const element=document.createElement('span');element.className='annotation pcb-annotation';
    element.textContent=`${id} · ${title}`;
    const label=new CSS2DObject(element);label.position.set(x-32.5,8,y-28);labelGroup.add(label);
  }
  function apply() {
    pi.visible = mode !== 'board'; shield.position.y = mode === 'exploded' ? 26 : 0;
    labelGroup.visible = showLabels;
  }
  const readyPromise=(async()=>{
    const gltf=await new GLTFLoader().loadAsync(modelURL), model=gltf.scene;
    model.scale.setScalar(1000);model.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(model), size=bounds.getSize(new THREE.Vector3());
    if(size.z < size.y && size.z < 20) model.rotation.x=-Math.PI/2;
    model.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(model);
    const center=bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x,-bounds.min.y,-center.z);
    shield.add(model);
    model.traverse(object=>{
      if(!object.isMesh)return;
      let node=object, ref;
      while(node && node!==model) {
        ref=specification.components.find(c=>new RegExp(`(?:^|[^A-Za-z0-9])${c.ref}(?:$|[^A-Za-z0-9])`).test(node.name))?.ref;
        if(ref)break;node=node.parent;
      }
      object.userData.moduleId=ref || 'pcb';pickables.push(object);
    });
    apply();
  })();
  return {
    root, data, pickables, readyPromise,
    getMode:()=>mode,
    async setMode(value){if(['assembled','board','exploded'].includes(value))mode=value;apply();},
    setLabels(value){showLabels=value;apply();},
    selectModule(){},
    getHoverInfo(hit){const id=hit.object.userData.moduleId;return {id,title:data.components.find(c=>c.id===id)?.title || id,kind:pl?'Element':'Component'};},
    getCameraPreset:()=>({position:new THREE.Vector3(95,125,155),target:new THREE.Vector3(5,0,0)}),
  };
}
