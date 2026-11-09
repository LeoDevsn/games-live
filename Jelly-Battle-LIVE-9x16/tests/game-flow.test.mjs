import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {setImmediate} from 'node:timers/promises';
import {entryModel} from '../public/game-entry.js';

// Run the actual classic scripts together. Fake only DOM/media/time and external services.
async function game({configured=true,autoConnect=false,studio=false,welcomes=false,blockedAudio=false}={}){
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const nodes=new Map(),intervals=new Map(),requests=[],played=[],sockets=[];let next=0;
  class Element{
    constructor(id){this.id=id;this.value='';this.checked=false;this.disabled=false;this.textContent='';this.open=false;this.style={setProperty(){}};this.dataset={};this.classList={add(){},remove(){},toggle(){}};this.selectedOptions=[{textContent:'Rosa · 2s'}]}
    append(){} replaceChildren(){} remove(){} setAttribute(){} beginElement(){} endElement(){} scrollIntoView(){}
    querySelector(selector){return selector==='span'?new Element('span'):null}
    closest(){return new Element('parent')}
    getBoundingClientRect(){return{x:0,y:0,width:100,height:100}}
    animate(){return{}}
    showModal(){this.open=true}close(){this.open=false}
  }
  for(const [,id]of html.matchAll(/id="([^"]+)"/g))nodes.set(id,new Element(id));nodes.set('again',new Element('again'));
  for(const id of ['voiceTeam','dynamicTeam'])nodes.get(id).value='A';nodes.get('voiceEvent').value='idle';nodes.get('giftType').value='2';
  const document={body:new Element('body'),getElementById(id){if(!nodes.has(id))throw Error('Missing UI element '+id);return nodes.get(id)},createElement(){return new Element('new')},querySelector(){return new Element('query')},querySelectorAll(){return[]}};
  const storage=new Map();
  const context=vm.createContext({document,console,URL,URLSearchParams,Blob,AbortController,SpeechSynthesisUtterance:class{},
    WebSocket:class{constructor(url){this.url=url;this.readyState=0;sockets.push(this)}open(){this.readyState=1;this.onopen?.()}close(){this.readyState=3;this.onclose?.()}},
    location:{search:studio?'?studio=1':'',protocol:'http:',origin:'http://127.0.0.1:4174'},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    setInterval:(fn,ms)=>{const id=++next;intervals.set(id,{fn,ms});return id},clearInterval:id=>intervals.delete(id),setTimeout:()=>++next,clearTimeout(){},
    Audio:class{constructor(src){this.src=src;this.readyState=4;played.push(this)}play(){if(blockedAudio)return Promise.reject(Object.assign(Error('Audio blocked'),{name:'NotAllowedError'}));this.onplaying?.();return Promise.resolve()}pause(){}},
    fetch:async(url,options)=>{
      if(url==='/api/voice/status')return Response.json({provider:'Fish Audio',teams:{A:configured,B:configured}});
      if(url==='/api/voice/generate'){requests.push(JSON.parse(options.body));return new Response(new Uint8Array([73,68,51]),{headers:{'content-type':'audio/mpeg'}})}
      if(url==='live-config.json')return Response.json({websocketUrl:'ws://localhost:21213/',autoConnect,defaultGiftSeconds:2,gifts:[]});
      if(url==='/api/live/overlay')return Response.json({url:'https://widgets.tikfinity.com/test-widget'});
      throw Error('Unexpected network request '+url);
    }
  });
  vm.runInContext("globalThis.window=globalThis;window.speechSynthesis={getVoices:()=>[],addEventListener(){},cancel(){}};window.matchMedia=()=>({matches:true});window.addEventListener=()=>{};",context);
  for(const file of ['audio-library.js','live-events.js','app.js','motion.js','voices.js','dynamic-voice.js','live.js'])vm.runInContext(await readFile(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
  const run=code=>vm.runInContext(code,context);await run('Promise.all([libraryReady,cloudReady])');run('dynamicVoiceSettings.welcomes='+JSON.stringify(welcomes));
  return{run,nodes,intervals,requests,played,sockets,setBlocked:value=>{blockedAudio=value;}};
}

test('entry calls both character APIs by name, without starting a match, and throttles repeat/burst welcomes',async()=>{
 const g=await game({welcomes:true,studio:true});await g.run('loadLiveConfig()');
 g.run("receiveLiveEvent({event:'member',data:{user:{id:'visitor',nickname:'Larissa'}}})");await setImmediate();
 assert.equal(g.run('running'),false);assert.equal(g.requests.length,1);assert.equal(g.requests[0].team,'A');assert.match(g.requests[0].text,/Larissa/);assert.match(g.requests[0].text,/A no chat/);
 g.played.at(-1).onended();await setImmediate();assert.equal(g.requests.length,2);assert.equal(g.requests[1].team,'B');assert.match(g.requests[1].text,/Larissa/);g.run('stopAudio()');
 g.run("receiveLiveEvent({event:'member',data:{user:{id:'visitor',nickname:'Larissa'}}});receiveLiveEvent({event:'member',data:{user:{id:'other',nickname:'Rafa'}}})");await setImmediate();assert.equal(g.requests.length,2);
});

test('first interaction invites when member is absent; unassigned gifts thank without assigning team or applying a bonus',async()=>{
 const g=await game({welcomes:true});await g.run('loadLiveConfig()');g.run("receiveLiveEvent({event:'chat',data:{userId:'visitor',nickname:'Bia',comment:'oi'}})");await setImmediate();assert.equal(g.requests.length,1);assert.match(g.requests[0].text,/Bia/);assert.equal(g.run('running'),false);g.run('stopAudio()');
 const h=await game();await h.run('loadLiveConfig()');h.run("receiveLiveEvent({event:'gift',data:{userId:'donor',nickname:'Leo',giftId:1,msgId:'one',giftType:1,repeatEnd:true,repeatCount:3,groupId:'g'}});receiveLiveEvent({event:'gift',data:{userId:'donor',nickname:'Leo',giftId:1,msgId:'two',giftType:1,repeatEnd:true,repeatCount:3,groupId:'g'}})");await setImmediate();assert.equal(h.requests.length,1);assert.match(h.requests[0].text,/Leo/);assert.equal(h.run('running'),false);assert.equal(h.run('data.A.boost'),0);assert.equal(h.run('data.B.boost'),0);h.run('stopAudio()');
});

test('missing API is explicit; autoplay failure stops further generation until the visible unlock button is clicked',async()=>{
 const a=await game({configured:false,welcomes:true});await a.run('loadLiveConfig()');a.run("receiveLiveEvent({event:'member',data:{userId:'x',nickname:'Rafa'}})");await setImmediate();assert.equal(a.requests.length,0);assert.match(a.nodes.get('liveVoiceStatus').textContent,/configuração/);
 const g=await game({welcomes:true,blockedAudio:true});await g.run('loadLiveConfig()');g.run("receiveLiveEvent({event:'member',data:{userId:'y',nickname:'Rafa'}})");await setImmediate();assert.equal(g.run('voiceHealth.blocked'),true);assert.equal(g.nodes.get('liveAudioUnlock').hidden,false);assert.equal(g.requests.length,1);g.setBlocked(false);g.nodes.get('liveAudioUnlock').onclick();await setImmediate();assert.equal(g.run('voiceHealth.blocked'),false);assert.equal(g.nodes.get('liveAudioUnlock').hidden,true);g.run('stopAudio()');
});

test('preparation uses folder recordings and starts only after 15 seconds',async()=>{
  const g=await game();g.run('prepareRound()');
  assert.equal(g.run('running'),false);assert.equal(g.run('preparing'),true);assert(g.nodes.get('start').disabled);
  assert(g.played[0].src.includes('tela%20inicial'));
  const countdown=[...g.intervals.values()].find(x=>x.ms===1000);assert(countdown);
  for(let i=0;i<14;i++)countdown.fn();assert.equal(g.run('running'),false);countdown.fn();assert.equal(g.run('running'),true);assert.equal(g.run('remaining'),120);assert.equal(g.requests.length,0);
});

test('rich entry follows the real Jelly round, fits only the ocean and exits when live chat starts',async()=>{
 const g=await game({studio:true});
 g.run(`globalThis.entryModel=${entryModel.toString()};globalThis.drawGameEntry=(c,m,t,o)=>{globalThis.entryPaint={model:m,bounds:o.bounds};};globalThis.createEntryControls=()=>({preview:false,page:0});globalThis.requestAnimationFrame=fn=>{globalThis.entryFrame=fn;};globalThis.Image=class{};document.getElementById('startoverlay').prepend=function(n){this.entryCanvas=n;};document.getElementById('ocean').clientWidth=540;document.getElementById('ocean').clientHeight=600;globalThis.originalCreateElement=document.createElement;document.createElement=tag=>tag==='canvas'?({setAttribute(){},getContext:()=>({clearRect(){}})}):originalCreateElement(tag);`);
 const code=(await readFile(new URL('../public/entry.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/gm,'');g.run(code);g.run('entryFrame(100)');assert.equal(g.run('entryPaint.model.kind'),'jelly');assert.equal(g.run('entryPaint.model.seconds'),null);assert.ok(g.nodes.get('startoverlay').entryCanvas);assert.ok(g.run('entryPaint.bounds.y>=0'));assert.ok(g.run('entryPaint.bounds.y+entryPaint.bounds.h<=1200'));
 g.run('prepareRound();entryFrame(200)');assert.equal(g.run('entryPaint.model.seconds'),15);
 const tick=[...g.intervals.values()].find(x=>x.ms===1000);tick.fn();g.run('entryFrame(300)');assert.equal(g.run('entryPaint.model.seconds'),14);
 for(let i=0;i<14;i++)tick.fn();g.run('entryFrame(400)');assert.equal(g.run('running'),true);assert.equal(g.nodes.get('startoverlay').style.display,'none');
});
test('chat -> likes -> streak gift routes donor name through Fish Audio to the right character',async()=>{
  const g=await game();await g.run('loadLiveConfig()');g.run('start()');
  g.run(`receiveLiveEvent({event:'chat',data:{userId:'one',nickname:'Larissa',comment:'B'}});
    receiveLiveEvent({event:'like',data:{userId:'one',nickname:'Larissa',likeCount:7}});
    receiveLiveEvent({event:'gift',data:{userId:'one',nickname:'Larissa',giftType:1,repeatEnd:false,repeatCount:3,giftId:1,groupId:'combo'}});
    receiveLiveEvent({event:'gift',data:{userId:'one',nickname:'Larissa',giftType:1,repeatEnd:true,repeatCount:3,giftId:1,groupId:'combo'}});
    receiveLiveEvent({event:'gift',data:{userId:'one',nickname:'Larissa',giftType:1,repeatEnd:true,repeatCount:3,giftId:1,groupId:'combo'}});`);
  await setImmediate();assert.equal(g.run('data.B.likes'),7);assert.equal(g.run('data.A.likes'),0);assert.equal(g.run("data.B.users.one.gifts"),3);
  assert.equal(g.requests.length,1);assert.equal(g.requests[0].team,'B');assert(g.requests[0].text.includes('Larissa'));assert(!g.requests[0].text.includes('{nome}'));
  assert(g.played.some(audio=>audio.src.startsWith('blob:')));g.run('stopAudio()');
});
test('unconfigured voice keeps gift bonus and does not attempt paid generation',async()=>{
  const g=await game({configured:false});g.run("start();gift('A',2,'Pedro',4)");
  assert.equal(g.run('data.A.users.Pedro.gifts'),4);assert(g.run('data.A.boost>Date.now()'));assert.equal(g.requests.length,0);assert(g.nodes.get('speechA').textContent.includes('Pedro'));
});
test('victory uses the winner folder and special user IDs cannot corrupt rankings',async()=>{
  const g=await game();g.run("start();likes('B',1,'Patrick fã','__proto__');data.B.score=3;finish()");
  assert.equal(g.run('running'),false);assert(g.played.at(-1).src.includes('/patrick/vitoria/'));assert(g.nodes.get('modalbody').innerHTML.includes('Patrick fã'));assert.equal(g.run("data.B.users['__proto__'].likes"),1);g.run('stopAudio()');
});
test('live connection loads the dedicated invitation widget and disables simulation',async()=>{
  const g=await game();await g.run('connectLive()');assert.equal(g.sockets.length,1);g.sockets[0].open();await setImmediate();
  assert(g.nodes.get('auto').disabled);assert.equal(g.run('botOverlay.src'),'https://widgets.tikfinity.com/test-widget');assert(g.nodes.get('connectionBadge').textContent.includes('conectado'));
  await g.run('connectLive()');assert.equal(g.sockets.length,1);
  g.run('disconnectLive()');assert.equal(g.run('botOverlay'),null);assert.equal(g.nodes.get('auto').disabled,false);
});
test('opening the arena automatically connects when live config requests it',async()=>{
  const g=await game({autoConnect:true});await setImmediate();assert.equal(g.sockets.length,1);assert.equal(g.sockets[0].url,'ws://localhost:21213/');g.run('disconnectLive()');
});

test('in studio mode, first A/B chat starts automatically and a new choice starts next round',async()=>{
  const g=await game({studio:true});await g.run('loadLiveConfig()');
  assert.equal(g.run('running'),false);assert.equal(g.nodes.get('start').disabled,true);
  g.run("receiveLiveEvent({event:'chat',data:{userId:'viewer1',nickname:'Larissa',comment:'A'}})");
  assert.equal(g.run('running'),true);assert.equal(g.run('remaining'),120);
  assert.equal(g.run('data.A.users.viewer1.name'),'Larissa');
  const first=g.run('round');
  g.run("receiveLiveEvent({event:'chat',data:{userId:'viewer2',nickname:'Rafa',comment:'B'}})");
  assert.equal(g.run('round'),first);
  g.run('finish()');assert.equal(g.run('running'),false);
  g.run("receiveLiveEvent({event:'chat',data:{userId:'viewer2',nickname:'Rafa',comment:'B'}})");
  assert.equal(g.run('running'),true);assert.equal(g.run('round'),first+1);
  assert.equal(g.nodes.get('modal').open,false);
});
test('TikFinity disconnect makes local IPv4 fallback available for reconnection',async()=>{
  const g=await game();await g.run('connectLive()');
  assert.equal(g.sockets[0].url,'ws://localhost:21213/');
  g.sockets[0].close();
  assert(g.nodes.get('liveStatus').textContent.includes('reconectando'));
  await g.run('connectLive()');
  assert.equal(g.sockets[1].url,'ws://127.0.0.1:21213/');
  g.run('disconnectLive()');
});


test('LIVE cannot inject manual likes/start or generate forced test speech while real chat still starts the round',async()=>{
 const g=await game({studio:true});await g.run('loadLiveConfig()');assert.equal(g.nodes.get('start').onclick,undefined);assert.equal(g.nodes.get('like').onclick,undefined);assert.equal(g.nodes.get('gift').onclick,undefined);assert.equal(g.nodes.get('testVoice').onclick,undefined);const before=g.requests.length;g.run("voiceLine('Fala de teste','A','welcome',true,{test:true,who:'Teste',dynamic:true})");assert.equal(g.requests.length,before);g.run("receiveLiveEvent({event:'chat',data:{userId:'real-live-viewer',nickname:'Jogador',comment:'A'}})");assert.equal(g.run('running'),true);assert.equal(g.run('data.A.users["real-live-viewer"].name'),'Jogador');
});
