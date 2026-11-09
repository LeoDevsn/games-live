import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
import {openDesktopApp} from '../shared/desktop-app.mjs';
const root=path.resolve(import.meta.dirname,'..'),url='http://127.0.0.1:4180/';
async function health(){try{const r=await fetch(url+'api/health',{signal:AbortSignal.timeout(1000)});if(!r.ok)return null;const h=await r.json();return h.app==='games-live'?h:null;}catch{return null;}}
async function ready(){const h=await health();return h?.publicLiveViews===true&&h.catalogVersion===3;}
try{
 const previous=await health();
 if(previous&&(!previous.publicLiveViews||previous.catalogVersion!==3)){
   // Upgrade only this library host. Game servers and their saved matches stay running.
   const script="$listener=Get-NetTCPConnection -LocalPort 4180 -State Listen -ErrorAction Stop; $owner=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener[0].OwningProcess); [pscustomobject]@{pid=$owner.ProcessId;name=$owner.Name;command=$owner.CommandLine}|ConvertTo-Json -Compress";
   const owner=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',script],{windowsHide:true,encoding:'utf8'}));
   const expected=path.join(import.meta.dirname,'server.mjs').toLowerCase(),command=String(owner.command).toLowerCase();
   if(owner.name!=='node.exe'||!Number.isInteger(owner.pid)||owner.pid===process.pid||!command.includes('"'+expected+'"'))throw Error('Feche a instância anterior do Games Live e abra novamente pelo INICIAR-GAMES-LIVE.bat.');
   process.kill(owner.pid);
   for(let i=0;i<40;i++){if(!await health())break;await new Promise(r=>setTimeout(r,100));}
 }
 if(!await ready()){
   const folder=path.join(root,'.runtime','logs');mkdirSync(folder,{recursive:true});const log=openSync(path.join(folder,'platform.log'),'a');
   try{const child=spawn(process.execPath,[path.join(import.meta.dirname,'server.mjs')],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',log,log]});child.once('error',()=>console.error('Falha ao iniciar plataforma'));child.unref();}finally{closeSync(log);}
   let started=false;for(let i=0;i<40;i++){if(await ready()){started=true;break;}await new Promise(r=>setTimeout(r,250));}if(!started)throw Error('Plataforma indisponível. Confira .runtime/logs/platform.log');
 }
 console.log('Games Live disponível: '+url);
 if(!process.argv.includes('--no-open')){
   await openDesktopApp(url,{kind:'library'});
 }
}catch(error){console.error(error.message);process.exitCode=1;}
