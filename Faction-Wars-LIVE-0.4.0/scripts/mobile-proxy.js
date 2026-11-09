import http from 'node:http';
import {networkInterfaces} from 'node:os';
export function localAddresses(interfaces=networkInterfaces()){
 return Object.entries(interfaces).flatMap(([name,items])=>(items??[]).filter(x=>(x.family==='IPv4'||x.family===4)&&!x.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(x.address)).map(x=>({name,address:x.address})));
}
// Optional LAN entry point. The original simulator remains bound to loopback.
export function createMobileProxy({backendPort=4173,addresses=localAddresses().map(x=>x.address)}={}){
 const server=http.createServer((req,res)=>{
  const fail=(status,message)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({error:message}));};
  const port=server.address().port,authority=String(req.headers.host??'').toLowerCase();
  const hostnames=['127.0.0.1','localhost',...addresses];
  if(!hostnames.some(host=>authority===(port===80?host:`${host}:${port}`)))return fail(403,'Use o endereço local exibido no terminal.');
  if(req.headers['sec-fetch-site']==='cross-site')return fail(403,'Acesso somente pela página local do jogo.');
  if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin).origin;}catch{return fail(403,'Origem inválida.');}if(origin!==`http://${authority}`)return fail(403,'Origem local diferente.');}
  if(!req.url.startsWith('/')||req.url.startsWith('//')||req.headers.upgrade)return fail(400,'Rota local inválida.');
  if(!['GET','POST'].includes(req.method))return fail(405,'GET/POST only');
  const headers={...req.headers,host:`127.0.0.1:${backendPort}`};
  // Validate browser origin above before translating this local hop.
  if(headers.origin)headers.origin=`http://127.0.0.1:${backendPort}`;
  for(const key of Object.keys(headers))if(key==='forwarded'||key.startsWith('x-forwarded-'))delete headers[key];
  const upstream=http.request({hostname:'127.0.0.1',port:backendPort,path:req.url,method:req.method,headers},response=>{
   res.writeHead(response.statusCode,response.headers);response.on('error',()=>res.destroy());response.pipe(res);res.on('close',()=>response.destroy());
  });
  upstream.on('error',()=>{if(!res.headersSent)fail(502,'Simulador local indisponível. Mantenha o terminal aberto.');else res.destroy();});
  req.on('aborted',()=>upstream.destroy());res.on('close',()=>upstream.destroy());req.pipe(upstream);
 });
 return server;
}
