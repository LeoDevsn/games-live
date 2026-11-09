import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createStore} from '../src/store.mjs';
const root=path.resolve(import.meta.dirname,'..'),port=4196,base=`http://127.0.0.1:${port}`;
let existing=null;try{const r=await fetch(base+'/api/state',{signal:AbortSignal.timeout(700)});existing=await r.json();}catch{}
if(existing){if(existing.theme?.id!=='krabs-plankton-v1')throw Error('Porta de prévia ocupada');console.log(base+'/?studio=1');}
else{
 const folder=path.join(root,'.runtime','theme-preview');mkdirSync(folder,{recursive:true});const db=path.join(folder,'preview-'+Date.now()+'.sqlite'),store=createStore(db),game=createEngine({roundSeconds:600,maxHp:500});
 for(let i=0;i<24;i++){const id='preview-'+i,team=i%2?'B':'A';game.apply({kind:'join',id,name:['Luna','Rafa','Gui','Bia'][i%4]+' '+(i+1),team},i*1000);game.apply({kind:'like',id,count:100},i*1000);}
 store.write('session',{engine:game.exportState(),rules:game.rules,elapsed:25000,seen:[]});store.write('audience.config',{voice:false,chat:false,volume:.8});store.close();const log=openSync(path.join(folder,'server.log'),'a');
 try{const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,windowsHide:true,detached:true,stdio:['ignore',log,log],env:{...process.env,PORT:String(port),TOWER_DB:db,LIVE_AUTOCONNECT:'0',TOWER_WS_URL:'ws://127.0.0.1:1/',TOWER_CHAT_RELAY_URL:base+'/disabled-chat'}});child.on('error',e=>console.error(e.message));child.unref();}finally{closeSync(log);}
 let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(base+'/api/state',{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('A prévia não respondeu');console.log(base+'/?studio=1');
}
