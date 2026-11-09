import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PROFILE} from '../src/rules/rules.js';
import {createState,birth,initialArmy} from '../src/core/state.js';
import {movement} from '../src/combat/combat.js';
import {step} from '../src/core/engine.js';
import {Store,hash} from '../src/persistence/store.js';
import {renderFrame} from '../src/adapters/local/render-frame.js';
const checks=[];
for(const faction of ['R','S'])for(let lane=0;lane<3;lane++)for(const speech of [false,true]){
 const s=createState({id:'formation'}),dir=faction==='R'?1:-1;s.phase='combat';s.spawned=true;
 const d=birth(s,faction,lane,'D'),g=birth(s,faction,lane,'G'),a=birth(s,faction,lane,'A');
 for(const [u,offset] of [[d,600],[g,300],[a,-300]])u.pos=(faction==='R'?5000:27000)+dir*offset;
 if(speech)s.teams[faction].buffs.speech=100000;
 for(let tick=0;tick<300;tick++){const before=[d.pos,g.pos,a.pos];movement(s);assert.ok(dir*(d.pos-g.pos)>=300);assert.ok(dir*(g.pos-a.pos)>=300);for(const [i,u] of [d,g,a].entries())assert.ok(dir*(u.pos-before[i])>=0);}
 d.hp=0;for(let i=0;i<50;i++)movement(s);assert.ok(dir*(g.pos-a.pos)>=300);
 checks.push(`${faction}/lane${lane}/speech${speech}: D > G > A, no retreat, promotes Warrior after Defender death`);
}
// Late reinforcements and other lanes never drag a squad backwards.
for(const faction of ['R','S']){
 const s=createState(),dir=faction==='R'?1:-1,a=birth(s,faction,0,'A'),g=birth(s,faction,0,'G'),d=birth(s,faction,1,'D');
 a.pos=faction==='R'?15000:17000;g.pos=a.pos-dir*5000;d.pos=a.pos+dir*1000;const before=a.pos;movement(s);assert.equal(dir*(a.pos-before),50);
}
// One initial Siege per faction/lane, then 30s, 60s... not a replacement-on-death timer.
let s=createState({id:'siege-30'});s.phase='combat';s.spawned=true;s.units=[];let waves=[];
for(let tick=0;tick<=1200;tick++){
 s=step(s);const births=s.effects.filter(e=>e.type==='birth'&&e.kind==='C');
 if(births.length){assert.equal(births.length,6);waves.push(s.combatMs-50);for(const u of s.units)u.hp=1000000000;}
}
assert.deepEqual(waves,[30000,60000]);assert.equal(s.nextWave,90000);
const initial=createState();initialArmy(initial);assert.equal(initial.units.filter(u=>u.kind==='C').length,6);assert.equal(initial.nextWave,30000);
const legacy=createState({profile:{...PROFILE,formationOrder:false,siegeWaveMs:20000}});assert.equal(legacy.nextWave,20000);
const frame=renderFrame(s,{paused:false,speed:1,demo:true,sequence:1});assert.equal(frame.nextWave,90000);assert.equal(frame.profile.siegeWaveMs,30000);
// New profile must retain deterministic journal recovery with formation constraints.
const db=new Store(path.join(mkdtempSync(path.join(tmpdir(),'fw-formation-')),'game.sqlite'),createState({id:'formation-replay'}));let current=db.recover();for(let i=0;i<1300;i++)current=db.commit(current);assert.equal(hash(current),hash(db.verifyReplay()));db.close();
const report={status:'pass',formationCases:checks.length,waves,initialSiege:6,profile:PROFILE.version,replay:'pass',checks};writeFileSync('evidence/formation-siege.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:'pass',formationCases:checks.length,waves,replay:'pass'}));
