import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createRenderer,themeReady} from '../public/render.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../previews');
globalThis.document={createElement:()=>createCanvas(1,1)};await themeReady;
const [backgroundImage,hostImage]=await Promise.all(['plankton-lab-v1.png','plankton-reactions-v1.png'].map(f=>loadImage(readFileSync(path.join(root,'public/assets',f)))));
mkdirSync(out,{recursive:true});const game=createEngine();
for(const phase of ['espera','aviso','contagem','ultimos-5']){
 if(phase==='aviso')for(const id of ['Luna','Rafa']){game.apply({kind:'follow',id,name:id});game.apply({kind:'like',id,count:1});}
 if(phase==='contagem')game.tick(5000);
 if(phase==='ultimos-5')game.tick(25000);
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage,hostImage,publicView:true});
 renderer.accept({mode:'live',paused:false,game:game.snapshot(),latest:'',broadcast:{nativeGiftsOnly:true,config:{title:'ALIADOS DO PLANKTON',accent:'#b9ef6d'}}},0);renderer.draw(32000);
 writeFileSync(path.join(out,`arena-entrada-legivel-${phase}.png`),canvas.toBuffer('image/png'));
 const detail=createCanvas(519,469);detail.getContext('2d').drawImage(canvas,35,420,1010,913,0,0,519,469);
 writeFileSync(path.join(out,`arena-entrada-celular-${phase}.png`),detail.toBuffer('image/png'));
}
console.log(path.join(out,'arena-entrada-celular-espera.png'));
