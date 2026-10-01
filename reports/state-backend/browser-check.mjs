import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createGameServer} from '../../backend/server.mjs';
import {encodeSave} from '../../world-expansion/modules/saveStore.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const server=createGameServer({dbPath:':memory:',rateLimit:1000});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const out=resolve('reports/state-backend');await mkdir(out,{recursive:true});
const report={environment:'Chromium / SwiftShader software rendering. Restore fixtures are diagnostics, not earned campaign progress.',checks:[],errors:[]};
let browser;
function assert(value,message){if(!value)throw Error(message);}
const save=()=>writeFile(resolve(out,'browser-results.json'),JSON.stringify(report,null,2));
async function check(name,fn){try{const details=await fn();report.checks.push({name,status:'pass',details});console.log('PASS',name);}catch(e){report.checks.push({name,status:'fail',error:e.stack});console.log('FAIL',name,e.message);throw e;}finally{await save();}}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/tmp/gv-chromium/chromium',headless:true,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--ignore-gpu-blocklist','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:800}});const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>{report.errors.push(e.message);console.log('ERROR',e.message);});
 await page.addInitScript(()=>{if(!localStorage.getItem('galevein_gfx'))localStorage.setItem('galevein_gfx','low');});
 const boot=async()=>{await page.goto(origin+'/?notrailer',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.SIM?.rigHealth().loaded&&SIM.structureSnapshot(),null,{timeout:180000});};
 await check('boot with backend and clean profile',async()=>{await boot();assert(await page.locator('#saveStatus').textContent(),'save status');return page.evaluate(()=>SIM.state());});
 await check('normal Story launch and save-to-hub create a resumable flight',async()=>{await page.mouse.click(12,250);await page.locator('#startBtn').click();await page.locator('[data-lobby-mode="story"]').click();await page.waitForFunction(()=>SIM.state().started&&!SIM.state().launching);await page.keyboard.press('Escape');await page.locator('#saveAndHub').click();await page.waitForFunction(()=>!SIM.state().started);const data=await page.evaluate(()=>SIM.saveState().data);assert(data.checkpoint,'checkpoint missing');report.firstCheckpoint=data.checkpoint;return {health:data.checkpoint.state.hp,position:data.checkpoint.dragon.position};});
 await check('reload and Continue restore saved position and pause before flight',async()=>{await boot();await page.mouse.click(12,250);await page.locator('#startBtn').click();await page.locator('#continueFlight').click();await page.waitForFunction(()=>SIM.state().started&&SIM.state().paused);const s=await page.evaluate(()=>SIM.state());const c=report.firstCheckpoint;assert(s.score===c.rings.filter(Boolean).length,'score mismatch');assert(s.pos.every((v,i)=>Math.abs(v-c.dragon.position[i])<.11),'position mismatch');await page.screenshot({path:resolve(out,'continued-flight.jpg'),type:'jpeg',quality:78});await page.locator('#saveAndHub').click();return s;});
 let fixture;
 await check('import diagnostic second-wave save and restore combat/loadout without duplicate rewards',async()=>{
  fixture=await page.evaluate(()=>{const d=SIM.saveState().data,c=d.checkpoint;c.state.tutDone=true;c.tutorial=[true,true,true];c.rings=c.rings.map((_,i)=>i<4);c.state.hp=73;c.state.raidDone=false;c.state.charges=1.7;c.loadout.scales=26;c.loadout.upgrades.rudder=2;d.profile={...d.profile,scales:26,upgrades:{...c.loadout.upgrades},highestChapter:2};c.raid={on:true,wave:2,hearth:82,riders:[{position:[200,80,-30],hp:1.6,yaw:.3,speed:34,fireCd:1,diveCd:5,orbit:1}]};c.towers[0]={hp:0,destroyed:true};return d;});
  await page.locator('#savePanel summary').click();await page.locator('#saveFile').setInputFiles({name:'journey.json',mimeType:'application/json',buffer:Buffer.from(encodeSave(fixture))});await page.waitForFunction(()=>SIM.saveState().data.profile.scales===26);
  await page.locator('#continueFlight').click();await page.waitForFunction(()=>SIM.state().started&&SIM.state().paused);
  const actual=await page.evaluate(()=>({state:SIM.state(),raid:SIM.campaignState(),upgrades:SIM.upgrades(),tower:SIM.combatState().towers[0]}));
  assert(actual.state.hp===73&&actual.state.scales===26&&actual.state.score===4,'loadout or health mismatch');assert(actual.raid.wave===2&&actual.raid.hearth===82&&actual.raid.riders.length===1,'raid mismatch');assert(actual.upgrades.rudder===2&&actual.tower.destroyed,'upgrade/tower mismatch');await page.screenshot({path:resolve(out,'restored-raid.jpg'),type:'jpeg',quality:78});await page.locator('#saveAndHub').click();return actual;
 });
 await check('server backup stores the browser journey and survives a local-save loss',async()=>{
  await page.locator('#savePanel').evaluate(e=>e.open=true);await page.locator('[data-save="connect"]').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('device + server'));
  const remote=await page.evaluate(()=>fetch('/api/save').then(r=>r.json()));assert(remote.save.profile.scales===26,'server missed save');
  // Simulates lost browser save keys while retaining the authenticated server session cookie.
  await page.evaluate(()=>{localStorage.removeItem('galevein_save_v1');localStorage.removeItem('galevein_save_v1_backup');});
  await boot();await page.mouse.click(12,250);await page.locator('#startBtn').click();await page.locator('#savePanel summary').click();await page.locator('[data-save="connect"]').click();await page.locator('[data-save="remote"]').click();
  assert((await page.evaluate(()=>SIM.saveState().data)).profile.scales===26,'server restore failed');await page.screenshot({path:resolve(out,'journey-backups.jpg'),type:'jpeg',quality:78});return {revision:remote.revision};
 });
 await check('real Forge purchase persists across reload',async()=>{
  await page.locator('#continueFlight').click();await page.waitForFunction(()=>SIM.state().started&&SIM.state().paused);await page.locator('#resumeFlight').click();await page.keyboard.press('KeyB');await page.locator('button[data-up="scaleplate"]').click();assert(await page.evaluate(()=>SIM.upgrades().scaleplate===1),'purchase failed');
  await page.keyboard.press('KeyB');await page.keyboard.press('Escape');await page.locator('#saveAndHub').click();await boot();return page.evaluate(()=>{if(SIM.upgrades().scaleplate!==1||SIM.state().scales!==20)throw Error('purchase lost');return {upgrades:SIM.upgrades(),scales:SIM.state().scales};});
 });
 await check('no browser exceptions',async()=>{assert(report.errors.length===0,report.errors.join(';'));});
}catch(e){report.fatal=e.stack;console.log('FATAL',e.stack);process.exitCode=1;}finally{await save();await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
