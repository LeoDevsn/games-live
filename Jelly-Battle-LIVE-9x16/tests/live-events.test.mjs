import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../public/live-events.js';
const router=()=>JellyLive.createRouter({defaultGiftSeconds:2,gifts:[{id:99,team:'B',seconds:6,gold:true}]});
const flat={userId:'123',uniqueId:'larissa',nickname:'Larissa'};
test('A/B assigns and changes teams; likes use incremental counts',()=>{
  const {route}=router();
  assert.equal(route({event:'chat',data:{...flat,comment:' a '}}).team,'A');
  const like=route({event:'like',data:{...flat,likeCount:12,totalLikeCount:999}});assert.equal(like.team,'A');assert.equal(like.count,12);
  assert.equal(route({event:'chat',data:{...flat,comment:'B'}}).team,'B');
  assert.equal(route({event:'gift',data:{...flat,giftId:10}}).team,'B');
  assert.equal(route({event:'chat',data:{...flat,comment:'banana'}}),null);
});
test('supports nested users, unmapped viewers and configured gifts',()=>{
  const {route}=router();
  assert.equal(route({event:'like',data:{user:flat}}).type,'unassigned');
  assert.equal(route({event:'chat',data:{user:flat,comment:'A'}}).who,'Larissa');
  assert.equal(route({event:'gift',data:{user:flat,giftDetails:{id:10,name:'Rosa'}}}).team,'A');
  const gift=route({event:'gift',data:{user:flat,giftId:99}});assert.equal(gift.team,'B');assert.equal(gift.gold,true);
});
test('counts final streak total once, including duplicate finals with different message IDs',()=>{
  const {route}=router();route({event:'chat',data:{...flat,comment:'A'}});
  const data={...flat,giftType:1,giftId:10,groupId:'combo1',repeatCount:5};
  assert.equal(route({event:'gift',data:{...data,repeatEnd:false}}),null);
  const final=route({event:'gift',data:{...data,repeatEnd:true,msgId:'x'}});assert.equal(final.count,5);assert.equal(final.seconds,2);
  assert.equal(route({event:'gift',data:{...data,repeatEnd:true,msgId:'y'}}),null);
  assert.equal(route({event:'gift',data:{...data,repeatEnd:true,groupId:'combo2'}}).count,5);
});
test('deduplicates event IDs without merging legitimate gifts',()=>{
  const {route}=router();route({event:'chat',data:{...flat,comment:'A'}});
  const message={event:'gift',data:{...flat,giftId:10,msgId:'1'}};
  assert(route(message));assert.equal(route(message),null);assert(route({...message,data:{...message.data,msgId:'2'}}));assert(route({...message,data:{...message.data,msgId:undefined}}));
});
test('rejects malformed payloads and safely handles special user identifiers',()=>{
  const {route}=router();for(const message of [null,{},'hello',{event:'chat',data:{comment:'A'}}])assert.equal(route(message),null);
  assert.equal(route({event:'chat',data:{userId:'__proto__',nickname:'x',comment:'A'}}).team,'A');
  assert.equal(route({event:'like',data:{userId:'__proto__',likeCount:-100}}).count,1);
});
test('entrance provides a visual invitation with a cooldown; it never assigns a team',()=>{
  const {route}=router();
  const message={event:'member',data:flat};
  const welcome=route(message,1000000);assert.equal(welcome.type,'welcome');assert(welcome.text.includes('Larissa'));assert(welcome.text.includes('Digite A'));
  assert.equal(route(message,1000001),null);assert.equal(route({event:'like',data:flat}).type,'unassigned');
  assert.equal(route(message,1600001).type,'welcome');
});
