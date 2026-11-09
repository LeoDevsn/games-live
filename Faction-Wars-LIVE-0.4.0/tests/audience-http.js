import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {WebSocketServer,WebSocket} from 'ws';
import {createStudioServer} from '../scripts/studio-server.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms)),folder=mkdtempSync(resolve(tmpdir(),'fw-guide-http-'));
const upstream=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>upstream.once('listening',r));
let child,studio,bot;const free=http.createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));const base='http://127.0.0.1:'+port;
async function poll(fn){for(let i=0;i<120;i++){try{const s=await(await fetch(base+'/api/state')).json();if(fn(s))return s;}catch{}await wait(60);}throw Error('Timeout');}
async function post(route,body){const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();}
const send=(event,id,comment)=>{const msg=JSON.stringify({event,data:{msgId:id,user:{userId:'fixture',uniqueId:'Tester'},comment}});for(const ws of upstream.clients)ws.send(msg);};
try{
 child=spawn(process.execPath,['src/adapters/local/server.js'],{cwd:resolve(import.meta.dirname,'..'),env:{...process.env,PORT:String(port),FW_RUNTIME_DIR:folder,FW_WS_URL:'ws://127.0.0.1:'+upstream.address().port,LIVE_AUTOCONNECT:'0'},windowsHide:true,stdio:'ignore'});
 await poll(()=>true);await post('live',{action:'start'});await poll(s=>s.live.status==='connected');
 bot=new WebSocket('ws://127.0.0.1:'+port+'/chatbot');const packets=[];bot.on('message',raw=>packets.push(JSON.parse(raw)));await new Promise((r,j)=>{bot.once('open',r);bot.once('error',j);});
 bot.send(JSON.stringify({request:'GetActions',id:'actions'}));await wait(80);assert.ok(packets.find(p=>p.request==='Hello'));assert.deepEqual(packets.find(p=>p.id==='actions').actions,[]);
 send('member','entry');let state=await poll(s=>s.audience.welcomed===1);assert.equal(state.waitingForFirstJoin,true);assert.equal(state.state.tick,0);assert.equal(Object.keys(state.state.people).length,0);
 await poll(s=>s.audience.relayed===1);assert.ok(packets.some(p=>p.action==='sendChatbotMessage'&&p.args.message.includes('!ajuda')));
 send('chat','help','!comandos');state=await poll(s=>s.audience.helped===1);assert.equal(state.state.tick,0);assert.equal(state.audience.current.pages.length,4);
 const forwarded=state.audience.chatbot.forwarded;await post('audience',{action:'test',kind:'help'});state=await poll(s=>s.audience.current?.simulate);assert.equal(state.audience.chatbot.forwarded,forwarded);
 const relayState=await(await fetch(base+'/api/platform-chat')).json();assert.equal(relayState.app,'games-live-chat');assert.equal(relayState.connected,true);
 const relayResult=await post('platform-chat',{source:'seguidor-arena',message:'Luna, bem-vinda! Siga e curta para entrar na arena.'});assert.equal(relayResult.relayed,true);await wait(40);assert.ok(packets.some(p=>p.action==='sendChatbotMessage'&&p.args.message.includes('entrar na arena')));
 const towerRelay=await post('platform-chat',{source:'tower-battle',message:'Trabalhadores do Plankton, comentem B para construir!'});assert.equal(towerRelay.relayed,true);await wait(40);assert.ok(packets.some(p=>p.action==='sendChatbotMessage'&&p.args.message.includes('Trabalhadores do Plankton')));assert.ok(relayState.sources.includes('tower-battle'));
 studio=createStudioServer({backendPort:port});await new Promise(r=>studio.listen(0,'127.0.0.1',r));const source='http://127.0.0.1:'+studio.address().port;
 for(const route of ['/src/ui/audience-ui.js','/src/ui/audience.css'])assert.equal((await fetch(source+route)).status,200);
 assert.equal((await fetch(source+'/api/audience',{method:'POST'})).status,405);
 const abort=new AbortController(),r=await fetch(source+'/api/stream',{signal:abort.signal});const raw=new TextDecoder().decode((await r.body.getReader().read()).value);const frame=JSON.parse(raw.split('\n')[0].slice(6));assert.equal(frame.audience.current,null);assert.equal(frame.audience.voice,null);abort.abort();
 send('chat','join','!azul');await poll(s=>Object.keys(s.state.people).length===1);await post('live',{action:'disconnect'});state=await poll(s=>s.audience.current===null);assert.equal(state.audience.queued,0);
 await post('audience',{action:'configure',config:{voice:false,welcome:false}});state=await poll(s=>s.audience.config.welcome===false);assert.equal(state.audience.config.voice,false);
 console.log('PASS audience HTTP: real local WS/SSE, member/help waiting at tick0, documented relay payload, preview isolation, capture CSS/modules, faction ingress and disconnect cleanup. No real TikTok messages sent.');
}finally{
 bot?.terminate();for(const ws of upstream.clients)ws.terminate();await new Promise(r=>upstream.close(r));
 if(studio){studio.closeAllConnections();await new Promise(r=>studio.close(r));}
 if(child&&child.exitCode===null&&child.signalCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}
}
