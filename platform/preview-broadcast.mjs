import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(new URL('../Seguidor Arena/package.json',import.meta.url));
const {createCanvas,loadImage}=require('@napi-rs/canvas');
import {createEngine} from '../Seguidor Arena/src/engine.mjs';
import {createRenderer} from '../Seguidor Arena/public/render.js';
globalThis.document={createElement:()=>createCanvas(1,1)};
const backgroundImage=await loadImage(readFileSync(new URL('../Seguidor Arena/public/assets/arena-space-v1.png',import.meta.url)));
const game=createEngine({giftMappings:[{id:'fire',seconds:5,trail:'fire'},{id:'laser',seconds:5,trail:'laser'},{id:'smoke',seconds:5,trail:'smoke'}]});
for(let i=0;i<18;i++){const id='preview-'+i,name=['Luna','Rafa','Bia','Caio','Duda','Leo','Nina','Gui','Maya'][i%9]+' '+(i+1);game.apply({kind:'follow',id,name});game.apply({kind:'like',id,name,count:1});if(i<9)game.apply({kind:'gift',id,giftId:['fire','laser','smoke'][i%3]});if(i===2)game.activateAbility(id,'heal');if(i===7)game.activateAbility(id,'damage');}
const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage});
const broadcast={config:{title:'LENDAS DA GALÁXIA',metric:'wins',accent:'#bc9bff',showChat:true},chat:[{name:'Rafa',text:'Olha esse rastro de fogo!'},{name:'Luna',text:'A cura de 5 segundos chegou na hora.'},{name:'Gui',text:'Batalha espacial valendo o topo!'}],queued:0};
for(let i=0;i<30;i++){game.tick(50);const view=game.snapshot();view.ranking=view.ranking.map((r,index)=>({...r,wins:Math.max(0,8-index),xp:Math.max(10,850-index*43),damage:r.damage+120+index*7,healing:r.healing+20+index*2,rank:['Ouro','Prata','Bronze'][Math.min(2,index)]}));renderer.accept({mode:'simulation',paused:false,game:view,broadcast,latest:'PRÉVIA DO LAYOUT · participantes e placares sintéticos'},i*50);renderer.draw(i*50+25);}
const folder=new URL('../previews/',import.meta.url);mkdirSync(folder,{recursive:true});writeFileSync(new URL('seguidor-arena-espacial.png',folder),canvas.toBuffer('image/png'));
const c=canvas.getContext('2d');c.fillStyle='#101628f5';c.beginPath();c.roundRect(44,1320,992,320,25);c.fill();const g=c.createRadialGradient(540,1455,15,540,1455,340);g.addColorStop(0,'#aa742278');g.addColorStop(1,'#10162900');c.fillStyle=g;c.fillRect(45,1321,990,318);
c.save();c.translate(540,1440);c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?37:83;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.shadowColor='#ffd572';c.shadowBlur=40;c.fillStyle='#ffe39a';c.fill();c.restore();
c.font='800 34px Segoe UI';c.textAlign='center';c.fillStyle='#fff0c6';c.fillText('Rafa · Efeito de presente',540,1569);c.font='21px Segoe UI';c.fillStyle='#9eafd1';c.fillText('Quadro ilustrativo da celebração integrada sobre o chat',540,1608);writeFileSync(new URL('seguidor-arena-efeito.png',folder),canvas.toBuffer('image/png'));
console.log('Saved previews/seguidor-arena-espacial.png and previews/seguidor-arena-efeito.png');
