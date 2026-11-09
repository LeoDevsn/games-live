import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAudienceUI,speechPages,SPEECH_BOUNDS} from '../public/audience.js';
const settle=()=>new Promise(r=>setImmediate(r));
const job=(id,priority=1)=>({id,text:'Luna, venha para a arena!',expiresAt:90000,priority});
const state=jobs=>({config:{voice:true,chat:true,volume:.8,character:'alternate'},jobs,voice:{configured:true},relay:{connected:false,lastError:null}});
function fixture(studio,blocked=false){
 const gestures=new Map(),nodes=new Map(),stage={children:[],append(n){this.children.push(n);}},html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const element=()=>({value:'',checked:false,hidden:false,textContent:''});for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],element());
 let audio;const requests=[],speaking=[];
 class Media{constructor(){audio=this;this.plays=0;}play(){this.plays++;return blocked?Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'})):Promise.resolve();}pause(){}}
 const fetcher=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return url.endsWith('/test')?Response.json({job:job('preview')}):new Response(Buffer.from('ID3-fixture'),{headers:{'Content-Type':'audio/mpeg'}});};
 const doc={addEventListener:(name,fn)=>gestures.set(name,fn),getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},createElement:element,querySelector:()=>stage};
 const ui=createAudienceUI({studio,document:doc,AudioClass:Media,fetcher,onSpeaking:v=>speaking.push(v),clock:()=>1000});
 return {ui,audio,nodes,requests,stage,speaking,gesture:()=>gestures.get('pointerdown')?.(),unblock(){blocked=false;}};
}
test('autoplay block does not generate paid audio; unlocking plays new jobs once, captions them and ducks music',async()=>{
 const f=fixture(true,true);f.ui.update(state([]));await settle();assert.equal(f.stage.children.length,1);assert.equal(f.stage.children[0].hidden,true);assert.equal(f.nodes.get('testwelcome').onclick,undefined);
 for(let i=0;i<20;i++)f.ui.update(state([job('new')]));assert.equal(f.requests.length,0);assert.equal(f.audio.plays,1);
 f.unblock();await f.gesture();await settle();assert.equal(f.requests.length,1);assert.equal(f.requests[0].body.id,'new');assert.equal(f.stage.children[0].textContent,'Luna, venha para a arena!');assert.equal(f.speaking.at(-1),true);
 f.audio.onended();f.ui.update(state([job('new')]));await settle();assert.equal(f.requests.length,1);assert.equal(f.speaking.at(-1),false);f.ui.stop();
});
test('winner has priority, queued voices never overlap, old snapshot jobs are not replayed',async()=>{
 const f=fixture(true);f.ui.update(state([job('old')]));await settle();assert.equal(f.requests.length,0);
 f.ui.update(state([job('invite'),job('gift',2),job('winner',3)]));await settle();assert.deepEqual(f.requests.map(r=>r.body.id),['winner']);
 f.audio.onended();await settle();assert.deepEqual(f.requests.map(r=>r.body.id),['winner','gift']);f.ui.stop();
});

test('admission interrupts a long invitation, coalesces duplicate pending confirmations and preserves gift audio',async()=>{
 const f=fixture(true);f.ui.update(state([]));await settle();
 const welcome={...job('invitation'),kind:'welcome'};f.ui.update(state([welcome]));await settle();assert.equal(f.requests.at(-1).body.id,'invitation');
 const first={...job('admitted',2.4),kind:'entry',text:'Luna, vaga confirmada na próxima rodada!'};
 f.ui.update(state([welcome,first]));await settle();assert.equal(f.requests.at(-1).body.id,'admitted');assert.equal(f.stage.children[0].textContent,first.text);
 const next={...job('next',2.4),kind:'entry'},latest={...job('latest',2.4),kind:'entry'};
 f.ui.update(state([first,next,latest]));await settle();assert.equal(f.requests.length,2,'current admission is not interrupted by more admission requests');
 f.audio.onended();await settle();assert.equal(f.requests.at(-1).body.id,'latest');assert.equal(f.requests.some(r=>r.body.id==='next'),false);f.ui.stop();
 const gift=fixture(true);gift.ui.update(state([]));await settle();gift.ui.update(state([{...job('gift',2),kind:'gift'}]));await settle();gift.ui.update(state([first]));await settle();assert.equal(gift.requests.length,1,'gift thanks completes before the short admission');gift.audio.onended();await settle();assert.equal(gift.requests.at(-1).body.id,'admitted');gift.ui.stop();
});
test('panel remains silent; preview generates a local test without a live chat request',async()=>{
 const f=fixture(false);f.ui.update(state([job('live')]));await settle();assert.equal(f.audio.plays,0);assert.equal(f.requests.length,0);
 await f.nodes.get('testwelcome').onclick();await settle();assert.deepEqual(f.requests.map(r=>r.url),['/api/audience/test','/api/audience/audio']);assert.equal(f.requests[1].body.id,'preview');f.ui.stop();
});

test('manual test can retry immediately after a media failure instead of waiting for the automatic backoff',async()=>{
 const f=fixture(false);f.ui.update(state([]));await f.nodes.get('testgift').onclick();await settle();assert.equal(f.requests.length,2);
 f.audio.onerror();await f.nodes.get('testwelcome').onclick();await settle();assert.equal(f.requests.length,4);assert.equal(f.speaking.at(-1),true);f.ui.stop();
});

test('operator preview exposes an audio unlock button when the browser blocks playback',async()=>{
 const f=fixture(false,true);f.ui.update(state([]));await f.nodes.get('testwelcome').onclick();assert.equal(f.requests.length,0);assert.equal(f.stage.children.length,2);assert.equal(f.stage.children[0].hidden,false);
 f.unblock();await f.stage.children[0].onclick();await f.nodes.get('testwelcome').onclick();await settle();assert.equal(f.requests.length,2);f.ui.stop();
});


test('public narrator ignores test jobs and never binds manual preview buttons',async()=>{
 const f=fixture(true);f.ui.update(state([]));await settle();f.ui.update(state([{...job('test-voice'),test:true},{...job('sim-voice'),simulate:true}]));await settle();assert.equal(f.requests.length,0);assert.equal(f.nodes.get('testgift').onclick,undefined);assert.equal(f.stage.children.length,1);f.ui.update(state([job('real-winner',3)]));await settle();assert.equal(f.requests[0].body.id,'real-winner');f.ui.stop();
});

test('speech stays above the host inside the broadcast panel and longer phrases advance without clipping',async()=>{
 assert.ok(SPEECH_BOUNDS.x>=44&&SPEECH_BOUNDS.x+SPEECH_BOUNDS.width<=1036);assert.ok(SPEECH_BOUNDS.y>=1320);assert.ok(SPEECH_BOUNDS.y+SPEECH_BOUNDS.height<=1412);
 const text='Aliados, eu preciso de bons jogadores para executar meu plano perfeito! Siga o canal e mande um like para entrar na batalha. Quem ficará de pé para me ajudar?';
 const pages=speechPages(text);assert.ok(pages.length>1);assert.ok(pages.every(page=>Array.from(page).length<=76));assert.equal(pages.join(' '),text);
 const f=fixture(true);f.ui.update(state([]));await settle();f.ui.update(state([{...job('long-welcome'),text}]));await settle();const caption=f.stage.children[0];assert.equal(caption.textContent,pages[0]);f.audio.duration=20;f.audio.currentTime=19;f.audio.ontimeupdate();assert.equal(caption.textContent,pages.at(-1));f.audio.onended();assert.equal(caption.hidden,true);assert.equal(f.audio.ontimeupdate,null);f.ui.stop();
});
