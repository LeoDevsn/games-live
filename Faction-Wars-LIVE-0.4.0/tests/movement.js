import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {RULES,PROFILE} from '../src/rules/rules.js';
import {createState,birth} from '../src/core/state.js';
import {movement,cadence,damage,protection} from '../src/combat/combat.js';
import {capture} from '../src/territory/territory.js';
import {step} from '../src/core/engine.js';
import {Store,hash} from '../src/persistence/store.js';
import {engineDigest} from '../scripts/source-digest.js';
const cases=[];
for(const faction of ['R','S'])for(const kind of ['G','D','A','C'])for(const speech of [false,true]){
 const run=scale=>{const s=createState({id:`move-${faction}-${kind}-${speech}`,profile:{...PROFILE,movementScale:scale}});s.phase='combat';s.spawned=true;const u=birth(s,faction,0,kind);u.pos=faction==='R'?5000:27000;if(kind==='A')birth(s,faction,0,'G');if(speech)s.teams[faction].buffs.speech=6000;const start=u.pos;for(let i=0;i<20;i++)movement(s);return {distance:Math.abs(u.pos-start),unit:u,state:s};};
 const old=run(1),current=run(2);assert.equal(current.distance,old.distance*2);assert.equal(current.unit.hp,old.unit.hp);assert.equal(damage(current.state,current.unit,current.state.nexus[faction==='R'?'S':'R']),damage(old.state,old.unit,old.state.nexus[faction==='R'?'S':'R']));assert.equal(protection(current.state,current.unit),protection(old.state,old.unit));cases.push({faction,kind,speech,oldDistance:old.distance,newDistance:current.distance});
}
assert.equal(PROFILE.movementScale,2);assert.equal(RULES.tick,50);assert.equal(RULES.combat,300000);assert.equal(RULES.prep,25000);assert.equal(RULES.results,15000);
for(const [kind,expected] of [['G',60],['D',42],['A',72],['C',30],['N',60]]){const u={kind,acc:0};let n=0;for(let i=0;i<1200;i++)if(cadence(u)){u.acc-=200;n++;}assert.equal(n,expected);}
for(const scale of [1,2]){const s=createState({profile:{...PROFILE,movementScale:scale}});s.phase='combat';const u=birth(s,'R',0,'C');u.pos=16000;for(let i=0;i<199;i++)capture(s);assert.equal(s.points[0].owner,null);capture(s);assert.equal(s.points[0].owner,'R');}
const fixture=JSON.parse(readFileSync('tests/fixtures/v0.1-replay.json'));let legacy=fixture.initial;assert.equal(hash(legacy),fixture.initialHash);for(const commit of fixture.commits){legacy=step(legacy,commit.events);assert.equal(hash(legacy),commit.hash);}assert.equal(legacy.profile.movementScale,undefined);
const s=createState({id:'movement-recovery'}),file=mkdtempSync(tmpdir()+'/fw-move-')+'/run.sqlite',db=new Store(file,s);let current=s;for(let i=0;i<800;i++)current=db.commit(current);assert.equal(hash(current),hash(db.verifyReplay()));db.close();
const report={status:'pass',engineDigest:engineDigest(),checks:cases,legacyReplayHash:hash(legacy),newReplayHash:hash(current),preserved:{cadence:true,capture10s:true,clock20Hz:true,durations:true,nexusDefense0:RULES.units.N.armor===0}};writeFileSync('evidence/movement-2x.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
