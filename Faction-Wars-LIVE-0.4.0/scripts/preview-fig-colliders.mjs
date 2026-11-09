import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(import.meta.dirname,'../design-import/arena-2026-11-02'),layout=JSON.parse(fs.readFileSync(path.join(root,'layout.json')));
const assets=fs.readdirSync(path.join(root,'exports'));
const background=await loadImage(path.join(root,'exports',assets.find(n=>n.startsWith('04-'))));
const reference=await loadImage(path.join(root,'exports','13-COLISORES.png'));
function shape(c,node,dx=0,dy=0){const m=node.transform;c.save();c.setTransform(m.m00,m.m10,m.m01,m.m11,m.m02+dx,m.m12+dy);for(const g of node.geometry){c.beginPath();for(const cmd of g.commands){const v=cmd.values;if(cmd.kind==='M')c.moveTo(...v);else if(cmd.kind==='L')c.lineTo(...v);else if(cmd.kind==='C')c.bezierCurveTo(...v);else if(cmd.kind==='Q')c.quadraticCurveTo(...v);else c.closePath();}c.fill(g.windingRule==='ODD'?'evenodd':'nonzero');}c.restore();}
// Validate transforms against the exact COLISORES PNG exported by the user.
const mask=createCanvas(reference.width,reference.height),mc=mask.getContext('2d');mc.fillStyle='#d9d9d9';for(const n of layout.colliders)shape(mc,n,-layout.colliderGroup.transform.m02,-layout.colliderGroup.transform.m12);
const original=createCanvas(reference.width,reference.height),oc=original.getContext('2d');oc.drawImage(reference,0,0);
const a=mc.getImageData(0,0,mask.width,mask.height).data,b=oc.getImageData(0,0,mask.width,mask.height).data;let intersection=0,union=0;
for(let i=3;i<a.length;i+=4){const x=a[i]>=128,y=b[i]>=128;if(x||y)union++;if(x&&y)intersection++;}
const overlap=intersection/union;assert.ok(overlap>.995,`Collision geometry/export agreement: ${overlap}`);
const canvas=createCanvas(layout.stage.width,layout.stage.height),c=canvas.getContext('2d');c.drawImage(background,0,0);c.fillStyle='#ffb83a77';for(const n of layout.colliders)shape(c,n);
c.font='bold 25px Segoe UI';c.textAlign='center';c.textBaseline='middle';
layout.colliders.forEach((n,i)=>{const m=n.transform,x=m.m00*n.size.x/2+m.m01*n.size.y/2+m.m02,y=m.m10*n.size.x/2+m.m11*n.size.y/2+m.m12;c.fillStyle='#17242e';c.beginPath();c.roundRect(x-24,y-19,48,38,8);c.fill();c.fillStyle='#ffe4a7';c.fillText(String(i+1),x,y);});
for(const n of layout.placements.filter(n=>/^Mapa — [ABC] — Neutro$/.test(n.name))){const x=n.transform.m02+n.size.x/2,y=n.transform.m12+n.size.y/2;c.fillStyle='#49d3f0';c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fill();c.fillText(n.name.split(' — ')[1],x,y+30);}
const output=path.resolve(import.meta.dirname,'../../previews/faction-wars-conferencia-colisores.png');fs.writeFileSync(output,canvas.toBuffer('image/png'));
const report={status:'pass',colliders:10,geometryMatchesUserExport:overlap,output,scope:'Geometry import verification only; no movement/collision behavior changed in the game.'};fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
