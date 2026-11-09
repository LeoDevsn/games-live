import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
// Keep the TikFinity endpoint already configured for the platform: 4173/chatbot.
// Starting this host never arms a Faction match or opens a window.
export async function ensureChatGateway({requiredSource,allowUpgrade=false}={}){
 try{const r=await fetch('http://127.0.0.1:4173/api/platform-chat',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}});if(r.ok){const h=await r.json();if(h.app==='games-live-chat'){
  if(!requiredSource||(h.sources||['seguidor-arena']).includes(requiredSource))return {ready:true};
  if(!allowUpgrade||process.platform!=='win32')return {ready:false,restartRequired:true};
  const state=await(await fetch('http://127.0.0.1:4173/api/state',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}})).json();
  if(state.live?.enabled!==false)return {ready:false,restartRequired:true};
  // Only upgrade the shared relay while its Faction game is explicitly disconnected.
  const script="$listener=Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction Stop; $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener[0].OwningProcess); [pscustomobject]@{pid=$p.ProcessId;name=$p.Name;command=$p.CommandLine}|ConvertTo-Json -Compress";
  const owner=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',script],{windowsHide:true,encoding:'utf8'}));
  if(owner.name!=='node.exe'||!Number.isInteger(owner.pid)||!/(?:[\\/]|\s|\")src[\\/]adapters[\\/]local[\\/]server\.js(?:\"|\s|$)/i.test(owner.command))return {ready:false,restartRequired:true};
  const current=await(await fetch('http://127.0.0.1:4173/api/state',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}})).json();if(current.live?.enabled!==false)return {ready:false,restartRequired:true};
  process.kill(owner.pid);await new Promise(r=>setTimeout(r,400));
 }}
  if((await fetch('http://127.0.0.1:4173/api/health',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}})).ok)return {ready:false,restartRequired:true};
 }catch{}
 try{const file=path.resolve(import.meta.dirname,'../Faction-Wars-LIVE-0.4.0/scripts/launch-live.mjs');const {startFactionLive}=await import(pathToFileURL(file).href);await startFactionLive({open:false,arm:false});
  const r=await fetch('http://127.0.0.1:4173/api/platform-chat',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}}),h=await r.json();return {ready:r.ok&&(!requiredSource||(h.sources||['seguidor-arena']).includes(requiredSource))};
 }catch{return {ready:false};}
}
