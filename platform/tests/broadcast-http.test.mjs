import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
const root=path.resolve(import.meta.dirname,'../..');
const gif='R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
for(const [name,folder,envKey] of [['Arena','Seguidor Arena','ARENA_DB'],['Tower','Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE','TOWER_DB']]){
 test(name+': pódio/chat persistentes e efeitos oficiais sem alertas GIF próprios',{timeout:20000},async()=>{
  let child,base;const db=path.join(mkdtempSync(path.join(tmpdir(),'gifts-http-')),'game.sqlite');
  const start=async()=>{const free=http.createServer();await new Promise(r=>free.listen(0,'127.0.0.1',r));const port=free.address().port;await new Promise(r=>free.close(r));child=spawn(process.execPath,['server.mjs'],{cwd:path.join(root,folder),env:{...process.env,PORT:String(port),[envKey]:db,LIVE_AUTOCONNECT:'0',ARENA_WS_URL:'ws://127.0.0.1:1/',ARENA_CHAT_RELAY_URL:'http://127.0.0.1:1/relay'},windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
   for(let i=0;i<150;i++){const match=output.match(/127\.0\.0\.1:(\d+)/);if(match&&match[1]!=='0'){base='http://127.0.0.1:'+match[1];return;}if(child.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,40));}throw Error(output||'startup timeout');};
  const stop=async()=>{if(child?.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}};
  const post=async(route,body={})=>{const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
  try{
   await start();await post('mode',{mode:'simulation'});
   for(const file of ['/broadcast-ui.js','/broadcast-ui.css','/broadcast-render.js','/?studio=1'])assert.equal((await fetch(base+file)).status,200,file);
   let view=await (await fetch(base+'/api/state')).json();assert.equal(view.broadcast.nativeGiftsOnly,true);assert.equal(view.broadcast.config.enabled,false);
   const upload=await fetch(base+'/api/broadcast/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:'effect.gif',base64:gif})});assert.equal(upload.status,400);
   view=await post('broadcast/config',{...view.broadcast.config,title:'Meu pódio',enabled:true});assert.equal(view.broadcast.config.enabled,false);
   view=await post('broadcast/chat',{name:'Visitante',text:'Meu comentário'});assert.equal(view.broadcast.chat.at(-1).text,'Meu comentário');
   assert.equal((await fetch(base+'/api/broadcast/test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,400);
   view=await post('mode',{mode:'live'});assert.equal(view.broadcast.alert,null);assert.equal(view.broadcast.chat.length,0);
   const blocked=await fetch(base+'/api/broadcast/test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(blocked.status,400);
   await stop();await start();view=await (await fetch(base+'/api/state')).json();assert.equal(view.broadcast.config.title,'Meu pódio');assert.equal(view.broadcast.config.enabled,false);
  }finally{await stop();}
 });
}
