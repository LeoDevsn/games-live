// Passive diagnosis only. Never sends events, chat, or eligibility overrides.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {createAdapter} from '../src/tikfinity.mjs';
import {createConnection} from '../src/connection.mjs';

const root=path.resolve(import.meta.dirname,'..');
const args=process.argv.slice(2),seconds=Math.min(600,Math.max(1,Number(args.shift())||300));
const targets=args.map(s=>s.replace(/^@/,'').toLowerCase()).filter(Boolean);
if(!targets.length)throw Error('Specify target account names after duration in seconds');
const db=new DatabaseSync(path.join(root,'.runtime/arena.sqlite'),{readOnly:true});
const get=db.prepare('SELECT value FROM state WHERE key=?'),salt=get.get('salt').value;
const anonymousId=id=>createHash('sha256').update(salt+String(id)).digest('hex').slice(0,32);
const adapter=createAdapter(),file=path.join(root,'evidence/live-entry-watch.json');
const report={startedAt:new Date().toISOString(),finishedAt:null,passive:true,targets,counts:{},events:[],socket:'connecting'};
function state(id){
 const session=JSON.parse(get.get('session').value),g=session.engine;
 const m=g.members.find(([k])=>k===id)?.[1];
 return {following:m?.follower??null,inRound:g.players.some(([k])=>k===id),queued:g.queued.some(([k])=>k===id),lastRound:m?.lastRound??null,round:g.round,phase:g.phase};
}
function save(){writeFileSync(file,JSON.stringify(report,null,2));}
const connection=createConnection({onStatus(s){report.socket=s.status;save();},onMessage(f){
 try{
  report.counts[f.event]=(report.counts[f.event]||0)+1;
  const d=f.data||{},u=d.user||d,labels=[u.nickname,d.nickname,u.uniqueId,d.uniqueId].filter(v=>typeof v==='string').join(' ').toLowerCase();
  const target=targets.find(t=>labels.includes(t));if(!target){save();return;}
  const a=adapter.normalize(f),id=a?anonymousId(a.id):null;
  const entry={at:new Date().toISOString(),target,event:f.event,followRole:u.followRole??d.followRole??null,followStatus:u.followInfo?.followStatus??d.followInfo?.followStatus??null,isFollower:u.isFollower??d.isFollower??null,likeCount:typeof d.likeCount==='number'?d.likeCount:null,normalized:a?{kind:a.kind,following:a.following,count:a.count??null}:null};
  report.events.push(entry);if(report.events.length>200)report.events.shift();save();
  if(id)setTimeout(()=>{try{entry.arena=state(id);save();}catch{}},1500);
 }catch{}
}});
connection.start();
await new Promise(r=>setTimeout(r,seconds*1000));
connection.stop();report.finishedAt=new Date().toISOString();save();db.close();
console.log(JSON.stringify({file,seconds,counts:report.counts,targetEvents:report.events.length}));
