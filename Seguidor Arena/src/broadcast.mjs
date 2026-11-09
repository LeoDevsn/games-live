import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const clean=(s,n=140)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,n);
const sha=s=>createHash('sha256').update(s).digest('hex');
export function validateBroadcast(input,{metrics,assets}){
 const value={enabled:input.enabled!==false,showChat:input.showChat!==false,title:clean(input.title||'PÓDIO DA COMUNIDADE',36),accent:String(input.accent||'#ac8fff'),metric:input.metric||metrics[0],giftMappings:[]};
 if(!/^#[a-f0-9]{6}$/i.test(value.accent)||!metrics.includes(value.metric))throw Error('Cor ou critério de ranking inválido');
 if(!Array.isArray(input.giftMappings)||input.giftMappings.length>100)throw Error('Cadastre até 100 efeitos');
 const seen=new Set();
 value.giftMappings=input.giftMappings.map(g=>{const giftId=clean(g.giftId,80),assetId=String(g.assetId||'builtin'),seconds=Number(g.seconds||6);if(!giftId||seen.has(giftId)||!Number.isFinite(seconds)||seconds<1||seconds>15||(assetId!=='builtin'&&!assets.has(assetId)))throw Error('Efeito: ID único, mídia válida e duração de 1 a 15s');seen.add(giftId);return {giftId,assetId,seconds,label:clean(g.label,50)};});
 return value;
}
export function inspectMedia(buffer,filename){
 if(buffer.length<12||buffer.length>12582912)throw Error('Arquivo deve ter até 12 MB');
 const ext=path.extname(filename).toLowerCase();let type;
 if(ext==='.gif'&&['GIF87a','GIF89a'].includes(buffer.toString('ascii',0,6))){const w=buffer.readUInt16LE(6),h=buffer.readUInt16LE(8);if(!w||!h||w>2048||h>2048||w*h>4194304)throw Error('GIF deve ter até 2048 × 2048');type='image/gif';}
 else if(ext==='.webm'&&buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])))type='video/webm';
 else if(ext==='.mp4'&&buffer.toString('ascii',4,8)==='ftyp')type='video/mp4';
 else if(ext==='.png'&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';
 else if(ext==='.webp'&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')type='image/webp';
 else throw Error('Use GIF, WebM, MP4, PNG ou WebP válidos');
 return {ext,type};
}
export async function createBroadcast({store,directory,metrics,defaultTitle='PÓDIO DA COMUNIDADE',clock=Date.now,nativeGiftsOnly=false}){
 await mkdir(directory,{recursive:true});
 const assets=new Map(store.read('broadcast.assets',[]).map(a=>[a.id,a]));
 let config=validateBroadcast(store.read('broadcast.config',{title:defaultTitle,accent:'#a893ff',metric:metrics[0],giftMappings:[]}),{metrics,assets}),serial=0;
 if(nativeGiftsOnly){config.enabled=false;store.write('broadcast.config',config);}
 const contexts={live:{chat:[],queue:[],active:null,seen:new Map(store.read('broadcast.seen',[])),rates:new Map(),dropped:0,gifts:new Map()},simulation:{chat:[],queue:[],active:null,seen:new Map(),rates:new Map(),dropped:0,gifts:new Map()}};
 function context(mode){return contexts[mode==='live'?'live':'simulation'];}
 function start(c){if(!c.active&&c.queue.length){const item=c.queue.shift(),at=clock();c.active={...item,startedAt:at,endsAt:at+item.seconds*1000};}}
 function advance(c){if(c.active&&c.active.endsAt<=clock())c.active=null;start(c);}
 function enqueue(c,{name,giftName,giftId,assetId,seconds=6,test=false}){
  if(c.queue.length>=8){c.dropped++;return false;}
  const asset=assets.get(assetId);c.queue.push({sequence:randomUUID(),name:clean(name,45),giftName:clean(giftName,50),giftId:clean(giftId,80),seconds,test,media:asset?{url:'/broadcast/media/'+asset.id,type:asset.type}:null});advance(c);return true;
 }
 function receive(frame,mode='live'){
  if(!frame?.data||!['chat','gift'].includes(frame.event))return false;
  const c=context(mode),d=frame.data,u=d.user&&typeof d.user==='object'?d.user:d,now=clock();
  const id=String(u.userId??u.id??d.userId??u.uniqueId??d.uniqueId??''),name=clean(u.nickname??d.nickname??u.uniqueId??'Espectador',45);
  if(!id)return false;
  const details=d.giftDetails||d.extendedGiftInfo||{};
  if(frame.event==='gift'&&Number(d.giftType??details.giftType)===1&&![true,1,'1'].includes(d.repeatEnd))return false;
  const token=frame.event==='gift'&&d.groupId?`group:${d.groupId}:${d.giftId??details.id??''}`:d.transactionId??d.msgId??d.common?.msgId;
  const key=token?sha(`${frame.event}:${id}:${token}`):null;
  for(const [k,t] of c.seen)if(now-t>86400000)c.seen.delete(k);
  if(key&&c.seen.has(key))return false;if(key){c.seen.set(key,now);if(c.seen.size>50000)c.seen.delete(c.seen.keys().next().value);}
  if(frame.event==='chat'){
   const comment=clean(d.comment);if(!comment)return false;
   const userKey=sha(id);if(now-(c.rates.get(userKey)??-Infinity)<700)return false;c.rates.set(userKey,now);if(c.rates.size>10000)c.rates.delete(c.rates.keys().next().value);
   c.chat.push({sequence:++serial,name,text:comment,at:now});if(c.chat.length>6)c.chat.shift();return true;
  }
  const giftId=clean(d.giftId??details.id??'',80),giftName=clean(d.giftName??details.name??'Presente',50);
  c.gifts.set(giftId,{giftId,name:giftName});if(c.gifts.size>40)c.gifts.delete(c.gifts.keys().next().value);
  if(!config.enabled)return false;
  const mapping=config.giftMappings.find(g=>g.giftId===giftId);
  return enqueue(c,{name,giftName:mapping?.label||giftName,giftId,assetId:mapping?.assetId,seconds:mapping?.seconds??6});
 }
 function snapshot(mode){const c=context(mode);advance(c);return {nativeGiftsOnly,config,chat:c.chat.map(x=>({...x})),alert:c.active?{...c.active,remainingMs:Math.max(0,c.active.endsAt-clock())}:null,queued:c.queue.length,dropped:c.dropped,assets:[...assets.values()].map(({id,name,type})=>({id,name,type})),observedGifts:[...c.gifts.values()],metrics};}
 async function handle(route,body,mode){
  if(nativeGiftsOnly&&['/api/broadcast/upload','/api/broadcast/test'].includes(route))throw Error('Este jogo utiliza as animações oficiais do TikTok. Não é necessário adicionar GIFs.');
  if(route==='/api/broadcast/config'){const next=validateBroadcast(body,{metrics,assets});if(nativeGiftsOnly)next.enabled=false;config=next;store.write('broadcast.config',config);if(!config.enabled)for(const c of Object.values(contexts)){c.queue=[];c.active=null;}return snapshot(mode);}
  if(route==='/api/broadcast/upload'){
   if(typeof body.base64!=='string'||body.base64.length>16777216||!/^[a-zA-Z0-9+/]*={0,2}$/.test(body.base64)||typeof body.filename!=='string')throw Error('Upload inválido');
   const bytes=Buffer.from(body.base64,'base64'),info=inspectMedia(bytes,body.filename),id=sha(bytes).slice(0,32);
   const asset={id,name:clean(path.basename(body.filename),70),type:info.type,ext:info.ext};await writeFile(path.join(directory,id+info.ext),bytes);assets.set(id,asset);store.write('broadcast.assets',[...assets.values()]);return snapshot(mode);
  }
  if(route==='/api/broadcast/test'){
   if(mode!=='simulation')throw Error('Ative Simulação para testar efeitos sem misturar eventos da LIVE');
   if(body.assetId&&body.assetId!=='builtin'&&!assets.has(body.assetId))throw Error('Mídia não encontrada');
   enqueue(context(mode),{name:'Teste local',giftName:'Efeito de presente',assetId:body.assetId,seconds:6,test:true});return snapshot(mode);
  }
  if(route==='/api/broadcast/chat'){
   if(mode!=='simulation')throw Error('Ative Simulação para testar chat');
   receive({event:'chat',data:{userId:'test-'+serial,nickname:clean(body.name||'Visitante',45),comment:clean(body.text||'Vamos vencer essa rodada!'),msgId:randomUUID()}},mode);return snapshot(mode);
  }
  throw Error('Rota de transmissão desconhecida');
 }
 async function serveMedia(id,res){if(!/^[a-f0-9]{32}$/.test(id)||!assets.has(id)){res.writeHead(404).end();return;}const asset=assets.get(id);try{const data=await readFile(path.join(directory,id+asset.ext));res.writeHead(200,{'Content-Type':asset.type,'Content-Length':data.length,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'none'});res.end(data);}catch{res.writeHead(404).end();}}
 function persist(){store.write('broadcast.seen',[...contexts.live.seen]);}
 return {receive,snapshot,handle,serveMedia,persist,clear(mode){const c=context(mode);c.chat=[];c.queue=[];c.active=null;c.seen.clear();c.rates.clear();}};
}
