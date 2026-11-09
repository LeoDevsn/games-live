import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../src/engine.mjs';
import {createAudience,phrase} from '../src/audience.mjs';
import {BASE_BOUNDS,DEATH_MATCH,boundsForArea,constrainToArena} from '../src/arena.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const join=(g,id)=>{g.apply({kind:'follow',id,name:id});g.apply({kind:'like',id,count:1});};
function fixture(total=10,live=2,area=.2){
 const base=createEngine({speed:40});for(let i=0;i<total;i++)join(base,'p'+i);
 const state=base.exportState();state.phase='running';state.arena.area=state.arena.target=area;state.nextItemAt=1e9;
 state.players.forEach(([,p],i)=>Object.assign(p,{hp:i<live?20:0,attackAt:1e9,shieldUntil:1e9,nextTurn:1e9,x:470+i*140,y:860,angle:Math.PI/2}));
 return createEngine(base.settings,state);
}
test('exactly two survivors trigger Death Match once; three survivors keep the normal rules and a two-player match triggers only at combat start',()=>{
 const g=fixture(10,3,1);assert.equal(g.snapshot().deathMatch.active,false);const state=g.exportState();state.players[2][1].hp=2;state.players[2][1].shieldUntil=0;state.players[0][1].attackAt=0;const duel=createEngine(g.settings,state);assert.equal(duel.hit('p0','p2'),true);assert.equal(duel.snapshot().deathMatch.active,true);near(duel.snapshot().arena.target,.2);assert.equal(duel.snapshot().effects.filter(e=>e.kind==='deathmatch').length,1);duel.tick(1000);assert.equal(duel.snapshot().effects.filter(e=>e.kind==='deathmatch').length,1);
 const two=createEngine();join(two,'a');join(two,'b');two.tick(34950);assert.equal(two.snapshot().deathMatch.active,false);near(two.snapshot().arena.target,1);two.tick(50);assert.equal(two.snapshot().phase,'running');assert.equal(two.snapshot().deathMatch.active,true);near(two.snapshot().arena.target,.2);
});
test('duel shrinks gradually to twenty percent before counting the first three seconds',()=>{
 const g=fixture(2,2,1);near(g.snapshot().arena.target,.2);g.tick(1000);assert.ok(g.snapshot().arena.area>.9);assert.equal(g.exportState().deathMatch.elapsed,0);
 for(let i=0;i<500&&g.snapshot().arena.area>.2+1e-9;i++)g.tick(50);
 near(g.snapshot().arena.area,.2);near(g.snapshot().arena.target,.2);g.tick(2950);near(g.snapshot().arena.target,.2);g.tick(50);near(g.snapshot().arena.target,.19);assert.ok(g.snapshot().arena.area>.19);g.tick(300);near(g.snapshot().arena.area,.19);
});
test('Death Match reduces one percentage point every three seconds, stops at five percent and keeps avatars inside the real circle',()=>{
 const g=fixture();
 for(let i=1;i<=17;i++){
  g.tick(2950);near(g.snapshot().arena.target,Math.max(.05,.2-(i-1)*.01));g.tick(50);near(g.snapshot().arena.target,Math.max(.05,.2-i*.01));
  const s=g.snapshot();for(const p of s.players){const copy={...p};constrainToArena(copy,s.bounds);near(copy.x,p.x);near(copy.y,p.y);}
 }
 g.tick(1000);near(g.snapshot().arena.area,.05);near(g.snapshot().arena.target,.05);const b=g.snapshot().bounds;near(Math.PI*b.radius*b.radius,(BASE_BOUNDS.right-BASE_BOUNDS.left)*(BASE_BOUNDS.bottom-BASE_BOUNDS.top)*.05);near(b.cornerRadius,b.radius);
 near(boundsForArea(.01).radius,boundsForArea(DEATH_MATCH.minArea).radius);
});
test('partial duel clock, area and announcement state survive recovery; victory ends it and next round clears it',()=>{
 const g=fixture();g.tick(11950);const saved=g.exportState(),restored=createEngine(g.settings,saved);assert.equal(restored.snapshot().effects.filter(e=>e.kind==='deathmatch').length,0);g.tick(50);restored.tick(50);assert.deepEqual(g.exportState(),restored.exportState());near(g.snapshot().arena.target,.16);
 const winning=g.exportState();winning.players[0][1].attackAt=0;winning.players[1][1].hp=2;winning.players[1][1].shieldUntil=0;const end=createEngine(g.settings,winning);end.hit('p0','p1');assert.equal(end.snapshot().phase,'intermission');assert.equal(end.snapshot().deathMatch.active,false);end.resetRound();near(end.snapshot().arena.area,1);assert.equal(end.exportState().deathMatch.active,false);assert.equal(end.exportState().deathMatch.elapsed,0);
});
test('updating an existing ten-percent duel preserves its size and partial clock, then continues down to the new five-percent limit',()=>{
 const base=fixture(),saved=base.exportState();saved.arena.version=10;saved.arena.area=saved.arena.target=.1;saved.deathMatch.elapsed=1950;
 const g=createEngine(base.settings,saved);near(g.snapshot().arena.area,.1);near(g.snapshot().arena.target,.1);g.tick(1000);near(g.snapshot().arena.target,.1);g.tick(50);near(g.snapshot().arena.target,.09);
 g.tick(15000);near(g.snapshot().arena.target,.05);near(g.snapshot().arena.area,.05);
});
test('Plankton announces each duel once to chat and voice, does not repeat on recovery, and gives victory priority over stale phase announcements',async()=>{
 let at=0;const sent=[],messages=[];const a=createAudience({clock:()=>at,onMessage:j=>messages.push(j),sendChat:async message=>{sent.push(message);return true;}}),base={phase:'running',round:1,alive:3,arena:{targetPercent:40},deathMatch:{active:false}};
 a.observe(base);at=1000;const duel={...base,alive:2,arena:{targetPercent:20},deathMatch:{active:true}};a.observe(duel);a.observe(duel);assert.equal(messages.filter(j=>j.kind==='deathmatch').length,1);const job=a.snapshot().jobs[0];assert.equal(job.kind,'deathmatch');assert.equal(job.team,'PLANKTON');assert.ok(job.priority>2&&job.priority<3);await a.pump();assert.equal(sent.length,1);assert.match(sent[0],/Death Match/);
 at=31000;a.observe({...duel,arena:{targetPercent:10}});assert.equal(messages.length,1,'no repetitive closing announcements during the duel');a.observe({...duel,phase:'intermission',winner:{name:'p0'}});assert.equal(a.snapshot().jobs.some(j=>j.kind==='deathmatch'),false);assert.equal(a.snapshot().jobs.at(-1).kind,'winner');
 const recovered=createAudience({clock:()=>at,onMessage:j=>messages.push(j)});recovered.observe(duel);recovered.observe(duel);assert.equal(recovered.snapshot().jobs.length,0);
 a.observe({...base,round:2,phase:'preparation'});a.observe({...duel,round:2});assert.equal(messages.filter(j=>j.kind==='deathmatch').length,2);assert.ok(phrase('deathmatch').length<=300);
});
