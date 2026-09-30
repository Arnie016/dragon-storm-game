// CPU rendering/checks: verifies chart caching and live state overlays. This is
// a reproducible illustrative chart, not a screenshot of completed gameplay.
import assert from 'node:assert/strict';
import {createRequire, registerHooks} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {createNavigationMap} from '../../world-expansion/modules/navigationMap.js';
import * as world from '../../world-expansion/modules/worldMap.js';
const hooks=registerHooks({resolve(specifier,context,nextResolve){
  return nextResolve(specifier==='three'?new URL('../../vendor/three.module.js',import.meta.url).href:specifier,context);
}});
const {sampleMountainHeight}=await import('../../world-expansion/modules/mountainTerrain.js');
hooks.deregister();
const require=createRequire(import.meta.url);
const canvasModule=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}) : '@napi-rs/canvas';
const {createCanvas}=require(canvasModule);
const canvas=createCanvas(900,900);
const chart=createNavigationMap({canvas,world,canvasFactory:createCanvas,
  terrainHeight:(x,z)=>Math.max(world.homeHeight(x,z),sampleMountainHeight(x,z))});
const rings=world.ROUTE.map(([x,y,z],i)=>({position:{x,y,z},userData:{hit:i<5}}));
const state={player:{x:800,y:70,z:-640,yaw:-.6},rings,tutorialDone:true,
  objective:rings[5].position,objectiveLabel:'Thread the Serpent Reach',
  towers:world.KEEPERS.lighthouses.map(([x,z,y],i)=>({lampPos:{x,y:y+42,z},hp:i===0?0:3,maxHp:4,destroyed:i===0})),
  gates:world.CANYON.filter((_,i)=>i%2===0).map(([x,z],i)=>({position:{x,y:34,z},userData:{hit:i===0}})),
  sites:[{x:-560,z:-420,done:false},{x:-950,z:-480,done:false}],raid:false};
chart.draw(state);
const first=chart.getStats();
assert(first.cached&&first.samples>1000,'terrain must be sampled and cached');
state.player.yaw+=.1;chart.draw(state);
assert.equal(chart.getStats().samples,first.samples,'live overlays must not regenerate the terrain');
chart.invalidate();chart.draw(state);
assert.equal(chart.getStats().samples,first.samples*2,'invalidation must rebuild the terrain');
const last=chart.getStats();
await writeFile(new URL('navigation-map.png',import.meta.url),canvas.toBuffer('image/png'));
chart.dispose();chart.draw(state);assert.equal(chart.getStats().cached,false,'disposed charts release their cache');
const result={passed:true,checks:3,kind:'CPU canvas preview with synthetic route progression',size:[canvas.width,canvas.height],terrainSamplesPerBuild:first.samples,bounds:last.bounds};
await writeFile(new URL('navigation-map-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
