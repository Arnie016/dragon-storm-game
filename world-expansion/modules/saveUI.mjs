import {SaveStore, SaveConflict, SAVE_KEY, encodeSave} from './saveStore.mjs';
import {SaveSync} from './saveSync.mjs';
import {MAX_SAVE_BYTES,validateSave} from './saveSchema.mjs';

export function mountSaveUI({storage,capture,applyProfile,resume,isPlaying,pause,canSave,getMilestone=()=>''}){
  const store=new SaveStore(storage);
  const panel=document.createElement('details');panel.id='savePanel';
  panel.innerHTML=`<summary>JOURNEY & BACKUPS <span id="saveStatus" role="status"></span></summary>
    <div class="save-body"><p id="saveSummary"></p><p>Story flights autosave every 5 seconds. Continue restores the saved flight and its loadout.</p>
    <div class="save-actions"><button type="button" data-save="export">Export save</button><button type="button" data-save="import">Import & replace</button><button type="button" data-save="recover">Recover previous save</button><button type="button" data-save="connect" hidden>Enable server backup</button></div>
    <input type="file" accept="application/json,.json" hidden id="saveFile">
    <div id="saveConflict" hidden><p>A server backup already exists. Export your local save first if you want to keep both.</p><button type="button" data-save="remote">Use server save</button><button type="button" data-save="local">Replace server with local</button></div>
    <p id="saveNotice" role="status"></p></div>`;
  document.querySelector('#lobbyHub').append(panel);
  const style=document.createElement('style');style.textContent=`
    #lobbyHub:not(.on){visibility:hidden}#lobbyHub.on{visibility:visible}
    #savePanel{position:relative;max-width:610px;width:calc(100% - 40px);color:#c6c2b6;font:13px/1.5 Georgia,serif;text-align:left;pointer-events:auto}
    #savePanel summary{cursor:pointer;text-align:center;letter-spacing:.08em;padding:7px;color:#dfcdae}
    #saveStatus{display:block;letter-spacing:0;color:#93b9a9;font:12px/1.6 sans-serif}
    #savePanel .save-body{background:rgba(12,17,23,.96);border:1px solid #a88d5c55;border-radius:8px;padding:12px 18px;max-height:30vh;overflow:auto}
    #savePanel p{margin:5px 0 10px}#savePanel button{font:12px/1.3 sans-serif;border:1px solid #a88d5c66;background:#20252b;color:#ecdcc2;border-radius:5px;padding:8px 10px;cursor:pointer}
    #savePanel .save-actions{display:flex;flex-wrap:wrap;gap:7px}#savePanel button:disabled{opacity:.45;cursor:wait}
    #savePanel [hidden],#lobbyHub [hidden]{display:none!important}
    #lobbyHub .lobby-node:disabled{opacity:.45;cursor:wait}#lobbyHub button.lobby-node{text-align:left;color:inherit;font:inherit}
    #saveConflict{margin-top:12px;border-top:1px solid #a88d5c55;padding-top:8px}
    @media(max-height:650px){#lobbyHub{gap:8px!important}#savePanel .save-body{max-height:24vh}}
  `;document.head.append(style);
  const status=panel.querySelector('#saveStatus'),notice=panel.querySelector('#saveNotice'),conflict=panel.querySelector('#saveConflict');
  const sync=new SaveSync({onStatus:s=>{status.textContent=({syncing:'Backing up…',synced:'Saved on device + server',offline:'Saved on device · server unavailable',conflict:'Backup conflict · choose a save below'})[s];conflict.hidden=!sync.conflict;}});
  let blocked=false,loading=false,lastAt=0,lastSignature='',lastMilestone='';
  function refresh(){
    const c=store.data.checkpoint,p=store.data.profile;
    const button=document.getElementById('continueFlight');button.hidden=!c;button.disabled=loading||blocked;
    button.querySelector('i').textContent=c?`${c.rings.filter(Boolean).length}/12 beacons · ${Math.round(c.state.hp)} health`:'No saved flight';
    panel.querySelector('#saveSummary').textContent=`${p.storyCompleted?'Saga completed · ':''}${Math.floor(p.scales)} scales · ${Object.values(p.upgrades).reduce((a,b)=>a+b,0)} forge fittings${c?' · Saved '+new Date(c.savedAt).toLocaleString():''}`;
    const select=document.querySelector('[data-lobby-chapter-pick]');
    for(const option of select.options)option.disabled=Number(option.value)>p.highestChapter;
    if(Number(select.value)>p.highestChapter)select.value='0';
  }
  const messages={new:'Progress saves on this device',saved:'Saved on this device',recovered:'Recovered previous save',unavailable:'Storage unavailable · export before leaving',damaged:'Save needs recovery · import or recover below','newer-version':'Save belongs to a newer game version'};
  status.textContent=messages[store.status];
  applyProfile(store.data.profile);refresh();
  function report(e){notice.textContent=e.message;status.textContent='Progress could not be saved';if(e instanceof SaveConflict){blocked=true;pause();refresh();}}
  function persist(reason='auto'){
    if(blocked||loading||!canSave())return false;
    let next;
    try{
      next=capture(structuredClone(store.data),reason);if(!next)return false;
      const signature=JSON.stringify(next);
      if(signature===lastSignature)return true;
      store.save(next);lastSignature=signature;lastAt=performance.now();status.textContent='Saved on this device';refresh();sync.enqueue(store.data);return true;
    }catch(e){
      // Keep an exportable session copy if storage is denied/full. Never replace a competing tab's state.
      if(next&&!(e instanceof SaveConflict)&&!store.blocked){store.data=validateSave(next);refresh();}
      report(e);return false;
    }
  }
  async function action(type){
    notice.textContent='';
    try{
      if(type==='export'){
        persist('manual');
        const current=canSave()?capture(structuredClone(store.data),'export'):null;
        const raw=current?encodeSave(validateSave(current)):store.export();
        const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='galevein-journey.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }else if(type==='import')document.getElementById('saveFile').click();
      else if(type==='recover'){if(isPlaying())throw Error('Return to the hub before recovering a save.');store.recover();applyProfile(store.data.profile);lastSignature='';sync.enqueue(store.data);refresh();notice.textContent='Previous save restored.';}
      else if(type==='connect'){
        const remote=await sync.connect();
        if(remote.save){sync.conflict=remote;conflict.hidden=false;notice.textContent='Choose the local journey or the existing server backup.';}
        else sync.enqueue(store.data);
      }else if(type==='remote'){
        if(isPlaying())throw Error('Return to the hub before changing journeys.');
        const remote=sync.conflict;
        if(!remote?.save)throw Error('No server save is available');
        store.import(encodeSave(remote.save));sync.resolveConflict(false,store.data);
        applyProfile(store.data.profile);lastSignature='';refresh();conflict.hidden=true;notice.textContent='Server journey restored on this device.';
      }else if(type==='local'){sync.resolveConflict(true,store.data);conflict.hidden=true;}
    }catch(e){report(e);}
  }
  panel.addEventListener('click',e=>{e.stopPropagation();const button=e.target.closest('[data-save]');if(button)void action(button.dataset.save);});
  panel.querySelector('#saveFile').addEventListener('change',async e=>{
    try{if(isPlaying())throw Error('Return to the hub before importing.');const file=e.target.files[0];if(!file)return;if(file.size>MAX_SAVE_BYTES)throw Error('Save file is too large');store.import(await file.text());applyProfile(store.data.profile);lastSignature='';refresh();sync.enqueue(store.data);notice.textContent='Journey imported. Continue when ready.';}
    catch(e){report(e);}finally{e.target.value='';}
  });
  document.getElementById('continueFlight').addEventListener('click',async e=>{
    e.stopPropagation();if(loading||blocked||!store.data.checkpoint)return;loading=true;refresh();
    try{await resume(structuredClone(store.data.checkpoint));}catch(e){report(e);}finally{loading=false;refresh();}
  });
  void sync.available().then(ok=>{panel.querySelector('[data-save="connect"]').hidden=!ok;});
  panel.addEventListener('toggle',()=>{if(panel.open)void sync.available().then(ok=>{panel.querySelector('[data-save="connect"]').hidden=!ok;});});
  addEventListener('storage',e=>{if(e.key===SAVE_KEY&&e.newValue!==store.raw){blocked=true;pause();notice.textContent='Another tab updated this journey. Reload this tab to use its progress.';status.textContent='Other tab has newer progress';refresh();}});
  addEventListener('pagehide',()=>persist('leave'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persist('leave');});
  addEventListener('online',()=>void sync.flush());
  return {store,sync,persist,refresh,tick(){const milestone=getMilestone();if(isPlaying()&&(milestone!==lastMilestone||performance.now()-lastAt>=5000)){lastMilestone=milestone;lastAt=performance.now();persist();}},canStartNew(){return !blocked&&(!store.data.checkpoint||confirm('Start a new story? Your current flight checkpoint will be replaced. Forge progress is kept.'));}};
}
