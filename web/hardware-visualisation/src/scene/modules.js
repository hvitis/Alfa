import * as THREE from 'three';

export function registerModule(modules,pickables,id,object){
  object.userData.moduleId=id;modules[id]=object;
  object.traverse(child=>{if(child.isMesh){child.userData.moduleId=id;pickables.push(child);}});
}
export function isVisible(object){
  for(let parent=object;parent;parent=parent.parent)if(!parent.visible)return false;
  return true;
}
export function highlightModule(root,object,color='#efad22'){
  const helper=new THREE.BoxHelper(object,color);helper.material.depthTest=false;helper.material.transparent=true;helper.material.opacity=0.9;helper.renderOrder=10;root.add(helper);
  return {object:helper,dispose(){root.remove(helper);helper.geometry.dispose();helper.material.dispose();}};
}
