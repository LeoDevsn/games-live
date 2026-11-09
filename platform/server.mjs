import http from 'node:http';
import path from 'node:path';
import {readFile,mkdir} from 'node:fs/promises';
import {openSync,closeSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ensureChatGateway} from './chat-gateway.mjs';
import {games} from './catalog.mjs';
import {ensureTowerServer} from '../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/scripts/runtime.mjs';
import {openDesktopApp} from '../shared/desktop-app.mjs';
const root=path.resolve(import.meta.dirname,'..');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function healthy(game){
 try{const response=await fetch(`http://127.0.0.1:${game.port}${game.health}`,{signal:AbortSignal.timeout(1500)});if(!response.ok)return false;const data=await response.json();return game.id==='jelly'?data.provider==='Fish Audio':game.id==='faction'?Boolean(data.state?.profile):game.id==='arena'?data.app==='seguidor-arena':Boolean(data.game?.rules);}
 catch{return false;}
}
async function launchProcess(directory,script,args=[],env={}){
 const logs=path.join(root,'.runtime','logs');await mkdir(logs,{recursive:true});const log=openSync(path.join(logs,directory.startsWith('Faction')?'faction.log':directory.startsWith('Jelly')?'jelly.log':directory==='Seguidor Arena'?'seguidor-arena.log':'tower.log'),'a');
 try{const child=spawn(process.execPath,[script,...args],{cwd:path.join(root,directory),env:{...process.env,...env},windowsHide:true,detached:true,stdio:['ignore',log,log]});child.once('error',error=>console.error('Não foi possível iniciar processo:',error.message));child.unref();}
 finally{closeSync(log);}
}
export async function startGame(game){
 // Only the selected new integration listens to LIVE input; preserve Jelly's running app.
 for(const other of games.filter(g=>g.id!==game.id&&g.id!=='jelly')){
   try{await fetch(`http://127.0.0.1:${other.port}/api/${other.id==='faction'?'live':'disconnect'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'disconnect'}),signal:AbortSignal.timeout(1000)});}catch{}
 }
 if(game.id==='faction'){
   const {startFactionLive}=await import(pathToFileURL(path.join(root,game.directory,'scripts/launch-live.mjs')).href);
   const result=await startFactionLive({open:false,arm:true});
   await fetch(result.panel+'api/live',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connect'}),signal:AbortSignal.timeout(1500)});
   return {id:game.id,panel:result.panel,studio:result.source};
 }
 if(['arena','tower'].includes(game.id))await ensureChatGateway({requiredSource:game.id==='tower'?'tower-battle':'seguidor-arena',allowUpgrade:true});
 if(game.id==='tower')await ensureTowerServer({preserveConnection:false});
 else if(!await healthy(game)){
   await launchProcess(game.directory,game.script,game.args||[],{PORT:String(game.port)});
   let ready=false;for(let i=0;i<50;i++){if(await healthy(game)){ready=true;break;}await delay(200);}if(!ready)throw Error('O jogo não respondeu. Consulte .runtime/logs.');
 }
 if(game.id==='faction'){
   let ready=false;try{ready=(await fetch(game.studio,{signal:AbortSignal.timeout(1500)})).ok;}catch{}
   if(!ready){await launchProcess(game.directory,'scripts/studio.js',[],{PORT:'4173',STUDIO_PORT:'4176'});for(let i=0;i<30;i++){try{if((await fetch(game.studio,{signal:AbortSignal.timeout(500)})).ok){ready=true;break;}}catch{}await delay(100);}if(!ready)throw Error('A arena de captura não iniciou na porta 4176.');}
 }
 if(game.id!=='jelly'){
   if(['arena','tower'].includes(game.id))await fetch(`http://127.0.0.1:${game.port}/api/mode`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'live'}),signal:AbortSignal.timeout(1500)});
   try{await fetch(`http://127.0.0.1:${game.port}/api/${game.id==='faction'?'live':'connect'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connect'}),signal:AbortSignal.timeout(1000)});}catch{}
 }
 return {id:game.id,panel:game.panel,studio:game.studio};
}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const files=new Map([['/','index.html'],['/app.js','app.js'],['/style.css','style.css']]);
export function createPlatformServer({port=Number(process.env.PLATFORM_PORT||4180),start=startGame,openWindow=openDesktopApp,status=healthy}={}){
const starting=new Map();
return http.createServer(async(req,res)=>{
 try{
   if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||''))return json(res,403,{error:'Acesso local obrigatório'});
   const url=new URL(req.url,'http://localhost');
   if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{app:'games-live',version:'0.3.2',desktopWindows:true,publicLiveViews:true,catalogVersion:3});
   if(req.method==='GET'&&url.pathname==='/api/games')return json(res,200,await Promise.all(games.map(async game=>({id:game.id,name:game.name,tag:game.tag,description:game.description,panel:game.panel,studio:game.studio,running:await status(game)}))));
   if(req.method==='POST'&&url.pathname.startsWith('/api/start/')){
     if(![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin||''))return json(res,403,{error:'Abra o painel local para iniciar um jogo'});
     const game=games.find(g=>g.id===url.pathname.split('/').at(-1));if(!game)return json(res,404,{error:'Jogo não encontrado'});
     let pending=starting.get(game.id);if(!pending){pending=(async()=>{const result=await start(game);await openWindow(game.studio,{kind:'game'});return {...result,window:{opened:true,mode:'app'}};})().finally(()=>starting.delete(game.id));starting.set(game.id,pending);}return json(res,200,await pending);
   }
   if(req.method==='POST'&&url.pathname.startsWith('/api/open/')){
     if(![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin||''))return json(res,403,{error:'Abra a biblioteca local para abrir um aplicativo'});
     const match=/^\/api\/open\/([^/]+)\/(studio|panel)$/.exec(url.pathname),game=match&&games.find(g=>g.id===match[1]);
     if(!game)return json(res,404,{error:'Janela não encontrada'});
     if(!await status(game))return json(res,409,{error:'Execute este jogo pela biblioteca primeiro.'});
     const target=match[2];await openWindow(game[target],{kind:target==='studio'?'game':'panel'});return json(res,200,{id:game.id,target,opened:true,mode:'app'});
   }
   if(req.method!=='GET')return json(res,405,{error:'Método inválido'});
   const file=files.get(url.pathname);if(!file)return json(res,404,{error:'Não encontrado'});
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'",'Cache-Control':'no-store'});res.end(await readFile(path.join(import.meta.dirname,'public',file)));
 }catch(error){json(res,500,{error:error.message});}
});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const port=Number(process.env.PLATFORM_PORT||4180);createPlatformServer({port}).listen(port,'127.0.0.1',()=>console.log(`Games Live: http://127.0.0.1:${port}/`));
}
