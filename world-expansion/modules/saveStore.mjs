import {emptySave, validateSave, MAX_SAVE_BYTES} from './saveSchema.mjs';
export const SAVE_KEY='galevein_save_v1', BACKUP_KEY=SAVE_KEY+'_backup';
export class SaveConflict extends Error {}
// Detect accidental corruption; this is not an authenticity or anti-cheat signature.
export function checksum(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16);}
export function encodeSave(data,revision=1){const payload=JSON.stringify(validateSave(data));return JSON.stringify({format:'galevein-save',revision,payload,checksum:checksum(payload)});}
export function decodeSave(raw){
  if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_SAVE_BYTES)throw Error('Save file is too large');
  const e=JSON.parse(raw);
  if(e.format!=='galevein-save'||typeof e.payload!=='string'||e.checksum!==checksum(e.payload)||!Number.isSafeInteger(e.revision)||e.revision<1)throw Error('Save file is damaged');
  return {data:validateSave(JSON.parse(e.payload)),revision:e.revision};
}
export class SaveStore {
  constructor(storage){this.storage=storage;this.raw=null;this.data=emptySave();this.status='new';this.error=null;this.blocked=false;this.load();}
  load(){
    try{
      this.raw=this.storage.getItem(SAVE_KEY);
      if(this.raw){
        try{const x=decodeSave(this.raw);this.data=x.data;this.status='saved';return;}
        catch(e){
          // A newer game may own this profile. Never replace it with an older backup.
          try{if(JSON.parse(JSON.parse(this.raw).payload).version>1){this.blocked=true;this.status='newer-version';this.error=e;return;}}catch{}
        }
      }
      const backup=this.storage.getItem(BACKUP_KEY);
      if(backup){this.data=decodeSave(backup).data;this.status='recovered';return;}
      if(this.raw){this.blocked=true;this.status='damaged';return;}
      const get=k=>this.storage.getItem(k);
      this.data.profile.storyCompleted=get('galevein_story_done')==='1';
      this.data.profile.highestChapter=this.data.profile.storyCompleted?5:0;
      this.data.profile.hearthholm=Math.max(0,Math.min(100,Number(get('galevein_hearthholm'))||0));
      try{const m=JSON.parse(get('galevein_myst')||'{}');this.data.profile.mysteries=validateSave({...this.data,profile:{...this.data.profile,mysteries:m}}).profile.mysteries;}catch{}
    }catch(e){this.status='unavailable';this.error=e;}
  }
  save(data,{replace=false}={}){
    const valid=validateSave(data);
    if(this.blocked&&!replace)throw Error('Existing save needs recovery before writing');
    const current=this.storage.getItem(SAVE_KEY);
    if(current!==this.raw&&!replace)throw new SaveConflict('Progress changed in another tab. Reload before continuing.');
    let revision=0;let previousValid=false;
    try{revision=decodeSave(current).revision;previousValid=true;}catch{}
    const next=encodeSave(valid,revision+1);
    if(previousValid)this.storage.setItem(BACKUP_KEY,current);
    // localStorage replaces this key atomically; a failed write leaves the old save intact.
    this.storage.setItem(SAVE_KEY,next);
    this.raw=next;this.data=valid;this.status='saved';this.blocked=false;this.error=null;
    return valid;
  }
  export(){return encodeSave(this.data);}
  import(raw){const {data}=decodeSave(raw);return this.save(data,{replace:true});}
  recover(){const raw=this.storage.getItem(BACKUP_KEY);if(!raw)throw Error('No recovery save exists');return this.import(raw);}
}
