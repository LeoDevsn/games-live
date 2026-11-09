import {Store,hash} from '../src/persistence/store.js';
if(!process.argv[2])throw Error('Usage: npm run replay -- .runtime/battle.sqlite');const db=new Store(process.argv[2]);const s=db.verifyReplay();console.log(JSON.stringify({tick:s.tick,result:s.result,hash:hash(s),representatives:Object.values(s.stats).filter(x=>x.champion).map(x=>({id:x.id,actorId:x.actorId}))},null,2));db.close();
