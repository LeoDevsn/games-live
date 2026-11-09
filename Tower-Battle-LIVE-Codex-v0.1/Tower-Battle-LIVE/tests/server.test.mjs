import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('HTTP + WebSocket reais: fonte compartilhada, dedupe, modos isolados e recuperação SQLite',{timeout:30000},async()=>{
 const sockets=new Set();let connections=0,child;
 const chat={event:'chat',data:{user:{id:'u1',nickname:'Teste'},msgId:'live-once',comment:'A'}};
 const encode=m=>{const b=Buffer.from(JSON.stringify(m));return Buffer.concat([b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]),b]);};
 const fixture=http.createServer();fixture.on('upgrade',(req,socket)=>{
   connections++;sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));
   const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
   socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');socket.write(encode({event:'member',data:{userId:'u1',nickname:'Teste',msgId:'member-once'}}));socket.write(encode(chat));socket.write(encode(chat));
   socket.on('data',data=>{if((data[0]&15)===8)socket.end(Buffer.from([0x88,0]));});
 });await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 const free=http.createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));
 const base=`http://127.0.0.1:${port}`,db=path.join(mkdtempSync(path.join(tmpdir(),'tower-http-')),'tower.sqlite');
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function start(){
   child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),TOWER_DB:db,TOWER_WS_URL:`ws://127.0.0.1:${fixture.address().port}/`,LIVE_AUTOCONNECT:'1'},windowsHide:true,stdio:'pipe'});
   let errors='';child.stderr.on('data',d=>errors+=d);child.stdout.resume();
   for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/state');if(r.ok){const v=await r.json();if(v.connection.received>=3)return v;}}catch{}if(child.exitCode!==null)throw Error(errors);await wait(50);}throw Error('Servidor não iniciou: '+errors);
 }
 const post=async(route,body)=>{const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});assert.equal(r.status,200,await r.clone().text());return r.json();};
 async function stop(){if(!child||child.exitCode!==null)return;const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}
 try{
   let view=await start();assert.equal(view.game.teams.A.blocks,1);assert.equal(view.game.round,1);
   for(const url of ['/','/?studio=1','/main.js','/scene.js','/render.js','/vendor/three.module.js','/vendor/three.core.js','/replay-example.json'])assert.equal((await fetch(base+url)).status,200,url);
   for(const [url,type]of [['/assets/construction-seabed-v1.png','image/png'],['/assets/mr-krabs-nickrewind-v1.png','image/png'],['/assets/plankton-reactions-v1.png','image/png'],['/voice-unlock.wav','audio/wav']]){const r=await fetch(base+url);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),type);}
   assert.equal(view.app,'tower-battle');assert.equal(view.theme.id,'krabs-plankton-v1');assert.ok(view.audience.jobs.some(j=>j.kind==='welcome'));
   const preview=await post('audience/test',{kind:'welcome',team:'B'});assert.equal(preview.job.team,'B');assert.equal(preview.job.test,true);const audienceState=await(await fetch(base+'/api/state?audience=1')).json();assert.equal(audienceState.audience.jobs.some(j=>j.id===preview.job.id),false);
   assert.equal((await fetch(base+'/api/audience/audio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'unknown'})})).status,400);await post('audience/config',{volume:.45,previewTeam:'B'});
   for(const url of ['/.runtime/tower.sqlite','/.env','/src/store.mjs','/../package.json'])assert.equal((await fetch(base+url)).status,404,url);
   const controller=new AbortController();const source=await fetch(base+'/api/stream',{signal:controller.signal});const reader=source.body.getReader();const first=new TextDecoder().decode((await reader.read()).value);const frame=JSON.parse(first.split('\n')[0].slice(6));assert.equal(frame.game.teams.A.blocks,1);controller.abort();
   assert.equal((await fetch(base+'/api/mode',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.invalid'},body:'{"mode":"simulation"}'})).status,403);
   await post('mode',{mode:'simulation'});view=await post('demo',{event:'chat',team:'B'});assert.equal(view.game.teams.B.blocks,1);const publicView=await(await fetch(base+'/api/state?audience=1')).json();assert.equal(publicView.mode,'live');assert.equal(publicView.game.teams.B.blocks,0);assert.equal(publicView.game.teams.A.blocks,1);const publicHtml=await(await fetch(base+'/?studio=1')).text();assert.ok(publicHtml.includes('/live-view.js'));assert.ok(!publicHtml.includes('id="demoA"'));assert.ok(!publicHtml.includes('id="sampleReplay"'));view=await post('mode',{mode:'live'});assert.equal(view.game.teams.B.blocks,0);assert.equal(view.game.teams.A.blocks,1);
   await wait(1200);await stop();view=await start();assert.equal(view.game.teams.A.blocks,1);assert.equal(view.game.ranking[0].blocks,1);assert.equal(view.audience.config.volume,.45);assert.equal(view.audience.config.previewTeam,'B');
   await post('mode',{mode:'simulation'});view=await post('replay',{events:[{at:0,message:{...chat,data:{...chat.data,comment:'B'}}}]});assert.equal(view.mode,'replay');assert.equal(view.game.teams.B.blocks,1);
   view=await post('mode',{mode:'live'});assert.equal(view.game.teams.B.blocks,0);assert.equal(view.game.teams.A.blocks,1);assert.ok(connections>=3);
 }finally{await stop();for(const socket of sockets)socket.destroy();await new Promise(r=>fixture.close(r));}
});
