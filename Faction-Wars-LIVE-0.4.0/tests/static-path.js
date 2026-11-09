import assert from 'node:assert/strict';
import path from 'node:path';
import {staticPath} from '../src/adapters/local/static-path.js';
import {writeFileSync} from 'node:fs';
const checks=[];
for(const [system,paths,root] of [['Windows',path.win32,'C:\\Users\\Owner\\Faction Wars'],['Linux',path.posix,'/workspace/faction-wars-offline']]){
 for(const [route,relative] of [['/','src/ui/index.html'],['/src/ui/app.js','src/ui/app.js'],['/src/ui/assets/arena.svg','src/ui/assets/arena.svg'],['/src/ui/vendor/phaser-3.90.0.min.js','src/ui/vendor/phaser-3.90.0.min.js'],['/profiles/manifest.json','profiles/manifest.json']]){assert.equal(staticPath(root,route,paths),paths.resolve(root,relative));checks.push({system,route,allowed:true});}
 for(const route of ['/package.json','/src/../package.json','/src/../../private','/.runtime/session.sqlite']){assert.equal(staticPath(root,route,paths),null);checks.push({system,route,allowed:false});}
}
writeFileSync('evidence/static-path.json',JSON.stringify({status:'pass',checks,note:'Windows paths simulated with node:path.win32; full browser/runtime tests executed on Linux'},null,2));console.log('18 static path checks passed, including Windows paths with spaces');
