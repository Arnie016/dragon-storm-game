import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=resolve(root,'reports/state-backend/campaign-evidence');await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),environment:'Headless Chromium 143 using SwiftShader CPU rendering; render timings are not hardware FPS benchmarks.',source:'State/backend enhancement branch',checks:[],pageErrors:[],failedRequests:[],screenshots:[],campaign:null};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(!path.startsWith(root+'/'))path=resolve(root,'index.html');if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch(e){res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
let browser,page;
const flush=()=>writeFile(resolve(out,'results.json'),JSON.stringify(report,null,2));
async function check(name,fn){let r;try{r=await fn();report.checks.push({name,status:'pass',...r});console.log('PASS '+name);}catch(e){report.checks.push({name,status:'fail',error:String(e.stack||e)});console.log('FAIL '+name+' '+e.message);}await flush();}
function assert(c,msg){if(!c)throw Error(msg)}
async function shot(name){try{await page.screenshot({path:resolve(out,name),timeout:60000});report.screenshots.push(name);console.log('SCREENSHOT '+name);}catch(e){report.screenshots.push({name,error:e.message});console.log('SCREENSHOT SKIP '+name);}await flush();}
async function steps(n,steer=false){return page.evaluate(({n,steer})=>{for(let i=0;i<n;i++){if(steer&&i%4===0)SIM.steerObjective();SIM.stepSimulation(1/60);if(SIM.state().done||SIM.state().paused)break;}return SIM.state();},{n,steer});}

try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||resolve(root,'../browser-bin/chromium'),args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--ignore-gpu-blocklist','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:800,height:500},deviceScaleFactor:1});page.setDefaultTimeout(30000);
 page.on('pageerror',e=>{report.pageErrors.push(e.message);console.log('ERROR '+e.message)});
 await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('galevein_gfx','low');let seed=104;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 await page.goto(url+'/?notrailer',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.SIM?.rigHealth().loaded,{},{timeout:600000});
 await page.mouse.click(12,250);await page.locator('#startBtn').click();await page.locator('[data-lobby-mode="story"]').click();
 await page.waitForFunction(()=>SIM.state().started&&!SIM.state().launching,{},{timeout:60000});
 await page.evaluate(()=>{
   window.CAMPAIGN_DRIVER={shots:0,held:false,events:[],steps:0};
   window.driveCampaign=()=>{
     const k=window.CAMPAIGN_DRIVER,s=SIM.state(),c=SIM.campaignState(); if(k.held&&s.chargeT<0) k.held=false;
     const event=(type,code)=>document.body.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
     if(!c.raid){SIM.steerObjective();
       // Read-only terrain lookahead helps the input driver avoid the mountain flank.
       // It changes only normal climb/throttle controls, never position, HP or progress.
       if(s.tutorial===3){
         let clearance=-Infinity;
         for(const distance of [0,35,70,110,155])clearance=Math.max(clearance,SIM.terrainHeight(c.position[0]-Math.sin(c.yaw)*distance,c.position[2]-Math.cos(c.yaw)*distance)+20);
         if(clearance>c.position[1])SIM.controls({climb:true,dive:false,flap:true,brake:c.speed>40,accel:c.speed<30});
       }
       if(k.held){event('keyup','KeyX');k.held=false;}return;}
     const targets=c.riders.filter(r=>!r.dead&&!r.falling);
     targets.sort((a,b)=>Math.hypot(...a.position.map((v,i)=>v-c.position[i]))-Math.hypot(...b.position.map((v,i)=>v-c.position[i])));
     const target=targets[0];if(!target){SIM.controls({allOff:true});return;}
     const p=c.position,t=target.position.slice(),dist=Math.hypot(...t.map((v,i)=>v-p[i]));
     const lead=Math.min(.5,dist/300);t[0]-=Math.sin(target.yaw)*target.speed*lead;t[2]-=Math.cos(target.yaw)*target.speed*lead;
     let diff=Math.atan2(-(t[0]-p[0]),-(t[2]-p[2]))-c.yaw;diff=Math.atan2(Math.sin(diff),Math.cos(diff));
     const dy=t[1]-p[1],wantedSpeed=dist>220?55:dist>100?34:25;
     SIM.controls({accel:c.speed<wantedSpeed-1,brake:c.speed>wantedSpeed+1,climb:dy>3,dive:dy<-5,bankLeft:diff>.06,bankRight:diff<-.06,turnLeft:false,turnRight:false,flap:dy>18&&dist>200});
     const aimPitch=Math.atan2(dy,Math.hypot(t[0]-p[0],t[2]-p[2]));
     const aligned=Math.abs(diff)<.32&&Math.abs(aimPitch-c.pitch)<.35;
     if(!k.held&&s.charges>=1&&dist<300){event('keydown','KeyX');k.held=SIM.state().chargeT>=0;}
     if(k.held&&s.chargeT>=c.chargeSeconds*.8&&aligned&&dist<290){event('keyup','KeyX');k.held=false;k.shots++;}
   };
 });
 report.method='Real UI Story launch, read-only telemetry, normal flight control state and X keyboard events; fixed 1/60-second simulation. No teleports, checkpoint jumps, score/HP/enemy mutation or forced victory. Fresh localStorage; RNG seed104. Read-only terrain lookahead adjusts normal climb/flap/throttle controls.';
 for(let batch=0;batch<180;batch++){
   if(await page.locator('#saga').evaluate(e=>e.classList.contains('on')))await page.locator('#saga').click();
   const r=await page.evaluate(()=>{let ran=0;for(;ran<240;ran++){const s=SIM.state();if(s.done||s.paused)break;driveCampaign();SIM.stepSimulation(1/60);CAMPAIGN_DRIVER.steps++;}return {ran,state:SIM.state(),campaign:SIM.campaignState(),shots:CAMPAIGN_DRIVER.shots,steps:CAMPAIGN_DRIVER.steps};});
   (report.samples??=[]).push(r);await flush();
   console.log(JSON.stringify({batch,t:r.state.flightT,score:r.state.score,tutorial:r.state.tutorial,hp:r.state.hp,raid:r.campaign.raid,hearth:r.campaign.hearth,left:r.campaign.riders.filter(x=>!x.dead&&!x.falling).length,shots:r.shots,cause:r.state.cause,paused:r.state.paused,pos:r.state.pos}));
   if(r.state.done)break;
 }
 report.final=await page.evaluate(()=>({state:SIM.state(),campaign:SIM.campaignState(),driver:CAMPAIGN_DRIVER}));
 report.campaignComplete=report.final.state.cause==='ESCAPED'&&report.final.state.score===12&&report.final.campaign.raidDone;
 await page.waitForFunction(()=>!document.getElementById('over').classList.contains('hide'),{},{timeout:60000});
 report.ending=await page.evaluate(()=>({title:document.getElementById('overTitle').textContent,cause:document.getElementById('overKick').textContent,beacons:document.getElementById('overBeacons').textContent,storySaved:localStorage.getItem('galevein_story_done')}));
 assert(report.ending.title==='TEMPEST GATE'&&report.ending.storySaved==='1','Victory screen and saved story completion');
 await shot('campaign-end.jpg');
 await page.waitForFunction(()=>!SIM.state().started&&document.getElementById('lobbyHub').classList.contains('on'),{},{timeout:60000});
 report.returnedToHub=true;
 assert(report.campaignComplete&&report.pageErrors.length===0,'Campaign completion without runtime exceptions');
}catch(e){report.fatal=String(e.stack||e);console.log('FATAL '+e.stack);}finally{await flush();await browser?.close();server.close();}
console.log(JSON.stringify({campaignComplete:report.campaignComplete,final:report.final,errors:report.pageErrors,fatal:report.fatal}));

if(!report.campaignComplete||!report.returnedToHub||report.fatal||report.pageErrors.length)process.exitCode=1;
