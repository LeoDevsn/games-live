import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,ANNOUNCEMENT_MS,PREPARATION_MS} from '../src/engine.mjs';
import {createAudience} from '../src/audience.mjs';
import {createRegistrationIntake,PENDING_LIKE_MS} from '../src/registration.mjs';
import {createAdapter} from '../src/tikfinity.mjs';
function fixture(saved){let at=100000;const engine=createEngine(),messages=[],audience=createAudience({clock:()=>at,onMessage:j=>messages.push(j)});const intake=createRegistrationIntake({engine,audience,pending:saved,clock:()=>at});return {engine,intake,messages,advance:ms=>at+=ms};}
const like=(f,id,following)=>f.intake.receive({kind:'like',id,name:id,count:1,following});

test('follow then zero-metadata likes cannot erase a confirmed next-round registration, including across recovery',()=>{
 const f=fixture(),adapter=createAdapter();like(f,'a',true);like(f,'b',true);f.engine.tick(ANNOUNCEMENT_MS+PREPARATION_MS);
 const send=(intake,event,data)=>intake.receive(adapter.normalize({event,data:{userId:'new',nickname:'New',...data}}));
 send(f.intake,'like',{likeCount:1,followRole:0,msgId:'before'});assert.equal(f.engine.entryStatus('new').next,false);
 send(f.intake,'follow',{msgId:'follow'});assert.equal(f.engine.entryStatus('new').next,true);
 send(f.intake,'like',{likeCount:15,followRole:0,followInfo:{followStatus:0},msgId:'after'});assert.equal(f.engine.entryStatus('new').next,true);assert.equal(f.engine.identity('new').following,true);
 const game=createEngine(f.engine.settings,f.engine.exportState()),intake=createRegistrationIntake({engine:game,audience:createAudience(),pending:f.intake.exportState()});
 send(intake,'member',{followRole:0,msgId:'member'});send(intake,'like',{likeCount:1,followRole:0,msgId:'restart-like'});assert.equal(game.entryStatus('new').next,true);
 const saved=game.exportState();saved.players.find(([id])=>id==='b')[1].hp=2;const next=createEngine(game.settings,saved);next.hit('a','b');next.tick(next.settings.intermissionSeconds*1000);
 assert.equal(next.snapshot().round,2);assert.ok(next.snapshot().players.some(p=>p.id==='new'&&p.hp===20),'the confirmed queued viewer actually spawns next round');
 send(intake,'like',{likeCount:1,isFollower:false,msgId:'explicit-revoke'});assert.equal(game.entryStatus('new').next,false);assert.equal(game.identity('new').following,false);
});

test('a real like received before follow evidence is retained and admitted as soon as the follow arrives',()=>{
 const f=fixture();assert.equal(like(f,'new',false),false);assert.equal(f.engine.snapshot().alive,0);assert.equal(f.intake.snapshot().pendingPlayers.length,1);
 f.intake.receive({kind:'follow',id:'new',name:'new',following:true});assert.equal(f.engine.snapshot().alive,1);assert.equal(f.intake.snapshot().pendingPlayers.length,0);assert.equal(f.messages.at(-1).kind,'entry');
 f.intake.receive({kind:'follow',id:'no-like',following:true});assert.equal(f.engine.snapshot().alive,1,'a follow alone cannot join');
});

test('checks run every two seconds, after the round ends and at five seconds before combat',()=>{
 const f=fixture();like(f,'a',true);like(f,'b',true);f.engine.tick(ANNOUNCEMENT_MS);f.intake.observe(f.engine.snapshot());
 const first=f.intake.snapshot().validation.at;f.advance(1999);f.intake.observe(f.engine.snapshot());assert.equal(f.intake.snapshot().validation.at,first);f.advance(1);f.intake.observe(f.engine.snapshot());assert.equal(f.intake.snapshot().validation.reason,'interval');
 like(f,'late-status',false);f.engine.apply({kind:'identity',id:'late-status',following:true});f.engine.tick(PREPARATION_MS-5000);f.intake.observe(f.engine.snapshot());assert.equal(f.intake.snapshot().validation.reason,'five-seconds');assert.equal(f.engine.snapshot().players.some(p=>p.id==='late-status'),true);
 f.engine.tick(5000);const s=f.engine.exportState();for(const [id,p]of s.players)if(id!=='a')p.hp=0;s.phase='intermission';s.resultUntil=s.now+10000;const g=createEngine(f.engine.settings,s),a=createAudience(),i=createRegistrationIntake({engine:g,audience:a});i.observe(g.snapshot());assert.equal(i.snapshot().validation.reason,'round-ended');
});

test('late validated users stay out of combat, queue for next round and spawn before its thirty-second countdown',()=>{
 const f=fixture();like(f,'a',true);like(f,'b',true);f.engine.tick(ANNOUNCEMENT_MS+PREPARATION_MS);
 like(f,'queued',false);f.intake.receive({kind:'identity',id:'queued',following:true});assert.equal(f.engine.snapshot().queued,1);assert.equal(f.engine.snapshot().players.some(p=>p.id==='queued'),false);
 const saved=f.engine.exportState();saved.players.find(([id])=>id==='b')[1].hp=2;const game=createEngine(f.engine.settings,saved);game.hit('a','b');game.tick(game.settings.intermissionSeconds*1000);assert.equal(game.snapshot().players.some(p=>p.id==='queued'),true);game.apply({kind:'like',id:'another',following:true,count:1});game.tick(ANNOUNCEMENT_MS);assert.equal(game.snapshot().countdown,30);
});

test('pending requests persist, never invent a follower, expire and do not register silent users in later rounds',()=>{
 const f=fixture();like(f,'unknown',false);const saved=f.intake.exportState(),restored=fixture(saved);restored.engine.apply({kind:'identity',id:'unknown',name:'unknown',following:false});restored.intake.validate('interval');assert.equal(restored.engine.snapshot().alive,0);assert.equal(restored.intake.snapshot().pendingPlayers.length,1);
 restored.advance(PENDING_LIKE_MS+1);restored.intake.validate('interval');assert.equal(restored.intake.snapshot().pendingPlayers.length,0);
 f.engine.resetRound();f.engine.apply({kind:'follow',id:'unknown'});f.intake.validate('round-ended');assert.equal(f.engine.snapshot().alive,0);assert.equal(f.intake.snapshot().pendingPlayers.length,0);
});
