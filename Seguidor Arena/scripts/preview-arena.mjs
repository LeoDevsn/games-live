import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {ARENA_VERSION,boundsForArea,constrainToArena} from '../src/arena.mjs';
import {createRenderer} from '../public/render.js';
globalThis.document={createElement:()=>createCanvas(1,1)};
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'../previews');mkdirSync(out,{recursive:true});
const background=await loadImage(readFileSync(resolve(root,'public/assets/arena-space-v1.png'))),pictures=[];
for(const [area,count,label]of [[1,100,'quadrada'],[.8,80,'quadrada-80'],[.6,60,'transicao'],[.4,40,'circular-40'],[.2,20,'circular']]){
 const g=createEngine();for(let i=0;i<100;i++){const id='preview-'+String(i).padStart(3,'0'),name=['Luna','Rafa','Bia','Caio','Duda','Leo','Nina','Gui'][i%8]+' '+(i+1);g.apply({kind:'follow',id,name});g.apply({kind:'like',id,count:1});}
 const state=g.exportState(),b=boundsForArea(area);state.arena={version:ARENA_VERSION,shape:'morph',area,target:area};state.phase='running';state.now=area===1?0:140000;
 state.players.forEach(([,p],i)=>{p.hp=i<count?(area===1?20:6+i%5*3):0;const r=p.radius;let attempt=i*7;for(let t=0;t<1000;t++){const n=++attempt,q={x:b.left+r+((n*.61803398875)%1)*(b.halfWidth*2-r*2),y:b.top+r+((n*.75487766625)%1)*(b.halfHeight*2-r*2),radius:r};const original={...q};constrainToArena(q,b);if(Math.hypot(q.x-original.x,q.y-original.y)<.01){p.x=q.x;p.y=q.y;break;}}p.attackAt=1e9;if(i<count&&i%7===0)p.healUntil=state.now+5000;if(i<count&&i%9===0)p.damageUntil=state.now+10000;});
 const engine=createEngine(g.settings,state),canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage:background});renderer.accept({mode:'simulation',paused:false,game:engine.snapshot(),latest:'Prévia visual · participantes sintéticos',broadcast:{nativeGiftsOnly:true}},0);renderer.draw(50);pictures.push(canvas);writeFileSync(resolve(out,'seguidor-arena-'+label+'.png'),canvas.toBuffer('image/png'));
}
const sheet=createCanvas(2000,430),c=sheet.getContext('2d');c.fillStyle='#091321';c.fillRect(0,0,2000,430);const labels=['100 vivos - ARENA 100%','80 vivos - ARENA 80%','60 vivos - ARENA 60%','40 vivos - ARENA 40%','20 vivos - ARENA 20%'],shapes=['CAMPO ABERTO','RETANGULAR','TRANSICAO','CIRCULAR','CIRCULAR'];c.textAlign='center';for(let i=0;i<5;i++){c.drawImage(pictures[i],0,380,1080,940,i*400,62,400,348);c.font='700 19px Segoe UI';c.fillStyle='#d5eef5';c.fillText(labels[i],i*400+200,24);c.font='600 16px Segoe UI';c.fillStyle='#f4c185';c.fillText(shapes[i],i*400+200,48);}writeFileSync(resolve(out,'seguidor-arena-hibrida.png'),sheet.toBuffer('image/png'));console.log('Previews: '+resolve(out,'seguidor-arena-hibrida.png'));
