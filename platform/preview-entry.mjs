import {createCanvas,loadImage} from '../Faction-Wars-LIVE-0.4.0/node_modules/@napi-rs/canvas/index.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {entryModel,drawGameEntry} from '../shared/game-entry.js';
import {createEngine as towerEngine} from '../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/src/engine.mjs';
import {createEngine as arenaEngine} from '../Seguidor Arena/src/engine.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'previews');mkdirSync(out,{recursive:true});
const jelly=resolve(root,'Jelly-Battle-LIVE-9x16/public/assets');
const images={A:await loadImage(readFileSync(resolve(jelly,'spongebob.png'))),B:await loadImage(readFileSync(resolve(jelly,'patrick.webp')))};
const backgrounds={jelly:await loadImage(readFileSync(resolve(jelly,'jellyfish-meadow.png'))),arena:await loadImage(readFileSync(resolve(root,'Seguidor Arena/public/assets/arena-space-v1.png')))};
const samples={jelly:{phase:'waiting',round:1},tower:towerEngine().snapshot(),arena:arenaEngine().snapshot()};
const pictures={};
{
 const canvas=createCanvas(1080,1000),c=canvas.getContext('2d');c.drawImage(backgrounds.jelly,0,0,1080,1000);drawGameEntry(c,entryModel('jelly',{phase:'preparation',seconds:13,round:1}),1800,{images,bounds:{x:42,y:40,w:996,h:900}});writeFileSync(resolve(out,'jelly-preparacao-live.png'),canvas.toBuffer('image/png'));
}
for(const kind of ['jelly','tower','arena']){
 const canvas=createCanvas(1080,1920),c=canvas.getContext('2d');const g=c.createLinearGradient(0,0,0,1920);g.addColorStop(0,kind==='jelly'?'#11454c':'#16213c');g.addColorStop(1,'#071120');c.fillStyle=g;c.fillRect(0,0,1080,1920);
 if(backgrounds[kind])c.drawImage(backgrounds[kind],0,360,1080,1120);
 c.fillStyle='#f0f6ed';c.textAlign='center';c.font='800 66px Segoe UI';c.fillText({jelly:'JELLY BATTLE',tower:'TOWER BATTLE',arena:'SEGUIDOR ARENA'}[kind],540,140);c.font='500 23px Segoe UI';c.fillStyle='#a9c8da';c.fillText('PRÉVIA DO OVERLAY DE ENTRADA',540,193);
 if(kind==='jelly'){
  c.fillStyle='#ffe66e';c.font='700 30px Segoe UI';c.fillText('TIME A',245,290);c.fillStyle='#ffa4ce';c.fillText('TIME B',835,290);c.fillStyle='#f3f6dc';c.fillText('02:00',540,290);
 }
 drawGameEntry(c,entryModel(kind,samples[kind]),1800,{images:kind==='jelly'?images:{},bounds:{x:42,y:424,w:996,h:900}});
 c.fillStyle='#c4d3e6';c.font='700 26px Segoe UI';c.fillText(kind==='jelly'?'RANKINGS DOS TIMES':kind==='tower'?'RANKING DOS CONSTRUTORES':'RANKING DOS SOBREVIVENTES',540,1510);c.font='400 22px Segoe UI';c.fillStyle='#8faac4';c.fillText('A entrada deixa o placar e os rankings livres.',540,1557);
 const filename=resolve(out,`entrada-${kind}.png`);writeFileSync(filename,canvas.toBuffer('image/png'));pictures[kind]=canvas;console.log(filename);
}
const faction=await loadImage(readFileSync(resolve(out,'faction-wars-entrada-live.png'))),sheet=createCanvas(1800,560),c=sheet.getContext('2d');c.fillStyle='#091321';c.fillRect(0,0,1800,560);
for(const [i,key] of ['faction','jelly','tower','arena'].entries()){const x=i*450;
 if(key==='faction')c.drawImage(faction,60,470,960,950,x+12,65,426,416);else c.drawImage(pictures[key],32,415,1016,920,x+12,65,426,416);
 c.fillStyle='#eaf4f6';c.font='700 21px Segoe UI';c.textAlign='center';c.fillText({faction:'FACTION WARS',jelly:'JELLY BATTLE',tower:'TOWER BATTLE',arena:'SEGUIDOR ARENA'}[key],x+225,36);}
c.fillStyle='#99b3c7';c.font='400 17px Segoe UI';c.fillText('Prévias somente dos overlays · Jelly mantém o formato 9:16 já aprovado',900,531);writeFileSync(resolve(out,'entradas-quatro-jogos.png'),sheet.toBuffer('image/png'));
