import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
import {createApprovedSheets,UNIT_VISUAL} from '../src/ui/approved-sprites.js';
const textures=new Map(),root=new URL('../src/ui/assets/',import.meta.url);
textures.set('approved-troops',await loadImage(readFileSync(new URL('troops-approved-v1.png',root))));
for(const f of ['R','S'])for(const a of ['walk','attack'])textures.set(`${a}-${f}`,await loadImage(readFileSync(new URL(`${a}-${f}-v2.png`,root))));
globalThis.document={createElement:()=>createCanvas(1,1)};
createApprovedSheets({textures:{get:key=>({getSourceImage:()=>textures.get(key)}),exists:key=>textures.has(key),remove:key=>textures.delete(key),addSpriteSheet(key,canvas){textures.set(key,canvas);}}});
const pixels=(sheet,frame,x=0,y=0,w=128,h=128)=>sheet.getContext('2d').getImageData((frame%8)*128+x,Math.floor(frame/8)*128+y,w,h).data;
const digest=data=>createHash('sha256').update(data).digest('hex');
let cases=0;
for(const f of ['R','S'])for(const k of ['G','D','A','C']){
 const sheet=textures.get(`${f}-${k}`),outline=textures.get(`${f}-${k}-protection`);assert.equal(sheet.width,1024);assert.equal(sheet.height,640);
 for(const frames of [[0,1,2],[4,5,6],[8,9],[12,13]])assert.equal(new Set(frames.map(i=>digest(pixels(sheet,i)))).size,frames.length,`${f}-${k} distinct poses`);
 const main=pixels(sheet,0),glow=pixels(outline,0);let visible=0,clearInterior=0;
 for(let i=0;i<glow.length;i+=4){if(glow[i+3]>100){visible++;if(glow[i+3]>230){assert.ok(glow[i]>=240);assert.ok(glow[i+1]>=200);assert.ok(glow[i+2]<=90);}}if(main[i+3]>240&&glow[i+3]<25)clearInterior++;}
 assert.ok(visible>20);assert.ok(clearInterior>100);
 if(k==='C'){assert.equal(digest(pixels(sheet,0,0,0,128,78)),digest(pixels(sheet,1,0,0,128,78)),'cannon chassis stays still');assert.notEqual(digest(pixels(sheet,0,10,78,108,50)),digest(pixels(sheet,1,10,78,108,50)),'wheels rotate');}
 cases++;
}
assert.ok(UNIT_VISUAL.normal<126&&UNIT_VISUAL.champion<142);
const preview=createCanvas(1024,640),ctx=preview.getContext('2d');ctx.fillStyle='#183343';ctx.fillRect(0,0,1024,640);
for(const [col,key] of ['R-G','R-D','R-A','R-C','S-G','S-D','S-A','S-C'].entries())for(let row=0;row<5;row++){
 const frame=[0,1,2,9,32][row],sheet=textures.get(key);ctx.drawImage(sheet,(frame%8)*128,Math.floor(frame/8)*128,128,128,col*128,row*128,128,128);
 if(row===4){const outline=textures.get(key+'-protection');ctx.drawImage(outline,0,512,128,128,col*128,row*128,128,128);}
}
writeFileSync('evidence/sprite-preview-v2.png',preview.toBuffer('image/png'));writeFileSync('evidence/sprite-frames.json',JSON.stringify({status:'pass',classesTested:cases,checks:['distinct walking poses both directions','distinct attack poses both directions','rotating wheels with fixed cannon chassis','yellow silhouette outline with transparent interior','smaller units'],limitation:'Native Canvas rendering of actual sheet builder, not browser/Studio FPS measurement'},null,2));console.log('PASS sprite frames: 8 class/faction sheets, attacks, wheel rotation and yellow alpha outlines.');
