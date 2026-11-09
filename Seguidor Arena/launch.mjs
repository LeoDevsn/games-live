import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
import {openDesktopApp} from '../shared/desktop-app.mjs';
const root=import.meta.dirname,base='http://127.0.0.1:4177/';
async function ready(){try{const r=await fetch(base+'api/state',{signal:AbortSignal.timeout(1000)});return r.ok&&(await r.json()).app==='seguidor-arena';}catch{return false;}}
try{
 try{const {ensureChatGateway}=await import('../platform/chat-gateway.mjs');const relay=await ensureChatGateway();if(relay.restartRequired)console.log('O host do chat precisa ser reiniciado para aplicar a atualiza\u00e7\u00e3o.');}catch{}
 if(!await ready()){
  mkdirSync(path.join(root,'.runtime'),{recursive:true});const log=openSync(path.join(root,'.runtime','server.log'),'a');
  try{const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',log,log]});child.once('error',()=>console.error('Falha ao iniciar arena'));child.unref();}finally{closeSync(log);}
  let success=false;for(let i=0;i<40;i++){if(await ready()){success=true;break;}await new Promise(r=>setTimeout(r,250));}if(!success)throw Error('Servidor indisponível. Confira .runtime/server.log');
 }
 console.log('Seguidor Arena disponível: '+base);
 if(!process.argv.includes('--no-open')){
  if(!process.argv.includes('--panel')){const r=await fetch(base+'api/mode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'live'})});if(!r.ok)throw Error('Não foi possível preparar a partida LIVE.');}
  await openDesktopApp(base+(process.argv.includes('--panel')?'':'?studio=1'),{kind:process.argv.includes('--panel')?'panel':'game'});
 }
}catch(error){console.error(error.message);process.exitCode=1;}
