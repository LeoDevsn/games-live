import http from 'node:http';
import {existsSync} from 'node:fs';
import path from 'node:path';
import worker from '../dist/server/index.js';
import {createLocalConfig} from './local-config.mjs';
import {restorePrivateVoice} from './private-voice-config.mjs';
const root=path.resolve(import.meta.dirname,'..');
if(existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
restorePrivateVoice(root);
const localConfig=createLocalConfig({root});
const server=http.createServer(async(req,res)=>{
  try{
    // Only loopback hosts can call this local runtime, including its private TTS key.
    if(!/^(127\.0\.0\.1|localhost)(:4174)?$/i.test(req.headers.host||'')){res.writeHead(403);res.end('Host não permitido');return}
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>2048){res.writeHead(413);res.end('Pedido muito grande');return}chunks.push(chunk)}
    const input=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const route=new URL(input.url).pathname;
    let out;
    if(route==='/api/setup/voice')out=await localConfig(input);
    else if(route==='/api/live/overlay'&&input.method==='GET'){
      let url=null;
      try{const target=new URL(process.env.TIKFINITY_ACTIONS_OVERLAY_URL);if(target.protocol==='https:'&&target.hostname==='widgets.tikfinity.com')url=target.href}catch{}
      out=Response.json({url},{headers:{'cache-control':'no-store'}});
    }else out=await worker.fetch(input,process.env);
    res.writeHead(out.status,Object.fromEntries(out.headers));res.end(Buffer.from(await out.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Erro no servidor local')}
});
server.requestTimeout=30000;
server.listen(4174,'127.0.0.1',()=>console.log('Jelly Battle: http://127.0.0.1:4174\nConfigurar vozes: http://127.0.0.1:4174/setup.html\nLive Studio: http://127.0.0.1:4174/?studio=1'));
