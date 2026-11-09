import test from 'node:test';
import assert from 'node:assert/strict';
import {createTikFinityAdapter} from '../src/tikfinity.mjs';
const msg=(event,data)=>({event,data});
test('normaliza comandos A e B e ignora outras mensagens',()=>{
 const a=createTikFinityAdapter();
 assert.deepEqual(a.normalize(msg('chat',{user:{userId:'42',nickname:'Ana'},comment:' a '})),{kind:'join',team:'A',id:'42',name:'Ana'});
 assert.equal(a.normalize(msg('chat',{user:{id:'42'},comment:'oi'})),null);
});
test('suporta ID nested e username de fallback',()=>{
 const a=createTikFinityAdapter();
 assert.equal(a.normalize(msg('chat',{user:{uniqueId:'@bob'},comment:'B'})).id,'@bob');
});
test('deduplicação de mensagem de chat',()=>{
 const a=createTikFinityAdapter(),m=msg('chat',{user:{id:'9'},comment:'A',msgId:'abc'});
 assert.ok(a.normalize(m,100));assert.equal(a.normalize(m,101),null);
});
test('curtidas trazem contagem e são limitadas',()=>{
 const a=createTikFinityAdapter();
 assert.equal(a.normalize(msg('like',{user:{id:'9'},likeCount:100000})).count,500);
});
test('presentes streak só são processados no último evento',()=>{
 const a=createTikFinityAdapter(),base={user:{id:'9'},giftType:1,repeatCount:3,groupId:'group:1'};
 assert.equal(a.normalize(msg('gift',{...base,repeatEnd:false})),null);
 assert.equal(a.normalize(msg('gift',{...base,repeatEnd:true})).count,3);
 assert.equal(a.normalize(msg('gift',{...base,repeatEnd:true})),null);
});
test('ignora envelope inválido ou eventos sem usuário',()=>{
 const a=createTikFinityAdapter();
 for(const value of [null,{},[],{event:'gift',data:null},{event:'chat',data:{comment:'A'}},{event:'unknown',data:{userId:'1'}}])assert.equal(a.normalize(value),null);
});
