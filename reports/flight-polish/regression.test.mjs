import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { segmentSphereT, segmentColumnT } from '../../world-expansion/modules/combatMath.mjs';
const p = (x,y=0,z=0) => ({x,y,z});
const approx = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-9, `${actual} ≠ ${expected}`);
const tower = {x:0,z:0,r:2,top:8};

test('high-speed segment hits a sphere even when both endpoints are outside', () => {
  approx(segmentSphereT(p(-100),p(100),p(0),2),.49);
});
test('sphere endpoint and tangent contacts register', () => {
  approx(segmentSphereT(p(-4),p(-2),p(0),2),1);
  approx(segmentSphereT(p(-4,2),p(4,2),p(0),2),.5);
});
test('stationary sphere queries distinguish inside from outside', () => {
  assert.equal(segmentSphereT(p(1),p(1),p(0),2),0);
  assert.equal(segmentSphereT(p(3),p(3),p(0),2),Infinity);
});
test('sphere behind the projectile or past the endpoint is not hit', () => {
  assert.equal(segmentSphereT(p(4),p(10),p(0),2),Infinity);
  assert.equal(segmentSphereT(p(-10),p(-4),p(0),2),Infinity);
});
test('sphere intersection works along steep vertical trajectories', () => {
  approx(segmentSphereT(p(0,20),p(0,-20),p(0),2),.45);
});
test('invalid sphere inputs do not leak NaN into collision ordering', () => {
  assert.equal(segmentSphereT(p(NaN),p(2),p(0),2),Infinity);
  assert.equal(segmentSphereT(p(-4),p(4),p(0),-1),Infinity);
});
test('cylinder side crossing records earliest wall entry', () => {
  approx(segmentColumnT(p(-10,5),p(10,5),tower),.4);
});
test('horizontal flight over cylinder top remains clear', () => {
  assert.equal(segmentColumnT(p(-10,9),p(10,9),tower),Infinity);
});
test('vertical trajectories collide with the top cap without lateral movement', () => {
  approx(segmentColumnT(p(0,20),p(0,0),tower),.6);
  assert.equal(segmentColumnT(p(3,20),p(3,0),tower),Infinity);
});
test('column tangency and inside starts are inclusive', () => {
  approx(segmentColumnT(p(-10,5,2),p(10,5,2),tower),.5);
  assert.equal(segmentColumnT(p(0,5),p(10,5),tower),0);
  assert.equal(segmentColumnT(p(0,5),p(0,5),tower),0);
});
test('finite cylinder bottom rejects shots beneath floating geometry', () => {
  const column={...tower,bottom:4};
  assert.equal(segmentColumnT(p(-10,2),p(10,2),column),Infinity);
  approx(segmentColumnT(p(0,0),p(0,10),column),.4);
});
test('projectile padding expands both cylinder walls and cap', () => {
  approx(segmentColumnT(p(-10,5),p(10,5),tower,1),.35);
  approx(segmentColumnT(p(0,20),p(0,0),tower,1),.55);
});
test('nearest cover wins over a target behind it', () => {
  const from=p(-20,5),to=p(20,5);
  const wall=segmentColumnT(from,to,{...tower,x:-5});
  const target=segmentSphereT(from,to,p(5,5),2);
  assert.ok(wall<target);
  approx(wall,.325);
  approx(target,.575);
});

const profileSource = await readFile(new URL('../../world-expansion/modules/graphicsProfiles.js', import.meta.url),'utf8');
const graphics = await import(`data:text/javascript;base64,${Buffer.from(profileSource).toString('base64')}`);
const {GRAPHICS_PROFILES, normalizeGraphics, graphicsPixelRatio}=graphics;
test('all five graphics levels are present, immutable and ordered by resolution budget', () => {
  assert.deepEqual(Object.keys(GRAPHICS_PROFILES),['low','med','high','extra','extreme']);
  assert.ok(Object.isFrozen(GRAPHICS_PROFILES));
  const profiles=Object.values(GRAPHICS_PROFILES);
  for (let i=0;i<profiles.length;i++) {
    assert.ok(Object.isFrozen(profiles[i]));
    assert.ok(profiles[i].ratio>0 && profiles[i].ratio<=2);
    if(i) assert.ok(profiles[i].ratio>=profiles[i-1].ratio);
  }
  assert.equal(GRAPHICS_PROFILES.low.shadow,0);
  assert.equal(GRAPHICS_PROFILES.med.dof,false);
  assert.equal(GRAPHICS_PROFILES.extreme.dof,true);
});
test('graphics storage values normalize safely and device pixel ratio is bounded', () => {
  assert.equal(normalizeGraphics('medium'),'med');
  assert.equal(normalizeGraphics('extra-high'),'extra');
  assert.equal(normalizeGraphics('__proto__'),'high');
  assert.equal(normalizeGraphics('constructor'),'high');
  for(const level of Object.keys(GRAPHICS_PROFILES)) {
    const ratio=graphicsPixelRatio(GRAPHICS_PROFILES[level],3);
    assert.ok(Number.isFinite(ratio) && ratio>0 && ratio<=2);
  }
});
