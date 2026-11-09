import {canonical} from '../src/rules/rules.js';
import {step} from '../src/core/engine.js';
export async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Transação cancelada'));tx.onerror=()=>{};});
export class BrowserStore{
 static async open(name='faction-wars-web-preview-0.4'){
  const req=indexedDB.open(name,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('meta',{keyPath:'key'});db.createObjectStore('matches',{keyPath:'id'});db.createObjectStore('commits',{keyPath:['id','tick']});db.createObjectStore('checkpoints',{keyPath:['id','tick']});db.createObjectStore('results',{keyPath:'id'});};return new BrowserStore(await request(req));
 }
 constructor(db){this.db=db;}
 tx(names,mode='readonly'){try{return this.db.transaction(names,mode,mode==='readwrite'?{durability:'strict'}:undefined);}catch(e){if(e.name!=='TypeError')throw e;return this.db.transaction(names,mode);}}
 async head(){return request(this.tx(['meta']).objectStore('meta').get('head'));}
 async start(state,demo){const hash=await digest(state),tx=this.tx(['meta','matches','checkpoints'],'readwrite'),done=complete(tx);tx.objectStore('matches').add({id:state.id,initial:state,hash,demo});tx.objectStore('checkpoints').add({id:state.id,tick:state.tick,state,hash});tx.objectStore('meta').put({key:'head',id:state.id,tick:state.tick,hash,demo});await done;return state;}
 async commit(current,events){
  const candidate=step(current,events);if(candidate.tick===current.tick)return candidate;const hash=await digest(candidate),tx=this.tx(['meta','commits','checkpoints','results'],'readwrite'),done=complete(tx);
  const meta=tx.objectStore('meta');const read=meta.get('head');read.onsuccess=()=>{const head=read.result;if(head?.id!==current.id||head.tick!==current.tick){tx.abort();return;}tx.objectStore('commits').add({id:current.id,tick:candidate.tick,events,hash});if(candidate.tick%200===0)tx.objectStore('checkpoints').put({id:current.id,tick:candidate.tick,state:candidate,hash});if(candidate.result)tx.objectStore('results').put(candidate.result);meta.put({...head,tick:candidate.tick,hash});};
  await done;return candidate;
 }
 async recover({fromGenesis=false}={}){
  const head=await this.head();if(!head)return null;const range=IDBKeyRange.bound([head.id,0],[head.id,Number.MAX_SAFE_INTEGER]),tx=this.tx(['matches','commits','checkpoints']);
  const initialReq=tx.objectStore('matches').get(head.id),commitsReq=tx.objectStore('commits').getAll(range),checkpointsReq=tx.objectStore('checkpoints').getAll(range);
  const [match,commits,checkpoints]=await Promise.all([request(initialReq),request(commitsReq),request(checkpointsReq)]);
  if(await digest(match.initial)!==match.hash)throw Error('Estado inicial inválido');
  const candidates=fromGenesis?[]:checkpoints.sort((a,b)=>b.tick-a.tick);candidates.push({tick:match.initial.tick,state:match.initial,hash:match.hash});
  for(const point of candidates){if(await digest(point.state)!==point.hash)continue;try{let state=point.state;for(const c of commits.filter(c=>c.tick>point.tick)){if(c.tick!==state.tick+1)throw Error('Lacuna no journal');state=step(state,c.events);if(await digest(state)!==c.hash)throw Error('Hash divergente');}if(state.tick!==head.tick||await digest(state)!==head.hash)throw Error('Head divergente');return {state,demo:head.demo};}catch{/* Try an earlier checkpoint, never invent events. */}}
  throw Error('Journal não verificável; teste pausado.');
 }
 async export(matchId=null){const currentHead=await this.head(),id=matchId??currentHead.id,tx=this.tx(['matches','commits','checkpoints']),range=IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]);const initial=request(tx.objectStore('matches').get(id)),events=request(tx.objectStore('commits').getAll(range)),points=request(tx.objectStore('checkpoints').getAll(range));const [match,commits,checkpoints]=await Promise.all([initial,events,points]);const last=commits.at(-1),head=id===currentHead.id?currentHead:{key:'head',id,tick:last?.tick??match.initial.tick,hash:last?.hash??match.hash,demo:match.demo};return {format:'faction-wars-technical-replay-v1',version:'web-preview-0.4',initial:match.initial,initialHash:match.hash,commits,checkpoints,head};}

 close(){this.db.close();}
}
