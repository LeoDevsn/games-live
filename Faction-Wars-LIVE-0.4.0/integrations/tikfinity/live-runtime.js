import {TikFinityIntake} from './intake.js';
import {createConnection} from './connection.mjs';
import {tokens} from '../../src/commands/commands.js';

// Authorized live ingress uses the existing durable contract/inbox and approved engine.
// No gift economy is introduced. follow/share remain transport diagnostics only.
export function createLiveRuntime({filename,enqueue,getState,onAudience=()=>{},now=Date.now,connectionOptions={}}){
 const intake=new TikFinityIntake(filename,{roomId:'local-stream',likeMode:'delta'});
 intake.db.exec('CREATE TABLE IF NOT EXISTS delivery(id TEXT PRIMARY KEY,matchId TEXT NOT NULL,event TEXT NOT NULL,status TEXT NOT NULL)');
 let enabled=false,applied=0,ignored=0,lastReason=null;
 const rates=new Map(),pending=new Set();
 const transport=createConnection({...connectionOptions,onMessage(message,at){
   if(!enabled){ignored++;return;}
   const audienceState=getState();if(!audienceState.paused&&!audienceState.demo)onAudience(message,at);
   if(!['chat','like','gift'].includes(message.event))return;
   if(message.event==='chat'&&!tokens(message.data?.comment||'').length){ignored++;return;}
   const state=getState();if(state.paused||state.demo){ignored++;return;}
   if(state.waitingForFirstJoin&&!(message.event==='chat'&&tokens(message.data?.comment||'').some(t=>t==='R'||t==='S'))){ignored++;lastReason='waiting-for-first-faction';return;}
   const result=intake.ingest(message);
   const event=result.status==='duplicate'?result.prior?.event:result.status==='ready'?result.event:null;
   if(!event){ignored++;lastReason=result.reason||result.status;return;}
   const id=event.providerEventId;
   if(pending.has(id)||intake.db.prepare('SELECT id FROM delivery WHERE id=?').get(id)){ignored++;return;}
   // Unknown gifts do not create participants or competitive effects.
   if(event.kind==='cosmeticGift'){ignored++;lastReason='gift-cosmetic-only';return;}
   for(const [key,value] of rates)if(at-value.at>60000)rates.delete(key);
   const key=event.actorId+event.kind,r=rates.get(key)||{at,count:0};if(at-r.at>=1000){r.at=at;r.count=0;}rates.set(key,r);
   if(++r.count>5||pending.size>=5000){ignored++;lastReason='rate-limit';return;}
   if(event.kind==='likesDelta')event.payload.delta=Math.min(event.payload.delta,500);
   const queued=enqueue(event);
   if(queued){pending.add(id);intake.db.prepare('INSERT INTO delivery VALUES (?,?,?,?)').run(id,state.id,JSON.stringify(event),'pending');applied++;lastReason=null;}
   else{ignored++;lastReason='paused-or-full';}
 }});
 function recover(){
   const state=getState();
   for(const row of intake.db.prepare("SELECT * FROM delivery WHERE status='pending'").all()){
     if(row.matchId!==state.id||state.seen?.[row.id]){intake.db.prepare("UPDATE delivery SET status='delivered' WHERE id=?").run(row.id);continue;}
     if(!pending.has(row.id)&&enqueue(JSON.parse(row.event)))pending.add(row.id);
   }
 }
 return {
   connect(){transport.start();},disconnect(){enabled=false;transport.stop();},
   enable(){enabled=true;recover();transport.start();},
   committed(events){for(const e of events)if(pending.has(e.eventId)){intake.db.prepare("UPDATE delivery SET status='delivered' WHERE id=?").run(e.eventId);pending.delete(e.eventId);}},
   disable(){enabled=false;pending.clear();},
   snapshot(){return {...transport.snapshot(),enabled,applied,ignored,pending:pending.size,lastReason,likeMode:intake.config.likeMode};},
   close(){transport.stop();intake.close();},
 };
}
