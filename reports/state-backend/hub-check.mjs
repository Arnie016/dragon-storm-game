import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createGameServer} from '../../backend/server.mjs';
import {emptySave} from '../../world-expansion/modules/saveSchema.mjs';
import {encodeSave} from '../../world-expansion/modules/saveStore.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const s=createGameServer({dbPath:':memory:'});await new Promise(r=>s.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${s.address().port}`;
const data=emptySave();data.checkpoint=JSON.parse(await readFile('reports/state-backend/browser-results.json','utf8')).firstCheckpoint;
const report={checks:[],errors:[]};let b;
try{
 b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/tmp/gv-chromium/chromium',headless:true,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--ignore-gpu-blocklist','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(raw=>{localStorage.setItem('galevein_gfx','low');localStorage.setItem('galevein_save_v1',raw);},encodeSave(data));
 await p.goto(origin+'/?notrailer');await p.waitForFunction(()=>window.SIM?.rigHealth().loaded&&SIM.structureSnapshot(),null,{timeout:180000});await p.mouse.click(12,250);await p.locator('#startBtn').click();
 for(const [w,h] of [[1280,800],[800,500]]){
  if(p.viewportSize().width!==w)await p.setViewportSize({width:w,height:h});await p.locator('#savePanel').evaluate(e=>e.open=true);
  await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#lobbyHub')).opacity)>.99);
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
  await p.waitForTimeout(1200);
  await p.screenshot({path:`reports/state-backend/hub-${w}.jpg`,type:'jpeg',quality:80});
  const info=await p.evaluate(()=>{const a=document.querySelector('#continueFlight').getBoundingClientRect(),b=document.querySelector('[data-lobby-mode="story"]').getBoundingClientRect(),c=document.querySelector('#journeyBack').getBoundingClientRect();return {titleHidden:getComputedStyle(document.querySelector('#menu .card>div:first-child')).visibility==='hidden',cardsSeparate:a.right<=b.left,backVisible:c.top>=0&&c.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
  if(!info.titleHidden||!info.cardsSeparate||!info.backVisible||info.overflow)throw Error(JSON.stringify(info));report.checks.push({viewport:[w,h],...info});
 }
 await p.locator('#journeyBack').click();await p.locator('#startBtn').click();report.backNavigation=true;
}catch(e){report.error=e.stack;process.exitCode=1;}finally{await writeFile('reports/state-backend/hub-results.json',JSON.stringify(report,null,2));await b?.close();s.closeAllConnections();await new Promise(r=>s.close(r));}
console.log(JSON.stringify(report));
