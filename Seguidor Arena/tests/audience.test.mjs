import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudience,phrase,receiveAudienceAction} from '../src/audience.mjs';
import {createEngine} from '../src/engine.mjs';
import {createArenaVoice} from '../src/voice.mjs';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('accepted likes confirm admission immediately, once, independently from voice generation and welcome cooldown',()=>{
 let at=100000;const game=createEngine(),messages=[];
 const audience=createAudience({clock:()=>at,onMessage:job=>messages.push({job,game:game.snapshot()})});
 const apply=a=>receiveAudienceAction(game,audience,a);
 apply({kind:'identity',id:'luna',name:'Luna',following:true});
 apply({kind:'like',id:'luna',count:1});
 let receipts=messages.filter(m=>m.job.kind==='entry');assert.equal(receipts.length,1);
 assert.equal(receipts[0].game.players.some(p=>p.id==='luna'),true,'admission must already exist when the receipt is published');
 assert.match(receipts[0].job.text,/Luna.*confirmada/);assert.equal(receipts[0].job.audioText,'Vaga confirmada! Prepare-se para a batalha!');
 apply({kind:'like',id:'luna',count:25});assert.equal(messages.filter(m=>m.job.kind==='entry').length,1,'ordinary power likes must not repeat the receipt');
 apply({kind:'like',id:'rafa',name:'Rafa',following:true,count:1});assert.equal(messages.filter(m=>m.job.kind==='entry').length,2,'second viewer bypasses the general welcome cooldown');
 game.tick(35000);assert.equal(game.snapshot().phase,'running');
 apply({kind:'like',id:'new',name:'Gui',following:true,count:1});
 const last=messages.at(-1);assert.equal(last.job.kind,'entry');assert.match(last.job.text,/Gui.*próxima rodada/);assert.equal(last.game.players.some(p=>p.id==='new'),false);assert.equal(last.game.queuedPlayers.some(p=>p.id==='new'),true);
 apply({kind:'like',id:'new',count:1});assert.equal(messages.at(-1),last,'queue confirmation is once per admission');
 apply({kind:'like',id:'unknown',name:'Bia',count:1});assert.equal(messages.filter(m=>m.job.kind==='entry').length,3,'unconfirmed followers do not get a false admission');
});

test('short admission voice is cached across names while visual confirmations remain personalized',async()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'arena-entry-cache-'));let calls=0;
 const env={FISH_AUDIO_API_KEY:'private-test-key',FISH_AUDIO_VOICE_ID_A:'voiceA',FISH_AUDIO_VOICE_ID_B:'voiceB',FISH_AUDIO_MODEL:'s2.1-pro-free'};
 const voice=createArenaVoice({folder,readConfig:()=>env,generate:async request=>{calls++;assert.equal((await request.json()).text,'Vaga confirmada na próxima rodada!');return new Response('ID3-fixture',{headers:{'Content-Type':'audio/mpeg'}});}});
 for(const name of ['Luna','Rafa'])await voice.audio({kind:'entry',team:'A',text:phrase('entry',{name,entryClosed:true}),audioText:'Vaga confirmada na próxima rodada!'});
 assert.equal(calls,1);
});

test('active participants and confirmed queue members never receive another welcome, including after ten minutes',()=>{
 let at=100000;const messages=[],game=createEngine(),audience=createAudience({clock:()=>at,onMessage:j=>messages.push(j)});
 const apply=action=>receiveAudienceAction(game,audience,action);
 for(const id of ['luna','rafa'])apply({kind:'like',id,name:id,following:true,count:1});game.tick(35000);
 const before=messages.length;at+=600001;
 apply({kind:'identity',id:'luna',following:true});apply({kind:'like',id:'luna',count:1});apply({kind:'follow',id:'luna',following:true});
 assert.equal(messages.length,before,'renewing next-round presence must not welcome an alive player again');assert.equal(game.entryStatus('luna').next,true);
 apply({kind:'like',id:'gui',name:'Gui',following:true,count:1});const receipt=messages.at(-1);assert.equal(receipt.kind,'entry');assert.match(receipt.text,/próxima rodada/);
 at+=600001;apply({kind:'identity',id:'gui',following:true});apply({kind:'like',id:'gui',count:2});assert.equal(messages.at(-1),receipt,'a queued player has already been acknowledged');
 apply({kind:'gift',id:'luna',giftName:'Rosa'});assert.equal(messages.at(-1).kind,'gift','gift thanks still works for active participants');
});

