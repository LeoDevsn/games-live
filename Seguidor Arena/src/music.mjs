import {createReadStream,statSync} from 'node:fs';
import {MUSIC_SELECTIONS} from '../public/music-catalog.js';
export const DEFAULT_MUSIC=Object.freeze({enabled:true,volume:.22,selection:'liberadas'});
export function musicConfig(input={},base=DEFAULT_MUSIC){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Configuração de música inválida');
 const value={...base};if('enabled'in input){if(typeof input.enabled!=='boolean')throw Error('Ativar música deve ser sim/não');value.enabled=input.enabled;}
 if('selection'in input){if(typeof input.selection!=='string'||!Object.hasOwn(MUSIC_SELECTIONS,input.selection))throw Error('Trilha inválida');value.selection=input.selection;}
 if('volume'in input){if(!Number.isFinite(input.volume)||input.volume<0||input.volume>1)throw Error('Volume deve estar entre 0 e 100%');value.volume=input.volume;}return value;
}
export function serveMusic(req,res,file){
 let size;try{size=statSync(file).size;}catch{res.writeHead(404);res.end('Trilha não encontrada');return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 const headers={'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
  if(!match[1])start=Math.max(0,size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
  status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}
 const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
