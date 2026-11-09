import {resultScreen} from '../../match/result.js';
// Read-only presentation projection. Dedupe, journal and simulation internals never leave here.
export function renderFrame(state,{paused,speed,demo,sequence,effects=[],waitingForFirstJoin=false}){
 const champions={R:{},S:{}};
 for(const stat of Object.values(state.stats))if(stat.champion){const group=champions[stat.faction][stat.kind]??={kills:0,unitDamage:0,received:0,zoneMs:0,nexusDamage:0,aliveMs:0};for(const key of Object.keys(group))group[key]+=stat[key];}
 const units=state.units.filter(u=>u.hp>0).map(u=>({id:u.id,faction:u.faction,lane:u.lane,kind:u.kind,champion:u.champion,actorId:u.actorId,hp:u.hp,pos:u.pos,cd:u.cd,walls:u.walls,retreat:u.retreat,defending:u.defending}));
 const people={};for(const unit of units)if(unit.actorId&&state.people[unit.actorId])people[unit.actorId]={name:state.people[unit.actorId].name};
 return {sequence,paused,speed,demo,waitingForFirstJoin,id:state.id,tick:state.tick,phase:state.phase,phaseMs:state.phaseMs,combatMs:state.combatMs,nextWave:state.nextWave,profile:state.profile,nexus:state.nexus,points:state.points,teams:Object.fromEntries(['R','S'].map(f=>{const t=state.teams[f];return [f,{credits:t.credits,energy:t.energy,stance:t.stance,buffs:t.buffs,cooldowns:t.cooldowns,window:t.window?{start:t.window.start,end:t.window.end}:null}];})),people,units,result:state.result,screen:resultScreen(state),champions,effects};
}
