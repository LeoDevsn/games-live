// Read-only import of the local .fig's own Kiwi schema. Does not modify gameplay.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {inflateRawSync,zstdDecompressSync} from 'node:zlib';
const require=createRequire(import.meta.url);
const kiwi=require('../../.tools/fig-reader/node_modules/kiwi-schema');
const root=path.resolve(import.meta.dirname,'../design-import/arena-2026-11-02');
const bytes=fs.readFileSync(path.join(root,'canvas.fig'));
if(bytes.toString('ascii',0,8)!=='fig-kiwi')throw Error('Not a Figma Kiwi file');
let offset=12;const chunks=[];
while(offset<bytes.length){const length=bytes.readUInt32LE(offset);offset+=4;if(offset+length>bytes.length)throw Error('Invalid chunk');chunks.push(bytes.subarray(offset,offset+length));offset+=length;}
const decompress=b=>b.readUInt32LE(0)===0xfd2fb528?zstdDecompressSync(b):inflateRawSync(b);
const schema=kiwi.decodeBinarySchema(decompress(chunks[0]));
const data=kiwi.compileSchema(schema).decodeMessage(decompress(chunks[1]));
const key=g=>g?`${g.sessionID}:${g.localID}`:null,nodes=new Map(data.nodeChanges.map(n=>[key(n.guid),n]));
const identity={m00:1,m01:0,m02:0,m10:0,m11:1,m12:0};
function multiply(a,b){return {m00:a.m00*b.m00+a.m01*b.m10,m01:a.m00*b.m01+a.m01*b.m11,m02:a.m00*b.m02+a.m01*b.m12+a.m02,m10:a.m10*b.m00+a.m11*b.m10,m11:a.m10*b.m01+a.m11*b.m11,m12:a.m10*b.m02+a.m11*b.m12+a.m12};}
function world(n,visited=new Set()){const id=key(n.guid);if(visited.has(id))throw Error('Cyclic hierarchy');visited.add(id);const parent=nodes.get(key(n.parentIndex?.guid));return multiply(parent?world(parent,visited):identity,n.transform||identity);}
function geometry(n){return (n.fillGeometry||[]).map(g=>{
 const b=Buffer.from(data.blobs[g.commandsBlob].bytes);let at=0;const commands=[];
 while(at<b.length){const opcode=b[at++],kind={0:'Z',1:'M',2:'L',3:'Q',4:'C'}[opcode],count={0:0,1:2,2:2,3:4,4:6}[opcode];if(!kind||at+count*4>b.length)throw Error('Unsupported geometry command');const values=[];for(let i=0;i<count;i++,at+=4)values.push(b.readFloatLE(at));commands.push({kind,values});}
 return {windingRule:g.windingRule,commands};
 });}
const arena=[...nodes.values()].find(n=>n.name==='Arena — fundo'),group=[...nodes.values()].find(n=>n.name==='COLISORES');
if(!arena||!group)throw Error('Arena or collision group missing');
const origin=world(arena);if(origin.m00!==1||origin.m11!==1||origin.m01||origin.m10)throw Error('Unexpected arena transform');
function record(n,withGeometry=false){const matrix=world(n);matrix.m02-=origin.m02;matrix.m12-=origin.m12;return {id:key(n.guid),name:n.name,type:n.type,parentId:key(n.parentIndex?.guid),size:n.size,transform:matrix,visible:n.visible,...(withGeometry?{geometry:geometry(n)}:{})};}
const top=[...nodes.values()].filter(n=>key(n.parentIndex?.guid)==='0:1');
const colliders=[...nodes.values()].filter(n=>key(n.parentIndex?.guid)===key(group.guid)&&n.name==='bloco-colisor').map(n=>record(n,true));
if(colliders.length!==10)throw Error('Expected the ten marked colliders');
const layout={source:'Arena Figma.zip / local .fig',stage:{width:arena.size.x,height:arena.size.y},arena:record(arena),colliderGroup:record(group),colliders,placements:top.filter(n=>n!==arena&&n!==group&&n.size&&n.name!=='Objetivos — marcadores para o mapa').map(n=>record(n)),referenceBoard:record(top.find(n=>n.name==='Objetivos — marcadores para o mapa')),status:'Imported geometry and design positions only; not integrated into the running game.'};
fs.writeFileSync(path.join(root,'layout.json'),JSON.stringify(layout,null,2)+'\n');
console.log(JSON.stringify({nodes:nodes.size,colliders:colliders.length,stage:layout.stage,colliderOffset:layout.colliderGroup.transform,output:path.join(root,'layout.json')},null,2));
