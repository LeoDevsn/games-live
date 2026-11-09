import {readFileSync,copyFileSync} from 'node:fs';
import {engineDigest} from './source-digest.js';
const r=JSON.parse(readFileSync('evidence/stress-medieval-03.json'));
if(r.status!=='pass'||r.engineDigest!==engineDigest()||!r.paced||r.ticks!==12000||r.events!==60000)throw Error('Invalid or stale movement2× benchmark');
for(let i=0;i<2;i++){const fresh=JSON.parse(readFileSync(`evidence/stress-fresh-03-${i}.json`));if(fresh.hash!==r.hashes[i].live)throw Error('Fresh process replay differs');copyFileSync(`evidence/stress-fresh-03-${i}.json`,`evidence/stress-fresh-${i}.json`);}
copyFileSync('evidence/stress-medieval-03.json','evidence/stress.json');copyFileSync('evidence/stress-medieval-03.log','evidence/stress.log');console.log('Verified movement2× benchmark and fresh replays promoted');
