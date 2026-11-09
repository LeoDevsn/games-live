import {movement as legacyMovement,combat as legacyCombat} from './legacy-0.2.js';
import {RULES,other,ordered} from '../rules/rules.js';
import {living,effect} from '../core/state.js';
export function protection(s,u,withoutWalls=false){if(u.kind==='N')return 0;const st=s.teams[u.faction].stance;return Math.max(0,Math.min(40,RULES.units[u.kind].armor+(u.champion?5:0)+(st==='defensive'?15:st==='offensive'&&u.kind==='D'?-10:0)+(!withoutWalls&&u.walls.some(w=>w.end>s.combatMs)?20:0)));}
// Exact integer/rational offense, with a single final ceil.
export function damage(s,u,target,skill=false,withoutWalls=false){let n=BigInt(u.kind==='C'&&target.kind==='N'?35:RULES.units[u.kind].damage),d=1n;const mult=p=>{n*=BigInt(p);d*=100n;};if(u.kind!=='N'){if(u.champion)mult(110);mult(RULES.stances[s.teams[u.faction].stance].damage);if(s.teams[u.faction].buffs.flame>s.combatMs)mult(105);if(skill)mult(RULES.abilities[u.kind].mult);}mult(100-protection(s,target,withoutWalls));return Math.max(1,Number((n+d-1n)/d));}
export function cadence(u){u.acc+=RULES.units[u.kind].rate;return u.acc>=200;}
export function targetFor(s,u,all=living(s)){if(u.kind==='N'){const priority={D:0,G:1,C:2,A:3};return all.filter(v=>v.faction!==u.faction&&Math.abs(v.pos-(u.faction==='R'?0:s.profile.path))<=4000).sort((a,b)=>priority[a.kind]-priority[b.kind]||distance(s,u,a)-distance(s,u,b)||a.id.localeCompare(b.id))[0];}
 const enemies=all.filter(v=>v.faction!==u.faction&&v.lane===u.lane);const n=s.nexus[other(u.faction)];const nd=u.faction==='R'?s.profile.path-u.pos:u.pos;
 if(u.kind==='C'&&nd<=2000&&n.hp>0)return n;
 const near=enemies.filter(v=>Math.abs(v.pos-u.pos)<=RULES.units[u.kind].range*1000&&(u.kind!=='C'||(v.pos-u.pos)*(u.faction==='R'?1:-1)>=0||(Math.abs(v.pos-s.profile.center)<=s.profile.zoneHalf&&Math.abs(u.pos-s.profile.center)<=s.profile.zoneHalf)));
 const home=u.faction==='R'?u.pos:s.profile.path-u.pos;
 near.sort((a,b)=>(home<=s.profile.defenseRegion?Number(!['C','D'].includes(a.kind))-Number(!['C','D'].includes(b.kind)):0)||Math.abs(a.pos-u.pos)-Math.abs(b.pos-u.pos)||a.id.localeCompare(b.id));
 if(near.length)return near[0];if(!enemies.some(v=>(u.faction==='R'?s.profile.path-v.pos:v.pos)<=s.profile.defenseRegion)&&nd<=RULES.units[u.kind].range*1000&&n.hp>0)return n;
}
export function distance(s,u,v){if(u.kind==='N')return Math.abs(v.pos-(u.faction==='R'?0:s.profile.path));if(v.kind==='N')return u.faction==='R'?s.profile.path-u.pos:u.pos;return Math.abs(u.pos-v.pos);}
export function movement(s){if(s.profile.archerRetreat!==false)return legacyMovement(s);const all=living(s), proposals=new Map();for(const u of all){u.walls=u.walls.filter(w=>w.end>s.combatMs);const dir=u.faction==='R'?1:-1; let dest=dir>0?s.profile.path:0;let moving=true;
 if(targetFor(s,u,all))moving=false;
 else if(u.kind==='C'&&s.points[u.lane].owner!==u.faction&&Math.abs(u.pos-s.profile.center)<=s.profile.zoneHalf)moving=false;
 if(!moving){proposals.set(u.id,u.pos);continue;}
 const speed=RULES.units[u.kind].speed;const numer=speed*(s.profile.movementScale??1)*500*(s.teams[u.faction].buffs.speech>s.combatMs?110:100)+u.moveRest;const delta=Math.floor(numer/10000);u.moveRest=numer%10000;
 let p=u.pos+Math.sign(dest-u.pos)*Math.min(delta,Math.abs(dest-u.pos));
 // Opponents block even fast movement; allies have no physical collision.
 for(const e of all)if(e.lane===u.lane&&e.faction!==u.faction){if(p>u.pos&&e.pos>=u.pos)p=Math.min(p,Math.max(u.pos,e.pos-s.profile.hitbox));if(p<u.pos&&e.pos<=u.pos)p=Math.max(p,Math.min(u.pos,e.pos+s.profile.hitbox));}
 if(u.kind==='C'&&s.points[u.lane].owner!==u.faction&&((u.pos-s.profile.center)*dir<0)&&((p-s.profile.center)*dir>=0))p=s.profile.center;
 proposals.set(u.id,p);}
 // Formation constrains forward advance without changing class speed or pulling units back.
 // A newly spawned frontliner behind an existing squad cannot drag it backwards.
 if(s.profile.formationOrder){const rank={D:0,G:1,A:2};
  for(const faction of ['R','S'])for(let lane=0;lane<3;lane++){
   const dir=faction==='R'?1:-1,squad=all.filter(u=>u.faction===faction&&u.lane===lane&&u.kind in rank);
   for(const u of [...squad].sort((a,b)=>rank[a.kind]-rank[b.kind]||dir*(b.pos-a.pos)||a.id.localeCompare(b.id))){
    const leaders=squad.filter(v=>rank[v.kind]<rank[u.kind]&&dir*(v.pos-u.pos)>=0);
    if(!leaders.length)continue;
    const front=Math.min(...leaders.map(v=>dir*proposals.get(v.id)));
    proposals.set(u.id,dir*Math.min(dir*proposals.get(u.id),Math.max(dir*u.pos,front-s.profile.formationGap)));
   }
  }
 }
 // Simultaneous opposing proposals cannot cross in the same tick.
 for(const a of all)for(const b of all)if(a.id<b.id&&a.lane===b.lane&&a.faction!==b.faction){const left=a.pos<=b.pos?a:b,right=left===a?b:a;let l=proposals.get(left.id),r=proposals.get(right.id);if(l>r){const mid=Math.floor((left.pos+right.pos)/2);proposals.set(left.id,Math.min(l,mid));proposals.set(right.id,Math.max(r,mid));}}
 for(const u of all)u.pos=proposals.get(u.id);
}
export function wall(s,u,all){if(!u.champion||u.kind!=='D'||u.cd>s.combatMs||!targetFor(s,u,all))return;const candidates=all.filter(v=>v.id!==u.id&&v.faction===u.faction&&v.lane===u.lane&&Math.abs(v.pos-u.pos)<=s.profile.wallRadius);const dir=u.faction==='R'?1:-1;const cs=candidates.filter(v=>v.kind==='C').sort((a,b)=>dir*(b.pos-a.pos)||a.id.localeCompare(b.id)).slice(0,2);const normal=candidates.filter(v=>v.kind!=='C').sort((a,b)=>Math.abs(a.pos-u.pos)-Math.abs(b.pos-u.pos)||a.id.localeCompare(b.id)).slice(0,1);for(const v of [u,...cs,...normal])v.walls.push({source:u.id,end:s.combatMs+5000});u.cd=s.combatMs+20000;effect(s,'ability',{unitId:u.id,ability:'Muralha',targets:[u,...cs,...normal].map(v=>v.id)});}
export function resolve(s,intents){for(const a of intents.sort((a,b)=>a.id.localeCompare(b.id))){const {source:u,target:v}=a;const dealt=Math.min(v.hp,a.amount);v.hp=Math.max(0,v.hp-a.amount);const us=s.stats[u.id],vs=s.stats[v.id];if(us)us[v.kind==='N'?'nexusDamage':'unitDamage']+=dealt;if(vs)vs.received+=dealt;
 if(v.hp===0&&dealt>0&&us&&v.kind!=='N')us.kills++;
 // Causal marginal wall attribution; first stable eligible source, no stacking/duplicate credit.
 if(v.kind!=='N'&&a.unprotected>a.amount&&dealt>0){const src=v.walls.filter(w=>w.end>s.combatMs).sort((a,b)=>a.source.localeCompare(b.source))[0];if(src&&src.source!==v.id&&s.stats[src.source])s.stats[src.source].prevented+=Math.min(a.unprotected-a.amount,Math.max(0,a.hpBefore-a.amount));}
 effect(s,'damage',{attackId:a.id,source:u.id,target:v.id,calculated:a.amount,effective:dealt,skill:a.skill});}
}
export function combat(s){if(s.profile.archerRetreat!==false)return legacyCombat(s);const all=living(s);for(const u of all)wall(s,u,all);const intents=[];for(const u of [...all,s.nexus.R,s.nexus.S]){if(u.hp<=0)continue;const ready=cadence(u);const v=targetFor(s,u,all);if(!ready||!v){u.acc=Math.min(200,u.acc);continue;}u.acc-=200;if(u.kind!=='N')u.attacks++;const skill=!!(u.champion&&['G','A'].includes(u.kind)&&u.cd<=s.combatMs);if(skill){u.cd=s.combatMs+RULES.abilities[u.kind].cd;effect(s,'ability',{unitId:u.id,ability:u.kind==='G'?'Golpe Poderoso':'Disparo Preciso'});}intents.push({id:`${s.id}:${String(s.tick).padStart(8,'0')}:${u.id}`,source:u,target:v,skill,amount:damage(s,u,v,skill),unprotected:damage(s,u,v,skill,true),hpBefore:v.hp});}resolve(s,intents);}
