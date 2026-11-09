import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createAudience,HELP,WELCOME,VOICE} from '../integrations/tikfinity/audience.js';
import {createAudienceVoice} from '../integrations/tikfinity/audience-voice.js';
import {createLiveRuntime} from '../integrations/tikfinity/live-runtime.js';
let at=100000,ready=false;const sent=[],saved=[];
const guide=createAudience({now:()=>at,save:c=>saved.push(c),sendChat:t=>{if(!ready)return false;sent.push(t);return true;}});
const m=(event,id,comment,user='1')=>({event,data:{msgId:id,user:{userId:user,uniqueId:'fixture'+user},comment}});
guide.receive(m('roomUser','count',null));assert.equal(guide.snapshot().current,null);
guide.receive(m('member','join'));let s=guide.snapshot();assert.equal(s.welcomed,1);assert.equal(s.voice.text,VOICE);assert.equal(s.queued,1);
guide.receive(m('member','join'));guide.receive(m('chat','hello','olá'));assert.equal(guide.snapshot().welcomed,1);
guide.receive(m('chat','help','!comandos'));s=guide.snapshot();assert.equal(s.helped,1);assert.deepEqual(s.current.pages,HELP);assert.equal(s.queued,4,'help replaces unsent welcome');
guide.receive(m('chat','help','!comandos'));guide.receive(m('chat','help2','!help'));assert.equal(guide.snapshot().helped,1);
guide.tick();assert.equal(sent.length,0);ready=true;guide.tick();assert.equal(sent.length,1);guide.tick();assert.equal(sent.length,1);at+=6000;guide.tick();assert.equal(sent.length,2);
at+=31000;guide.receive(m('chat','help3','!ajuda'));assert.equal(guide.snapshot().helped,2);
const before=guide.snapshot().queued;guide.test('welcome');assert.equal(guide.snapshot().queued,before,'preview never enters real chat queue');assert.equal(guide.snapshot().current.simulate,true);
guide.configure({voice:false,chat:false,volume:200,voiceEngine:'untrusted'});assert.equal(guide.snapshot().voice,null);assert.equal(guide.snapshot().queued,0);assert.equal(saved.at(-1).volume,1);assert.equal(saved.at(-1).voiceEngine,'browser');
for(let i=0;i<100;i++)guide.receive(m('member','burst'+i,null,String(i+10)));assert.ok(guide.snapshot().welcomed<=2,'global welcome interval');
guide.configure({help:true,chat:true});for(let i=0;i<30;i++)guide.receive(m('chat','h'+i,'!help',String(i+100)));assert.ok(guide.snapshot().queued<=12);
at+=61000;guide.tick();assert.equal(guide.snapshot().queued,0,'stale chat discarded');guide.stop();assert.equal(guide.snapshot().current,null);
// The welcome phrase is fixed; user-controlled comments and display names are not spoken.
assert.ok(WELCOME.includes('!help'));assert.ok(HELP.every(line=>line.length<=150));
const dir=mkdtempSync(resolve(tmpdir(),'fw-audience-'));let socket,events=[],notices=[],paused=false,demo=false;
class Socket{constructor(){socket=this;}close(){}}
const runtime=createLiveRuntime({filename:resolve(dir,'intake.sqlite'),getState:()=>({id:'test',paused,demo,waitingForFirstJoin:true}),enqueue:e=>{events.push(e);return true;},onAudience:m=>notices.push(m.event),connectionOptions:{WebSocketClass:Socket}});
const send=m=>socket.onmessage({data:JSON.stringify(m)});runtime.enable();socket.onopen();
send(m('member','m'));send(m('chat','h','!help'));send(m('chat','c','!comandos'));assert.deepEqual(notices,['member','chat','chat']);assert.equal(events.length,0,'guidance cannot start a match');
paused=true;send(m('member','paused'));demo=true;paused=false;send(m('member','demo'));assert.equal(notices.length,3);demo=false;send(m('chat','join-faction','!vermelho'));assert.equal(events.length,1);runtime.close();
// Fish integration is tested against a stub, with no paid provider calls or secrets.
let calls=0;const voice=createAudienceVoice({folder:resolve(dir,'voice'),fetcher:async(url,options)=>{calls++;if(url.endsWith('status'))return Response.json({teams:{A:true}});assert.equal(JSON.parse(options.body).text,VOICE);return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'audio/mpeg'}});}});
assert.equal((await voice.status()).configured,true);await assert.rejects(()=>voice.audio('arbitrary'));const audios=await Promise.all([voice.audio('welcome'),voice.audio('welcome')]);assert.equal(calls,2);assert.deepEqual(audios[0],audios[1]);await voice.audio('welcome');assert.equal(calls,2,'persistent fixed phrase cache');
console.log('PASS audience: entry fallback, help aliases before faction, cooldowns, dedupe, bounded queue, no replay, local previews, disabled modes, cached voice API (stub).');
const originalFetch=globalThis.fetch;let directCalls=0;
try{
 globalThis.fetch=async url=>{assert.equal(url,'https://api.fish.audio/v1/tts');directCalls++;return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'audio/mpeg'}});};
 const standalone=createAudienceVoice({folder:resolve(dir,'platform-voice'),readConfig:()=>({FISH_AUDIO_API_KEY:'fixture-platform',FISH_AUDIO_VOICE_ID_A:'fixture-a',FISH_AUDIO_VOICE_ID_B:'fixture-b'}),fetcher:async()=>{throw Error('Jelly closed');}});
 assert.equal((await standalone.status()).configured,true);await standalone.audio('welcome');assert.equal(directCalls,1);
 console.log('PASS shared platform voice works with Jelly closed (provider stub).');
}finally{globalThis.fetch=originalFetch;}
