import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,ANNOUNCEMENT_MS,PREPARATION_MS} from '../src/engine.mjs';
import {entryModel,drawGameEntry} from '../public/game-entry.js';
import {createCanvas} from '@napi-rs/canvas';
const join=(g,id,count=1)=>{g.apply({kind:'follow',id,name:id});return g.apply({kind:'like',id,count});};
const player=(g,id)=>g.snapshot().players.find(p=>p.id===id);
function battle(){const g=createEngine();join(g,'a');join(g,'b');g.tick(ANNOUNCEMENT_MS+PREPARATION_MS);return g;}

test('visible notice precedes a full 30s countdown; movement, hits and new entry obey the exact cutoff',()=>{
 const g=createEngine();join(g,'a');assert.equal(g.snapshot().phase,'waiting');join(g,'b');
 let s=g.snapshot();assert.equal(s.phase,'announcement');assert.equal(s.countdown,0);assert.equal(s.entryOpen,true);
 let model=entryModel('arena',s);assert.match(model.subtitle,/novas inscrições.*próxima/);assert.equal(model.seconds,null);
 const positions=s.players.map(p=>[p.id,p.x,p.y,p.hp]);assert.equal(g.hit('a','b'),false);
 g.tick(ANNOUNCEMENT_MS-50);assert.equal(g.snapshot().phase,'announcement');g.tick(50);s=g.snapshot();assert.equal(s.phase,'preparation');assert.equal(s.countdown,30);
 model=entryModel('arena',s);assert.equal(model.footer,'Contagem iniciada, prepare-se!');assert.match(model.hint,/novos inscritos.*próxima/);drawGameEntry(createCanvas(1080,1920).getContext('2d'),model,1);
 g.tick(PREPARATION_MS-50);assert.equal(g.snapshot().countdown,1);assert.deepEqual(g.snapshot().players.map(p=>[p.id,p.x,p.y,p.hp]),positions);
 join(g,'last-second');assert.ok(player(g,'last-second'));g.tick(50);assert.equal(g.snapshot().phase,'running');assert.equal(g.snapshot().entryOpen,false);
 assert.equal(join(g,'late'),true);s=g.snapshot();assert.equal(s.alive,3);assert.equal(s.totalParticipants,3);assert.equal(s.queued,1);assert.equal(player(g,'late'),undefined);assert.equal(s.ranking.some(p=>p.id==='late'),false);
});

test('new likes confirm next-round presence; silent participants are not automatically spawned',()=>{
 let g=battle();join(g,'late');const before=player(g,'a').likes;
 g.apply({kind:'like',id:'a',count:1});assert.equal(player(g,'a').likes,before+1);assert.equal(g.snapshot().queued,2);
 const saved=g.exportState();saved.players.find(([id])=>id==='b')[1].hp=2;g=createEngine(g.settings,saved);g.hit('a','b');assert.equal(g.snapshot().phase,'intermission');
 g.tick(g.settings.intermissionSeconds*1000);const s=g.snapshot();assert.equal(s.round,2);assert.deepEqual(s.players.map(p=>p.id).sort(),['a','late']);assert.equal(player(g,'b'),undefined);assert.equal(s.queued,0);assert.equal(s.phase,'announcement');assert.ok(s.players.every(p=>p.hp===20));
});

test('queue and partial countdown survive restart without reopening entry or resetting the timer',()=>{
 const g=createEngine();join(g,'a');join(g,'b');g.tick(8000);assert.equal(g.snapshot().countdown,27);
 const restored=createEngine(g.settings,g.exportState());assert.equal(restored.snapshot().countdown,27);
 g.tick(27000);restored.tick(27000);join(g,'late');join(restored,'late');assert.deepEqual(g.exportState(),restored.exportState());assert.equal(restored.snapshot().queued,1);
 const again=createEngine(restored.settings,restored.exportState());assert.equal(again.snapshot().entryOpen,false);assert.equal(again.snapshot().queuedPlayers[0].id,'late');
});

test('likes and gifts accumulated before combat start their abilities only when the countdown finishes',()=>{
 const g=createEngine();join(g,'a',50);join(g,'b');g.apply({kind:'gift',id:'a',giftId:'unmapped'});
 assert.equal(g.snapshot().effects.filter(e=>e.kind==='ability').length,0);g.tick(34950);assert.equal(player(g,'a').boostUntil,0);assert.equal(player(g,'a').hp,20);
 g.tick(50);const s=g.snapshot(),p=player(g,'a');assert.equal(s.phase,'running');assert.equal(s.effects.filter(e=>e.kind==='ability').length,1);assert.equal(p.likes,0);assert.equal(p.boostUntil,s.now+1000);assert.ok(p.healUntil>s.now||p.damageUntil>s.now);
});

test('capacity queues extra users; revoked followers leave the next-round queue and countdown can cancel safely',()=>{
 const g=createEngine({maxPlayers:2});join(g,'a');join(g,'b');assert.equal(join(g,'overflow'),true);assert.equal(g.snapshot().queued,1);
 g.apply({kind:'identity',id:'overflow',following:false});assert.equal(g.snapshot().queued,0);g.tick(5000);g.apply({kind:'identity',id:'b',following:false});assert.equal(g.snapshot().phase,'waiting');
 join(g,'b');assert.equal(g.snapshot().phase,'announcement');g.tick(35000);assert.equal(g.snapshot().alive,2);
});
