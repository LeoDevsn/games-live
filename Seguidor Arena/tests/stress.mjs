import {createEngine} from '../src/engine.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const g=createEngine(),start=performance.now();for(let i=0;i<200;i++){g.apply({kind:'follow',id:'u'+i,name:'Teste '+i});g.apply({kind:'like',id:'u'+i,count:1});}
let hits=0;
for(let i=0;i<7200;i++){g.tick(250);if(i%40===0){const s=g.snapshot();for(const p of s.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.hp>0&&p.hp<=20);}hits=Math.max(hits,s.ranking.reduce((sum,r)=>sum+r.damage,0));if(s.phase==='intermission')for(let j=0;j<200;j++)g.apply({kind:'like',id:'u'+j,count:1});}}
assert.ok(hits>0);const report={status:'pass',users:200,logicalMinutes:30,wallSeconds:Number(((performance.now()-start)/1000).toFixed(3)),damage:Math.round(hits),round:g.snapshot().round,heapMB:Math.round(process.memoryUsage().heapUsed/1048576),scope:'Tempo lógico: motor e colisões; não é ensaio de 30min reais nem teste de FPS/avatares em LIVE.'};mkdirSync('evidence',{recursive:true});writeFileSync('evidence/stress.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
