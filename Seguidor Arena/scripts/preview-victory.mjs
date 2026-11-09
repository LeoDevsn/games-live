import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createEngine} from '../src/engine.mjs';
import {createRenderer,themeReady} from '../public/render.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,'../previews');globalThis.document={createElement:()=>createCanvas(1,1)};await themeReady;
const [backgroundImage,hostImage]=await Promise.all(['plankton-lab-v1.png','plankton-reactions-v1.png'].map(f=>loadImage(readFileSync(path.join(root,'public/assets',f)))));
const seed=createEngine();for(const [id,name]of [['a','Luna'],['b','Rafa']]){seed.apply({kind:'follow',id,name});seed.apply({kind:'like',id,count:1});}seed.tick(35000);const saved=seed.exportState();saved.players.find(([id])=>id==='b')[1].hp=2;const game=createEngine(seed.settings,saved);game.hit('a','b');
const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage,hostImage,publicView:true});renderer.accept({mode:'live',paused:false,game:game.snapshot(),latest:'',broadcast:{nativeGiftsOnly:true,config:{title:'ALIADOS DO PLANKTON',accent:'#b9ef6d'}}},0);renderer.draw(500);mkdirSync(out,{recursive:true});const file=path.join(out,'arena-royale-vencedor.png');writeFileSync(file,canvas.toBuffer('image/png'));console.log(file);
