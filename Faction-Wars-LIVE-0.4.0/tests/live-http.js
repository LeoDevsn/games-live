import assert from 'node:assert/strict';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createStudioServer} from '../scripts/studio-server.js';
const sockets=new Set(),wait=ms=>new Promise(r=>setTimeout(r,ms));
const encode=m=>{const b=Buffer.from(JSON.stringify(m));return Buffer.concat([b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]),b]);};
const msg=(event,id,fields={})=>({event,data:{user:{id:'synthetic-live-http',nickname:'Teste HTTP'},msgId:'fixture-http-'+id,...fields}});
const fixture=http.createServer();let child,studio,report;
fixture.on('upgrade',(req,socket)=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));const accept=createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');socket.write(encode(msg('chat','join',{comment:'!vermelho'})));socket.write(encode(msg('chat','join',{comment:'!vermelho'})));socket.on('data',d=>{if((d[0]&15)===8)socket.end(Buffer.from([0x88,0]));});});
try{
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));const free=http.createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));
 const base=`http://127.0.0.1:${port}`,folder=mkdtempSync(path.join(tmpdir(),'fw-live-http-'));
 child=spawn(process.execPath,['src/adapters/local/server.js'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),FW_RUNTIME_DIR:folder,FW_MATCH:'http-fixture-'+Date.now(),FW_LIVE_DB:path.join(folder,'intake.sqlite'),FW_WS_URL:`ws://127.0.0.1:${fixture.address().port}/`,LIVE_AUTOCONNECT:'0'},windowsHide:true,stdio:'ignore'});
 async function poll(predicate=()=>true){for(let i=0;i<850;i++){try{const r=await fetch(base+'/api/state');if(r.ok){const v=await r.json();if(predicate(v))return v;}}catch{}await wait(40);}throw Error('Timeout no servidor Faction');}
 const post=async(route,body)=>{const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 await poll();await post('live',{action:'start'});let v=await poll(v=>Object.keys(v.state.people).length===1);assert.equal(v.demo,false);assert.equal(v.live.enabled,true);assert.equal(v.state.people['tt:synthetic-live-http'].faction,'R');
 const locked=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'step',ticks:200})});assert.equal(locked.status,409);v=await poll(v=>v.state.phase==='combat');
 const likes=msg('like','likes',{likeCount:400,totalLikeCount:999999});for(const socket of sockets){socket.write(encode(likes));socket.write(encode(likes));}
 v=await poll(v=>v.state.teams.R.credits===2);assert.equal(v.state.people['tt:synthetic-live-http'].E,4);
 for(const url of ['/','/src/ui/approved-sprites.js','/src/ui/assets/arena-approved-v1.png','/src/ui/assets/troops-approved-v1.png'])assert.equal((await fetch(base+url)).status,200,url);
 studio=createStudioServer({backendPort:port});await new Promise(r=>studio.listen(0,'127.0.0.1',r));const sourceBase=`http://127.0.0.1:${studio.address().port}`;
 const html=await (await fetch(sourceBase)).text();assert.equal(/<(button|input|select)\b/.test(html),false);assert.equal((await fetch(sourceBase+'/api/control',{method:'POST'})).status,405);assert.equal((await fetch(sourceBase+'/.runtime/session.sqlite')).status,404);
 for(const route of ['/src/ui/figma-hud.js','/src/ui/figma-layout.js','/src/ui/arena-navigation.js',...['background','title','clock','credits-R','credits-S','nexus-R','nexus-S','objectives','point-A','point-B','point-C'].map(key=>'/src/ui/assets/figma/'+key+'.png')]){
  const operator=await fetch(base+route),capture=await fetch(sourceBase+route);assert.equal(operator.status,200,route);assert.equal(capture.status,200,route);assert.equal(createHash('sha256').update(Buffer.from(await operator.arrayBuffer())).digest('hex'),createHash('sha256').update(Buffer.from(await capture.arrayBuffer())).digest('hex'),route+' capture parity');
 }
 const abort=new AbortController(),source=await fetch(sourceBase+'/api/stream',{signal:abort.signal});const first=new TextDecoder().decode((await source.body.getReader().read()).value);const frame=JSON.parse(first.split('\n')[0].slice(6));assert.equal(frame.id,v.state.id);abort.abort();
 assert.equal((await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pause'})})).status,409);await post('live',{action:'disconnect'});
 v=await post('control',{action:'new',demo:true});assert.equal(v.sessionKind,'simulation');assert.ok(Object.keys(v.state.people).length>0);
 v=await post('live',{action:'start'});assert.equal(v.sessionKind,'live');assert.equal(v.demo,false);assert.equal(Object.keys(v.state.people).length,0);assert.equal(v.waitingForFirstJoin,true);assert.equal(Object.keys(v.state.nextQueue).length,0);
 report={status:'pass',scope:'HTTP, SSE e WebSocket reais locais com eventos sintéticos; não é LIVE real nem revisão visual',checks:['comando pelo socket inicia participação','msgId duplicado não duplica usuário/crédito','curtidas delta aplicam economia aprovada','assets atuais servidos','fonte somente leitura acompanha mesma partida'],credits:2,personalEnergy:4};console.log(JSON.stringify(report,null,2));
}catch(error){report={status:'fail',error:error.stack};console.error(error);process.exitCode=1;}
finally{if(child&&child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}for(const socket of sockets)socket.destroy();await new Promise(r=>fixture.close(r));if(studio){studio.closeAllConnections();await new Promise(r=>studio.close(r));}writeFileSync(new URL('../evidence/live-http.json',import.meta.url),JSON.stringify(report,null,2));}
