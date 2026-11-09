import http from 'node:http';
import path from 'node:path';
import {mkdir,readFile} from 'node:fs/promises';
import {createEngine} from './src/engine.mjs';
import {createAdapter,allowedAvatar} from './src/tikfinity.mjs';
import {createConnection} from './src/connection.mjs';
import {createStore} from './src/store.mjs';
import {DEFAULT_SETTINGS,validateSettings,RULES} from './src/config.mjs';
import {createBroadcast} from './src/broadcast.mjs';
import {createAudience} from './src/audience.mjs';
import {createRegistrationIntake} from './src/registration.mjs';
import {saveGameNarrator,readGameNarrator} from './src/narrator.mjs';
import {createArenaVoice} from './src/voice.mjs';
import {DEFAULT_MUSIC,musicConfig,serveMusic} from './src/music.mjs';
import {MUSIC_TRACKS} from './public/music-catalog.js';
const root=import.meta.dirname,port=Number(process.env.PORT||4177);
await mkdir(path.join(root,'.runtime'),{recursive:true});
const store=createStore(process.env.ARENA_DB||path.join(root,'.runtime','arena.sqlite'));
if(!process.env.ARENA_DB)saveGameNarrator(root,readGameNarrator(root));
let narratorConfig=store.read('audience.config',{});if(store.read('theme.version')!=='plankton-v1'){narratorConfig={...narratorConfig,character:'plankton'};store.write('audience.config',narratorConfig);const bc=store.read('broadcast.config',{title:'ALIADOS DO PLANKTON',accent:'#b9ef6d',metric:'wins',giftMappings:[]});if(['PÓDIO DA COMUNIDADE','LENDAS DA ARENA','SEGUIDOR ARENA'].includes(bc.title))bc.title='ALIADOS DO PLANKTON';if(['#a893ff','#ac8fff','#b69aff'].includes(bc.accent))bc.accent='#b9ef6d';store.write('broadcast.config',bc);store.write('theme.version','plankton-v1');}
let music;try{music=musicConfig(store.read('music',DEFAULT_MUSIC));}catch{music={...DEFAULT_MUSIC};}
if(store.read('music.phaseTracksVersion')!==1){music={...music,selection:'liberadas'};store.write('music',music);store.write('music.phaseTracksVersion',1);}
const broadcast=await createBroadcast({store,nativeGiftsOnly:true,directory:path.join(process.env.ARENA_DB?path.dirname(process.env.ARENA_DB):path.join(root,'.runtime'),'broadcast-media'),metrics:['wins','xp','damage','healing','kills','participations'],defaultTitle:'ALIADOS DO PLANKTON'});
let settings=validateSettings(store.read('settings',DEFAULT_SETTINGS)),saved=store.read('session');
let engine=createEngine(saved?.settings||settings,saved?.engine),adapter=createAdapter({seen:saved?.seen,key:store.anonymousId});
let mode='simulation',liveActive=false,paused=false,demoSerial=0,autoDemo=false,demoEngine,demoAdapter;
const voice=createArenaVoice({root,folder:path.join(process.env.ARENA_DB?path.dirname(process.env.ARENA_DB):path.join(root,'.runtime'),'voice-cache')});
const chatRelay=new URL(process.env.ARENA_CHAT_RELAY_URL||'http://127.0.0.1:4173/api/platform-chat');
if(chatRelay.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(chatRelay.hostname)||chatRelay.username||chatRelay.password)throw Error('Chat relay deve ser local');
const audience=createAudience({config:narratorConfig,seen:store.read('audience.seen',[]),save:value=>store.write('audience.config',value),onMessage:job=>broadcast.receive({event:'chat',data:{userId:'arena-bot',nickname:'Plankton',comment:job.text,msgId:job.id}},'live'),sendChat:async message=>{const r=await fetch(chatRelay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'seguidor-arena',message}),signal:AbortSignal.timeout(1500)});return r.ok&&(await r.json()).relayed===true;}});
audience.observe(engine.snapshot());
const registrations=createRegistrationIntake({engine,audience,pending:saved?.pendingEntries});
const clients=new Map(),avatars=new Map(store.read('avatars',[])),avatarCache=new Map(),avatarPending=new Map(),observedGifts=new Map();
let latest='Modo simulação · adicione participantes para testar',rejected=0,lastSave=performance.now(),then=lastSave,demoElapsed=0;
function newDemo(){broadcast.clear('simulation');demoEngine=createEngine({...settings,giftMappings:[...settings.giftMappings,...[1,2,3,4,5].map(n=>({id:'demo-'+n,name:'Impulso teste '+n,seconds:n,trail:['smoke','fire','laser'][n%3]}))]});demoAdapter=createAdapter();demoSerial=0;demoElapsed=0;}
newDemo();
const endpoint=new URL(process.env.ARENA_WS_URL||'ws://localhost:21213/');
if(endpoint.protocol!=='ws:'||!['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)||endpoint.username||endpoint.password)throw Error('TikFinity precisa ser local, sem credenciais');
const alternate=new URL(endpoint);alternate.hostname=endpoint.hostname==='localhost'?'127.0.0.1':'localhost';
const connection=createConnection({endpoints:[endpoint.href,alternate.href],onMessage(message,at){
 if(!liveActive)return;broadcast.receive(message,'live');
 const action=adapter.normalize(message,at);if(!action)return;
 action.id=store.anonymousId(action.id);
 if(action.avatar){avatars.set(action.id,action.avatar);if(avatars.size>10000)avatars.delete(avatars.keys().next().value);}
 if(action.kind==='gift'){observedGifts.set(action.giftId,{id:action.giftId,name:action.giftName});if(observedGifts.size>40)observedGifts.delete(observedGifts.keys().next().value);}
 const accepted=registrations.receive(action);if(!accepted)rejected++;
 latest=accepted?`${action.name||'Espectador'} · ${action.kind==='follow'?'seguidor confirmado':action.kind==='like'?(engine.entryStatus(action.id).next?'presença confirmada na próxima rodada':'inscrição / curtidas recebidas'):action.kind==='gift'?'impulso':'identidade atualizada'}`:`${action.name||'Espectador'} · aguardando elegibilidade ou próxima rodada`;
}});
function persist(){broadcast.persist();store.write('audience.seen',audience.exportSeen());store.write('session',{engine:engine.exportState(),settings:engine.settings,seen:adapter.exportState(),pendingEntries:registrations.exportState()});store.write('avatars',[...avatars]);}
function view(publicView=false){const game=(publicView||mode==='live'?engine:demoEngine).snapshot();game.pendingRegistrations=(publicView||mode==='live')?registrations.snapshot().pendingPlayers:[];game.players=game.players.map(p=>({...p,avatar:(publicView||mode==='live')&&avatars.has(p.id)?`/api/avatar/${p.id}?v=${store.anonymousId(avatars.get(p.id)).slice(0,8)}`:null}));game.ranking=game.ranking.map(p=>({...p,avatar:(publicView||mode==='live')&&avatars.has(p.id)?`/api/avatar/${p.id}?v=${store.anonymousId(avatars.get(p.id)).slice(0,8)}`:null}));return {registrations:registrations.snapshot(),theme:{id:'plankton-v1',title:'Arena Royale do Plankton',character:'Plankton'},audience:{...audience.snapshot(),voice:voice.status()},broadcast:broadcast.snapshot(publicView?'live':mode),app:'seguidor-arena',liveActive,mode:publicView?'live':mode,paused:publicView?false:paused,autoDemo:publicView?false:autoDemo,music:{...music},game,connection:connection.snapshot(),latest:publicView?'':latest,rejected,settings,rules:RULES,observedGifts:[...observedGifts.values()]};}
function publish(){const data='data: '+JSON.stringify(view())+'\n\n';for(const [res,publicView] of clients){if(res.writableLength>1048576){res.end();clients.delete(res);}else res.write(publicView?'data: '+JSON.stringify(view(true))+'\n\n':data);}}
function simulate(event,data){broadcast.receive({event,data},'simulation');const action=demoAdapter.normalize({event,data},Date.now());if(action)demoEngine.apply(action);}
function addDemo(count){for(let i=0;i<count;i++){const id='demo-viewer-'+(++demoSerial),user={id,nickname:['Luna','Rafa','Bia','Caio','Duda','Leo','Nina','Gui'][demoSerial%8]+' '+demoSerial};simulate('follow',{user,msgId:'follow-'+demoSerial});simulate('like',{user,likeCount:1,msgId:'join-'+demoSerial});}}
const timer=setInterval(()=>{const now=performance.now(),delta=Math.min(30000,now-then);then=now;
 try{if(liveActive){engine.tick(delta);registrations.observe(engine.snapshot());audience.observe(engine.snapshot());void audience.pump();}if(!paused&&mode==='simulation'){demoEngine.tick(delta);demoElapsed+=delta;if(autoDemo&&demoElapsed>=1000){demoElapsed%=1000;const list=demoEngine.snapshot().ranking;if(list.length){const p=list[Math.floor(Math.random()*list.length)];simulate('like',{user:{id:p.id,nickname:p.name},likeCount:50,msgId:'auto-'+Date.now()});}}}
 if(now-lastSave>1000){persist();lastSave=now;}publish();}catch(error){paused=true;latest='Falha local: '+error.message;console.error('Sessão pausada:',error.message);}},100);
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function fetchAvatar(id){
 const url=avatars.get(id);if(!url)return null;
 const cached=avatarCache.get(id);if(cached?.url===url&&Date.now()-cached.at<600000)return cached;
 if(avatarPending.has(id))return avatarPending.get(id);
 const pending=(async()=>{let current=url;for(let n=0;n<4;n++){
  if(!allowedAvatar(current))return null;const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(4000)});
  if(r.status>=300&&r.status<400){current=new URL(r.headers.get('location'),current).href;continue;}
  const type=r.headers.get('content-type')?.split(';')[0];if(!r.ok||!['image/png','image/jpeg','image/webp','image/gif'].includes(type)||Number(r.headers.get('content-length'))>524288)return null;
  const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>524288)throw Error('Avatar grande demais');chunks.push(chunk);}
  const result={url,type,data:Buffer.concat(chunks),at:Date.now()};avatarCache.set(id,result);if(avatarCache.size>300)avatarCache.delete(avatarCache.keys().next().value);return result;
 }return null;})().catch(()=>null).finally(()=>avatarPending.delete(id));avatarPending.set(id,pending);return pending;
}
const routes=new Map([['/plankton-theme.js','plankton-theme.js'],['/assets/plankton-lab-v1.png','assets/plankton-lab-v1.png'],['/assets/plankton-reactions-v1.png','assets/plankton-reactions-v1.png'],['/soundtrack.js','soundtrack.js'],['/audience.js','audience.js'],['/voice-unlock.wav','assets/audio/voice-unlock.wav'],['/game-entry.js','game-entry.js'],['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/render.js','render.js'],['/broadcast-render.js','broadcast-render.js'],['/broadcast-ui.js','broadcast-ui.js'],['/broadcast-ui.css','broadcast-ui.css'],['/assets/arena-space-v1.png','assets/arena-space-v1.png'],['/style.css','style.css']]);
const server=http.createServer(async(req,res)=>{try{
 if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'Host local obrigatório'});
 const url=new URL(req.url,'http://localhost');
 if(Object.values(MUSIC_TRACKS).some(track=>track.url===url.pathname))return serveMusic(req,res,path.join(root,'public',url.pathname.slice(1)));
 if(req.method==='GET'&&url.pathname==='/music-catalog.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(await readFile(path.join(root,'public/music-catalog.js')));return;}
 if(req.method==='GET'&&url.pathname.startsWith('/broadcast/media/'))return broadcast.serveMedia(url.pathname.split('/').at(-1),res);
 if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,view(url.searchParams.get('audience')==='1'));
 if(req.method==='GET'&&url.pathname==='/api/stream'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});const publicView=url.searchParams.get('audience')==='1';clients.set(res,publicView);res.on('close',()=>clients.delete(res));res.write('data: '+JSON.stringify(view(publicView))+'\n\n');return;}
 if(req.method==='GET'&&/^\/api\/avatar\/[a-f0-9]{32}$/.test(url.pathname)){const avatar=await fetchAvatar(url.pathname.split('/').at(-1));if(!avatar){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':avatar.type,'Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'});res.end(avatar.data);return;}
 if(req.method==='POST'&&url.pathname.startsWith('/api/')){
  if(req.headers.origin&&!new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]).has(req.headers.origin))return json(res,403,{error:'Origem local obrigatória'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Use JSON'});
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>(url.pathname==='/api/broadcast/upload'?17000000:100000))return json(res,413,{error:'Pedido grande demais'});}const body=JSON.parse(raw||'{}');
  if(url.pathname.startsWith('/api/broadcast/')){await broadcast.handle(url.pathname,body,mode);publish();return json(res,200,view());}
  switch(url.pathname){
   case '/api/audience/config':audience.configure(body);break;
   case '/api/audience/test':return json(res,200,{job:audience.test(body.kind,body.name||'Teste')});
   case '/api/audience/audio':{const bytes=await voice.audio(audience.getJob(body.id));res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store'});res.end(bytes);return;}
   case '/api/music':music=musicConfig(body,music);store.write('music',music);break;
   case '/api/mode':if(!['simulation','live'].includes(body.mode))throw Error('Modo inválido');mode=body.mode;paused=false;autoDemo=false;if(mode==='live'){liveActive=true;connection.start();latest='LIVE · aguardando seguidor confirmado + primeiro like';}else{latest='SIMULAÇÃO · ranking e espectadores de teste isolados';}break;
   case '/api/connect':if(mode!=='live')throw Error('Ative modo LIVE primeiro');connection.start();break;
   case '/api/disconnect':connection.stop();audience.stop();break;
   case '/api/control':if(mode!=='simulation')throw Error('Controles manuais disponíveis somente no painel de testes em simulação');if(body.action==='pause')paused=true;else if(body.action==='resume')paused=false;else if(body.action==='new'){(mode==='live'?engine:demoEngine).resetRound();paused=false;}else throw Error('Controle inválido');break;
   case '/api/settings':settings=validateSettings(body);store.write('settings',settings);engine.configure(settings);demoEngine.configure({...settings,giftMappings:[...settings.giftMappings,...[1,2,3,4,5].map(n=>({id:'demo-'+n,name:'Teste',seconds:n,trail:['smoke','fire','laser'][n%3]}))]});persist();break;
   case '/api/demo':{
    if(mode!=='simulation')throw Error('Simulação está desativada na LIVE');
    if(body.action==='add'){const count=Number(body.count);if(!Number.isInteger(count)||count<1||count>200)throw Error('Escolha 1–200 participantes');addDemo(count);}
    else if(body.action==='auto')autoDemo=Boolean(body.enabled);
    else if(body.action==='clear'){newDemo();autoDemo=false;}
    else{
     const demo=demoEngine.snapshot(),list=[...demo.players,...demo.queuedPlayers],p=list.find(p=>p.id===body.id)||list[0];if(!p)throw Error('Adicione um participante');
     if(body.action==='confirm')simulate('like',{user:{id:p.id,nickname:p.name},likeCount:1,msgId:'confirm-'+Date.now()+'-'+Math.random()});
     else if(body.action==='like')simulate('like',{user:{id:p.id,nickname:p.name},likeCount:50,msgId:'like-'+Date.now()+'-'+Math.random()});
     else if(body.action==='gift'){if(!demo.players.some(q=>q.id===p.id))throw Error('Este participante aguarda a pr\u00f3xima rodada');if(![1,2,3,4,5].includes(body.seconds))throw Error('Duração 1–5s');simulate('gift',{user:{id:p.id,nickname:p.name},giftId:'demo-'+body.seconds,msgId:'gift-'+Date.now()+'-'+Math.random(),repeatEnd:true});}
     else throw Error('Teste inválido');
    }break;
   }
   default:return json(res,404,{error:'Rota desconhecida'});
  }publish();return json(res,200,view());
 }
 if(req.method!=='GET')return json(res,405,{error:'Método inválido'});
 const filename=['/','/index.html'].includes(url.pathname)&&url.searchParams.get('studio')==='1'?'live.html':url.pathname==='/live-view.js'?'live-view.js':routes.get(url.pathname);if(!filename)return json(res,404,{error:'Não encontrado'});
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.wav':'audio/wav'};
 res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'"});res.end(await readFile(path.join(root,'public',filename)));
}catch(error){json(res,400,{error:error.message});}});
server.listen(port,'127.0.0.1',()=>console.log(`Seguidor Arena: http://127.0.0.1:${port}/\nArena: http://127.0.0.1:${port}/?studio=1`));
function close(){clearInterval(timer);connection.stop();persist();for(const client of clients.keys())client.end();server.close();store.close();process.exit();}
process.once('SIGTERM',close);process.once('SIGINT',close);
