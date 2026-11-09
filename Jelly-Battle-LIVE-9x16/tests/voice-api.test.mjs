import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const env={FISH_AUDIO_API_KEY:'test-not-a-real-secret',FISH_AUDIO_VOICE_ID_A:'voiceA',FISH_AUDIO_VOICE_ID_B:'voiceB'};
const post=(body,headers={})=>new Request('https://battle.test/api/voice/generate',{method:'POST',headers:{'content-type':'application/json',origin:'https://battle.test',...headers},body:JSON.stringify(body)});

test('readiness for each team never exposes credentials',async()=>{
  const status=async e=>(await worker.fetch(new Request('https://battle.test/api/voice/status'),e)).json();
  assert.deepEqual((await status({})).teams,{A:false,B:false});
  assert.deepEqual((await status({...env,FISH_AUDIO_VOICE_ID_B:''})).teams,{A:true,B:false});
  assert.equal((await status(env)).provider,'Fish Audio');
  assert(!JSON.stringify(await status(env)).includes(env.FISH_AUDIO_API_KEY));
  assert.equal((await worker.fetch(post({team:'A',text:'Olá!'}),{})).status,503);
  assert.deepEqual((await status({...env,FISH_AUDIO_MODEL:'unknown'})).teams,{A:false,B:false});
});
test('validates requests and rejects cross-site generation',async()=>{
  for(const body of [{team:'C',text:'Oi'},{team:'A',text:''},{team:'A',text:'a'.repeat(301)},null])assert.equal((await worker.fetch(post(body),env)).status,400);
  assert.equal((await worker.fetch(post({team:'A',text:'Oi'},{origin:'https://evil.test'}),env)).status,403);
  assert.equal((await worker.fetch(post({team:'A',text:'Oi'},{'sec-fetch-site':'cross-site'}),env)).status,403);
  assert.equal((await worker.fetch(post({team:'A',text:'Oi'},{'content-type':'text/plain'}),env)).status,415);
  assert.equal((await worker.fetch(post({team:'A',text:'x'.repeat(2100)}),env)).status,413);
});
test('Fish Audio receives donor phrase and team voice; cache isolates accounts',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;assert.equal(url,'https://api.fish.audio/v1/tts');
    assert(options.headers.Authorization.startsWith('Bearer test-'));
    assert.equal(options.headers.model,'s2.1-pro');
    const body=JSON.parse(options.body);assert.equal(body.text,'Vamos lá, Larissa!');
    assert.equal(body.format,'mp3');assert.equal(body.reference_id,calls===2?'voiceB':'voiceA');
    return new Response(new Uint8Array([73,68,51,1]),{headers:{'content-type':'audio/mpeg'}});
  };
  try{
    for(const team of ['A','B']){
      const res=await worker.fetch(post({team,text:'Vamos lá, Larissa!'}),env);assert.equal(res.status,200);assert.equal(res.headers.get('x-voice-provider'),'Fish Audio');
    }
    const cached=await worker.fetch(post({team:'A',text:'Vamos lá, Larissa!'}),env);assert.equal(cached.headers.get('x-voice-cache'),'hit');assert.equal(calls,2);
    await worker.fetch(post({team:'A',text:'Vamos lá, Larissa!'}),{...env,FISH_AUDIO_API_KEY:'test-other-account'});assert.equal(calls,3);
  }finally{globalThis.fetch=original}
});
test('provider failures and timeouts do not leak details or block the next request',async()=>{
  const original=globalThis.fetch;
  try{
    const cases=[
      [()=>new Response('secret provider details',{status:401}),502],
      [()=>new Response('private billing details',{status:402}),502],
      [()=>new Response('rate limited',{status:429}),429],
      [()=>new Response('{}',{headers:{'content-type':'application/json'}}),502],
      [()=>new Response(new Uint8Array(),{headers:{'content-type':'audio/mpeg'}}),502],
      [()=>{throw Error('private network information')},504]
    ];
    for(let i=0;i<cases.length;i++){
      globalThis.fetch=cases[i][0];const res=await worker.fetch(post({team:'A',text:'Erro '+i}),env);assert.equal(res.status,cases[i][1]);const body=await res.text();assert(!body.includes('secret provider'));assert(!body.includes('private network'));
    }
  }finally{globalThis.fetch=original}
});
test('same simultaneous phrase makes only one provider call',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;await new Promise(r=>setTimeout(r,10));return new Response(new Uint8Array([73,68,51]),{headers:{'content-type':'audio/mpeg'}})};
  try{
    const results=await Promise.all([1,2].map(()=>worker.fetch(post({team:'B',text:'Valeu, Pedro!'}),env)));
    assert(results.every(r=>r.status===200));assert.equal(calls,1);
  }finally{globalThis.fetch=original}
});
test('serves recordings with accents, spaces and ranges; keeps secrets private',async()=>{
  const page=await worker.fetch(new Request('https://battle.test/'));assert.equal(page.status,200);assert((await page.text()).includes('liveModal'));
  const audio=await worker.fetch(new Request('https://battle.test/assets/audio/bobesponja/capturado/É minha!.mp3',{headers:{range:'bytes=0-15'}}));
  assert.equal(audio.status,206);assert.equal((await audio.arrayBuffer()).byteLength,16);assert.equal(audio.headers.get('content-type'),'audio/mpeg');
  for(const path of ['/.env','/worker/voice.js','/missing'])assert.equal((await worker.fetch(new Request('https://battle.test'+path))).status,404);
  const config=await worker.fetch(new Request('https://battle.test/live-config.json'));assert.equal(config.headers.get('content-type'),'application/json; charset=utf-8');
});
