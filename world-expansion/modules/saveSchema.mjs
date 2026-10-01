// Shared browser/server contract. Save only simulation data, never scene objects.
export const SAVE_VERSION = 1;
export const MAX_SAVE_BYTES = 131072;
export const UPGRADE_IDS = ['strap', 'rudder', 'stirrup', 'gland', 'scaleplate'];
export const STATE_NUMBERS = {
  hp:[0,136], charges:[0,3], detection:[0,1], grace:[0,10],
  echoCd:[0,100], flockCd:[0,100], flockT:[0,100], poison:[0,100],
  violence:[0,10000], altitudePeak:[0,10000], ultraCd:[0,100], ultraT:[0,10],
  superCharge:[0,100], spiral:[0,100], dive:[0,100], lift:[-100,100],
  strikeNext:[0,100], gustNext:[0,100], shootCd:[0,100], beatCd:[0,100]
};
export const STATE_FLAGS = ['tutDone','raidDone','altitudeCollected','bookLost','violenceWarned',
  'spiralFired','spiralMax','stormbreakFired','keepersWoke'];
const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
function need(ok, label) { if (!ok) throw new TypeError(`Invalid save: ${label}`); }
function num(v, lo, hi, label) { need(typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi, label); return v; }
function integer(v, lo, hi, label) { num(v,lo,hi,label); need(Number.isSafeInteger(v),label); return v; }
function bool(v,label) { need(typeof v === 'boolean',label); return v; }
function text(v,max,label) { need(typeof v === 'string' && v.length<=max,label); return v; }
function vector(v) { need(Array.isArray(v)&&v.length===3,'position'); return v.map(n=>num(n,-100000,100000,'position')); }
function flags(v,length,label) { need(Array.isArray(v)&&v.length===length,label); return v.map(n=>bool(n,label)); }
export function loadout(v) {
  need(object(v)&&object(v.upgrades),'loadout');
  return {scales:num(v.scales,0,1e7,'scales'),upgrades:Object.fromEntries(UPGRADE_IDS.map(id=>[id,integer(v.upgrades[id]??0,0,3,id)]))};
}
export function emptySave() {
  return {version:SAVE_VERSION,profile:{...loadout({scales:0,upgrades:{}}),storyCompleted:false,highestChapter:0,hearthholm:0,mysteries:{}},checkpoint:null};
}
export function validateSave(value) {
  need(object(value),'document');
  need(value.version===SAVE_VERSION,'unsupported version');
  const p=value.profile; need(object(p),'profile');
  const mysteries={}; need(object(p.mysteries),'mysteries');
  need(Object.keys(p.mysteries).length<=64,'mysteries count');
  for(const [k,v] of Object.entries(p.mysteries)){ need(/^[a-z0-9_-]{1,64}$/i.test(k),'mystery id'); Object.defineProperty(mysteries,k,{value:num(v,0,1e7,'mystery score'),enumerable:true}); }
  const profile={...loadout(p),storyCompleted:bool(p.storyCompleted,'storyCompleted'),highestChapter:integer(p.highestChapter,0,5,'chapter'),hearthholm:num(p.hearthholm,0,100,'hearthholm'),mysteries};
  let checkpoint=null;
  if(value.checkpoint!==null){
    const c=value.checkpoint; need(object(c),'checkpoint');
    need(c.mode==='story','checkpoint mode'); need(object(c.state),'state');
    const state={};
    for(const [key,[lo,hi]] of Object.entries(STATE_NUMBERS)) state[key]=num(c.state[key]??0,lo,hi,key);
    for(const key of STATE_FLAGS) state[key]=bool(c.state[key]??false,key);
    const rings=flags(c.rings,12,'beacons'),tutorial=flags(c.tutorial,3,'tutorial');
    need(rings.filter(Boolean).length<12,'finished checkpoint');
    need(state.hp>0,'dead checkpoint');
    need(state.tutDone===tutorial.every(Boolean),'tutorial state');
    need(state.tutDone||!rings.some(Boolean),'beacons before tutorial');
    const d=c.dragon; need(object(d),'dragon');
    need(Array.isArray(c.towers)&&c.towers.length<=128,'towers');
    const towers=c.towers.map(t=>({hp:num(t.hp,0,10000,'tower hp'),destroyed:bool(t.destroyed,'tower destroyed')}));
    const r=c.raid; need(object(r)&&Array.isArray(r.riders)&&r.riders.length<=12,'raid');
    const raid={on:bool(r.on,'raid active'),wave:integer(r.wave,0,2,'wave'),hearth:num(r.hearth,0,100,'village health'),riders:r.riders.map(e=>({position:vector(e.position),hp:num(e.hp,0,3,'rider hp'),yaw:num(e.yaw,-1e6,1e6,'rider yaw'),speed:num(e.speed,0,200,'rider speed'),fireCd:num(e.fireCd,-10,100,'rider cooldown'),diveCd:num(e.diveCd,-10,100,'rider dive'),orbit:num(e.orbit,-1e6,1e6,'rider orbit')}))};
    need(!raid.on||(!state.raidDone&&raid.wave>0&&raid.hearth>0),'raid consistency');
    checkpoint={mode:'story',rig:text(c.rig,64,'rig'),savedAt:integer(c.savedAt,0,1e15,'saved time'),worldTime:num(c.worldTime,0,1e9,'world time'),flightTime:num(c.flightTime,0,1e7,'flight time'),day:num(c.day,0,1,'day'),state,loadout:loadout(c.loadout),rings,tutorial,gates:flags(c.gates,3,'gates'),towers,raid,dragon:{position:vector(d.position),yaw:num(d.yaw,-1e6,1e6,'yaw'),pitch:num(d.pitch,-4,4,'pitch'),roll:num(d.roll,-4,4,'roll'),speed:num(d.speed,0,300,'speed')}};
  }
  return {version:SAVE_VERSION,profile,checkpoint};
}
