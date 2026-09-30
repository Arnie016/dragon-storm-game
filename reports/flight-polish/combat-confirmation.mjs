import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=resolve(root,'reports/flight-polish/combat-confirmation');await mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),environment:'Headless Chromium 153 using SwiftShader CPU rendering; render timings are not hardware FPS benchmarks.',source:'Recovered enhancement branch',checks:[],pageErrors:[],failedRequests:[],screenshots:[],campaign:null};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(!path.startsWith(root+'/'))path=resolve(root,'index.html');if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch(e){res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
let browser,page;
const flush=()=>writeFile(resolve(out,'results.json'),JSON.stringify(report,null,2));
async function check(name,fn){let r;try{r=await fn();report.checks.push({name,status:'pass',...r});console.log('PASS '+name);}catch(e){report.checks.push({name,status:'fail',error:String(e.stack||e)});console.log('FAIL '+name+' '+e.message);}await flush();}
function assert(c,msg){if(!c)throw Error(msg)}
async function shot(name){try{await page.screenshot({path:resolve(out,name),timeout:15000});report.screenshots.push(name);console.log('SCREENSHOT '+name);}catch(e){report.screenshots.push({name,error:e.message});console.log('SCREENSHOT SKIP '+name);}await flush();}
async function steps(n,steer=false){return page.evaluate(({n,steer})=>{for(let i=0;i<n;i++){if(steer&&i%4===0)SIM.steerObjective();SIM.stepSimulation(1/60);if(SIM.state().done||SIM.state().paused)break;}return SIM.state();},{n,steer});}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||resolve(root,'../browser-bin/chromium'),args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--ignore-gpu-blocklist','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-web-security']});
 page=await browser.newPage({viewport:{width:800,height:500},deviceScaleFactor:1});page.setDefaultTimeout(25000);
 page.on('pageerror',e=>{report.pageErrors.push(e.message);console.log('PAGE ERROR '+e.message)});
 await page.addInitScript(()=>localStorage.setItem('galevein_gfx','low'));
 await check('Current final terrain and game load without exceptions',async()=>{await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.SIM?.rigHealth().loaded,{},{timeout:150000});const state=await page.evaluate(()=>({terrain:SIM.terrainState(),seaHeight:SIM.terrainHeight(5000,5000),rig:SIM.rigHealth(),boot:SIM.snapshot().bootErrors}));assert(state.seaHeight<0,'Open ocean is incorrectly land');assert(!state.boot.length,'Boot errors');return state;});
 await check('Held position receives an actual watchtower projectile',async()=>{
 const result=await page.evaluate(()=>{SIM.reset({launch:false,preserveUpgrades:true});SIM.jumpChapter(2);let locked=null,maximumBolts=0,maximumWindup=0,maximumLit=0,hit=null,holdTower=0;const samples=[];
 for(let i=0;i<1200;i++){
  const combat=SIM.combatState();const tower=combat.towers[holdTower];const moving=tower.lampPos.map((v,j)=>v+tower.beamDirection[j]*35);
  if(!locked&&combat.foeBolts>0)locked=SIM.state().pos;
  const p=locked||moving;SIM.jumpState({pos:p,speed:0});SIM.stepSimulation(1/60);
  const state=SIM.state(),after=SIM.combatState();maximumBolts=Math.max(maximumBolts,after.foeBolts);maximumWindup=Math.max(maximumWindup,after.towers[holdTower].fireWindup);maximumLit=Math.max(maximumLit,after.towers[holdTower].lit);
  if(i%30===0)samples.push({step:i,state,tower:after.towers[holdTower],foeBolts:after.foeBolts,invulnerable:after.invulnerable,terrain:SIM.terrainHeight(p[0],p[2]),locked:!!locked});
  if(state.hp<state.hpMax&&after.invulnerable>0){hit={state,invulnerable:after.invulnerable,projectiles:after.foeBolts,popup:document.querySelector('#popup')?.textContent};break;}
  if(state.done)break;
 }
 return {setup:'Declared diagnostic: chapter 2 and dragon held 35m in front of tower beam; lock position only after a real enemy projectile launches. Position/speed are fixed for target geometry; no HP, projectile, fire timer, detection or damage injection.',maximumBolts,maximumWindup,maximumLit,hit,samples};});
 report.retaliation=result;await flush();assert(result.maximumWindup>0,'No wind-up observed');assert(result.maximumBolts>0,'No enemy projectile observed');assert(result.hit&&result.hit.invulnerable>0,'No confirmed projectile damage');return result;
 });
 await check('No uncaught browser exceptions',async()=>{assert(!report.pageErrors.length,report.pageErrors.join('\n'));return {pageErrors:report.pageErrors};});
}catch(e){report.fatal=String(e.stack||e);console.log('FATAL '+e.stack)}finally{await flush();await browser?.close();server.close();}
console.log(JSON.stringify({pass:report.checks.filter(c=>c.status==='pass').length,fail:report.checks.filter(c=>c.status==='fail').length,fatal:report.fatal,pageErrors:report.pageErrors,hit:report.retaliation?.hit},null,2));
