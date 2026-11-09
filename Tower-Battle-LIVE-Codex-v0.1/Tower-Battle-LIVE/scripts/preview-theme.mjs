import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEngine} from '../src/engine.mjs';
import {drawArena,setThemeAssets} from '../public/render.js';
const {createCanvas,loadImage}=createRequire(new URL('../../../Seguidor Arena/package.json',import.meta.url))('@napi-rs/canvas');
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../../previews'),assets={};
for(const [key,file]of [['background','construction-seabed-v1.png'],['krabs','mr-krabs-nickrewind-v1.png'],['plankton','plankton-reactions-v1.png']])assets[key]=await loadImage(fileURLToPath(new URL('../public/assets/'+file,import.meta.url)));setThemeAssets(assets);mkdirSync(out,{recursive:true});
const game=createEngine();function draw(label){const canvas=createCanvas(1080,1920);drawArena(canvas,game.snapshot(),300,'','','live',{nativeGiftsOnly:true,config:{title:'MESTRES DA CONSTRUÇÃO',accent:'#b6ed70',metric:'blocks'}},{publicView:true});const file=path.join(out,'tower-'+label+'.png');writeFileSync(file,canvas.toBuffer('image/png'));console.log(file);}
draw('sirigueijo-plankton-entrada');for(let i=0;i<24;i++){const team=i%2?'B':'A',id='preview-'+i;game.apply({kind:'join',id,team,name:['Luna','Rafa','Gui','Bia'][i%4]+' '+(i+1)},i*100);game.apply({kind:'like',id,count:100},i*100);}draw('sirigueijo-plankton-batalha');
