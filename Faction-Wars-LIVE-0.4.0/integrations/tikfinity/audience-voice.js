import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {VOICE,HELP_VOICE} from './audience.js';
import {createHash} from 'node:crypto';
import {voiceStatus,generateVoice} from './fish-voice.js';
// Loads the private platform settings; the Jelly service is a legacy fallback.
// Only two fixed instructional phrases can be generated, with persistent caching.
export function createAudienceVoice({folder,fetcher=fetch,base='http://127.0.0.1:4174',readConfig=()=>null}={}){
 mkdirSync(folder,{recursive:true});const phrases={welcome:VOICE,help:HELP_VOICE},pending=new Map();
 let lastError=null;
 return {
  async status(){const config=readConfig();if(config?.FISH_AUDIO_API_KEY)return {provider:'Fish Audio · configuração privada da plataforma',configured:voiceStatus(config).teams.A,lastError};try{const r=await fetcher(base+'/api/voice/status',{signal:AbortSignal.timeout(1500)});if(!r.ok)throw Error();const s=await r.json();return {provider:'Fish Audio via Jelly',configured:!!s.teams?.A,lastError};}catch{return {provider:'Fish Audio',configured:false,lastError:'Voz da plataforma indisponível. Confira a configuração salva no Jelly.'};}},
  async audio(kind){
   if(!Object.hasOwn(phrases,kind))throw Error('Fala desconhecida');const config=readConfig();const scope=config?.FISH_AUDIO_API_KEY?createHash('sha256').update(JSON.stringify([config.FISH_AUDIO_API_KEY,config.FISH_AUDIO_VOICE_ID_A,config.FISH_AUDIO_MODEL,phrases[kind]])).digest('hex').slice(0,16):'local';const file=resolve(folder,'guide-v2-'+scope+'-'+kind+'.mp3');
   if(existsSync(file))return readFileSync(file);
   const jobKey=scope+':'+kind;if(!pending.has(jobKey))pending.set(jobKey,(async()=>{
    const request={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({team:'A',text:phrases[kind]}),signal:AbortSignal.timeout(20000)};
    const r=config?.FISH_AUDIO_API_KEY?await generateVoice(new Request('http://127.0.0.1/api/voice/generate',request),config):await fetcher(base+'/api/voice/generate',request);
    if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.error||'Configure a voz A no Jelly Battle.');}
    if(!r.headers.get('content-type')?.startsWith('audio/'))throw Error('Áudio inválido');
    const reader=r.body.getReader(),chunks=[];let size=0;for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2097152){await reader.cancel();throw Error('Áudio muito grande');}chunks.push(Buffer.from(value));}
    if(!size)throw Error('Áudio vazio');const audio=Buffer.concat(chunks);writeFileSync(file,audio);lastError=null;return audio;
   })().catch(e=>{lastError=e.message;throw e;}).finally(()=>pending.delete(jobKey)));
   return pending.get(jobKey);
  },
 };
}
