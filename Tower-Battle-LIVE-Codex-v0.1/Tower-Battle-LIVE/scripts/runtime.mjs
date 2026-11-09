import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),base='http://127.0.0.1:4175/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function state(){try{const r=await fetch(base+'api/state',{signal:AbortSignal.timeout(3000),headers:{Connection:'close'}});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}catch(e){if(e.message==='fetch failed'||e.name==='TimeoutError')return null;throw e;}}
export function recognizedTower(s){return s?.app==='tower-battle'||!!(s?.game?.teams?.A&&s?.game?.teams?.B&&s?.game?.rules?.likesPerBlock&&s?.limits?.maxBlocks);}
export function currentTower(s){return s?.app==='tower-battle'&&s.theme?.id==='krabs-plankton-v1'&&s.theme?.version===1;}
function owner(){const script="$listener=Get-NetTCPConnection -LocalPort 4175 -State Listen -ErrorAction Stop; $p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener[0].OwningProcess); [pscustomobject]@{pid=$p.ProcessId;name=$p.Name;command=$p.CommandLine}|ConvertTo-Json -Compress";return JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',script],{windowsHide:true,encoding:'utf8'}));}
function trusted(p){return p.name==='node.exe'&&Number.isInteger(p.pid)&&p.pid!==process.pid&&/(?:[\\/]|\s|\")server\.mjs(?:\"|\s|$)/i.test(p.command);}
export async function ensureTowerServer({force=false,preserveConnection=true}={}){
 const before=await state();if(before&&!recognizedTower(before))throw Error('A porta 4175 pertence a outro aplicativo.');if(before&&currentTower(before)&&!force)return {updated:false,panel:base,studio:base+'?studio=1'};
 if(before){if(process.platform!=='win32')throw Error('Reinicie o servidor anterior do Tower Battle.');const p=owner();if(!trusted(p))throw Error('Não foi possível confirmar o processo do Tower Battle.');await wait(1300);const again=owner();if(again.pid!==p.pid||!trusted(again))throw Error('O processo mudou durante a atualização.');let confirmed=await state();if(!confirmed){await wait(150);confirmed=await state();}if(!recognizedTower(confirmed))throw Error('O Tower Battle não respondeu à conferência antes da atualização.');process.kill(p.pid);for(let i=0;i<40&&await state();i++)await wait(100);}
 const folder=path.join(root,'.runtime');mkdirSync(folder,{recursive:true});const log=openSync(path.join(folder,'server.log'),'a');try{const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,env:{...process.env,PORT:'4175',LIVE_AUTOCONNECT:'0'},windowsHide:true,detached:true,stdio:['ignore',log,log]});child.once('error',e=>console.error(e.message));child.unref();}finally{closeSync(log);}
 let ready=false;for(let i=0;i<70;i++){if(currentTower(await state())){ready=true;break;}await wait(100);}if(!ready)throw Error('Tower Battle não respondeu. Confira .runtime/server.log.');
 if(before&&preserveConnection&&!['disconnected','ended'].includes(before.connection?.status)){const r=await fetch(base+'api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error('O jogo atualizou, mas a reconexão precisa ser feita no painel.');}
 return {updated:true,panel:base,studio:base+'?studio=1'};
}
