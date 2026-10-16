export function installLiveReload({getState,restoreState}) {
  const key='alfa-hardware-view-v1',versionKey='alfa-hardware-revision-v1';
  try{
    const state=sessionStorage.getItem(key);if(state){restoreState(JSON.parse(state));sessionStorage.removeItem(key);}
  }catch{ /* A fresh camera is valid if the saved state is unavailable. */ }
  if(!window.ALFA_LIVE_RELOAD)return;
  const status=document.getElementById('live-status');status.hidden=false;status.textContent='Connecting live preview…';
  const events=new EventSource('/api/events');
  function refresh(revision){
    try{sessionStorage.setItem(key,JSON.stringify(getState()));sessionStorage.setItem(versionKey,revision);}catch{}
    status.textContent='Updating preview…';events.close();window.location.reload();
  }
  events.addEventListener('ready',event=>{
    const revision=JSON.parse(event.data).revision;let previous=null;
    try{previous=sessionStorage.getItem(versionKey);sessionStorage.setItem(versionKey,revision);}catch{}
    if(previous&&previous!==revision){refresh(revision);return;}
    status.textContent='Live · updates automatically';status.classList.add('connected');
  });
  events.addEventListener('change',event=>refresh(JSON.parse(event.data).revision));
  events.onerror=()=>{status.textContent='Reconnecting live preview…';status.classList.remove('connected');};
  window.addEventListener('beforeunload',()=>events.close());
}
