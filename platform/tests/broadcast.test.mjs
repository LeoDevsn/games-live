import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createBroadcast,inspectMedia} from '../../shared/broadcast-server.mjs';
const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
const memory=()=>{const map=new Map();return {read:(k,f)=>map.has(k)?structuredClone(map.get(k)):f,write:(k,v)=>map.set(k,structuredClone(v))};};
test('GIF local, vínculo por presente, streak único, chat real e restauração após alerta',async()=>{
 const store=memory(),directory=mkdtempSync(path.join(tmpdir(),'broadcast-'));let now=10000;
 const b=await createBroadcast({store,directory,metrics:['wins'],clock:()=>now});
 await b.handle('/api/broadcast/upload',{filename:'../../teste.gif',base64:gif.toString('base64')},'simulation');const asset=b.snapshot('simulation').assets[0];assert.equal(asset.name,'teste.gif');assert.equal(asset.type,'image/gif');
 await b.handle('/api/broadcast/config',{metric:'wins',accent:'#ab89ff',title:'TOP 3',giftMappings:[{giftId:'1',assetId:asset.id,seconds:2}]},'simulation');
 const frame={event:'gift',data:{user:{id:'u',nickname:'Visitante'},giftId:1,giftType:1,groupId:'g',repeatEnd:false,repeatCount:3,msgId:'1'}};
 assert.equal(b.receive(frame,'live'),false);frame.data.repeatEnd=true;assert.equal(b.receive(frame,'live'),true);frame.data.msgId='2';assert.equal(b.receive(frame,'live'),false);assert.ok(b.snapshot('live').alert.media.url.includes(asset.id));assert.equal(b.snapshot('simulation').alert,null);
 const chat={event:'chat',data:{userId:'u',nickname:'Visitante',msgId:'chat1',comment:'Mensagem sem comando A/B'}};assert.equal(b.receive(chat,'live'),true);assert.equal(b.receive(chat,'live'),false);assert.equal(b.snapshot('live').chat[0].text,'Mensagem sem comando A/B');
 now+=2100;assert.equal(b.snapshot('live').alert,null);assert.equal(b.snapshot('live').chat.length,1);b.persist();const restored=await createBroadcast({store,directory,metrics:['wins'],clock:()=>now});assert.equal(restored.receive(frame,'live'),false);assert.equal(restored.snapshot('live').assets.length,1);
});
test('limite de fila, separação de modo e validação de arquivos',async()=>{
 const b=await createBroadcast({store:memory(),directory:mkdtempSync(path.join(tmpdir(),'broadcast-')),metrics:['blocks']});
 await assert.rejects(()=>b.handle('/api/broadcast/test',{},'live'),/Simulação/);
 for(let i=0;i<15;i++)b.receive({event:'gift',data:{userId:'u',msgId:String(i),giftId:1}},'simulation');assert.equal(b.snapshot('simulation').queued,8);assert.ok(b.snapshot('simulation').dropped>0);assert.equal(b.snapshot('live').alert,null);
 for(const filename of ['a.svg','a.html','a.js'])assert.throws(()=>inspectMedia(gif,filename));assert.throws(()=>inspectMedia(Buffer.from('<script>evil</script>'),'bad.gif'));
 const big=Buffer.from(gif);big.writeUInt16LE(6000,6);assert.throws(()=>inspectMedia(big,'big.gif'));
 await assert.rejects(()=>b.handle('/api/broadcast/config',{metric:'arbitrary',giftMappings:[]},'simulation'));
});
