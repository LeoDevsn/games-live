import {startGame} from '../../platform/server.mjs';
import {games} from '../../platform/catalog.mjs';
import {ensureTowerServer} from './scripts/runtime.mjs';
import {openDesktopApp} from '../../shared/desktop-app.mjs';
try{const panel=process.argv.includes('--panel');const result=panel?await ensureTowerServer():await startGame(games.find(g=>g.id==='tower'));if(!process.argv.includes('--no-open'))await openDesktopApp(panel?result.panel:result.studio,{kind:panel?'panel':'game'});console.log('Tower Battle pronto.');}catch(error){console.error(error.message);process.exitCode=1;}
