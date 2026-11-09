import {execFileSync,spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import {ARENA_VERSION} from '../src/arena.mjs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),base='http://127.0.0.1:4177';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function api(route,body){const r=await fetch(base+'/api/'+route,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(2500)});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
async function inspect(){
 const before=await api('state');if(before.app!=='seguidor-arena')throw Error('A porta 4177 pertence a outro aplicativo.');
 const ps="$listener=Get-NetTCPConnection -LocalPort 4177 -State Listen -ErrorAction Stop; $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener.OwningProcess); [pscustomobject]@{pid=$p.ProcessId;name=$p.Name;command=$p.CommandLine}|ConvertTo-Json -Compress";
 const processInfo=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',ps],{windowsHide:true,encoding:'utf8'}));
 if(processInfo.name!=='node.exe'||!Number.isInteger(processInfo.pid)||!/(?:[\\/]|\s)server\.mjs(?:"|\s|$)/i.test(processInfo.command))throw Error('O processo da porta 4177 não é o servidor esperado.');
 return {before,processInfo};
}
try{
 const {before,processInfo}=await inspect();
 if(process.argv.includes('--check')){console.log(JSON.stringify({checked:true,app:before.app,pid:processInfo.pid,mode:before.mode,currentArenaVersion:before.game.arena?.version||1,source:path.join(root,'server.mjs'),mutation:false},null,2));}
 else{
  // Pause and let the normal SQLite persistence tick finish before stopping this game.
  if(before.mode==='simulation')await api('control',{action:'pause'});await wait(1300);
  const confirmed=await inspect();if(confirmed.processInfo.pid!==processInfo.pid)throw Error('O processo mudou durante a conferência.');
  process.kill(processInfo.pid);await wait(150);
  const logDir=path.join(root,'.runtime');mkdirSync(logDir,{recursive:true});const log=openSync(path.join(logDir,'restart-local.log'),'a');
  try{const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,env:{...process.env,PORT:'4177',LIVE_AUTOCONNECT:'0'},windowsHide:true,detached:true,stdio:['ignore',log,log]});child.on('error',e=>console.error(e.message));child.unref();}finally{closeSync(log);}
  let ready=false;for(let i=0;i<80;i++){try{const s=await api('state');if(s.app==='seguidor-arena'&&s.game.arena?.version===ARENA_VERSION&&s.rules.damageMs===10000&&s.music&&s.audience&&s.theme?.id==='plankton-v1'){ready=true;break;}}catch{}await wait(100);}
  if(!ready)throw Error('A nova versão não respondeu. Confira .runtime/restart-local.log.');
  if(before.mode==='live'){await api('mode',{mode:'live'});if(before.connection.status==='disconnected')await api('disconnect',{});}
  if(before.paused&&before.mode==='simulation')await api('control',{action:'pause'});
  try{const {ensureChatGateway}=await import('../../platform/chat-gateway.mjs');const gateway=await ensureChatGateway();if(gateway.restartRequired)console.log('O host de chat do Faction (porta 4173) precisa ser reiniciado uma vez para carregar a atualiza\u00e7\u00e3o. A configura\u00e7\u00e3o do TikFinity permanece salva.');}catch{}
  console.log('Seguidor Arena atualizado. Rankings e configurações salvos foram preservados.');console.log('Painel: '+base+'/');console.log('Tela da LIVE: '+base+'/?studio=1');console.log('Atualize a página com Ctrl+F5.');
 }
}catch(e){console.error('Não foi possível reiniciar: '+e.message);process.exitCode=1;}
