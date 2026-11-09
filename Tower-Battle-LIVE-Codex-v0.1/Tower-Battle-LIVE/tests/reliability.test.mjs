import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join as pathJoin} from 'node:path';
import {createConnection} from '../src/connection.mjs';
import {createEngine} from '../src/engine.mjs';
import {createTikFinityAdapter} from '../src/tikfinity.mjs';
import {replayEvents} from '../src/replay.mjs';
import {createStore} from '../src/store.mjs';
import {validateRules,DEFAULT_RULES} from '../src/rules.mjs';

function fixture(){
 let now=0,next=0;const tasks=new Map(),sockets=[],received=[];
 class Socket{
   constructor(url){this.url=url;sockets.push(this);}
   open(){this.onopen?.();}
   message(value){this.onmessage?.({data:JSON.stringify(value)});}
   close(){this.onclose?.();}
 }
 const connection=createConnection({WebSocketClass:Socket,clock:()=>now,setTimer:(fn,ms)=>{const id=++next;tasks.set(id,{fn,at:now+ms});return id;},clearTimer:id=>tasks.delete(id),onMessage:m=>received.push(m)});
 function advance(ms){now+=ms;for(const [id,t] of [...tasks])if(t.at<=now){tasks.delete(id);t.fn();}}
 return {connection,sockets,received,advance};
}
const chat=(id='u1',team='A',msgId='one')=>({event:'chat',data:{user:{id,nickname:'Teste'},comment:team,msgId}});

