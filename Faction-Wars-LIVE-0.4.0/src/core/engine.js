import {RULES,rulesHash,fingerprint,ordered} from '../rules/rules.js';
import {createState,initialArmy,birth,diagnostic} from './state.js';
import {join,command,closeWindow,closeStrategic} from '../commands/commands.js';
import {likes,maintain,autocast} from '../economy/economy.js';
import {movement,combat} from '../combat/combat.js';
import {capture} from '../territory/territory.js';
import {resultCheck} from '../match/result.js';
export function event(s,e){if(!e||e.schemaVersion!==1||e.matchId!==s.id||typeof e.eventId!=='string'||!e.eventId||typeof e.actorId!=='string'||!e.actorId||e.source!=='local-simulator'||!Number.isSafeInteger(e.sequence)||e.sequence<0||e.logicalTimeMs!==s.tick*50||!e.payload||!['joinFaction','likesDelta','command','cosmeticGift'].includes(e.kind)){diagnostic(s,'invalid-event',e?.eventId);return;}if(e.kind==='likesDelta'&&(!Number.isSafeInteger(e.payload.delta)||e.payload.delta<0)){diagnostic(s,'invalid-delta',e.eventId);return;}if(e.kind==='joinFaction'&&!['R','S'].includes(e.payload.faction)){diagnostic(s,'invalid-faction',e.eventId);return;}if(s.seen[e.eventId]){diagnostic(s,'duplicate',e.eventId);return;}s.seen[e.eventId]=true;if(e.kind==='joinFaction')join(s,e.actorId,e.payload.faction,e.payload.name);else if(e.kind==='command')command(s,e.actorId,e.payload.text,e.payload.name);else if(e.kind==='likesDelta'&&s.phase==='combat'&&s.people[e.actorId])likes(s,s.people[e.actorId],e.payload.delta);}
// Pure API: input state is never mutated. Persistence publishes only a committed candidate.
export function step(state,events=[]){if(state.engineVersion!=='offline-0.1.0'||state.rulesHash!==rulesHash||state.rulesVersion!==RULES.version||state.profileHash!==fingerprint(state.profile))throw Error('Incompatible or changed rules/profile');const s=structuredClone(state);s.effects=[];s.units=ordered(s.units);s.people=Object.fromEntries(Object.entries(s.people).sort(([a],[b])=>a.localeCompare(b)));if(s.phase==='done')return s;
 const closing=[];if(s.phase==='combat'){for(const f of ['R','S'])if(s.teams[f].window?.end<=s.combatMs){if(s.combatMs<300000)closing.push([f,s.teams[f].window]);s.teams[f].window=null;}for(const f of ['R','S'])if(s.combatMs>=s.teams[f].nextStrategy)closeStrategic(s,f);}
 const es=[...events].sort((a,b)=>(a.logicalTimeMs??0)-(b.logicalTimeMs??0)||(a.sequence??0)-(b.sequence??0)||String(a.eventId).localeCompare(String(b.eventId)));for(const e of es)event(s,e);
 if(s.phase==='preparation'){s.phaseMs+=50;if(s.phaseMs>=25000){s.phase='combat';s.phaseMs=0;initialArmy(s);}}
 else if(s.phase==='combat'){maintain(s);for(const [f,w] of closing){const next=s.teams[f].window;s.teams[f].window=w;closeWindow(s,f);s.teams[f].window=next;}autocast(s);if(s.combatMs>=s.nextWave&&s.combatMs<300000){for(const f of ['R','S'])for(let l=0;l<3;l++)birth(s,f,l,'C',false,null,`${s.id}:wave:${s.nextWave}:${f}:${l}`);s.nextWave+=s.profile.siegeWaveMs??RULES.wave;}movement(s);combat(s);capture(s);if(s.combatMs+50>=300000){for(const f of ['R','S']){if(s.teams[f].window?.end<=300000)closeWindow(s,f,false);if(s.teams[f].nextStrategy<=300000)closeStrategic(s,f);}}resultCheck(s,s.combatMs+50>=300000);s.combatMs+=50;if(s.phase==='combat')s.phaseMs=s.combatMs;}
 else if(s.phase==='results'){s.phaseMs+=50;if(s.phaseMs>=15000)s.phase='done';}
 s.tick++;return s;
}
export function nextMatch(s,id){const n=createState({id,seed:s.seed+1,profile:s.profile});for(const p of Object.values(s.nextQueue))join(n,p.id,p.faction,p.name);return n;}
export function localEvent(s,actorId,kind,payload,sequence=0,eventId=`${s.id}:event:${s.tick}:${sequence}`){return {schemaVersion:1,matchId:s.id,eventId,actorId,source:'local-simulator',logicalTimeMs:s.tick*50,sequence,kind,payload};}
export function combatFixture(id='fixture'){const s=createState({id});s.phase='combat';initialArmy(s);return s;}
