import {createCanvas,loadImage} from '../Seguidor Arena/node_modules/@napi-rs/canvas/index.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {entryModel,drawGameEntry} from '../shared/game-entry.js';
import {createEngine} from '../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/src/engine.mjs';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'previews');mkdirSync(out,{recursive:true});
const jellyAssets=resolve(root,'Jelly-Battle-LIVE-9x16/public/assets'),towerAssets=resolve(root,'Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/public/assets');
const load=async file=>loadImage(readFileSync(file));
const images={jelly:{A:await load(resolve(jellyAssets,'spongebob.png')),B:await load(resolve(jellyAssets,'patrick.webp'))},tower:{KRABS:await load(resolve(towerAssets,'mr-krabs-nickrewind-v1.png')),PLANKTON:await load(resolve(towerAssets,'plankton-reactions-v1.png'))}};
const back={jelly:await load(resolve(jellyAssets,'jellyfish-meadow.png')),tower:await load(resolve(towerAssets,'construction-seabed-v1.png'))};
const tower=createEngine().snapshot(),pictures=[];
for(const kind of ['jelly','tower'])for(const phase of ['espera','contagem']){
 const state=kind==='jelly'?{phase:phase==='espera'?'waiting':'preparation',seconds:15,round:1}:{...tower,...(phase==='contagem'?{phase:'intermission',lastWinner:'A',timeLeftSeconds:10}:{})};
 const canvas=createCanvas(1080,1000),c=canvas.getContext('2d');c.drawImage(back[kind],0,0,1080,1000);
 drawGameEntry(c,entryModel(kind,state,{theme:kind==='tower'?'construction':null}),1000,{images:images[kind],bounds:{x:42,y:40,w:996,h:900}});
 writeFileSync(resolve(out,`${kind}-entrada-legivel-${phase}.png`),canvas.toBuffer('image/png'));
 const phone=createCanvas(519,469);phone.getContext('2d').drawImage(canvas,35,36,1010,913,0,0,519,469);writeFileSync(resolve(out,`${kind}-entrada-celular-${phase}.png`),phone.toBuffer('image/png'));
 if(phase==='espera')pictures.push(phone);
}
for(const [label,file]of [['espera','faction-wars-entrada-live.png'],['contagem','faction-wars-preparacao-live.png']]){
 const full=await load(resolve(out,file)),phone=createCanvas(519,587);phone.getContext('2d').drawImage(full,56,332,968,1095,0,0,519,587);writeFileSync(resolve(out,`faction-entrada-celular-${label}.png`),phone.toBuffer('image/png'));if(label==='espera')pictures.push(phone);
}
const sheet=createCanvas(1557,635),c=sheet.getContext('2d');c.fillStyle='#081c28';c.fillRect(0,0,sheet.width,sheet.height);c.textAlign='center';c.fillStyle='#f2eddb';c.font='800 23px Segoe UI';
pictures.forEach((p,i)=>{c.fillText(['JELLY BATTLE','TOWER BATTLE','FACTION WARS'][i],i*519+260,29);c.drawImage(p,i*519,44);});
const file=resolve(out,'entradas-legiveis-demais-jogos.png');writeFileSync(file,sheet.toBuffer('image/png'));console.log(file);
