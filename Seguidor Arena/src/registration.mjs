import {receiveAudienceAction} from './audience.mjs';
export const REGISTRATION_INTERVAL_MS=2000,PENDING_LIKE_MS=600000;
// A retained real like can be admitted only after positive follower evidence arrives.
export function createRegistrationIntake({engine,audience,pending=[],clock=Date.now}={}){
 const requests=new Map(pending);let nextCheck=0,lastPhase=null,lastRound=null,lastSeconds=null;
 let validation={at:null,reason:null,checked:0};
 const target=game=>game.round+(game.entryOpen?0:1);
 function receive(action){
  const accepted=receiveAudienceAction(engine,audience,action),game=engine.snapshot();
  if(action.kind==='like'&&Number.isSafeInteger(action.count)&&action.count>0){
   if(!engine.identity(action.id)?.following){const wasPending=requests.has(action.id);requests.set(action.id,{at:clock(),round:target(game)});if(requests.size>10000)requests.delete(requests.keys().next().value);if(!wasPending&&!engine.entryStatus(action.id).current)audience.receive({...action,name:action.name||engine.identity(action.id)?.name,kind:'pending'});}
   else requests.delete(action.id);
  }
  if(action.kind==='follow'||action.kind==='identity')validate('identity',action.id);
  return accepted;
 }
 function validate(reason,onlyId=null){
  const at=clock(),game=engine.snapshot();let checked=0;
  for(const [id,request]of onlyId?(requests.has(onlyId)?[[onlyId,requests.get(onlyId)]]:[]):requests){
   checked++;if(at-request.at>PENDING_LIKE_MS||request.round<game.round){requests.delete(id);continue;}
   if(!engine.identity(id)?.following)continue;
   // Once the intended round has already started, a fresh like is needed for the next.
   if(request.round===game.round&&!game.entryOpen)continue;
   if(receiveAudienceAction(engine,audience,{kind:'like',id,count:1}))requests.delete(id);
  }
  if(!onlyId)for(const row of game.queuedPlayers){checked++;if(engine.identity(row.id)?.following===false)engine.apply({kind:'identity',id:row.id,following:false});}
  validation={at,reason,checked};if(!onlyId)nextCheck=at+REGISTRATION_INTERVAL_MS;
 }
 function observe(game){
  const finalCheck=game.phase==='preparation'&&game.countdown<=5&&(lastRound!==game.round||lastPhase!=='preparation'||lastSeconds>5);
  if(game.phase==='intermission'&&lastPhase!=='intermission')validate('round-ended');
  else if(finalCheck)validate('five-seconds');
  else if(clock()>=nextCheck)validate('interval');
  lastPhase=game.phase;lastRound=game.round;lastSeconds=game.countdown;
 }
 return {receive,observe,validate,exportState:()=>[...requests],snapshot:()=>({intervalMs:REGISTRATION_INTERVAL_MS,validation:{...validation},pendingPlayers:[...requests].map(([id,p])=>({id,name:engine.identity(id)?.name||'Seguidor',round:p.round,reason:'following'}))})};
}
