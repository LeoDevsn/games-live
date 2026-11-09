import {copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
for(const dir of ['Jelly-Battle-LIVE-9x16','Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE','Seguidor Arena'])copyFileSync(resolve(root,'shared/game-entry.js'),resolve(root,dir,'public/game-entry.js'));
console.log('Entry renderer synced to Jelly, Tower and Seguidor Arena.');
