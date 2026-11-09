import {ARENA_VERSION} from '../src/arena.mjs';
import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),port=4194,base=`http://127.0.0.1:${port}`;
async function state(){try{const r=await fetch(base+'/api/state',{signal:AbortSignal.timeout(1000)});return r.ok?await r.json():null;}catch{return null;}}
const current=await state();if(current&&current.app!=='seguidor-arena')throw Error('Porta de prévia ocupada por outro aplicativo');
if(current&&current.game.arena?.version!==ARENA_VERSION)throw Error('Uma prévia antiga está aberta nesta porta');
if(!current){
 const folder=path.join(root,'.runtime','plankton-preview-4194');mkdirSync(folder,{recursive:true});const log=openSync(path.join(folder,'server.log'),'a');
 try{const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',log,log],env:{...process.env,PORT:String(port),ARENA_DB:path.join(folder,'arena.sqlite'),ARENA_WS_URL:'ws://127.0.0.1:1/',ARENA_CHAT_RELAY_URL:base+'/disabled-chat'}});child.once('error',e=>console.error(e.message));child.unref();}finally{closeSync(log);}
}
let ready=false;for(let i=0;i<50;i++){const s=await state();if(s?.app==='seguidor-arena'&&s.audience){ready=true;break;}await new Promise(r=>setTimeout(r,100));}
if(!ready)throw Error('Prévia não respondeu. Confira .runtime/plankton-preview-4194/server.log');
console.log(JSON.stringify({preview:base+'/',studio:base+'/?studio=1',isolated:true,liveChatDisabled:true,liveInputDisabled:true}));
