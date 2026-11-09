import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdapter,allowedAvatar} from '../src/tikfinity.mjs';
const frame=(event,data)=>({event,data:{userId:'100',nickname:'Teste',...data}});

test('existing followers are recognized on member/share and unknown status is preserved as unknown',()=>{
 const a=createAdapter();
 for(const event of ['member','share']){const action=a.normalize({event,data:{user:{id:'old',followRole:1}}});assert.equal(action.kind,'identity');assert.equal(action.following,true);}
 assert.equal(a.normalize(frame('member',{})).following,null);
 assert.equal(a.normalize(frame('member',{isFollower:false})).following,false);
 assert.equal(a.normalize(frame('roomUser',{viewerCount:500})),null);
});
test('normaliza usuários nested/flat, follow e status explícito sem inventar seguidor por contadores',()=>{
 const a=createAdapter();assert.equal(a.normalize(frame('follow',{})).following,true);assert.equal(a.normalize(frame('like',{likeCount:1,followRole:1})).following,true);assert.equal(a.normalize(frame('like',{likeCount:1,followInfo:{followStatus:2}})).following,true);assert.equal(a.normalize(frame('like',{likeCount:1,followerCount:9000,isModerator:true})).following,null);assert.equal(a.normalize(frame('like',{likeCount:1,followRole:0})).following,null);assert.equal(a.normalize({event:'follow',data:{user:{id:'nested',nickname:'Nested'}}}).id,'nested');
});

test('positive follower evidence is not masked by a zero in another relationship field; explicit boolean revocation is respected',()=>{
 const a=createAdapter();
 assert.equal(a.normalize(frame('like',{likeCount:1,followRole:0,followInfo:{followStatus:1}})).following,true);
 assert.equal(a.normalize(frame('like',{likeCount:1,followRole:0,isFollower:true})).following,true);
 assert.equal(a.normalize(frame('like',{likeCount:1,followRole:1,isFollower:false})).following,false);
});
test('dedupe sobrevive a reinício, usa msgId e grupo final de streak mesmo com msgIds diferentes',()=>{
 const a=createAdapter(),chat=frame('like',{msgId:'a',likeCount:50});assert.ok(a.normalize(chat));assert.equal(a.normalize(chat),null);const b=createAdapter({seen:a.exportState()});assert.equal(b.normalize(chat),null);
 const gift=frame('gift',{giftId:1,groupId:'g',giftType:1,repeatCount:4,repeatEnd:false});assert.equal(a.normalize(gift),null);gift.data.repeatEnd=true;gift.data.msgId='1';assert.ok(a.normalize(gift));gift.data.msgId='2';assert.equal(a.normalize(gift),null);
});
test('total da sala, likes negativos e IDs numéricos inseguros não viram entradas/XP',()=>{
 const a=createAdapter();for(const data of [{totalLikeCount:90000},{likeCount:-1},{likeCount:2.5},{userId:9007199254740992,likeCount:1}])assert.equal(a.normalize(frame('like',data)),null);
});
test('fotos aceitam somente HTTPS de CDN, sem credenciais, portas privadas ou domínios falsos',()=>{
 assert.ok(allowedAvatar('https://p16.tiktokcdn.com/avatar.webp?signature=private'));
 for(const url of ['http://p16.tiktokcdn.com/a','https://127.0.0.1/a','https://tiktokcdn.com.evil.invalid/a','https://evil.invalid/a','https://user:pass@p16.tiktokcdn.com/a','https://p16.tiktokcdn.com:4173/a','javascript:alert(1)'])assert.equal(allowedAvatar(url),null);
});