test('named invitations distinguish existing followers; gift thanks and winner are queued once with cooldowns',async()=>{
 assert.match(phrase('welcome',{name:'Luna',following:true,entryClosed:true}),/próxima rodada/);
 let at=100000;const messages=[],sent=[];const a=createAudience({clock:()=>at,onMessage:j=>messages.push(j),sendChat:async text=>{sent.push(text);return true;}});
 a.observe({round:1,phase:'waiting'});
 a.receive({kind:'identity',id:'old',name:'Luna',following:true});
 assert.match(messages[0].text,/Luna/);assert.match(messages[0].text,/volta/);assert.match(messages[0].text,/like/);
 a.receive({kind:'like',id:'old',name:'Luna'});assert.equal(messages.length,1);
 at+=21000;a.receive({kind:'identity',id:'new',name:'Rafa',following:false});assert.match(messages[1].text,/siga e depois/i);
 a.receive({kind:'gift',id:'gift',name:'Gui',giftName:'Rosa'});assert.match(messages[2].text,/Gui/);assert.match(messages[2].text,/Rosa/);
 a.observe({round:1,phase:'intermission',winner:{name:'Luna'}});a.observe({round:1,phase:'intermission',winner:{name:'Luna'}});assert.equal(messages.filter(j=>j.kind==='winner').length,1);
 assert.match(messages.at(-1).text,/Luna/);assert.equal(messages.at(-1).priority,3);
 await a.pump();await a.pump();assert.equal(sent.length,1);at+=6000;await a.pump();assert.equal(sent.length,2);
 const count=messages.length;a.test('gift','Teste');assert.equal(messages.length,count,'local preview never publishes chat');
 const restored=createAudience({clock:()=>at,seen:a.exportSeen()});restored.receive({kind:'identity',id:'old',name:'Luna'});assert.equal(restored.snapshot().jobs.length,0);
 a.stop();assert.equal(a.snapshot().jobs.length,0);assert.equal(a.snapshot().relay.queued,0);
});

test('old winner is not announced again on restart; API settings persist and expired phrases cannot be generated',()=>{
 let at=0,saved;const a=createAudience({clock:()=>at,save:v=>saved=v});a.observe({round:1,phase:'intermission',winner:{name:'Anterior'}});a.observe({round:1,phase:'intermission',winner:{name:'Anterior'}});assert.equal(a.snapshot().jobs.length,0);
 a.configure({character:'B',volume:.3,voice:false});assert.equal(saved.character,'B');assert.equal(saved.volume,.3);
 const job=a.test('winner','Teste');assert.equal(job.team,'B');assert.equal(a.snapshot().jobs.length,0);at=120001;assert.equal(a.getJob(job.id),null);
 assert.throws(()=>phrase('unknown'));assert.throws(()=>a.configure({volume:4}));
});

test('private saved provider generates named template audio, caches on disk and never exposes its key',async()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'arena-voice-test-'));let calls=0;
 const env={FISH_AUDIO_API_KEY:'private-test-key',FISH_AUDIO_VOICE_ID_A:'voiceA',FISH_AUDIO_VOICE_ID_B:'voiceB',FISH_AUDIO_MODEL:'s2.1-pro-free'};
 const generate=async(request,config)=>{calls++;assert.equal(config.FISH_AUDIO_API_KEY,env.FISH_AUDIO_API_KEY);const body=await request.json();assert.equal(body.team,'B');assert.match(body.text,/Luna/);return new Response(Buffer.from('ID3-audio-fixture'),{headers:{'Content-Type':'audio/mpeg'}});};
 let v=createArenaVoice({folder,readConfig:()=>env,generate});assert.equal(v.status().configured,true);assert.equal(JSON.stringify(v.status()).includes(env.FISH_AUDIO_API_KEY),false);
 const job={id:'fixed',team:'B',text:phrase('winner',{name:'Luna'})};const [one,two]=await Promise.all([v.audio(job),v.audio(job)]);assert.deepEqual(one,two);assert.equal(calls,1);
 v=createArenaVoice({folder,readConfig:()=>env,generate});assert.deepEqual(await v.audio(job),one);assert.equal(calls,1);
 await assert.rejects(()=>v.audio(null));
});
