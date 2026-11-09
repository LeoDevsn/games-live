import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {canonical} from '../../src/rules/rules.js';
import {normalizeFrame} from './normalize.js';
const sha=x=>createHash('sha256').update(canonical(x)).digest('hex');
// Durable shadow inbox. There is intentionally no route from this class to game economy.
export class TikFinityIntake{
 constructor(path,config){this.config=config;this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS inbox (id TEXT PRIMARY KEY,digest TEXT NOT NULL,status TEXT NOT NULL,normalized TEXT NOT NULL); CREATE TABLE IF NOT EXISTS counters (id TEXT PRIMARY KEY,total INTEGER NOT NULL);');}
 ingest(frame){const normalized=normalizeFrame(frame,this.config),rawHash=sha(frame),identity=normalized.event?.providerEventId??`quarantine:${this.config.roomId}:${rawHash}`;this.db.exec('BEGIN IMMEDIATE');try{
  const prior=this.db.prepare('SELECT digest,normalized FROM inbox WHERE id=?').get(identity);
  if(prior){this.db.exec('COMMIT');return prior.digest===rawHash?{status:'duplicate',prior:JSON.parse(prior.normalized)}:{status:'quarantine',reason:'conflicting-event-id'};}
  let result=normalized;
  if(normalized.status==='counter'){
   const event=normalized.event,key=JSON.stringify([event.roomId,event.actorId]),previous=this.db.prepare('SELECT total FROM counters WHERE id=?').get(key)?.total;
   if(previous===undefined){this.db.prepare('INSERT INTO counters VALUES (?,?)').run(key,event.counter);result={status:'baseline',reason:'no-historical-like-credit',event:{...event,payload:{delta:0}}};}
   else if(event.counter<previous)result={status:'quarantine',reason:'counter-rewind-or-out-of-order'};
   else{this.db.prepare('UPDATE counters SET total=? WHERE id=?').run(event.counter,key);result={status:'ready',event:{...event,payload:{delta:event.counter-previous}}};}
  }
  this.db.prepare('INSERT INTO inbox VALUES (?,?,?,?)').run(identity,rawHash,result.status,JSON.stringify(result));this.db.exec('COMMIT');return result;
 }catch(e){this.db.exec('ROLLBACK');throw e;}}
 count(){return this.db.prepare('SELECT COUNT(*) AS n FROM inbox').get().n;}
 close(){this.db.close();}
}
