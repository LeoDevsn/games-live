import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createStore} from '../src/store.mjs';
test('HTTP/WebSocket: follow + like, avatar privado, dedupe, modos isolados e SQLite',{timeout:20000},async()=>{
 const sockets=new Set();let child;
 const frames=[{event:'follow',data:{userId:'one',nickname:'Primeiro',profilePictureUrl:'https://p16.tiktokcdn.com/avatar.webp?signature=not-for-frontend',msgId:'f1'}},{event:'like',data:{userId:'one',nickname:'Primeiro',likeCount:1,msgId:'l1'}}];
 const encode=m=>{const b=Buffer.from(JSON.stringify(m));return Buffer.concat([b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]),b]);};
 const fixture=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({relayed:true}));});fixture.on('upgrade',(req,socket)=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');for(const frame of [...frames,frames[1]])socket.write(encode(frame));socket.on('data',d=>{if((d[0]&15)===8)socket.end(Buffer.from([0x88,0]));});});await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 const free=http.createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));const base=`http://127.0.0.1:${port}`,db=path.join(mkdtempSync(path.join(tmpdir(),'seguidor-test-')),'arena.sqlite');
 const legacy=createStore(db);legacy.write('music',{enabled:false,volume:.17,selection:'filmic'});legacy.close();
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function get(){return (await fetch(base+'/api/state')).json();}
 async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),ARENA_DB:db,ARENA_CHAT_RELAY_URL:`http://127.0.0.1:${fixture.address().port}/relay`,ARENA_WS_URL:`ws://127.0.0.1:${fixture.address().port}/`},windowsHide:true,stdio:'ignore'});for(let i=0;i<80;i++){try{return await get();}catch{}await wait(40);}throw Error('Servidor não iniciou');}
 async function stop(){if(child?.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}}
 async function post(route,body={}){const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();}
 try{
  let view=await start();assert.deepEqual(view.music,{enabled:false,volume:.17,selection:'liberadas'});assert.equal(view.mode,'simulation');await post('demo',{action:'add',count:10});assert.equal((await get()).game.alive,10);const publicWaiting=await(await fetch(base+'/api/state?audience=1')).json();assert.equal(publicWaiting.mode,'live');assert.equal(publicWaiting.game.alive,0);assert.equal(publicWaiting.latest,'');const liveHtml=await(await fetch(base+'/?studio=1')).text();assert.ok(liveHtml.includes('/live-view.js'));assert.ok(!liveHtml.includes('id="pause"'));assert.ok(!liveHtml.includes('id="testwelcome"'));await post('mode',{mode:'live'});
  for(let i=0;i<80;i++){view=await get();if(view.game.alive===1)break;await wait(40);}assert.equal(view.game.alive,1);assert.equal(view.game.phase,'waiting');assert.equal(view.game.players[0].hp,20);assert.equal(view.game.players[0].likes,1);assert.ok(view.game.players[0].avatar.startsWith('/api/avatar/'));assert.equal(JSON.stringify(view).includes('not-for-frontend'),false);
  assert.equal((await fetch(base+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"action":"add","count":1}'})).status,400);
  assert.equal((await fetch(base+'/api/mode',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.invalid'},body:'{"mode":"simulation"}'})).status,403);
  for(const file of ['/','/?studio=1','/app.js','/render.js','/style.css','/soundtrack.js','/music-catalog.js','/audience.js','/voice-unlock.wav','/plankton-theme.js','/assets/plankton-lab-v1.png','/assets/plankton-reactions-v1.png'])assert.equal((await fetch(base+file)).status,200,file);
  const policy=(await fetch(base+'/')).headers.get('content-security-policy');assert.match(policy,/(?:^|;\s*)media-src 'self' blob:(?:;|$)/);assert.match(policy,/script-src 'self';/);
  const head=await fetch(base+'/assets/audio/filmic-remix.mp3',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'audio/mpeg');assert.equal(Number(head.headers.get('content-length')),4802447);
  const partial=await fetch(base+'/assets/audio/filmic-remix.mp3',{headers:{Range:'bytes=0-63'}});assert.equal(partial.status,206);assert.equal((await partial.arrayBuffer()).byteLength,64);assert.equal(partial.headers.get('content-range'),'bytes 0-63/4802447');
  assert.equal((await fetch(base+'/assets/audio/filmic-remix.mp3',{headers:{Range:'bytes=999999999-'}})).status,416);
  for(const file of ['12th-street-rag-1921.mp3','drunken-sailor-nakarada.mp3']){
   const head=await fetch(base+'/assets/audio/'+file,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'audio/mpeg');assert.ok(Number(head.headers.get('content-length'))>1000000);
   const chunk=await fetch(base+'/assets/audio/'+file,{headers:{Range:'bytes=0-127'}});assert.equal(chunk.status,206);assert.equal((await chunk.arrayBuffer()).byteLength,128);
  }
  const beforeTest=(await get()).audience;const localTest=await post('audience/test',{kind:'winner',name:'Teste'});assert.equal(localTest.job.test,true);assert.match(localTest.job.text,/Teste/);assert.equal((await get()).audience.jobs.length,beforeTest.jobs.length);
  const narrator=await post('audience/config',{volume:.45,character:'B'});assert.equal(narrator.audience.config.volume,.45);assert.equal(JSON.stringify(narrator).includes('FISH_AUDIO_API_KEY'),false);
  assert.deepEqual((await post('music',{enabled:false,volume:.17,selection:'rag'})).music,{enabled:false,volume:.17,selection:'rag'});
  for(const file of ['/.env','/.runtime/arena.sqlite','/src/store.mjs'])assert.equal((await fetch(base+file)).status,404,file);
  const abort=new AbortController(),stream=await fetch(base+'/api/stream',{signal:abort.signal});const data=new TextDecoder().decode((await stream.body.getReader().read()).value);assert.equal(JSON.parse(data.split('\n')[0].slice(6)).game.alive,1);abort.abort();
  await wait(1200);await stop();await start();view=await post('mode',{mode:'live'});await wait(100);view=await get();assert.equal(view.game.alive,1);assert.equal(view.game.players[0].likes,1);assert.equal(view.game.ranking.length,1);assert.deepEqual(view.music,{enabled:false,volume:.17,selection:'rag'});assert.equal(view.audience.config.character,'B');assert.equal(view.audience.config.volume,.45);
  // Actual WebSocket member event confirms an old follower without spawning or re-following.
  const send=(event,data)=>{for(const socket of sockets)socket.write(encode({event,data}));};
  async function until(predicate){for(let i=0;i<60;i++){const s=await get();if(predicate(s))return s;await wait(25);}throw Error('Follower event was not applied');}
  send('member',{user:{id:'old-member',nickname:'Antigo',followRole:1},msgId:'member-old'});
  view=await until(s=>s.game.followers===2);assert.equal(view.game.alive,1);
  send('like',{userId:'old-member',likeCount:1,msgId:'old-like-1'});
  view=await until(s=>s.game.alive===2);assert.ok(view.game.players.some(p=>p.name==='Antigo'));
  send('like',{userId:'old-direct',nickname:'Antigo direto',followRole:2,likeCount:1,msgId:'old-direct-1'});
  await until(s=>s.game.alive===3);
  send('like',{userId:'new-user',likeCount:1,msgId:'new-before-follow'});
  send('follow',{userId:'new-user',msgId:'new-follow'});
  view=await until(s=>s.game.followers===4);assert.equal(view.game.alive,4,'the retained real like is admitted immediately when the follow arrives');
  assert.equal(view.registrations.pendingPlayers.length,0);
  send('like',{userId:'new-user',likeCount:1,msgId:'new-after-follow'});await until(s=>s.game.alive===4);
  const received=(await get()).connection.received;
  send('like',{userId:'new-user',followRole:0,followInfo:{followStatus:0},likeCount:3,msgId:'new-follow-metadata-stale'});
  view=await until(s=>s.connection.received>received);assert.equal(view.game.alive,4,'zero metadata on a real WebSocket like cannot remove the newly confirmed participant');assert.equal(view.game.followers,4);
  assert.equal((await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'new'})})).status,400);await post('mode',{mode:'simulation'});await post('control',{action:'new'});assert.equal((await(await fetch(base+'/api/state?audience=1')).json()).game.alive,4);await wait(1200);await stop();await start();await post('mode',{mode:'live'});
  await until(s=>s.connection.status==='receiving');
  send('like',{userId:'old-member',likeCount:1,msgId:'old-like-after-restart'});
  view=await until(s=>s.game.alive===4&&s.game.players.some(p=>p.name==='Antigo'&&p.likes===2));
  assert.equal(view.game.followers,4);
 }finally{await stop();for(const socket of sockets)socket.destroy();await new Promise(r=>fixture.close(r));}
});
