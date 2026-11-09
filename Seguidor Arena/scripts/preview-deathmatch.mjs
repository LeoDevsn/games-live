import {createCanvas,loadImage} from '@napi-rs/canvas';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createRenderer,themeReady} from '../public/render.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../previews');
globalThis.document={createElement:()=>createCanvas(1,1)};await themeReady;
const [backgroundImage,hostImage]=await Promise.all(['plankton-lab-v1.png','plankton-reactions-v1.png'].map(file=>loadImage(readFileSync(path.join(root,'public/assets',file)))));
const base=createEngine();for(const [id,name]of [['luna','Luna'],['rafa','Rafa']]){base.apply({kind:'follow',id,name});base.apply({kind:'like',id,count:1});}
base.tick(35000);const state=base.exportState();state.arena.area=state.arena.target=.2;
state.players.forEach(([,p],i)=>Object.assign(p,{x:440+i*200,y:860,hp:i?8:12,attackAt:1e9,nextTurn:1e9,angle:Math.PI/2}));
const game=createEngine(base.settings,state),canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage,hostImage,publicView:true});
renderer.accept({mode:'live',paused:false,game:game.snapshot(),latest:'',broadcast:{chat:[],config:{title:'ALIADOS DO PLANKTON',accent:'#b9ef6d',metric:'wins'},nativeGiftsOnly:true}},0);renderer.draw(1);
mkdirSync(out,{recursive:true});const file=path.join(out,'arena-royale-deathmatch.png');writeFileSync(file,canvas.toBuffer('image/png'));console.log(file);
