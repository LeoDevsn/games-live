import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createEngine} from '../src/engine.mjs';
import {createTikFinityAdapter} from '../src/tikfinity.mjs';
const engine=createEngine(),adapter=createTikFinityAdapter(),start=performance.now();
let accepted=0,duplicates=0,now=0;
for(let i=0;i<18000;i++){
 now=i*100;engine.tick(i?100:0);
 const n=i%200,team=n%2?'A':'B',event=i<200||i%3===0?'chat':i%3===1?'like':'gift';
 const message={event,data:{user:{id:'synthetic-'+n,nickname:'Teste '+n},msgId:'m'+i,comment:team,likeCount:25,giftId:1,giftType:1,groupId:'group'+i,repeatEnd:true,repeatCount:3}};
 const action=adapter.normalize(message,now);if(action&&engine.apply(action,now))accepted++;
 if(adapter.normalize(message,now)===null)duplicates++;
 if(i%100===0){const s=engine.snapshot();for(const t of Object.values(s.teams)){assert.ok(t.hp>=0&&t.hp<=s.rules.maxHp);assert.ok(t.blocks<=s.rules.maxBlocks);assert.ok(t.shield<=40);}}
}
engine.tick(100);const state=engine.snapshot();assert.equal(state.totalMembers,200);assert.ok(state.round>=10);assert.equal(duplicates,18000);
const report={status:'pass',simulationMinutes:30,wallSeconds:Number(((performance.now()-start)/1000).toFixed(3)),users:200,inputEvents:18000,duplicatesRejected:duplicates,accepted,rounds:state.round,heapMB:Math.round(process.memoryUsage().heapUsed/1048576),scope:'30 minutos de tempo lógico; não é ensaio de 30 minutos reais, renderização ou LIVE real. Reconexões são testadas em reliability.test.mjs.'};
mkdirSync(new URL('../evidence/',import.meta.url),{recursive:true});writeFileSync(new URL('../evidence/stability.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
