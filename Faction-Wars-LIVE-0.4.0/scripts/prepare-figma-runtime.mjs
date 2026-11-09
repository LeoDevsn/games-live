import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),input=path.join(root,'design-import/arena-2026-11-02');
const layout=JSON.parse(readFileSync(path.join(input,'layout.json')));
const names={'1:18':'credits-R','5:19':'nexus-R','5:32':'title','5:35':'clock','10:2':'credits-S','10:3':'objectives','10:4':'nexus-S','12:16':'point-A','12:10':'point-B','20:34':'point-C'};
const exports={background:'04-',title:'08-',clock:'07-','credits-R':'11-','credits-S':'06-','nexus-R':'10-','nexus-S':'12-',objectives:'03-','point-A':'01-','point-B':'02-','point-C':'05-'};
const folder=path.join(root,'src/ui/assets/figma');mkdirSync(folder,{recursive:true});
const files=readdirSync(path.join(input,'exports'));
for(const [key,prefix] of Object.entries(exports)){const file=files.find(n=>n.startsWith(prefix));if(!file)throw Error('Missing export '+prefix);copyFileSync(path.join(input,'exports',file),path.join(folder,key+'.png'));}
const placements=Object.fromEntries(layout.placements.filter(n=>names[n.id]).map(n=>[names[n.id],{nodeId:n.id,x:n.transform.m02,y:n.transform.m12,width:n.size.x,height:n.size.y}]));
const colliders=layout.colliders.map(n=>{
 const m=n.transform;
 if(n.type==='ELLIPSE')return {id:n.id,type:'ellipse',x:m.m02+n.size.x/2,y:m.m12+n.size.y/2,rx:n.size.x/2,ry:n.size.y/2};
 if(n.type==='ROUNDED_RECTANGLE')return {id:n.id,type:'rect',x:m.m02,y:m.m12,width:n.size.x,height:n.size.y};
 const points=n.geometry[0].commands.filter(c=>c.kind==='M'||c.kind==='L').map(c=>({x:m.m00*c.values[0]+m.m01*c.values[1]+m.m02,y:m.m10*c.values[0]+m.m11*c.values[1]+m.m12}));
 return {id:n.id,type:'polygon',points:points.slice(0,3)};
});
const manifest={stage:layout.stage,placements,colliders,assets:Object.keys(exports),source:'Arena Figma.zip / 2026-11-02'};
writeFileSync(path.join(root,'src/ui/figma-layout.js'),'// Generated from the supplied editable Figma file; coordinates relative to Arena — fundo.\nexport const FIGMA_LAYOUT = '+JSON.stringify(manifest,null,2)+';\n');
console.log('Prepared '+Object.keys(exports).length+' local exports and '+colliders.length+' collision shapes.');
