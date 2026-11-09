import {createEngine} from '../src/engine.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const results=[];
for(const traffic of ['none','moderate'])for(const count of [2,8,30,100,200])for(let variation=0;variation<4;variation++){
 let g=createEngine();const initial=g.exportState();initial.seed=(variation+1)*7919;g=createEngine(g.settings,initial);
 for(let i=0;i<count;i++){g.apply({kind:'follow',id:'u'+i,name:'Teste '+i});g.apply({kind:'like',id:'u'+i,count:1});}
 let elapsed=0;for(;elapsed<900000;elapsed+=500){g.tick(500);const view=g.snapshot();if(view.phase==='intermission')break;if(traffic==='moderate'&&elapsed%1000===0)for(const p of view.players)g.apply({kind:'like',id:p.id,count:2});}
 results.push({traffic,users:count,variation,seconds:(elapsed+500)/1000,finished:g.snapshot().phase==='intermission'});
}
const groups=[];for(const traffic of ['none','moderate']){const group=results.filter(r=>r.traffic===traffic),mean=group.reduce((n,r)=>n+r.seconds,0)/group.length;groups.push({traffic,meanSeconds:Math.round(mean*10)/10,minSeconds:Math.min(...group.map(r=>r.seconds)),maxSeconds:Math.max(...group.map(r=>r.seconds)),allFinished:group.every(r=>r.finished)});assert.ok(mean>=120&&mean<=300,`${traffic}: target average`);assert.ok(group.every(r=>r.finished));}
mkdirSync('evidence',{recursive:true});writeFileSync('evidence/pacing.json',JSON.stringify({status:'pass',initialHp:20,healingSeconds:5,scenarios:results.length,groups,results,limitation:'Simulação determinística com até 2 likes/s por sobrevivente; não garante duração para todo fluxo de likes/presentes nem para entradas contínuas.'},null,2));console.log(JSON.stringify(groups,null,2));
