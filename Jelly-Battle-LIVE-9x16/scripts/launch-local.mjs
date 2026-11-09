import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
import {openDesktopApp} from '../../shared/desktop-app.mjs';

const root=path.resolve(import.meta.dirname,'..');
const base='http://127.0.0.1:4174';
const target=base+(process.argv.includes('--setup')?'/setup.html':process.argv.includes('--panel')?'/':'/?studio=1');
const noOpen=process.argv.includes('--no-open');
async function ready(){
  try{const response=await fetch(base+'/api/voice/status',{signal:AbortSignal.timeout(1000)});return response.ok&&(await response.json()).provider==='Fish Audio'}catch{return false}
}
try{
  if(!await ready()){
    console.log('Preparando Jelly Battle…');
    const build=spawnSync(process.execPath,[path.join(root,'scripts/build.mjs')],{cwd:root,stdio:'inherit',windowsHide:true});
    if(build.error||build.status!==0)throw Error('Não foi possível preparar o jogo. Confira o Node.js.');
    const logs=path.join(root,'.logs');mkdirSync(logs,{recursive:true});
    const log=openSync(path.join(logs,'local-server.log'),'a');
    let startError;
    try{
      const child=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',log,log]});
      child.once('error',error=>{startError=error});child.unref();
    }finally{closeSync(log)}
    let started=false;
    for(let attempt=0;attempt<30;attempt++){
      if(startError)throw Error('Não foi possível iniciar o servidor local.');
      if(await ready()){started=true;break}
      await new Promise(resolve=>setTimeout(resolve,500));
    }
    if(!started)throw Error('O servidor não respondeu. Consulte .logs/local-server.log e confira se a porta 4174 está livre.');
  }
  console.log('Jelly Battle disponível: '+target);
  if(!noOpen){
    await openDesktopApp(target,{kind:process.argv.includes('--setup')||process.argv.includes('--panel')?'panel':'game'});
  }
}catch(error){console.error(error.message);process.exitCode=1}
