import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createMobileProxy,localAddresses} from './mobile-proxy.js';
const root=fileURLToPath(new URL('../',import.meta.url));
function port(value,fallback){const p=value===undefined?fallback:Number(value);if(!Number.isInteger(p)||p<1||p>65535)throw Error('Porta inválida');return p;}
const backendPort=port(process.env.PORT,4173),mobilePort=port(process.env.MOBILE_PORT,4174);
if(backendPort===mobilePort)throw Error('PORT e MOBILE_PORT devem ser diferentes.');
let child,server,stopping=false;
async function probe(){const r=await fetch(`http://127.0.0.1:${backendPort}/api/state`,{signal:AbortSignal.timeout(1500)});if(!r.ok)throw Error('Porta do simulador ocupada');const data=await r.json();if(data.state?.rulesHash!=='f3602e48')throw Error('A porta já está em uso por outro aplicativo');return data;}
function stop(code=0){if(stopping)return;stopping=true;server?.closeAllConnections();server?.close();child?.kill('SIGTERM');process.exitCode=code;}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
try{
 let running;try{running=await probe();}catch(e){if(e.message!=='fetch failed')throw e;}
 if(!running){
  child=spawn(process.execPath,['src/adapters/local/server.js'],{cwd:root,env:{...process.env,PORT:String(backendPort)},stdio:['ignore','inherit','inherit']});
  child.on('error',e=>{console.error(e.message);stop(1);});child.on('exit',code=>{if(!stopping){console.error('O simulador foi encerrado.');stop(code||1);}});
  for(let attempt=0;attempt<60&&!stopping;attempt++){try{running=await probe();break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
  if(!running)throw Error('Não foi possível iniciar o simulador local.');
 }
 if(stopping)throw Error('Inicialização interrompida.');
 const addresses=localAddresses();server=createMobileProxy({backendPort,addresses:addresses.map(x=>x.address)});
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`A porta ${mobilePort} está ocupada. Feche o teste anterior ou defina MOBILE_PORT.`:e.message);stop(1);});
 server.listen(mobilePort,'0.0.0.0',()=>{
  console.log('\nFACTION WARS — TESTE NO CELULAR (REDE LOCAL)');
  console.log(`Computador: http://127.0.0.1:${mobilePort}`);
  for(const {name,address} of addresses)console.log(`Celular (${name}): http://${address}:${mobilePort}`);
  if(!addresses.length)console.log('Nenhum endereço de rede local encontrado. Conecte o computador ao Wi-Fi e execute novamente.');
  console.log('Use o mesmo Wi-Fi no celular. Mantenha este terminal aberto. Ctrl+C encerra o acesso local.');
  console.log('No navegador: Nova batalha com cenário → Retomar. PC e celular controlam a mesma partida.\n');
 });
}catch(e){console.error(e.message);stop(1);}
