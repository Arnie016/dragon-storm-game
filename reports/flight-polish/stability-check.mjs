process.on('uncaughtException',err=>{console.error(err.name+': '+err.message);console.error((err.stack||'').split('\n').filter(l=>!l.includes('data:text')).slice(0,8).join('\n'));process.exit(1);});
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url), html=await readFile(new URL('index.html',root),'utf8');
const asModule=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const threeUrl=asModule(await readFile(new URL('vendor/three.module.js',root),'utf8'));
const THREE=await import(threeUrl);
const utilsUrl=asModule((await readFile(new URL('utils/BufferGeometryUtils.js',root),'utf8')).replaceAll("from 'three'",`from '${threeUrl}'`));
const loaderUrl=asModule((await readFile(new URL('vendor/GLTFLoader.js',root),'utf8')).replace("from 'three'",`from '${threeUrl}'`).replace("from '../utils/BufferGeometryUtils.js'",`from '${utilsUrl}'`));
globalThis.self=globalThis;globalThis.ProgressEvent??=class{constructor(type,data){this.type=type;Object.assign(this,data);}};
const {GLTFLoader}=await import(loaderUrl);
const dracoPending=new Map();let dracoTask=0;
const dracoContext=vm.createContext({console,setTimeout,clearTimeout,performance,TextDecoder,ArrayBuffer,Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,WebAssembly});
vm.runInContext('self=globalThis;',dracoContext);
dracoContext.postMessage=message=>{const pending=dracoPending.get(message.id);dracoPending.delete(message.id);if(message.type==='error'){pending.reject(new Error(message.error));return;}const g=new THREE.BufferGeometry();if(message.geometry.index)g.setIndex(new THREE.BufferAttribute(message.geometry.index.array,1));for(const a of message.geometry.attributes)g.setAttribute(a.name,new THREE.BufferAttribute(a.array,a.itemSize));pending.resolve(g);};
vm.runInContext(await readFile(new URL('vendor/draco/draco_decoder.js',root),'utf8'),dracoContext);
const dracoSource=await readFile(new URL('vendor/DRACOLoader.js',root),'utf8');
vm.runInContext(dracoSource.slice(dracoSource.indexOf('function DRACOWorker()'),dracoSource.lastIndexOf('export'))+'\nDRACOWorker();onmessage({data:{type:"init",decoderConfig:{}}});',dracoContext);
const dracoLoader={preload(){},decodeDracoFile(buffer,callback,attributeIDs,attributeTypes,colorSpace,onError){const id=++dracoTask;const promise=new Promise((resolve,reject)=>dracoPending.set(id,{resolve,reject}));dracoContext.onmessage({data:{type:'decode',id,buffer,taskConfig:{attributeIDs,attributeTypes,useUniqueIDs:true}}});promise.then(callback,onError);return promise;}};

