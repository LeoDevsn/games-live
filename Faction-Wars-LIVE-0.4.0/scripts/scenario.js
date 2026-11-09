import {sourceDigest} from './source-digest.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createState} from '../src/core/state.js';
import {Store,hash} from '../src/persistence/store.js';
import {demoEvents} from '../scenarios/demo.js';
const id=process.argv[2]||`battle-${Date.now()}`;mkdirSync('.runtime',{recursive:true});const path=`.runtime/${id}.sqlite`;const db=new Store(path,createState({id,seed:29}));let s=db.recover(),abilities=new Set(),purchases=0,captures=0;while(s.phase!=='done'){s=db.commit(s,demoEvents(s));for(const e of s.effects){if(e.type==='ability')abilities.add(e.ability);if(e.type==='purchase')purchases++;}captures=Math.max(captures,s.points.filter(p=>p.owner).length);}const replay=db.verifyReplay();const report={sourceDigest:sourceDigest(),id,path,ticks:s.tick,logicalMs:s.tick*50,result:s.result,abilities:[...abilities],purchases,captures,hash:hash(s),replayHash:hash(replay),people:s.people,stats:s.stats};db.close();mkdirSync('evidence',{recursive:true});writeFileSync(`evidence/${id}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,people:undefined,stats:undefined},null,2));
