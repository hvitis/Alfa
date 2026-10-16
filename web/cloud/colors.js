const PARTS = [['front','Front shell'],['rear','Rear shell'],['battery_door','Battery door']];
const PALETTES = [
  ['Cloud blue',['#dae9ed','#b7d2da','#f3c96d']],
  ['Candy cloud',['#ffd6e6','#d7c6f5','#fff0b5']],
  ['Mint arcade',['#bcebd8','#a9cde7','#ffd2a8']],
  ['Lavender dream',['#d9ccf3','#b7c7ed','#f6c8dc']],
  ['Peach pop',['#ffd2b7','#efb6c3','#bcebd8']],
  ['Lemon fizz',['#fff0ad','#c9e9db','#cbbef0']],
];
// Opaque PETG swatches from Prusa's official HueForge color reference.
const FILAMENT_COLORS=[
  ['Black','#292b2b'],['White','#e5e0e1'],['Grey','#95908c'],['Dark grey','#3f4646'],
  ['Matte black','#303635'],['Orange','#eb5403'],['Red','#bb2e32'],['Yellow','#f2b706'],
  ['Gold','#9a8523'],['Forest green','#007248'],['Pistachio','#93a682'],['Chalky blue','#6f9aa9'],
  ['Ocean blue','#1a4c54'],['Sky blue','#346ce3'],['Violet','#1d1991'],['Terracotta','#b87f69'],
];
const STORAGE='alfa.cloud-colors.v1';
export function createCloudColorControls(container,onChange) {
  const colors=Object.fromEntries(PARTS.map(([id],i)=>[id,PALETTES[0][1][i]]));
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE));
    for(const [id] of PARTS) if(/^#[\da-f]{6}$/i.test(saved?.[id])) colors[id]=saved[id].toLowerCase();
  } catch { /* Preview controls also work when browser storage is unavailable. */ }
  container.innerHTML='<div class="color-heading"><p class="eyebrow">MAKE IT YOURS</p><h3>Pick your cloud colors.</h3><p>Choose filament to match your preview.</p></div><div class="color-controls"><details class="palette-picker"><summary><span class="palette-current"></span><span class="palette-name"></span><span aria-hidden="true">⌄</span></summary><div class="palette-options" aria-label="Preset color palettes"></div></details><div class="part-colors"></div></div>';
  const picker=container.querySelector('.palette-picker'),summary=picker.querySelector('summary');
  const fields=new Map();
  function swatches(values){
    const group=document.createElement('span');group.className='palette-swatches';group.setAttribute('aria-hidden','true');
    for(const value of values){const square=document.createElement('i');square.style.backgroundColor=value;group.append(square)}
    return group;
  }
  function update(){
    const values=PARTS.map(([id])=>colors[id]);
    const selected=PALETTES.find(([,palette])=>palette.every((color,i)=>color===values[i]));
    picker.querySelector('.palette-name').textContent=selected?.[0]||'Custom colors';
    picker.querySelector('.palette-current').replaceChildren(swatches(values));
    summary.setAttribute('aria-label',`Color palette: ${selected?.[0]||'Custom colors'}`);
    for(const [id] of PARTS){const {input,hex,preview,choice,summary,menu}=fields.get(id);input.value=colors[id];hex.textContent=colors[id].toUpperCase();preview.style.backgroundColor=colors[id];choice.textContent=FILAMENT_COLORS.find(([,value])=>value===colors[id])?.[0]||'Custom';summary.setAttribute('aria-label',`${PARTS.find(([key])=>key===id)[1]} color: ${choice.textContent}`);for(const button of menu.querySelectorAll('[data-color]'))button.setAttribute('aria-pressed',String(button.dataset.color===colors[id]))}
    for(const button of picker.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.palette===selected?.[0]));
    try{localStorage.setItem(STORAGE,JSON.stringify(colors))}catch{ /* Optional preference storage. */ }
    onChange({...colors});
  }
  for(const [name,values] of PALETTES){
    const button=document.createElement('button');button.type='button';button.dataset.palette=name;
    const text=document.createElement('span');text.textContent=name;button.append(swatches(values),text);
    button.addEventListener('click',()=>{PARTS.forEach(([id],i)=>colors[id]=values[i]);update();picker.open=false;summary.focus()});
    picker.querySelector('.palette-options').append(button);
  }
  for(const [id,title] of PARTS){
    const dropdown=document.createElement('details');dropdown.className='part-color-picker';dropdown.dataset.part=id;
    const summary=document.createElement('summary');summary.className='part-color-button';
    const preview=document.createElement('i');preview.className='part-swatch';preview.setAttribute('aria-hidden','true');
    const text=document.createElement('span'),name=document.createElement('strong'),choice=document.createElement('small'),hex=document.createElement('small');name.textContent=title;hex.className='color-hex';text.append(name,choice,hex);
    const arrow=document.createElement('span');arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');summary.append(preview,text,arrow);
    const menu=document.createElement('div');menu.className='filament-menu';
    const heading=document.createElement('strong');heading.className='filament-heading';heading.textContent='PETG colors';menu.append(heading);
    const grid=document.createElement('div');grid.className='filament-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label',`${title} PETG colors`);
    for(const [colorName,value] of FILAMENT_COLORS){
      const button=document.createElement('button');button.type='button';button.dataset.color=value;button.className='filament-color';button.setAttribute('aria-label',`${title}: ${colorName}`);
      const square=document.createElement('i');square.style.backgroundColor=value;square.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=colorName;button.append(square,label);
      button.addEventListener('click',()=>{colors[id]=value;update();dropdown.open=false;summary.focus()});grid.append(button);
    }
    menu.append(grid);
    const custom=document.createElement('label');custom.className='custom-filament-color';
    const input=document.createElement('input');input.type='color';input.id=`cloud-color-${id}`;input.setAttribute('aria-label',`${title} color`);custom.append(input,document.createTextNode('Custom color'));menu.append(custom);
    const note=document.createElement('p');note.className='filament-note';note.append(document.createTextNode('Screen colors are approximate. '));
    const source=document.createElement('a');source.href='https://help.prusa3d.com/article/hueforge-filament-transparency-values-and-hexcodes_762314';source.textContent='Color reference ↗';source.target='_blank';source.rel='noopener noreferrer';note.append(source);menu.append(note);
    dropdown.append(summary,menu);container.querySelector('.part-colors').append(dropdown);
    fields.set(id,{input,hex,preview,choice,summary,menu});input.addEventListener('input',()=>{colors[id]=input.value;update()});
    dropdown.addEventListener('toggle',()=>{if(dropdown.open){picker.open=false;for(const other of container.querySelectorAll('.part-color-picker'))if(other!==dropdown)other.open=false}});
    document.addEventListener('pointerdown',event=>{if(!dropdown.contains(event.target))dropdown.open=false});
    dropdown.addEventListener('keydown',event=>{if(event.key==='Escape'){dropdown.open=false;summary.focus()}});
  }
  document.addEventListener('pointerdown',event=>{if(!picker.contains(event.target))picker.open=false});
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.open=false;summary.focus()}});
  update();
  return {getColors:()=>({...colors})};
}
