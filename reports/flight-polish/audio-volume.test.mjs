import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const AU = {'),html.indexOf("AU.load('menu'"));
class Audio {
  paused=true; _volume=1;
  set volume(value){if(!Number.isFinite(value)||value<0||value>1)throw new RangeError('Invalid media volume');this._volume=value;}
  get volume(){return this._volume;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
}
test('actual audio adapter clamps boosted impacts and fade targets',()=>{
 let now=0;const context=vm.createContext({Audio,performance:{now:()=>now},requestAnimationFrame:fn=>{now+=100;fn();}});
 vm.runInContext(source+';globalThis.audio=AU;',context);const au=context.audio;
 au.load('impact','impact.mp3',false,1.5);assert.equal(au.el.impact.volume,1);
 for(const [input,expected] of [[1.05,1],[-.5,0],[.7,.7]]){au.play('impact',input);assert.equal(au.el.impact.volume,expected);}
 au.fadeTo('impact',2,100);assert.equal(au.el.impact.volume,1);
 au.fadeTo('impact',-1,100);assert.equal(au.el.impact.volume,0);assert.equal(au.el.impact.paused,true);
});
