import {readFileSync,writeFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createState} from '../src/core/state.js';
import {renderFrame} from '../src/adapters/local/render-frame.js';
import {createApprovedSheets} from '../src/ui/approved-sprites.js';
import {HUD_ASSETS,drawFigmaHud,drawMapObjectives} from '../src/ui/figma-hud.js';
import {drawFactionEntry} from '../src/ui/faction-entry.js';
const textures=new Map(),root=new URL('../src/ui/assets/',import.meta.url);
textures.set('approved-troops',await loadImage(readFileSync(new URL('troops-approved-v1.png',root))));
for(const f of ['R','S'])for(const a of ['walk','attack'])textures.set(`${a}-${f}`,await loadImage(readFileSync(new URL(`${a}-${f}-v2.png`,root))));
globalThis.document={createElement:()=>createCanvas(1,1)};
createApprovedSheets({textures:{get:key=>({getSourceImage:()=>textures.get(key)}),exists:key=>textures.has(key),remove:key=>textures.delete(key),addSpriteSheet(key,canvas){textures.set(key,canvas);}}});
const assets=Object.fromEntries(await Promise.all(HUD_ASSETS.map(async key=>[key,await loadImage(readFileSync(new URL('figma/'+key+'.png',root)))])));
const canvas=createCanvas(1080,1920),c=canvas.getContext('2d'),hud=createCanvas(1080,1920),map=createCanvas(1080,1920),entry=createCanvas(1080,1920);
const s=createState({id:'entry-preview'}),portraits={R:textures.get('R-D'),S:textures.get('S-D')};
for(const waiting of [true,false]){
 s.phaseMs=waiting?0:13000;const frame=renderFrame(s,{paused:false,speed:1,demo:false,sequence:1,waitingForFirstJoin:waiting});
 c.clearRect(0,0,1080,1920);c.drawImage(assets.background,0,0,1080,1920);drawMapObjectives(map.getContext('2d'),frame,assets);c.drawImage(map,0,0);drawFigmaHud(hud.getContext('2d'),frame,assets);c.drawImage(hud,0,0);
 drawFactionEntry(entry.getContext('2d'),frame,1800,portraits);c.drawImage(entry,0,0);
 const output=new URL(waiting?'../../previews/faction-wars-entrada-live.png':'../../previews/faction-wars-preparacao-live.png',import.meta.url);writeFileSync(output,canvas.toBuffer('image/png'));console.log(output.pathname);
}