test('socket aberto não confirma LIVE; evento real e inatividade têm estados distintos',()=>{
 const f=fixture();f.connection.start();assert.equal(f.connection.snapshot().status,'connecting');f.sockets[0].open();assert.equal(f.connection.snapshot().status,'connected');
 f.sockets[0].message(chat());assert.equal(f.connection.snapshot().status,'receiving');f.advance(60001);assert.equal(f.connection.snapshot().status,'inactive');f.connection.stop();
});
test('queda alterna localhost/IPv4, reconecta e ignora callback de socket antigo',()=>{
 const f=fixture();f.connection.start();const old=f.sockets[0];old.open();old.close();assert.equal(f.connection.snapshot().status,'retrying');f.advance(750);
 assert.equal(f.sockets[1].url,'ws://127.0.0.1:21213/');old.message(chat());assert.equal(f.received.length,0);f.sockets[1].open();f.sockets[1].message(chat());assert.equal(f.received.length,1);f.connection.stop();f.advance(60000);assert.equal(f.sockets.length,2);
});
test('conexão travada expira, payload inválido não derruba a sessão, follow/share são telemetria',()=>{
 const f=fixture();f.connection.start();f.advance(5000);assert.equal(f.connection.snapshot().status,'retrying');f.advance(750);const ws=f.sockets[1];ws.open();ws.onmessage({data:'{'});assert.equal(f.connection.snapshot().invalid,1);
 ws.message({event:'follow',data:{}});ws.message({event:'share',data:{}});assert.equal(f.received.length,2);ws.message({event:'streamEnd'});assert.equal(f.connection.snapshot().status,'ended');f.connection.stop();
});
test('socket falso com chat A inicia uma única vez ao reentregar msgId',()=>{
 const engine=createEngine(),adapter=createTikFinityAdapter();let applied=0;
 class WS{constructor(){queueMicrotask(()=>{this.onopen();for(let i=0;i<3;i++)this.onmessage({data:JSON.stringify(chat())});});}close(){}}
 const c=createConnection({WebSocketClass:WS,onMessage:m=>{const action=adapter.normalize(m,1);if(action){engine.apply(action,1);applied++;}}});c.start();
 return new Promise(resolve=>setImmediate(()=>{assert.equal(applied,1);assert.equal(engine.snapshot().round,1);assert.equal(engine.snapshot().teams.A.blocks,1);c.stop();resolve();}));
});
test('streak final é único por groupId mesmo com msgId diferente',()=>{
 const a=createTikFinityAdapter(),base={user:{id:'u'},groupId:'g',giftId:1,giftType:1,repeatCount:8};
 assert.equal(a.normalize({event:'gift',data:{...base,repeatEnd:false,msgId:'1'}}),null);
 assert.equal(a.normalize({event:'gift',data:{...base,repeatEnd:true,msgId:'2'}}).count,8);
 assert.equal(a.normalize({event:'gift',data:{...base,repeatEnd:true,msgId:'3'}}),null);
 const restarted=createTikFinityAdapter(a.exportState());assert.equal(restarted.normalize({event:'gift',data:{...base,repeatEnd:true,msgId:'4'}}),null);
});
test('presentes diferentes e curtidas delta não são fundidos; total da sala nunca vira bloco',()=>{
 const a=createTikFinityAdapter();for(const id of ['g1','g2'])assert.ok(a.normalize({event:'gift',data:{user:{id:'u'},giftId:1,msgId:id,repeatCount:1}}));
 assert.equal(a.normalize({event:'like',data:{user:{id:'u'},totalLikeCount:999999}}).count,0);
});
test('desconhecidos não entram por likes/gifts; cooldown, teto e time fixo permanecem',()=>{
 const g=createEngine();g.apply({kind:'gift',id:'x'});g.apply({kind:'like',id:'x',count:500});assert.equal(g.snapshot().totalMembers,0);
 g.apply({kind:'join',id:'u',team:'A'},0);for(let i=0;i<1000;i++)g.apply({kind:'join',id:'u',team:'A'},1);assert.equal(g.snapshot().teams.A.blocks,1);
 assert.equal(g.apply({kind:'join',id:'u',team:'B'},99999),false);
});
test('ranking e partida voltam do SQLite com o mesmo estado e identidade pseudonimizada',()=>{
 const filename=pathJoin(mkdtempSync(pathJoin(tmpdir(),'tower-store-')),'session.sqlite');let store=createStore(filename);
 const id=store.anonymousId('real-user-123'),g=createEngine({roundSeconds:1,attackIntervalSeconds:5});g.apply({kind:'join',id,team:'A',name:'Teste'},0);g.tick(1000);
 store.write('session',g.exportState());store.write('rules',g.rules);store.close();store=createStore(filename);
 assert.equal(store.anonymousId('real-user-123'),id);const restored=createEngine(store.read('rules'),store.read('session'));assert.deepEqual(restored.snapshot().ranking,g.snapshot().ranking);assert.equal(restored.snapshot().teams.A.wins,1);assert.equal(restored.snapshot().round,1);store.close();
});
test('configuração rejeita zero/divisão, NaN, limites e desconhecidos; não muda rodada em curso',()=>{
 for(const input of [{likesPerBlock:0},{maxBlocks:0},{maxHp:0},{roundSeconds:Infinity},{maxBlocks:1.2},{giftBlocks:-1},{autoRestart:'sim'},{unknown:1}])assert.throws(()=>validateRules(input));
 const g=createEngine();g.apply({kind:'join',id:'u',team:'A'},0);g.configure(validateRules({...DEFAULT_RULES,maxHp:200}));assert.equal(g.snapshot().rules.maxHp,120);g.tick(30000);g.tick(30000);g.tick(30000);g.tick(30000);g.tick(12000);assert.equal(g.snapshot().rules.maxHp,200);assert.equal(g.snapshot().teams.A.hp,200);
});
test('replay usa normalizador real, é determinístico e não modifica outra sessão',()=>{
 const records=[{at:0,message:chat()},{at:5000,message:chat()},{at:6000,message:chat('u2','B','two')},{at:125000,message:{event:'share',data:{}}}];
 const live=createEngine(),before=live.exportState(),a=replayEvents(records),b=replayEvents(records);assert.deepEqual(a,b);assert.equal(a.accepted,2);assert.equal(a.snapshot.phase,'intermission');assert.deepEqual(live.exportState(),before);
 assert.throws(()=>replayEvents([{at:1,message:chat()},{at:0,message:chat()}]));
});
