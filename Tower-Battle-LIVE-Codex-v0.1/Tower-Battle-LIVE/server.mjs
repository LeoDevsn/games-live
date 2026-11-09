import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createEngine} from './src/engine.mjs';
import {createTikFinityAdapter} from './src/tikfinity.mjs';
import {createConnection} from './src/connection.mjs';
import {createStore} from './src/store.mjs';
import {validateRules,DEFAULT_RULES,RULE_LIMITS} from './src/rules.mjs';
import {replayEvents} from './src/replay.mjs';
import {createBroadcast} from './src/broadcast.mjs';
import {createAudience} from './src/audience.mjs';
import {createTowerVoice} from './src/voice.mjs';
import {saveTowerNarrators} from './src/narrators.mjs';

const here=import.meta.dirname,port=Number(process.env.PORT||4175),clients=new Map();
await mkdir(path.join(here,'.runtime'),{recursive:true});
const store=createStore(process.env.TOWER_DB||path.join(here,'.runtime','tower.sqlite'));
if(!process.env.TOWER_DB)saveTowerNarrators(here);
const voice=createTowerVoice({root:here,folder:path.join(process.env.TOWER_DB?path.dirname(process.env.TOWER_DB):path.join(here,'.runtime'),'voice-cache')});
if(store.read('theme.version')!=='krabs-plankton-v1'){
 const config=store.read('broadcast.config',{title:'MESTRES DA CONSTRUÇÃO',accent:'#b6ed70',metric:'blocks',giftMappings:[]});
 if(['CONSTRUTORES LENDARIOS','CONSTRUTORES LENDÁRIOS','PÓDIO DA COMUNIDADE'].includes(config.title))config.title='MESTRES DA CONSTRUÇÃO';
 if(['#a893ff','#ac8fff','#b69aff'].includes(config.accent))config.accent='#b6ed70';store.write('broadcast.config',config);store.write('theme.version','krabs-plankton-v1');
}
const broadcast=await createBroadcast({store,nativeGiftsOnly:true,directory:path.join(process.env.TOWER_DB?path.dirname(process.env.TOWER_DB):path.join(here,'.runtime'),'broadcast-media'),metrics:['blocks','wins','likes','rounds'],defaultTitle:'CONSTRUTORES LENDARIOS'});
const saved=store.read('session');
let rules=store.read('rules',DEFAULT_RULES),settings=store.read('settings',{giftsEnabled:true,giftIds:[]});
let engine=createEngine(saved?.rules||rules,saved?.engine),adapter=createTikFinityAdapter(saved?.seen,store.anonymousId);
let demoEngine=createEngine(rules),demoAdapter=createTikFinityAdapter(),demoTime=0;
let mode='live',elapsed=saved?.elapsed||0,latest='Aguardando primeiro comentário A/B',serial=0,replay=null;
const liveConfig=JSON.parse(await readFile(path.join(here,'public','live-config.json'),'utf8'));
const endpoint=new URL(process.env.TOWER_WS_URL||liveConfig.websocketUrl);
if(endpoint.protocol!=='ws:'||!['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)||endpoint.username||endpoint.password)throw Error('TikFinity deve usar WebSocket local sem credenciais');
const alternate=new URL(endpoint);alternate.hostname=endpoint.hostname==='localhost'?'127.0.0.1':'localhost';
const connection=createConnection({onMessage:receiveLive,endpoints:[endpoint.href,alternate.href]});
const relayUrl=new URL(process.env.TOWER_CHAT_RELAY_URL||'http://127.0.0.1:4173/api/platform-chat');
if(relayUrl.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(relayUrl.hostname)||relayUrl.username||relayUrl.password)throw Error('Relay deve ser local');
const audience=createAudience({config:store.read('audience.config',{}),seen:store.read('audience.seen',[]),save:value=>store.write('audience.config',value),onMessage:job=>broadcast.receive({event:'chat',data:{userId:'tower-boss-'+job.team,nickname:job.team==='A'?'Sr. Sirigueijo':'Plankton',comment:job.text,msgId:job.id}},'live'),sendChat:async message=>{const r=await fetch(relayUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'tower-battle',message}),signal:AbortSignal.timeout(1500)});return r.ok&&(await r.json()).relayed===true;}});
audience.observe(engine.snapshot());
function receiveLive(message,at){
  
  broadcast.receive(message,'live');
  const action=adapter.normalize(message,at);
  if(!action)return;
  action.id=store.anonymousId(action.id);
  action.team=action.team||engine.teamFor(action.id);
  if(['identity','help'].includes(action.kind)){audience.receive(action,engine.snapshot());return;}
  if(action.kind==='gift'&&(!settings.giftsEnabled||(settings.giftIds.length&&!settings.giftIds.includes(action.giftId))))return;
  const accepted=engine.apply(action,elapsed);
  audience.observe(engine.snapshot());if(accepted||['like','gift'].includes(action.kind))audience.receive(action,engine.snapshot());
  latest=`${accepted?'✓':'•'} ${action.name} · ${action.kind==='join'?'time '+action.team:action.kind==='like'?'curtidas':'reforço'}`;
}
function persist(){broadcast.persist();store.write('audience.seen',audience.exportSeen());store.write('session',{engine:engine.exportState(),rules:engine.rules,elapsed,seen:adapter.exportState()});}
function view(publicView=false){return {app:'tower-battle',version:'0.3.0',theme:{id:'krabs-plankton-v1',version:1},audience:{...audience.snapshot(),voice:voice.status()},audienceActive:!['disconnected','ended'].includes(connection.snapshot().status),broadcast:broadcast.snapshot(publicView?'live':mode),mode:publicView?'live':mode,game:publicView?engine.snapshot():mode==='replay'&&replay?replay.snapshot:(mode==='simulation'?demoEngine:engine).snapshot(),connection:connection.snapshot(),latest:publicView?'':latest,settings,rules,limits:RULE_LIMITS,replay:replay?{accepted:replay.accepted,elapsedMs:replay.elapsedMs}:null};}
function publish(){const data='data: '+JSON.stringify(view())+'\n\n';for(const [res,publicView] of clients){if(res.writableLength>1048576){res.end();clients.delete(res);}else res.write(publicView?'data: '+JSON.stringify(view(true))+'\n\n':data);}}
let then=performance.now(),lastSave=then;
const timer=setInterval(()=>{const now=performance.now(),delta=now-then;then=now;try{elapsed+=Math.min(delta,30000);engine.tick(delta);if(!['disconnected','ended'].includes(connection.snapshot().status)){audience.observe(engine.snapshot());void audience.pump();}if(mode==='simulation'){demoTime+=delta;demoEngine.tick(delta);}if(now-lastSave>=1000){persist();lastSave=now;}publish();}catch(error){console.error('Falha na sessão Tower:',error.message);}},100);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.wav':'audio/wav'};
const routes=new Map([['/audience.js','audience.js'],['/tower-theme.js','tower-theme.js'],['/assets/construction-seabed-v1.png','assets/construction-seabed-v1.png'],['/assets/mr-krabs-nickrewind-v1.png','assets/mr-krabs-nickrewind-v1.png'],['/assets/plankton-reactions-v1.png','assets/plankton-reactions-v1.png'],['/voice-unlock.wav','assets/voice-unlock.wav'],['/game-entry.js','game-entry.js'],['/','index.html'],['/index.html','index.html'],['/style.css','style.css'],['/main.js','main.js'],['/render.js','render.js'],['/broadcast-render.js','broadcast-render.js'],['/broadcast-ui.js','broadcast-ui.js'],['/broadcast-ui.css','broadcast-ui.css'],['/scene.js','scene.js'],['/vendor/three.module.js','vendor/three.module.js'],['/vendor/three.core.js','vendor/three.core.js'],['/replay-example.json','replay-example.json']]);
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
  try{
    if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'Host local obrigatório'});
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&url.pathname.startsWith('/broadcast/media/'))return broadcast.serveMedia(url.pathname.split('/').at(-1),res);
    if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,view(url.searchParams.get('audience')==='1'));
    if(req.method==='GET'&&url.pathname==='/api/stream'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});const publicView=url.searchParams.get('audience')==='1';clients.set(res,publicView);res.on('close',()=>clients.delete(res));res.write('data: '+JSON.stringify(view(publicView))+'\n\n');return;}
    if(req.method==='POST'&&url.pathname.startsWith('/api/')){
      if(req.headers.origin&&!new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]).has(req.headers.origin))return json(res,403,{error:'Origem local obrigatória'});
      if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Use JSON'});
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>(url.pathname==='/api/broadcast/upload'?17000000:8000000))return json(res,413,{error:'Pedido grande demais'});}
      const body=JSON.parse(raw||'{}');
      if(url.pathname.startsWith('/api/broadcast/')){await broadcast.handle(url.pathname,body,mode);publish();return json(res,200,view());}
      switch(url.pathname){
        case '/api/audience/config':audience.configure(body);break;
        case '/api/audience/test':return json(res,200,{job:audience.test(body.kind,body.team||'A')});
        case '/api/audience/audio':{const bytes=await voice.audio(audience.getJob(body.id));res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'private, no-store'});res.end(bytes);return;}
        case '/api/mode':
          if(!['live','simulation'].includes(body.mode))throw Error('Modo inválido');
          mode=body.mode;latest=mode==='simulation'?'SIMULAÇÃO · ranking de teste isolado':'Aguardando interações da LIVE';
          if(mode==='simulation'){broadcast.clear('simulation');demoEngine=createEngine(rules);demoAdapter=createTikFinityAdapter();demoTime=0;}else connection.start();break;
        case '/api/connect':if(mode!=='live')throw Error('Ative o modo LIVE primeiro');connection.start();break;
        case '/api/disconnect':connection.stop();audience.stop();break;
        case '/api/demo':{
          if(mode!=='simulation')throw Error('Ative a simulação primeiro');
          if(!['A','B'].includes(body.team)||!['chat','like','gift'].includes(body.event))throw Error('Teste inválido');
          const message={event:body.event,data:{user:{id:'demo-'+body.team,nickname:'Visitante '+body.team},msgId:'demo-'+(++serial),comment:body.team,likeCount:rules.likesPerBlock,giftName:'Teste',giftId:'test',repeatEnd:true}};
          broadcast.receive(message,'simulation');const action=demoAdapter.normalize(message,demoTime);if(action)demoEngine.apply(action,demoTime);latest='SIMULAÇÃO · '+body.event+' '+body.team;break;
        }
        case '/api/config':{
          const next=validateRules(body.rules);
          if(typeof body.giftsEnabled!=='boolean'||!Array.isArray(body.giftIds)||body.giftIds.length>100||body.giftIds.some(x=>typeof x!=='string'||x.length>45))throw Error('Configuração de presentes inválida');
          rules=next;settings={giftsEnabled:body.giftsEnabled,giftIds:body.giftIds};
          store.write('rules',rules);store.write('settings',settings);engine.configure(rules);demoEngine.configure(rules);persist();break;
        }
        case '/api/replay':
          if(mode!=='simulation'&&mode!=='replay')throw Error('Ative simulação para executar replay');
          replay=replayEvents(body.events,rules);mode='replay';latest='REPLAY TÉCNICO · dados de teste isolados';break;
        default:return json(res,404,{error:'Rota desconhecida'});
      }
      publish();return json(res,200,view());
    }
    if(req.method!=='GET')return json(res,405,{error:'Método inválido'});
    const filename=['/','/index.html'].includes(url.pathname)&&url.searchParams.get('studio')==='1'?'live.html':url.pathname==='/live-view.js'?'live-view.js':routes.get(url.pathname);if(!filename)return json(res,404,{error:'Não encontrado'});
    const content=await readFile(path.join(here,'public',filename));
    res.writeHead(200,{'Content-Type':types[path.extname(filename)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'"});res.end(content);
  }catch(error){json(res,400,{error:error.message});}
});
server.listen(port,'127.0.0.1',()=>{console.log(`Tower Battle LIVE: http://127.0.0.1:${port}/\nStudio: http://127.0.0.1:${port}/?studio=1`);if(process.env.LIVE_AUTOCONNECT!=='0'&&liveConfig.autoConnect)connection.start();});
function shutdown(){clearInterval(timer);connection.stop();persist();for(const client of clients.keys())client.end();server.close();store.close();}
process.once('SIGTERM',()=>{shutdown();process.exit();});process.once('SIGINT',()=>{shutdown();process.exit();});
