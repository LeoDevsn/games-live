import {copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
for(const game of ['Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE','Seguidor Arena']){
 await mkdir(path.join(root,game,'public'),{recursive:true});
 for(const [source,destination] of [['broadcast-server.mjs','src/broadcast.mjs'],['broadcast-render.js','public/broadcast-render.js'],['broadcast-ui.js','public/broadcast-ui.js'],['broadcast-ui.css','public/broadcast-ui.css']])await copyFile(path.join(root,'shared',source),path.join(root,game,destination));
}
console.log('Broadcast modules synchronized to Tower Battle and Seguidor Arena.');
