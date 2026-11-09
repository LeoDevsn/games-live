import {createCanvas,loadImage} from '@napi-rs/canvas';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createRenderer,themeReady} from '../public/render.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../previews');
globalThis.document={createElement:()=>createCanvas(1,1)};await themeReady;
const [backgroundImage,hostImage]=await Promise.all(['plankton-lab-v1.png','plankton-reactions-v1.png'].map(file=>loadImage(readFileSync(path.join(root,'public/assets',file)))));
const game=createEngine({speed:40});
for(let i=0;i<12;i++){const id='preview-'+i,name=['Luna','Rafa','Bia','Caio','Duda','Leo','Nina','Gui'][i%8]+' '+(i+1);game.apply({kind:'follow',id,name});game.apply({kind:'like',id,count:1});}
game.tick(35000);const state=game.exportState();
state.players.forEach(([,p],i)=>Object.assign(p,{x:170+(i%4)*235,y:570+Math.floor(i/4)*230,nextTurn:1e9,attackAt:1e9,angle:Math.PI/2}));
Object.assign(state.players[0][1],{x:430,y:800});Object.assign(state.players[1][1],{x:800,y:700});Object.assign(state.players[4][1],{x:170,y:730});Object.assign(state.players[5][1],{x:760,y:950});
state.items=[{id:1,kind:'fire',x:430,y:800,radius:18},{id:2,kind:'shield',x:800,y:700,radius:18},{id:3,kind:'fire',x:380,y:1120,radius:18},{id:4,kind:'shield',x:680,y:1120,radius:18}];state.itemSerial=4;
const preview=createEngine(game.settings,state);preview.tick(300);const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage,hostImage,publicView:true});
renderer.accept({mode:'live',paused:false,game:preview.snapshot(),latest:'',broadcast:{chat:[],config:{title:'ALIADOS DO PLANKTON',accent:'#b9ef6d',metric:'wins'},nativeGiftsOnly:true}},0);renderer.draw(1);
mkdirSync(out,{recursive:true});const file=path.join(out,'arena-royale-itens.png');writeFileSync(file,canvas.toBuffer('image/png'));console.log(file);
