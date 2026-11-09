import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes} from 'node:crypto';

export function createStore(filename) {
  const db=new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
  const get=db.prepare('SELECT value FROM state WHERE key=?');
  const put=db.prepare('INSERT OR REPLACE INTO state(key,value) VALUES (?,?)');
  let salt=get.get('salt')?.value;
  if(!salt){salt=randomBytes(32).toString('hex');put.run('salt',salt);}
  return {
    anonymousId:id=>createHash('sha256').update(salt+String(id)).digest('hex').slice(0,32),
    read(key,fallback=null){const row=get.get(key);return row?JSON.parse(row.value):fallback;},
    write(key,value){put.run(key,JSON.stringify(value));},
    close(){db.close();},
  };
}
