import {RULES,validateSettings,rankFor} from './config.mjs';
import {ITEM_RULES} from './items.mjs';
import {BASE_BOUNDS,LEGACY_BOUNDS,ARENA_VERSION,LOW_COUNT_CLOSING,DEATH_MATCH,CLOSING_AREA_PER_SECOND,areaForSurvivors,boundsForArea,constrainToArena} from './arena.mjs';
export const ANNOUNCEMENT_MS=5000,PREPARATION_MS=30000;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function createEngine(settings={},saved=null){
 let config=validateSettings(settings),pendingConfig=null,phase='waiting',round=1,now=0,roundStartedAt=0,resultUntil=0,winner=null,seed=8369,serial=0,remainder=0;
 let announcementEndsAt=0,preparationEndsAt=0;
 let items=[],projectiles=[],nextItemAt=0,itemSerial=0;
 let arenaArea=1,arenaTarget=1,bounds=boundsForArea(1),lowCountArea=1,lowCountElapsed=0;
 let deathMatchActive=false,deathMatchStartedAt=0,deathMatchElapsed=0;
 const members=new Map(),players=new Map(),rankings=new Map(),queued=new Map(),effects=[];
 if(saved){({phase,round,now,roundStartedAt,resultUntil,winner,seed,serial,remainder,pendingConfig}=saved);
  announcementEndsAt=saved.announcementEndsAt||0;preparationEndsAt=saved.preparationEndsAt||0;
  items=structuredClone(saved.items||[]);projectiles=structuredClone(saved.projectiles||[]);itemSerial=saved.itemSerial||0;nextItemAt=saved.nextItemAt||(phase==='running'?now+ITEM_RULES.intervalMs:0);
  const migrated=!saved.arena;
  deathMatchActive=!!saved.deathMatch?.active;deathMatchStartedAt=saved.deathMatch?.startedAt||0;deathMatchElapsed=clamp(saved.deathMatch?.elapsed||0,0,DEATH_MATCH.intervalMs-1);
  const floor=deathMatchActive?DEATH_MATCH.minArea:DEATH_MATCH.startArea;
  if(!migrated){arenaArea=clamp(saved.arena.area,floor,1);arenaTarget=clamp(saved.arena.target,floor,arenaArea);bounds=boundsForArea(arenaArea);lowCountArea=clamp(saved.arena.lowCountArea??1,LOW_COUNT_CLOSING.minArea,1);lowCountElapsed=clamp(saved.arena.lowCountElapsed??0,0,LOW_COUNT_CLOSING.intervalMs-1);}
  for(const [k,v] of saved.members)members.set(k,v);
  for(const [k,v] of saved.players){const p={...v,hp:Math.min(v.hp,RULES.initialHp),healUntil:Math.min(v.healUntil,now+RULES.regenMs),damageUntil:Math.min(v.damageUntil||0,now+RULES.damageMs)};
   if(migrated){p.x=BASE_BOUNDS.left+(v.x-LEGACY_BOUNDS.left)/(LEGACY_BOUNDS.right-LEGACY_BOUNDS.left)*(BASE_BOUNDS.right-BASE_BOUNDS.left);p.y=BASE_BOUNDS.top+(v.y-LEGACY_BOUNDS.top)/(LEGACY_BOUNDS.bottom-LEGACY_BOUNDS.top)*(BASE_BOUNDS.bottom-BASE_BOUNDS.top);p.radius=clamp(v.radius*.88,22,38);}
   if(migrated||p.hp>0){constrainToArena(p,bounds);}players.set(k,p);
  }
  for(const [k,v] of saved.rankings)rankings.set(k,v);for(const [k,v] of saved.queued)queued.set(k,v);
  if(phase==='waiting'&&alive().length>=2)beginAnnouncement();
  if(phase==='running'){arenaTarget=Math.min(arenaTarget,lowCountArea,areaForSurvivors(alive().length,players.size));ensureDeathMatch();}
 }
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
 function emit(kind,data={}){effects.push({sequence:++serial,at:now,kind,...data});if(effects.length>80)effects.shift();}
 function rank(id,name){let r=rankings.get(id);if(!r){r={id,name,xp:0,wins:0,participations:0,damage:0,healing:0,kills:0};rankings.set(id,r);}r.name=name;return r;}
 function register(action){
  if(!action.id)return null;let m=members.get(action.id);
  if(!m){m={id:action.id,name:action.name||'Seguidor',follower:false,lastRound:0};members.set(m.id,m);}
  if(action.name)m.name=String(action.name).slice(0,45);
  if(typeof action.following==='boolean')m.follower=action.following;
  if(action.kind==='follow')m.follower=true;
  if(!m.follower){queued.delete(m.id);
   if(!['running','intermission'].includes(phase)&&players.delete(m.id)){
    m.lastRound=round-1;if(alive().length<2){phase='waiting';announcementEndsAt=preparationEndsAt=0;}
   }
  }
  return m;
 }

 function alive(){return [...players.values()].filter(p=>p.hp>0).sort((a,b)=>a.id.localeCompare(b.id));}
 function spawn(member){
  if(member.lastRound===round||!member.follower)return null;
  if(alive().length>=config.maxPlayers)return null;
  member.lastRound=round;const angle=random()*Math.PI*2,radius=clamp(38-alive().length*.04,22,38);
  const p={id:member.id,name:member.name,hp:RULES.initialHp,x:bounds.left+radius+random()*(bounds.right-bounds.left-radius*2),y:bounds.top+radius+random()*(bounds.bottom-bounds.top-radius*2),angle,nextTurn:now+1000+random()*2000,radius,attackAt:0,healUntil:0,healTick:0,damageUntil:0,shieldUntil:0,boostUntil:0,trail:'smoke',likes:0,damage:0,healing:0,kills:0};
  constrainToArena(p,bounds);
  players.set(p.id,p);for(const other of alive()){other.radius=radius;constrainToArena(other,bounds);}rank(p.id,p.name);emit('spawn',{id:p.id,name:p.name,x:p.x,y:p.y});
  if(phase==='waiting'&&alive().length>=2)beginAnnouncement();return p;
 }
 function beginAnnouncement(){phase='announcement';announcementEndsAt=now+ANNOUNCEMENT_MS;preparationEndsAt=0;emit('announcement',{round});}
 function startCombat(){phase='running';roundStartedAt=now;nextItemAt=now+ITEM_RULES.intervalMs;for(const p of alive()){p.attackAt=now;if(p.boostPendingMs){p.boostUntil=now+p.boostPendingMs;p.boostPendingMs=0;}p.nextTurn=now+1000+random()*2000;while(p.likes>=RULES.likesPerAbility){p.likes-=RULES.likesPerAbility;ability(p);}}
  emit('start',{round});
  ensureDeathMatch();
 }
 function ensureDeathMatch(){
  if(phase!=='running'||alive().length!==2)return;
  arenaTarget=Math.min(arenaTarget,DEATH_MATCH.startArea);
  if(deathMatchActive)return;
  deathMatchActive=true;deathMatchStartedAt=now;deathMatchElapsed=0;lowCountElapsed=0;
  emit('deathmatch',{round,finalists:alive().map(p=>({id:p.id,name:p.name}))});
 }
 function heal(p,amount){const actual=Math.max(0,Math.min(amount,RULES.initialHp-p.hp));p.hp+=actual;p.healing+=actual;rank(p.id,p.name).healing+=actual;return actual;}
 function ability(p,type=random()<.5?'heal':'damage'){
  if(type==='heal'){if(p.healUntil<=now)p.healTick=now+1000;p.healUntil=now+RULES.regenMs;}
  else p.damageUntil=now+RULES.damageMs;
  emit('ability',{id:p.id,name:p.name,ability:type,x:p.x,y:p.y});return type;
 }
 function apply(action){
  if(!action||!['follow','identity','like','gift'].includes(action.kind))return false;
  const member=register(action);if(!member)return false;
  if(action.kind==='follow'||action.kind==='identity')return true;
  if(action.kind==='like'){
   if(!member.follower)return false;
   const count=clamp(Math.floor(Number(action.count)||0),0,500);if(!count)return false;
   if(phase==='intermission'||phase==='running'&&!players.has(member.id)){queued.set(member.id,Math.min(5000,(queued.get(member.id)||0)+count));return true;}
   let p=players.get(member.id);if(p&&p.hp<=0){queued.set(member.id,Math.min(5000,(queued.get(member.id)||0)+count));return true;}
   p=p||spawn(member);if(!p){queued.set(member.id,Math.min(5000,(queued.get(member.id)||0)+count));return true;}
   if(phase==='running'&&!queued.has(member.id))queued.set(member.id,0);
   p.name=member.name;p.likes+=count;
   if(phase==='running')while(p.likes>=RULES.likesPerAbility){p.likes-=RULES.likesPerAbility;ability(p);}return true;
  }
  const p=players.get(member.id);if(!p||p.hp<=0||phase==='intermission')return false;
  const mapping=config.giftMappings.find(g=>g.id===String(action.giftId));
  // Unmapped gifts get only the smallest boost, never derived from monetary value.
  const seconds=mapping?.seconds??1;if(phase==='running')p.boostUntil=Math.max(p.boostUntil,now+seconds*1000);else p.boostPendingMs=Math.max(p.boostPendingMs||0,seconds*1000);p.trail=mapping?.trail??'smoke';emit('boost',{id:p.id,name:p.name,seconds,trail:p.trail,x:p.x,y:p.y});return true;
 }
 function hit(attackerId,targetId){
  const a=players.get(attackerId),b=players.get(targetId);
  if(phase!=='running'||!a||!b||a===b||a.hp<=0||b.hp<=0||a.attackAt>now||b.shieldUntil>now)return false;
  a.attackAt=now+config.attackCooldownMs;
  return dealDamage(a,b,RULES.damage*(a.damageUntil>now?RULES.damageMultiplier:1),true);
 }
 function dealDamage(a,b,amount,contact=false){
  if(phase!=='running'||b.hp<=0||b.shieldUntil>now)return false;
  const damage=Math.min(b.hp,amount);b.hp-=damage;a.damage+=damage;rank(a.id,a.name).damage+=damage;
  const recovered=contact?heal(a,a.healUntil>now?RULES.regenHitHeal:RULES.hitHeal):0;
  emit('hit',{attacker:a.id,target:b.id,damage,heal:recovered,x:b.x,y:b.y});
  if(b.hp<=0){a.kills++;rank(a.id,a.name).kills++;emit('elimination',{id:b.id,name:b.name,by:a.name,x:b.x,y:b.y});arenaTarget=Math.min(arenaTarget,areaForSurvivors(alive().length,players.size));}
  ensureDeathMatch();finishIfWinner();return true;
 }
 function spawnItems(){
  const count=random()<.5?1:2;
  for(let i=0;i<count;i++){
   // Rejection sampling distributes drops across the actual rounded zone.
   let item,fallback;for(let attempt=0;attempt<100;attempt++){
    item={id:++itemSerial,kind:random()<.5?'fire':'shield',radius:ITEM_RULES.radius,x:bounds.left+ITEM_RULES.radius+random()*(bounds.right-bounds.left-ITEM_RULES.radius*2),y:bounds.top+ITEM_RULES.radius+random()*(bounds.bottom-bounds.top-ITEM_RULES.radius*2)};
    const constrained={...item};constrainToArena(constrained,bounds);fallback=constrained;
    if(Math.hypot(constrained.x-item.x,constrained.y-item.y)<.001&&!items.some(other=>Math.hypot(other.x-item.x,other.y-item.y)<item.radius*3))break;
    item=null;
   }
   item=item||fallback;if(item){items.push(item);emit('item-spawn',{item:item.kind,x:item.x,y:item.y});}
  }
 }
 function updateItems(list){
  if(now>=nextItemAt){spawnItems();nextItemAt=now+ITEM_RULES.intervalMs;}
  const remaining=[];
  for(const item of items){
   constrainToArena(item,bounds);
   const p=list.filter(p=>p.hp>0&&Math.hypot(p.x-item.x,p.y-item.y)<=p.radius+item.radius).sort((a,b)=>Math.hypot(a.x-item.x,a.y-item.y)-Math.hypot(b.x-item.x,b.y-item.y)||a.id.localeCompare(b.id))[0];
   if(!p){remaining.push(item);continue;}
   emit('pickup',{id:p.id,item:item.kind,x:p.x,y:p.y});
   if(item.kind==='shield')p.shieldUntil=now+ITEM_RULES.shieldMs;
   else for(let i=0;i<8;i++){const angle=i*Math.PI/4;projectiles.push({id:++itemSerial,owner:p.id,x:p.x,y:p.y,vx:Math.cos(angle)*ITEM_RULES.projectileSpeed,vy:Math.sin(angle)*ITEM_RULES.projectileSpeed,radius:ITEM_RULES.projectileRadius,expiresAt:now+ITEM_RULES.projectileMs});}
  }
  items=remaining;
 }
 function updateProjectiles(list){
  const remaining=[];
  for(const shot of projectiles){
   if(shot.expiresAt<=now)continue;
   const dx=shot.vx*.05,dy=shot.vy*.05,length2=dx*dx+dy*dy;let victim=null,first=Infinity;
   // Swept circle collision prevents fast shots from passing through avatars.
   for(const p of list){if(p.hp<=0||p.id===shot.owner)continue;
    const ox=shot.x-p.x,oy=shot.y-p.y,radius=p.radius+shot.radius,b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-radius*radius,discriminant=b*b-4*length2*c;
    if(c>0&&discriminant<0)continue;
    const t=c<=0?0:(-b-Math.sqrt(discriminant))/(2*length2);
    if(t>=0&&t<=1&&t<first){first=t;victim=p;}
   }
   if(victim){const owner=players.get(shot.owner);if(owner)dealDamage(owner,victim,ITEM_RULES.fireDamage);if(victim.shieldUntil>now)emit('blocked',{x:victim.x,y:victim.y});if(phase!=='running'){projectiles=[];return;}continue;}
   shot.x+=dx;shot.y+=dy;const copy={...shot};constrainToArena(copy,bounds);
   if(Math.hypot(copy.x-shot.x,copy.y-shot.y)<.001)remaining.push(shot);
  }
  projectiles=remaining;
 }
 function finishIfWinner(){if(phase!=='running')return;const survivors=alive();if(survivors.length>1)return;winner=survivors[0]?{id:survivors[0].id,name:survivors[0].name}:null;phase='intermission';resultUntil=now+config.intermissionSeconds*1000;
  items=[];projectiles=[];
  for(const p of players.values()){const r=rank(p.id,p.name);r.participations++;r.xp+=config.participationXp;if(p.id===winner?.id){r.wins++;r.xp+=config.victoryXp;}}
  emit('winner',{winner:winner?.name||'Empate',id:winner?.id});
 }
 function resetRound(){round++;players.clear();phase='waiting';winner=null;roundStartedAt=now;announcementEndsAt=preparationEndsAt=0;effects.length=0;arenaArea=arenaTarget=lowCountArea=1;lowCountElapsed=0;bounds=boundsForArea(1);if(pendingConfig){config=pendingConfig;pendingConfig=null;}
  items=[];projectiles=[];nextItemAt=0;itemSerial=0;
  deathMatchActive=false;deathMatchStartedAt=deathMatchElapsed=0;
  const queue=[...queued];queued.clear();for(const [id,count] of queue){const m=members.get(id);if(m?.follower){const p=spawn(m);if(p&&count)p.likes=count;else if(!p)queued.set(id,count);}}
 }
 function step(){
  now+=50;
  if(phase==='intermission'){if(now>=resultUntil)resetRound();return;}
  if(phase==='waiting')return;
  if(phase==='announcement'){if(now>=announcementEndsAt){phase='preparation';preparationEndsAt=now+PREPARATION_MS;emit('preparation',{round});}return;}
  if(phase==='preparation'){if(now<preparationEndsAt)return;startCombat();return;}
  const list=alive();
  if(phase==='running'){
   ensureDeathMatch();
   arenaTarget=Math.min(arenaTarget,areaForSurvivors(list.length,players.size));
   if(deathMatchActive&&list.length===2){
    if(arenaArea<=DEATH_MATCH.startArea+1e-9){
     deathMatchElapsed+=50;
     if(deathMatchElapsed>=DEATH_MATCH.intervalMs){deathMatchElapsed-=DEATH_MATCH.intervalMs;arenaTarget=Math.max(DEATH_MATCH.minArea,Math.round((arenaTarget-DEATH_MATCH.areaStep)*100)/100);}
    }
   }else if(list.length>=3&&list.length<LOW_COUNT_CLOSING.below){
    lowCountElapsed+=50;
    if(lowCountElapsed>=LOW_COUNT_CLOSING.intervalMs){lowCountElapsed-=LOW_COUNT_CLOSING.intervalMs;lowCountArea=Math.max(LOW_COUNT_CLOSING.minArea,Math.min(lowCountArea,arenaTarget)-LOW_COUNT_CLOSING.areaStep);}
    arenaTarget=Math.min(arenaTarget,lowCountArea);
   }else lowCountElapsed=0;
   arenaArea=Math.max(arenaTarget,arenaArea-CLOSING_AREA_PER_SECOND*.05);bounds=boundsForArea(arenaArea);
  }
  for(const p of list){
   while(p.healTick>0&&p.healTick<=now&&p.healTick<=p.healUntil){heal(p,RULES.regenPerSecond);p.healTick+=1000;}
   if(p.healUntil<now)p.healTick=0;
   if(now>=p.nextTurn){
    // After two minutes, increasingly seek nearby opponents while retaining random turns.
    // This shortens sparse endgames without choosing a winner or changing hit damage.
    const pressure=phase==='running'?clamp((now-roundStartedAt-120000)/90000,0,.95):0;
    if(pressure>0&&random()<pressure){let target=null,distance=Infinity;for(const other of list)if(other.id!==p.id){const d=(other.x-p.x)**2+(other.y-p.y)**2;if(d<distance){distance=d;target=other;}}if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x)+(random()-.5)*.7;}
    else p.angle+=(random()-.5)*2;
    p.nextTurn=now+1000+random()*2000;
   }
   const speed=config.speed*(p.boostUntil>now?config.boostMultiplier:1),dx=Math.cos(p.angle)*speed*.05,dy=Math.sin(p.angle)*speed*.05;
   p.x+=dx;p.y+=dy;
   constrainToArena(p,bounds,true);
  }
  if(phase!=='running')return;
  updateItems(list);updateProjectiles(list);if(phase!=='running')return;
  // Grid broad phase keeps larger crowds from comparing every possible pair.
  const cell=96,bins=new Map();for(const p of list){const key=`${Math.floor(p.x/cell)},${Math.floor(p.y/cell)}`;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);}
  for(const a of list){if(a.hp<=0)continue;const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);
   for(let xx=-1;xx<=1;xx++)for(let yy=-1;yy<=1;yy++)for(const b of bins.get(`${gx+xx},${gy+yy}`)||[]){
    if(a.id>=b.id||b.hp<=0)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),range=a.radius+b.radius;if(d>=range)continue;
    if(!d){dx=1;dy=0;d=1;}const overlap=(range-d)/2+.5,nx=dx/d,ny=dy/d;
    a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;constrainToArena(a,bounds);constrainToArena(b,bounds);
    const attacker=random()<.5?a:b,target=attacker===a?b:a;hit(attacker.id,target.id);a.angle+=Math.PI*.6;b.angle-=Math.PI*.6;
    if(phase!=='running')return;
   }
  }
 }
 function tick(ms){remainder+=clamp(Number(ms)||0,0,60000);while(remainder>=50){remainder-=50;step();}}
 function configure(input){const next=validateSettings(input);if(phase==='waiting'&&!players.size)config=next;else pendingConfig=next;}
 function snapshot(){const active=alive();return {phase,round,now,elapsed:phase==='running'?Math.floor((now-roundStartedAt)/1000):0,countdown:phase==='preparation'?Math.max(0,Math.ceil((preparationEndsAt-now)/1000)):phase==='intermission'?Math.max(0,Math.ceil((resultUntil-now)/1000)):0,entryOpen:['waiting','announcement','preparation'].includes(phase),announcementSeconds:Math.max(0,Math.ceil((announcementEndsAt-now)/1000)),preparationSeconds:PREPARATION_MS/1000,winner,initialHp:RULES.initialHp,rules:RULES,bounds:{...bounds},arena:{version:ARENA_VERSION,shape:'morph',area:arenaArea,target:arenaTarget,areaPercent:Math.round(arenaArea*100),targetPercent:Math.round(arenaTarget*100),survivorsPercent:players.size?Math.round(active.length/players.size*100):100,baseBounds:{...BASE_BOUNDS}},items:items.map(p=>({...p})),projectiles:projectiles.map(p=>({...p})),itemRules:ITEM_RULES,players:active.map(p=>({...p})),totalParticipants:players.size,alive:active.length,queued:queued.size,queuedPlayers:[...queued.keys()].map(id=>({id,name:members.get(id)?.name||'Seguidor'})),followers:[...members.values()].filter(m=>m.follower).length,effects:effects.map(e=>({...e})),ranking:[...rankings.values()].map(r=>({...r,rank:rankFor(r.xp,config.ranks)})),deathMatch:{active:deathMatchActive&&phase==='running',startedAt:deathMatchStartedAt,minArea:DEATH_MATCH.minArea,intervalMs:DEATH_MATCH.intervalMs,areaStep:DEATH_MATCH.areaStep},settings:structuredClone(config),pendingSettings:!!pendingConfig};}
 function exportState(){return structuredClone({phase,round,now,roundStartedAt,resultUntil,announcementEndsAt,preparationEndsAt,winner,seed,serial,remainder,pendingConfig,items,projectiles,nextItemAt,itemSerial,deathMatch:{active:deathMatchActive,startedAt:deathMatchStartedAt,elapsed:deathMatchElapsed},arena:{version:ARENA_VERSION,shape:'morph',area:arenaArea,target:arenaTarget,lowCountArea,lowCountElapsed},members:[...members],players:[...players],rankings:[...rankings],queued:[...queued]});}
 return {apply,tick,snapshot,exportState,configure,resetRound,hit,entryStatus:id=>({current:players.has(id),alive:(players.get(id)?.hp||0)>0,next:queued.has(id),entryOpen:['waiting','announcement','preparation'].includes(phase)}),identity:id=>{const m=members.get(id);return m?{name:m.name,following:m.follower}:null;},activateAbility:(id,type)=>{const p=players.get(id);if(p?.hp>0&&['heal','damage'].includes(type))return ability(p,type);},get settings(){return config;}};
}
