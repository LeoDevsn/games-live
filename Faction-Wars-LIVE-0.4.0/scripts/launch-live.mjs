import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDesktopApp} from '../../shared/desktop-app.mjs';
const root=path.resolve(import.meta.dirname,'..');
const version=JSON.parse(readFileSync(path.join(root,'package.json'))).version;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url,options={}){const response=await fetch(url,{...options,signal:AbortSignal.timeout(1800)});if(!response.ok)throw Error('HTTP '+response.status);return response.json();}
export async function startFactionLive({backendPort=4173,capturePort=4176,open=true,arm=true,env={}}={}){
 if(Number(process.versions.node.split('.')[0])!==24)throw Error('Use Node.js 24 para executar o Faction Wars.');
 for(const file of ['src/ui/vendor/phaser-3.90.0.min.js','src/ui/assets/figma/background.png','src/ui/assets/figma/title.png'])if(!existsSync(path.join(root,file)))throw Error('Arquivo do jogo ausente: '+file);
 if(!Number.isInteger(backendPort)||!Number.isInteger(capturePort)||backendPort===capturePort||Math.min(backendPort,capturePort)<1024||Math.max(backendPort,capturePort)>65535)throw Error('Portas locais inválidas.');
 const panel=`http://127.0.0.1:${backendPort}/`,source=`http://127.0.0.1:${capturePort}/`,children=[];
 const check=async(base,app)=>{try{const h=await json(base+'api/health');if(h.app!==app)throw Error('Porta em uso por outro aplicativo');if(h.version!==version)throw Error('Há uma versão anterior do jogo aberta. Reinicie o servidor do Faction.');if(app==='faction-wars-capture'&&h.backendPort!==backendPort)throw Error('A captura aponta para outra partida');return true;}catch(error){if(/Porta em uso|versão anterior|outra partida/.test(error.message))throw error;return false;}};
 function launch(script,label){const folder=path.join(root,'.runtime','logs');mkdirSync(folder,{recursive:true});const log=openSync(path.join(folder,label+'.log'),'a');try{const child=spawn(process.execPath,[path.join(root,script)],{cwd:root,env:{...process.env,...env,PORT:String(backendPort),STUDIO_PORT:String(capturePort),LIVE_AUTOCONNECT:'0'},detached:true,windowsHide:true,stdio:['ignore',log,log]});child.on('error',error=>{child.launchError=error;});child.unref();children.push(child);return child;}finally{closeSync(log);}}
 async function ensure(base,app,script,label){if(await check(base,app))return;const child=launch(script,label);for(let i=0;i<100;i++){if(child.launchError)throw child.launchError;if(child.exitCode!==null)throw Error('Não foi possível iniciar '+label+'. Confira .runtime/logs/'+label+'.log');if(await check(base,app))return;await wait(100);}throw Error('Tempo esgotado ao iniciar '+label);}
 try{
  await ensure(panel,'faction-wars-live','src/adapters/local/server.js','faction-live');
  await ensure(source,'faction-wars-capture','scripts/studio.js','faction-capture');
  if(arm&&backendPort===4173&&capturePort===4176){
   for(const [port,app] of [[4175,'tower'],[4177,'arena']]){
    try{const other=await json(`http://127.0.0.1:${port}/api/state`),recognized=app==='arena'?other.app==='seguidor-arena':Boolean(other.game?.rules?.likesPerBlock);if(recognized&&other.mode==='live')await json(`http://127.0.0.1:${port}/api/disconnect`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}catch{}
   }
  }
  let state=await json(panel+'api/state');
  // Reopening the app preserves an already armed/running LIVE match.
  if(arm&&!state.live.enabled){const action=state.sessionKind==='live'&&Object.keys(state.state.people).length>0&&state.state.phase!=='done'?'resume':'start';state=await json(panel+'api/live',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});}
  if(open)await openDesktopApp(source);
  return {panel,source,version,waitingForFirstJoin:state.waitingForFirstJoin,tikfinity:state.live.status,children};
 }catch(error){for(const child of children)if(child.exitCode===null)child.kill();throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{const result=await startFactionLive({open:!process.argv.includes('--no-open'),arm:!process.argv.includes('--no-arm')});console.log(`Faction Wars LIVE ${result.version}\nPainel: ${result.panel}\nFonte Navegador 1080x1920: ${result.source}\nTikFinity: ${result.tikfinity}\n${result.waitingForFirstJoin?'Aguardando !vermelho ou !azul para abrir a preparação de 25s.':'Partida pronta no painel.'}`);}
 catch(error){console.error(error.message);process.exitCode=1;}
}
