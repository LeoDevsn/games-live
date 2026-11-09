import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import path from 'node:path';
import {desktopAppCommand,openDesktopApp} from '../../shared/desktop-app.mjs';
import {createPlatformServer} from '../server.mjs';
import {games} from '../catalog.mjs';

test('desktop launcher uses app mode, portrait game windows, panel sizes and Chrome fallback; never opens external URLs',async()=>{
 const env={ProgramFiles:'C:/Apps','ProgramFiles(x86)':'C:/Apps86',LOCALAPPDATA:'C:/Local'},exists=p=>p===path.join('C:/Apps','Microsoft/Edge/Application/msedge.exe');
 const c=desktopAppCommand(games[0].studio,{env,exists});assert.match(c.executable,/msedge\.exe$/);assert.deepEqual(c.args,[`--app=${games[0].studio}`,'--window-size=570,1000']);assert.equal(c.options.windowsHide,true);
 assert.equal(desktopAppCommand(games[0].panel,{kind:'panel',env,exists}).args[1],'--window-size=1440,960');
 assert.match(desktopAppCommand(games[0].studio,{env,exists:p=>p.endsWith('chrome.exe')}).executable,/chrome\.exe$/);
 for(const url of ['https://example.com','file:///C:/x','http://127.0.0.1.evil.invalid','http://user:secret@localhost:4180/'])assert.throws(()=>desktopAppCommand(url,{env,exists}));
 assert.throws(()=>desktopAppCommand(games[0].studio,{env,exists:()=>false}),/não foi localizado/);
 let unref=false;const result=await openDesktopApp(games[0].studio,{env,exists,spawnProcess:(exe,args,options)=>{assert.equal(exe,c.executable);assert.deepEqual(args,c.args);assert.deepEqual(options,c.options);const child=new EventEmitter();child.unref=()=>{unref=true;};queueMicrotask(()=>child.emit('spawn'));return child;}});assert.equal(result.mode,'app');assert.ok(unref);
 await assert.rejects(()=>openDesktopApp(games[0].studio,{env,exists,spawnProcess:()=>{const child=new EventEmitter();queueMicrotask(()=>child.emit('error',Error('test launch failed')));return child;}}),/test launch failed/);
});

test('library starts all four games in app windows and opens fixed operator windows with local origin checks',{timeout:10000},async()=>{
 const port=49181,base=`http://127.0.0.1:${port}`,calls=[];let running=true;
 const server=createPlatformServer({port,status:async()=>running,start:async game=>({id:game.id,panel:game.panel,studio:game.studio}),openWindow:async(url,options)=>calls.push({url,kind:options.kind})});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const post=(route,origin=base)=>fetch(base+route,{method:'POST',headers:{Origin:origin}});
 try{
  assert.equal((await (await fetch(base+'/api/health')).json()).desktopWindows,true);
  for(const game of games){const r=await post('/api/start/'+game.id);assert.equal(r.status,200);assert.equal((await r.json()).window.mode,'app');assert.deepEqual(calls.at(-1),{url:game.studio,kind:'game'});const p=await post(`/api/open/${game.id}/panel`);assert.equal(p.status,200);assert.deepEqual(calls.at(-1),{url:game.panel,kind:'panel'});}
  const before=calls.length;assert.equal((await post('/api/open/arena/studio','https://external.invalid')).status,403);assert.equal((await post('/api/open/arena/arbitrary')).status,404);assert.equal((await post('/api/open/missing/panel')).status,404);assert.equal((await fetch(base+'/api/open/arena/studio')).status,404);assert.equal(calls.length,before);
  const r=await post('/api/open/arena/studio?url=https://external.invalid');assert.equal(r.status,200);assert.deepEqual(calls.at(-1),{url:games[3].studio,kind:'game'});
  running=false;assert.equal((await post('/api/open/arena/panel')).status,409);
  const html=await (await fetch(base+'/')).text();assert.match(html,/<button id="arena"/);assert.match(html,/<button id="panel"/);assert.doesNotMatch(html,/target="_blank"/);
 }finally{await new Promise(r=>server.close(r));}
});

test('simultaneous start requests open one game window; failed window launch can be retried',{timeout:10000},async()=>{
 const port=49182,base=`http://127.0.0.1:${port}`;let starts=0,opens=0,fail=true;
 const server=createPlatformServer({port,status:async()=>true,start:async game=>{starts++;await new Promise(r=>setTimeout(r,50));return {id:game.id};},openWindow:async()=>{opens++;if(fail)throw Error('window unavailable');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const post=()=>fetch(base+'/api/start/arena',{method:'POST',headers:{Origin:base}});
 try{const results=await Promise.all([post(),post()]);assert.ok(results.every(r=>r.status===500));assert.equal(starts,1);assert.equal(opens,1);fail=false;assert.equal((await post()).status,200);assert.equal(starts,2);assert.equal(opens,2);}
 finally{await new Promise(r=>server.close(r));}
});
