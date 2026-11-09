import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLiveRuntime} from '../integrations/tikfinity/live-runtime.js';
import {createState} from '../src/core/state.js';
import {localEvent} from '../src/core/engine.js';
import {Store,hash} from '../src/persistence/store.js';

const dir=mkdtempSync(path.join(tmpdir(),'faction-live-'));
let current=createState({id:'live-fixture'}),queue=[],sockets=[],seq=0;
const db=new Store(path.join(dir,'game.sqlite'),current);
class FakeSocket{constructor(){sockets.push(this);}close(){}}
function make(){return createLiveRuntime({filename:path.join(dir,'intake.sqlite'),getState:()=>({id:current.id,seen:current.seen,paused:false,demo:false}),enqueue(e){queue.push(localEvent(current,e.actorId,e.kind,e.payload,seq++,e.providerEventId));return true;},connectionOptions:{WebSocketClass:FakeSocket}});}
const send=m=>sockets.at(-1).onmessage({data:JSON.stringify(m)});
const msg=(event,id,fields={})=>({event,data:{user:{id:'u1',nickname:'Fixture'},msgId:id,...fields}});
let live=make();live.connect();sockets.at(-1).onopen();send(msg('chat','monitor',{comment:'!vermelho'}));assert.equal(queue.length,0);
live.enable();sockets.at(-1).onopen();send(msg('chat','m1',{comment:'!vermelho'}));send(msg('chat','m1',{comment:'!vermelho'}));assert.equal(queue.length,1);
// Crash between durable intake and engine commit: pending delivery survives process restart.
live.close();queue=[];live=make();live.enable();assert.equal(queue.length,1);current=db.commit(current,queue);live.committed(queue);queue=[];
assert.equal(current.people['tt:u1'].faction,'R');
send(msg('chat','m1',{comment:'!vermelho'}));assert.equal(queue.length,0);
while(current.phase!=='combat')current=db.commit(current);
send(msg('like','l1',{likeCount:400,totalLikeCount:999999}));current=db.commit(current,queue);live.committed(queue);queue=[];assert.equal(current.teams.R.credits,2);
send(msg('gift','g1',{giftId:1,repeatEnd:true}));assert.equal(queue.length,0);
send(msg('chat','m2',{comment:'!azul'}));current=db.commit(current,queue);live.committed(queue);queue=[];assert.equal(current.people['tt:u1'].faction,'R');
send(msg('chat','m3',{comment:'!arqueiro !centro'}));current=db.commit(current,queue);live.committed(queue);queue=[];assert.equal(current.teams.R.window.votes['tt:u1'].kind,'A');
assert.equal(hash(current),hash(db.verifyReplay()));live.close();db.close();
console.log('PASS live runtime: monitor isolado, usuário nested, dedupe durável, pending recovery, likes delta, gift inerte, facção fixa, votos e replay real.');
