import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const lock=JSON.parse(readFileSync('package-lock.json'));
if(lock.packages['node_modules/phaser'].version!=='3.90.0')throw Error('Unexpected Phaser version');
mkdirSync('src/ui/vendor',{recursive:true});
copyFileSync('node_modules/phaser/dist/phaser.min.js','src/ui/vendor/phaser-3.90.0.min.js');
copyFileSync('node_modules/phaser/LICENSE.md','src/ui/vendor/PHASER-LICENSE.md');
const sha256=createHash('sha256').update(readFileSync('src/ui/vendor/phaser-3.90.0.min.js')).digest('hex');
writeFileSync('src/ui/vendor/manifest.json',JSON.stringify({name:'phaser',version:'3.90.0',license:'MIT',npmIntegrity:lock.packages['node_modules/phaser'].integrity,sha256,source:'node_modules/phaser/dist/phaser.min.js'},null,2));console.log('Local Phaser vendor verified: '+sha256);
