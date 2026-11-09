import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createRenderer} from '../public/render.js';
globalThis.document={createElement:()=>createCanvas(1,1)};
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../previews');mkdirSync(out,{recursive:true});
const background=await loadImage(readFileSync(path.join(root,'public/assets/arena-space-v1.png'))),g=createEngine(),pictures=[];
for(const id of ['Luna','Rafa']){g.apply({kind:'follow',id,name:id});g.apply({kind:'like',id,count:1});}
for(const label of ['aviso','contagem']){
 if(label==='contagem')g.tick(7000);
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage:background});
 renderer.accept({mode:'simulation',paused:false,game:g.snapshot(),latest:'Prévia de inscrições · participantes de teste',broadcast:{nativeGiftsOnly:true}},0);renderer.draw(50);
 pictures.push(canvas);writeFileSync(path.join(out,'seguidor-arena-'+label+'.png'),canvas.toBuffer('image/png'));
}
const sheet=createCanvas(1080,550),c=sheet.getContext('2d');c.fillStyle='#091321';c.fillRect(0,0,1080,550);c.font='700 21px Segoe UI';c.textAlign='center';c.fillStyle='#d5eef5';
for(let i=0;i<2;i++){c.fillText(i?'CONTAGEM DE 30s · ENTRADAS ABERTAS':'AVISO ANTES DA CONTAGEM',270+i*540,26);c.drawImage(pictures[i],40,420,1000,910,i*540,46,540,491);}
writeFileSync(path.join(out,'seguidor-arena-inscricoes.png'),sheet.toBuffer('image/png'));console.log(path.join(out,'seguidor-arena-inscricoes.png'));
