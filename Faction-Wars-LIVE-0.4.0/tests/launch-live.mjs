import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {startFactionLive} from '../scripts/launch-live.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms)),sockets=new Set();
const fixture=http.createServer();const encode=m=>{const b=Buffer.from(JSON.stringify(m));return Buffer.concat([b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]),b]);};
fixture.on('upgrade',(req,socket)=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');socket.on('data',d=>{if((d[0]&15)===8)socket.end(Buffer.from([0x88,0]));});});
const free=async()=>{const s=http.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port;};
let launched,report;const owned=[];
try{
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));const backendPort=await free(),capturePort=await free(),folder=mkdtempSync(path.join(tmpdir(),'faction-launch-'));
 const options={backendPort,capturePort,open:false,env:{FW_RUNTIME_DIR:path.join(folder,'runtime'),FW_LIVE_DB:path.join(folder,'intake.sqlite'),FW_WS_URL:`ws://127.0.0.1:${fixture.address().port}/`}};
 launched=await startFactionLive(options);owned.push(...launched.children);assert.equal(launched.children.length,2);const base=launched.panel;
 const get=async()=> (await fetch(base+'api/state')).json(),post=async(route,body)=>{const r=await fetch(base+'api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 for(let i=0;i<50&&!sockets.size;i++)await wait(20);let v=await get();assert.equal(v.waitingForFirstJoin,true);assert.equal(v.live.enabled,true);assert.equal(v.demo,false);const initialTick=v.state.tick,id=v.state.id;
 const event=(event,id,extra)=>({event,data:{userId:'viewer',nickname:'Teste',msgId:id,...extra}}),send=m=>{for(const socket of sockets)socket.write(encode(m));};
 send(event('like','before-like',{likeCount:200}));send(event('chat','before-class',{comment:'!guerreiro'}));await wait(1100);v=await get();assert.equal(v.state.tick,initialTick);assert.equal(v.state.phaseMs,0);assert.equal(Object.keys(v.state.people).length,0);
 const again=await startFactionLive(options);assert.equal(again.children.length,0);assert.equal((await get()).state.id,id);
 const captureHealth=await(await fetch(launched.source+'api/health')).json();assert.equal(captureHealth.app,'faction-wars-capture');assert.equal(captureHealth.backendPort,backendPort);
 const abort=new AbortController(),stream=await fetch(launched.source+'api/stream',{signal:abort.signal}),first=new TextDecoder().decode((await stream.body.getReader().read()).value);assert.equal(JSON.parse(first.split('\n')[0].slice(6)).waitingForFirstJoin,true);abort.abort();
 const join=event('chat','join',{comment:'!vermelho'});send(join);send(join);for(let i=0;i<100;i++){v=await get();if(Object.keys(v.state.people).length)break;await wait(20);}assert.equal(v.waitingForFirstJoin,false);assert.equal(Object.keys(v.state.people).length,1);assert.equal(v.state.people['tt:viewer'].faction,'R');assert.ok(v.state.phaseMs>0&&v.state.phaseMs<1500);
 const local=await fetch(base+'api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({actorId:'fake',kind:'joinFaction',payload:{faction:'S'}})});assert.equal(local.status,409);
 await post('control',{action:'pause'});const exited=new Promise(r=>launched.children[0].once('exit',r));launched.children[0].kill();await exited;
 const recovered=await startFactionLive(options);owned.push(...recovered.children);assert.equal(recovered.children.length,1);v=await get();assert.equal(v.state.id,id);assert.equal(v.sessionKind,'live');assert.equal(v.live.enabled,true);assert.equal(Object.keys(v.state.people).length,1);
 await post('control',{action:'pause'});for(const ticks of [200,200,100])v=await post('control',{action:'step',ticks});assert.equal(v.state.phase,'combat');assert.ok(v.state.units.length>=30);
 for(let i=0;i<40&&v.state.id===id;i++)v=await post('control',{action:'step',ticks:200});assert.notEqual(v.state.id,id);assert.equal(v.waitingForFirstJoin,true);assert.equal(v.state.phase,'preparation');assert.equal(v.state.tick,0);assert.equal(Object.keys(v.state.people).length,0);
 v=await post('live',{action:'disconnect'});assert.equal(v.paused,true);assert.equal(v.live.enabled,false);
 report={status:'pass',checks:['one initializer starts backend and capture','reopen preserves the armed match','clock holds without audience','likes/class commands cannot open the match','capture receives waiting state','first faction comment opens 25s preparation once','local synthetic ingress blocked in LIVE','combat starts with the army','complete match automatically returns to waiting without audience','disconnect pauses'],scope:'Local launcher/HTTP/SSE/WebSocket fixture; no actual browser UI or broadcast.'};console.log(JSON.stringify(report,null,2));
}catch(error){report={status:'fail',error:error.stack};console.error(error);process.exitCode=1;}
finally{for(const child of owned){if(child.exitCode===null&&child.signalCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}}for(const socket of sockets)socket.destroy();await new Promise(r=>fixture.close(r));writeFileSync(new URL('../evidence/launch-live.json',import.meta.url),JSON.stringify(report,null,2));}
