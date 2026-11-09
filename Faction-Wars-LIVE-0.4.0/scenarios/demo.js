import {localEvent} from '../src/core/engine.js';
export function demoEvents(s){const out=[];let seq=0;const add=(id,kind,payload)=>out.push(localEvent(s,id,kind,payload,seq++,`${s.id}:demo:${s.tick}:${seq}`));if(s.tick===0){for(const f of ['R','S'])for(let i=0;i<3;i++)add(f+i,'joinFaction',{faction:f,name:`${f==='R'?'Rubi':'Azul'} ${i+1}`});}
 if(s.phase==='combat'){const t=s.combatMs;if(t%20000===0)for(const f of ['R','S'])for(let i=0;i<3;i++){add(f+i,'likesDelta',{delta:1400});add(f+i,'command',{text:`!${['warrior','guardian','archer'][i]} !${['left','mid','right'][i]} !${f==='R'?'attack':'defend'}`});}}
 return out;}
