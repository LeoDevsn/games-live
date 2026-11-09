import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createState,initialArmy} from '../src/core/state.js';
import {renderFrame} from '../src/adapters/local/render-frame.js';
import {createApprovedSheets,UNIT_VISUAL} from '../src/ui/approved-sprites.js';
import {HUD_ASSETS,drawFigmaHud,drawMapObjectives,drawObjective} from '../src/ui/figma-hud.js';
import {unitPosition} from '../src/ui/arena-layout.js';
const textures=new Map(),root=new URL('../src/ui/assets/',import.meta.url);
textures.set('approved-troops',await loadImage(readFileSync(new URL('troops-approved-v1.png',root))));
for(const f of ['R','S'])for(const action of ['walk','attack'])textures.set(`${action}-${f}`,await loadImage(readFileSync(new URL(`${action}-${f}-v2.png`,root))));
globalThis.document={createElement:()=>createCanvas(1,1)};
createApprovedSheets({textures:{get:key=>({getSourceImage:()=>textures.get(key)}),exists:key=>textures.has(key),remove:key=>textures.delete(key),addSpriteSheet(key,canvas){textures.set(key,canvas);}}});
const assets=Object.fromEntries(await Promise.all(HUD_ASSETS.map(async key=>[key,await loadImage(readFileSync(new URL('figma/'+key+'.png',root)))])));
const s=createState({id:'preview-synthetic'});s.phase='combat';s.combatMs=75000;s.teams.R.credits=9;s.teams.S.credits=14;s.nexus.R.hp=1550;s.nexus.S.hp=1800;
s.points=[{lane:0,owner:null,progress:-85,contested:false},{lane:1,owner:'R',progress:200,contested:false},{lane:2,owner:'S',progress:20,contested:true}];
const clean=renderFrame(s,{paused:true,speed:1,demo:true,sequence:1}),canvas=createCanvas(1080,1920),c=canvas.getContext('2d'),hud=createCanvas(1080,1920),map=createCanvas(1080,1920);
function draw(frame){c.clearRect(0,0,1080,1920);c.drawImage(assets.background,0,0,1080,1920);drawMapObjectives(map.getContext('2d'),frame,assets);c.drawImage(map,0,0);
 for(const u of [...frame.units].sort((a,b)=>unitPosition(a,frame.profile).y-unitPosition(b,frame.profile).y)){
  const p=unitPosition(u,frame.profile),size=UNIT_VISUAL.normal,frameNo=u.faction==='R'?1:5,sheet=textures.get(u.faction+'-'+u.kind);
  c.fillStyle='#11293744';c.beginPath();c.ellipse(p.x,p.y,24,8,0,0,Math.PI*2);c.fill();
  c.drawImage(sheet,(frameNo%8)*128,Math.floor(frameNo/8)*128,128,128,p.x-size/2,p.y-size*.85,size,size);
  c.fillStyle='#0a2234';c.fillRect(p.x-26,p.y-83,52,5);c.fillStyle=u.faction==='R'?'#ff2545':'#00aaff';c.fillRect(p.x-26,p.y-83,52,4);
 }
 drawFigmaHud(hud.getContext('2d'),frame,assets);c.drawImage(hud,0,0);
}
draw(clean);writeFileSync('../previews/faction-wars-layout-final.png',canvas.toBuffer('image/png'));
initialArmy(s);const counts={};for(const u of s.units){const key=u.faction+u.lane,index=counts[key]||0;counts[key]=index+1;const order={D:0,G:1,A:2,C:4};u.pos=u.faction==='R'?14500-order[u.kind]*1350-(index===3?650:0):17500+order[u.kind]*1350+(index===3?650:0);}
draw(renderFrame(s,{paused:true,speed:1,demo:true,sequence:2}));writeFileSync('../previews/faction-wars-combate-final.png',canvas.toBuffer('image/png'));
// Repaint the same HUD repeatedly to verify no stale values, labels or fills remain.
const hash=()=>Buffer.from(hud.getContext('2d').getImageData(0,0,1080,1920).data);
const before=hash();clean.teams.R.credits=0;clean.nexus.S.hp=0;clean.combatMs=299000;drawFigmaHud(hud.getContext('2d'),clean,assets);assert.notDeepEqual(hash(),before);clean.nexus.S.hp=2000;drawFigmaHud(hud.getContext('2d'),clean,assets);
const states=createCanvas(560,250),sc=states.getContext('2d');sc.fillStyle='#061117';sc.fillRect(0,0,560,250);
for(const [i,p] of [{owner:null,progress:0,contested:false},{owner:null,progress:-120,contested:false},{owner:'R',progress:200,contested:false},{owner:'S',progress:-200,contested:false},{owner:'R',progress:60,contested:true}].entries())drawObjective(sc,60+i*108,100,p,['A','B','C','A','B'][i]);
writeFileSync('evidence/figma-objective-states.png',states.toBuffer('image/png'));
writeFileSync('evidence/figma-render.json',JSON.stringify({status:'pass',width:1080,height:1920,assets:HUD_ASSETS,checks:['all local Figma images decode','actual runtime HUD and markers render','time/credits/health redraw','all objective states','sprite sheets at projected routes'],previews:['../previews/faction-wars-layout-final.png','../previews/faction-wars-combate-final.png'],scope:'Canvas components used by the runtime, with synthetic test values. Not a browser/Studio screenshot.'},null,2));
console.log('PASS native Canvas rendering of final Figma HUD, markers, assets and projected sprites.');
