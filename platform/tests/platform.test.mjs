import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {games} from '../catalog.mjs';
import path from 'node:path';

test('catálogo mantém os quatro jogos em portas distintas e aponta para Faction atualizado',()=>{
 assert.equal(games.length,4);assert.equal(new Set(games.map(g=>g.port)).size,4);assert.equal(games.find(g=>g.id==='faction').directory,'Faction-Wars-LIVE-0.4.0');assert.equal(games.find(g=>g.id==='faction').studio,'http://127.0.0.1:4176/');
});
test('plataforma serve biblioteca e restringe inicialização e arquivos privados',{timeout:15000},async()=>{
 const port=49180,base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['platform/server.mjs'],{cwd:path.resolve(import.meta.dirname,'../..'),env:{...process.env,PLATFORM_PORT:String(port)},windowsHide:true,stdio:'ignore'});
 try{let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
   const state=await (await fetch(base+'/api/games')).json();assert.equal(state.length,4);assert.ok(state.every(g=>!('directory'in g)));
   assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/api/start/tower',{method:'POST',headers:{Origin:'https://external.invalid'}})).status,403);
 }finally{child.kill();}
});
