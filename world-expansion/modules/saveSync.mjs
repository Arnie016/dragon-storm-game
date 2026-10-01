// Same-origin only. HttpOnly session cookie is owned by the server, never exported.
export class SaveSync {
  constructor({fetcher=(...args)=>globalThis.fetch(...args),onStatus=()=>{}}={}){this.fetcher=fetcher;this.onStatus=onStatus;this.revision=0;this.connected=false;this.pending=null;this.conflict=null;this.running=false;}
  async request(path,options={}){
    const r=await this.fetcher(`/api/${path}`,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(8000)});
    const body=await r.json();if(r.status===409){this.conflict=body;this.onStatus('conflict');throw Error('Server backup differs. Choose which save to keep.');}
    if(!r.ok)throw Error(body.error||'Server unavailable');return body;
  }
  async available(){try{const r=await this.request('health');return r.service==='galevein-save';}catch{return false;}}
  async connect(){const r=await this.request('session',{method:'POST',body:'{}'});this.revision=r.revision;this.connected=true;return r;}
  enqueue(save){this.pending=structuredClone(save);if(this.connected&&!this.running&&!this.conflict)void this.flush();}
  async flush(){
    if(!this.connected||this.running||this.conflict)return;
    this.running=true;
    try{while(this.pending){const save=this.pending;this.pending=null;this.onStatus('syncing');
      try{const r=await this.request('save',{method:'PUT',body:JSON.stringify({revision:this.revision,save})});this.revision=r.revision;this.onStatus('synced');}
      catch(e){this.pending=this.pending||save;this.onStatus(this.conflict?'conflict':'offline');break;}
    }}finally{this.running=false;}
  }
  resolveConflict(useLocal,localSave){const remote=this.conflict;if(!remote)throw Error('No conflict');this.revision=remote.revision;this.conflict=null;this.pending=null;if(useLocal)this.enqueue(localSave);return remote.save;}
}
