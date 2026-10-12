import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function addLabel(group, text, position, className = '', netColor) {
  const element = document.createElement('div'); element.className = 'annotation ' + className; element.textContent = text;
  if(netColor) element.style.setProperty('--net-color', ['#f4f4f0','#ffffff','#a2a6a8'].includes(netColor.toLowerCase())?'#59646b':netColor);
  const object = new CSS2DObject(element); object.position.set(...position); group.add(object); return object;
}
