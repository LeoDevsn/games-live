import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../src/engine.mjs';
import {ITEM_RULES} from '../src/items.mjs';
import {constrainToArena} from '../src/arena.mjs';
import {phrase} from '../src/audience.mjs';
const join=(g,id)=>{g.apply({kind:'follow',id,name:id});g.apply({kind:'like',id,count:1});};
function fixture(count=2){const g=createEngine({speed:40});for(let i=0;i<count;i++)join(g,'p'+i);g.tick(35000);const s=g.exportState();s.players.forEach(([,p],i)=>Object.assign(p,{x:100+(i%5)*200,y:500+Math.floor(i/5)*300,nextTurn:1e9,attackAt:1e9,angle:Math.PI/2}));return {settings:g.settings,state:s};}
const engine=f=>createEngine(f.settings,f.state);
const drop=(s,kind,x,y)=>{s.items.push({id:++s.itemSerial,kind,x,y,radius:ITEM_RULES.radius});};
test('one or two random runes spawn every ten combat seconds, inside the current zone; lobby and countdown never spawn',()=>{
 const g=createEngine();join(g,'p0');g.tick(30000);assert.equal(g.snapshot().items.length,0);join(g,'p1');g.tick(34950);assert.equal(g.snapshot().items.length,0);g.tick(50);assert.equal(g.snapshot().phase,'running');g.tick(9950);assert.equal(g.snapshot().items.length,0);g.tick(50);
 assert.ok([1,2].includes(g.snapshot().effects.filter(e=>e.kind==='item-spawn').length));
 const f=fixture(10);f.state.nextItemAt=f.state.now+50;f.state.arena.area=f.state.arena.target=.4;f.state.players.forEach(([,p])=>p.shieldUntil=1e9);const zone=engine(f);zone.tick(50);let previous=zone.snapshot().effects.filter(e=>e.kind==='item-spawn').length;
 for(let i=0;i<6;i++){const snap=zone.snapshot();for(const item of snap.items){const copy={...item};constrainToArena(copy,snap.bounds);assert.ok(Math.hypot(item.x-copy.x,item.y-copy.y)<1e-8);assert.ok(['fire','shield'].includes(item.kind));}zone.tick(10000);const current=zone.snapshot().effects.filter(e=>e.kind==='item-spawn').length;if(current>previous)assert.ok([1,2].includes(current-previous));previous=current;}
});
test('fire is consumed once and launches eight distinct directions with fixed 2 damage and no healing bonus',()=>{
 const f=fixture(3),s=f.state;s.nextItemAt=1e9;
 Object.assign(s.players[0][1],{x:540,y:860,hp:10,damageUntil:s.now+10000,healUntil:s.now+5000,healTick:s.now+1000});Object.assign(s.players[1][1],{x:700,y:860});Object.assign(s.players[2][1],{x:150,y:550});drop(s,'fire',540,860);
 const g=engine(f);g.tick(50);let snap=g.snapshot();assert.equal(snap.items.length,0);assert.equal(snap.projectiles.length,8);assert.equal(new Set(snap.projectiles.map(p=>Math.atan2(p.vy,p.vx).toFixed(4))).size,8);
 g.tick(350);snap=g.snapshot();assert.equal(snap.players.find(p=>p.id==='p1').hp,18);assert.equal(snap.players.find(p=>p.id==='p0').hp,10);assert.equal(snap.ranking.find(p=>p.id==='p0').damage,2);assert.equal(snap.ranking.find(p=>p.id==='p0').healing,0);assert.equal(snap.effects.filter(e=>e.kind==='pickup').length,1);
 g.tick(500);assert.equal(g.snapshot().players.find(p=>p.id==='p1').hp,18);
});
test('a projectile hits only the first avatar on its path; a fast segment cannot skip an enemy',()=>{
 const f=fixture(3),s=f.state;s.nextItemAt=1e9;Object.assign(s.players[0][1],{x:200,y:860});Object.assign(s.players[1][1],{x:500,y:860,radius:22});Object.assign(s.players[2][1],{x:650,y:860,radius:22});
 s.projectiles=[{id:1,owner:'p0',x:450,y:860,vx:5000,vy:0,radius:7,expiresAt:s.now+3000}];const g=engine(f);g.tick(50);assert.equal(g.snapshot().players.find(p=>p.id==='p1').hp,18);assert.equal(g.snapshot().players.find(p=>p.id==='p2').hp,20);assert.equal(g.snapshot().projectiles.length,0);
});
test('shield pickup blocks contact and projectile damage for exactly three seconds; a second pickup refreshes without stacking',()=>{
 const f=fixture(3),s=f.state;s.nextItemAt=1e9;Object.assign(s.players[0][1],{x:540,y:860});drop(s,'shield',540,860);const g=engine(f);g.tick(50);const until=g.snapshot().players[0].shieldUntil;assert.equal(until,g.snapshot().now+3000);assert.equal(g.hit('p1','p0'),false);
 const saved=g.exportState();saved.projectiles=[{id:2,owner:'p1',x:500,y:864,vx:420,vy:0,radius:7,expiresAt:saved.now+3000}];saved.players.find(([id])=>id==='p1')[1].attackAt=0;
 const blocked=createEngine(g.settings,saved);blocked.tick(50);assert.equal(blocked.snapshot().players[0].hp,20);assert.equal(blocked.snapshot().projectiles.length,0);blocked.tick(2900);assert.equal(blocked.hit('p1','p0'),false);blocked.tick(50);assert.equal(blocked.hit('p1','p0'),true);assert.equal(blocked.snapshot().players[0].hp,18);
 const again=g.exportState(),p=again.players[0][1];drop(again,'shield',p.x,p.y);const refreshed=createEngine(g.settings,again);refreshed.tick(50);assert.equal(refreshed.snapshot().players[0].shieldUntil,refreshed.snapshot().now+3000);
});
test('fire eliminations award real damage, kills, victory and XP exactly once',()=>{
 const f=fixture(),s=f.state;s.nextItemAt=1e9;Object.assign(s.players[0][1],{x:540,y:860});Object.assign(s.players[1][1],{x:680,y:860,hp:2});drop(s,'fire',540,860);const g=engine(f);g.tick(400);const snap=g.snapshot();assert.equal(snap.phase,'intermission');assert.equal(snap.winner.id,'p0');const winner=snap.ranking.find(p=>p.id==='p0');assert.equal(winner.damage,2);assert.equal(winner.kills,1);assert.equal(winner.wins,1);assert.equal(winner.xp,60);g.tick(1000);assert.equal(g.snapshot().ranking.find(p=>p.id==='p0').wins,1);
});
test('item clocks, uncollected runes, shots and shield survive recovery and reset on a new round; old saves migrate',()=>{
 const f=fixture(4),s=f.state;s.nextItemAt=s.now+150;drop(s,'shield',530,1000);drop(s,'fire',800,1000);s.players[0][1].shieldUntil=s.now+2800;s.projectiles=[{id:3,owner:'p0',x:300,y:1000,vx:420,vy:0,radius:7,expiresAt:s.now+3000}];s.itemSerial=3;const g=engine(f),restored=createEngine(f.settings,s);g.tick(500);restored.tick(500);assert.deepEqual(g.exportState(),restored.exportState());assert.ok(g.snapshot().items.length>0);g.resetRound();assert.deepEqual(g.snapshot().items,[]);assert.deepEqual(g.snapshot().projectiles,[]);assert.equal(g.exportState().nextItemAt,0);
 delete s.items;delete s.projectiles;delete s.itemSerial;delete s.nextItemAt;s.players.forEach(([,p])=>delete p.shieldUntil);const old=engine(f);assert.deepEqual(old.snapshot().items,[]);assert.equal(old.exportState().nextItemAt,s.now+10000);
});
test('Arena welcomes identify the correct game for followers and new visitors, with entries open or closed',()=>{
 for(const following of [true,false])for(const entryClosed of [true,false]){const text=phrase('welcome',{name:'Recruta',following,entryClosed});assert.ok(text.includes('Arena Royale do Plankton'));assert.ok(!/jelly|time [ab]/i.test(text));assert.ok(text.length<=300);}
});