const between=(a,b)=>{const start=html.indexOf(a),end=html.indexOf(b,start+a.length);assert.ok(start>=0&&end>start,`source markers missing: ${a}`);return html.slice(start,end);};
function fn(name){const a=html.indexOf(`function ${name}(`);assert.ok(a>=0,name);const lineEnd=html.indexOf('\n',a);if(html.slice(a,lineEnd).trimEnd().endsWith('}'))return html.slice(a,lineEnd);const b=html.indexOf('\n}',a);assert.ok(b>a,name);return html.slice(a,b+2);}
const out={generatedAt:new Date().toISOString(),sourceSha256:createHash('sha256').update(html).digest('hex'),method:'Numerical execution of source extracted from index.html, using the shipped Three build; boundary stubs listed per section. No GPU/FPS or full-campaign assertion.',rigs:[],lifecycle:{},graze:[]};
const rigs=await import(asModule(await readFile(new URL('world-expansion/modules/dragonRigs.js',root),'utf8')));
const animationBlock=between('  /* ---- animation blend + procedural alive layer ---- */','  /* ---- STEALTH detection ---- */');
for(const id of ['stormcrest','quaternius']){
 const rig=rigs.DRAGON_RIGS.find(r=>r.id===id),bytes=await readFile(new URL(rig.asset,root));
 const jsonLen=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLen).toString());
 const binStart=20+jsonLen+8,binLength=bytes.readUInt32LE(20+jsonLen);
 // Images/materials are deliberately excluded: this is a CPU skin/animation test, not texture rendering.
 gltf.buffers=[{byteLength:binLength,uri:`data:application/octet-stream;base64,${bytes.subarray(binStart,binStart+binLength).toString('base64')}`}];
 delete gltf.images;delete gltf.textures;delete gltf.samplers;gltf.materials=[];
 for(const mesh of gltf.meshes||[])for(const p of mesh.primitives)delete p.material;
 for(const fps of [30,60,120]){
  const loaded=await new GLTFLoader().setDRACOLoader(dracoLoader).parseAsync(JSON.stringify(gltf),'');
  const D={model:loaded.scene,group:new THREE.Group(),mixer:new THREE.AnimationMixer(loaded.scene),speed:30,turn:0,pitch:0,roll:0,recoil:0,motion:{yawRate:0,gLoad:1,longAccel:0}},S={t:0,boost:0,accel:0,started:true,launching:false},key={},input={flap:false};D.group.add(D.model);
  const ctx=vm.createContext({THREE,D,S,key,input,activeRig:rig,loaded,rig});
  vm.runInContext([fn('findClip'),fn('setupDragonClips'),between('function collectBones(model){','/* ============================ INPUT'),fn('springAxis'),'const fdamp=(l,dt)=>1-Math.exp(-l*dt);','setupDragonClips(loaded,rig);collectBones(D.model);ALIVE=rig.id==="quaternius"?.35:1;',`function step(dt){${animationBlock}}`].join('\n'),ctx);
  let maxQuaternionError=0,invalid=0,maxExtent=0;const bones=[];D.model.traverse(o=>{if(o.isBone)bones.push(o);});
  for(let f=0;f<600;f++){
   S.t=f/fps;S.boost=(Math.sin(f*.037)+1)/2;S.accel=Math.sin(f*.011);D.speed=22+30*(Math.sin(f*.023)+1)/2;D.turn=Math.sin(f*.021);D.pitch=.5*Math.sin(f*.017);D.motion.yawRate=2*Math.sin(f*.019);D.motion.gLoad=1+2*(Math.sin(f*.013)+1)/2;D.motion.longAccel=30*Math.sin(f*.025);key.KeyS=f%180>120;input.flap=f%120<40;
   ctx.dt=1/fps;vm.runInContext('step(dt)',ctx);D.model.updateMatrixWorld(true);
   assert.ok(Number.isFinite(D.flap?.timeScale??0)&&Number.isFinite(D.glide?.timeScale??0));
   for(const b of bones){if(![...b.quaternion.toArray(),...b.position.toArray(),...b.matrixWorld.elements].every(Number.isFinite))invalid++;maxQuaternionError=Math.max(maxQuaternionError,Math.abs(b.quaternion.length()-1));}
   D.model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();assert.ok(o.skeleton.boneMatrices.every(Number.isFinite));const p=new THREE.Vector3();for(let k=0;k<o.geometry.attributes.position.count;k+=Math.max(1,Math.floor(o.geometry.attributes.position.count/64))){o.getVertexPosition(k,p);assert.ok(p.toArray().every(Number.isFinite));maxExtent=Math.max(maxExtent,p.length());}}});
  }
  assert.equal(invalid,0);assert.ok(maxQuaternionError<1e-4);assert.ok(maxExtent<50,'exploding skinned geometry');
  const mixer=D.mixer;D.mixer=null;vm.runInContext('advanceDragonAnimation(0)',ctx);for(const {bone,base} of D.alivePose)assert.ok(bone.quaternion.equals(base),'procedural offset failed to restore');D.mixer=mixer;
  out.rigs.push({id,fps,frames:600,simulatedSeconds:600/fps,bones:bones.length,invalid,proceduralPoseRestore:true,maxQuaternionError,maxSampledVertexRadius:maxExtent,assetSha256:createHash('sha256').update(bytes).digest('hex'),boundaries:'Textures stripped; animation clips, mesh vertices/skin weights, bone hierarchy and procedural pose code are actual. 64+ sampled vertices per skinned mesh per frame.'});
  D.mixer.stopAllAction();D.mixer.uncacheRoot(D.model);
 }
}
// Actual reset, begin, input, projectile/flock cleanup and timer source; mock only browser/audio/world boundaries.
const elements=new Map();function $(id){if(!elements.has(id))elements.set(id,{style:{},classList:{data:new Set(),add(x){this.data.add(x)},remove(x){this.data.delete(x)},contains(x){return this.data.has(x)}},open:false,hidden:false});return elements.get(id);}
const S={t:5,runToken:0,finishToken:0,hpMax:124,hp:10,scales:42,started:false,paused:false},D={group:new THREE.Group(),model:new THREE.Group(),mouth:new THREE.Mesh(),mouthLt:{intensity:10},motion:{},springs:{turn:{value:2,velocity:3}},glide:{timeScale:1}},key={KeyX:true,KeyW:true},input={flap:true};
let nextTimer=0,now=0;const timers=new Map(),allTimers=[];const setTimeoutFake=(cb,ms)=>{const id=++nextTimer;timers.set(id,{cb,at:now+ms});allTimers.push(cb);return id;};const clearTimeoutFake=id=>timers.delete(id);
function advance(ms){const target=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>target)break;now=next[1].at;timers.delete(next[0]);next[1].cb();}now=target;}
let geoDisposed=0,matDisposed=0,ringMaterialsDisposed=0,flxCleared=0,projectilesGiven=0,cleanedMystery=0;
const ownedMesh=()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());m.geometry.addEventListener('dispose',()=>geoDisposed++);m.material.addEventListener('dispose',()=>matDisposed++);return m;};
const ringBase=new THREE.MeshStandardMaterial(),ringDone=new THREE.MeshStandardMaterial();const rings=[{userData:{},scale:new THREE.Vector3(),material:ringBase.clone()}];
const searchlights=[{maxHp:100,hp:1,group:new THREE.Group(),spot:{},cone:{},lampGlow:{},lamp:{material:{}},hbBg:{material:{}},hbFill:{material:{}}}];
const shocks=[],debris=[],flock=[],bolts=[],foeBolts=[],scene=new THREE.Scene(),sharedGeometry=new THREE.SphereGeometry();let sharedDisposed=0;sharedGeometry.addEventListener('dispose',()=>sharedDisposed++);
const context={THREE,S,D,key,input,$,scene,REST:{x:10,y:40,z:20},activeRig:{id:'stormcrest',scale:9},MYST:{active:null},ROOK:{},RAID:{on:false,fireList:[]},NORSE:{fires:[]},GATE:{},TOD:{},ROG:{},uRA:{},TONE:{},rings,ringBase,ringDone,searchlights,shocks,debris,flock,bolts,foeBolts,BURST_POOL:[{alive:true,sp:{visible:true},slot:4}],FXL:{clear:()=>flxCleared++,give:()=>projectilesGiven++},COMBAT:{},combatTarget:$('combatTarget'),combatThreat:$('combatThreat'),combatHit:$('combatHit'),gates:[],structure:{reset(){}},echoMesh:{},UPGRADES:[{id:'scaleplate'}],UP:{scaleplate:2},SKILLS:[{_had:true}],teleMark:{},tutRings:[],WIND:{gain:{gain:{value:1}}},SAGA:{},AU:{play(){},fadeTo(){}},setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,updateChargeHum(){},startAudio(){},endRaid(){},triggerRipple(){},storyPop(){},upLv:id=>context.UP[id]||0,camera:{position:new THREE.Vector3()},simJumpChapter:n=>{S.chapter=n;D.group.position.set(123,234,345);}};
const ctx=vm.createContext(context);
vm.runInContext([fn('isFlightPaused'),fn('clearFlightInput'),fn('setFlightPaused'),fn('disposeCombatBolt'),fn('clearCombatProjectiles'),fn('clearFlock'),between('const runTimers=new Set();','/* ---- landing interactions ---- */')].join('\n'),ctx);
for(let i=0;i<20;i++){
 S.started=false;S.paused=true;S.saga=true;S.chargeT=1;S._chargeReady=true;input.flap=true;key.KeyX=true;key.KeyW=true;S.hp=1;S.score=7;S.detection=1;S.gustPow=1;D.springs.turn.value=4;D.springs.turn.velocity=5;
 rings[0].material.addEventListener('dispose',()=>ringMaterialsDisposed++);context.MYST.active={cleanup:()=>cleanedMystery++};shocks.push({m:ownedMesh()});debris.push({m:ownedMesh()});flock.push({m:ownedMesh()});
 const player=new THREE.Mesh(sharedGeometry,new THREE.MeshBasicMaterial());player.material.addEventListener('dispose',()=>matDisposed++);const line=ownedMesh();bolts.push({m:player,line,lgeo:line.geometry,slot:1});const enemy=ownedMesh();foeBolts.push({m:enemy});
 vm.runInContext('reset({launch:false,preserveUpgrades:true})',ctx);
 assert.equal(S.started,false);assert.equal(S.launching,false);assert.equal(S.paused,false);assert.equal(S.chargeT,-1);assert.equal(input.flap,false);assert.ok(Object.values(key).every(v=>!v));assert.equal(S.hp,124);assert.equal(S.scales,42);assert.equal(context.UP.scaleplate,2);assert.equal(S.score,0);assert.equal(S.detection,0);assert.equal(D.springs.turn.value,0);assert.equal(D.springs.turn.velocity,0);assert.equal(searchlights[0].hp,100);assert.equal(searchlights[0].fireWindup,0);assert.equal(shocks.length+debris.length+flock.length+bolts.length+foeBolts.length,0);assert.equal(context.COMBAT.invulnerable,0);
}
assert.equal(ringMaterialsDisposed,20);assert.equal(geoDisposed,100);assert.equal(matDisposed,120);assert.equal(sharedDisposed,0);assert.equal(projectilesGiven,20);assert.equal(cleanedMystery,20);
let staleCalls=0;context.stale=()=>staleCalls++;vm.runInContext('afterRunDelay(100,stale)',ctx);const staleCallback=allTimers.at(-1);vm.runInContext('reset({launch:false})',ctx);staleCallback();advance(200);assert.equal(staleCalls,0);
let pauseCalls=0;context.pausedCallback=()=>pauseCalls++;vm.runInContext('setFlightPaused(true);afterRunDelay(100,pausedCallback)',ctx);advance(500);assert.equal(pauseCalls,0);vm.runInContext('setFlightPaused(false)',ctx);advance(100);assert.equal(pauseCalls,1);
S.started=false;S.launching=false;vm.runInContext('begin({mode:"chapter",chapterIndex:3})',ctx);advance(950);assert.equal(S.chapter,3);assert.deepEqual(D.group.position.toArray(),[123,234,345]);assert.equal(S.scales,42);assert.equal(context.UP.scaleplate,2);advance(3000);assert.equal(S.launching,false);assert.equal(input.flap,false);
vm.runInContext('reset({launch:false,preserveUpgrades:false})',ctx);assert.equal(S.scales,0);assert.equal(context.UP.scaleplate,0);assert.equal(S.hp,100);
out.lifecycle={resetCycles:20,ownedGeometriesDisposed:geoDisposed,ownedMaterialsDisposed:matDisposed,ringMaterialsDisposed,sharedGeometryDisposals:sharedDisposed,staleTimerCalls:staleCalls,pausedCallbackCallsAfterResume:pauseCalls,preservedChapterPosition:[123,234,345],checks:['20 resets clear transient state, controls, charge, combat, springs and world effects','20 resources per transient effect type disposed; shared projectile geometry retained','upgrades and scales preserved unless explicitly cleared','cancelled timer cannot execute even if invoked after cancellation','paused delayed callback waits for resume','chapter launch retains checkpoint spawn after timed intro'],boundaries:'Audio, DOM, achievement/story callbacks, map state, upgrade lookup and chapter positioning are explicit lightweight stubs; reset/input/timer/cleanup functions executed unchanged from index.html.'};
// The exact wind and collision blocks, with only terrain height and feedback replaced.
const wind=between('  // wind gusts (all directions)','  /* ---- collisions ---- */');
const collisions=between('  /* ---- collisions ---- */','  /* ---- orientation: prone, headfirst flight (not upright) ---- */');
for(const fps of [30,60,120]){
 const p=new THREE.Vector3(35,30,0),S={t:0,hp:100,impactCd:0,launching:false,detection:1,shake:0,grazing:false,gustNext:999,gustPow:1,gustDir:Math.PI},D={speed:40,pitch:0,roll:0,yaw:0};let crashed=0,closeCalls=0;
 const c={THREE,p,S,D,colliders:[{x:0,z:0,r:30,top:50}],waveH:()=>0,groundHeight:()=>-2,upLv:()=>0,routeDifficulty:()=>0,crash:()=>crashed++,popup:s=>{if(s==='CLOSE CALL')closeCalls++},smallBurst(){},AU:{play(){}},$};
 const context=vm.createContext(c);vm.runInContext(`function step(dt){${wind}${collisions}};function windOnly(dt){${wind}};function collideOnly(dt){${collisions}}`,context);
 for(let f=0;f<fps*3;f++){S.t=f/fps;context.dt=1/fps;vm.runInContext('step(dt)',context);assert.ok(p.toArray().every(Number.isFinite));}
 assert.equal(crashed,0);assert.equal(S.hp,100);assert.ok(S.detection<1-1e-5);assert.ok(closeCalls>0);
 const grazeResult={fps,seconds:3,hp:S.hp,crashes:crashed,closeCalls,detectionAfter:S.detection,finalPosition:p.toArray()};
 // A penetrating rock strike damages once during its 1.15 second cooldown, even at higher rates.
 S.hp=100;S.impactCd=0;S.gustPow=0;for(let f=0;f<fps;f++){p.set(30,30,0);D.speed=40;context.dt=1/fps;vm.runInContext('collideOnly(dt)',context);}assert.ok(Math.abs(S.hp-78.1)<1e-9);
 // Centre-of-column contact must remain finite (zero-length horizontal normal).
 p.set(0,30,0);S.impactCd=0;S.hp=100;vm.runInContext('collideOnly(dt)',context);assert.ok(p.toArray().every(Number.isFinite));
 // Flat hillside near-miss uses the heightfield and gently raises the dragon.
 c.colliders.length=0;c.groundHeight=()=>50;context.groundHeight=c.groundHeight;p.set(0,56,0);D.speed=40;S.impactCd=0;S.hp=100;S.grazing=false;vm.runInContext('collideOnly(dt)',context);assert.equal(S.grazing,true);assert.equal(S.hp,100);assert.ok(p.y>56);
 // Isolate wind once for an exact 0.2 gust multiplier comparison, with identical initial values.
 function windDisplacement(grazing){p.set(0,30,0);Object.assign(S,{t:1,grazing,gustNext:999,gustPow:.7,gustDir:.9,shake:0});D.roll=0;vm.runInContext('windOnly(dt)',context);return p.clone().sub(new THREE.Vector3(0,30,0));}
 const full=windDisplacement(false),damped=windDisplacement(true),ratio=damped.length()/full.length();assert.ok(Math.abs(ratio-.2)<1e-10);
 Object.assign(grazeResult,{singleImpactHp:78.1,centreContactFinite:true,hillsideGrazing:true,gustDisplacementRatio:ratio});out.graze.push(grazeResult);
}
out.grazeBoundaries='Isolated unmodified wind/collision snippets; no player route steering, rendering, new terrain mesh or complete canyon autopilot. Tests use a cylindrical cliff and a flat hillside, deterministic inputs, and stubbed sound/feedback.';
out.pass=true;
await writeFile(new URL('stability-result.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({pass:true,rigFrames:out.rigs.reduce((n,r)=>n+r.frames,0),rigs:out.rigs.map(({id,fps,frames,invalid,maxQuaternionError})=>({id,fps,frames,invalid,maxQuaternionError})),lifecycle:out.lifecycle,graze:out.graze},null,2));
