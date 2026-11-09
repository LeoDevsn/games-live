import {mkdir,readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readPrivateVoice} from './private-voice-config.mjs';
import {voiceStatus,generateVoice} from './fish-voice.mjs';
import {readGameNarrator} from './narrator.mjs';
export function createArenaVoice({root,folder,readConfig=()=>readPrivateVoice(root),readNarrator=root?()=>readGameNarrator(root):()=>null,generate=generateVoice}={}){
 const pending=new Map();let lastError=null;
 function config(){const env=readConfig(),profile=readNarrator();return profile?{...env,FISH_AUDIO_VOICE_ID_A:profile.voiceId,FISH_AUDIO_VOICE_ID_B:profile.voiceId}:env;}
 return {
  status(){const s=voiceStatus(config());return {provider:s.provider,character:readNarrator()?.name||null,configured:s.teams.A||s.teams.B,teams:s.teams,lastError};},
  async audio(job){
   if(!job)throw Error('Fala expirada ou desconhecida.');const env=config();
   const team=voiceStatus(env).teams[job.team]?job.team:voiceStatus(env).teams.A?'A':'B';
   const text=job.kind==='entry'&&job.audioText?job.audioText:job.text;
   const key=createHash('sha256').update(JSON.stringify([env.FISH_AUDIO_API_KEY,env['FISH_AUDIO_VOICE_ID_'+team],env.FISH_AUDIO_MODEL,text])).digest('hex');
   await mkdir(folder,{recursive:true});const file=path.join(folder,key+'.mp3');try{return await readFile(file);}catch{}
   if(!pending.has(key))pending.set(key,(async()=>{
    const r=await generate(new Request('http://127.0.0.1/api/voice/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({team,text})}),env);
    if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'API de voz indisponível.');}
    if(!r.headers.get('content-type')?.startsWith('audio/'))throw Error('A API não retornou áudio.');
    const bytes=Buffer.from(await r.arrayBuffer());if(!bytes.length||bytes.length>2097152)throw Error('Áudio inválido.');
    const files=(await readdir(folder)).filter(f=>/^[a-f0-9]{64}\.mp3$/.test(f));if(files.length>=300)await unlink(path.join(folder,files[0]));
    await writeFile(file,bytes);lastError=null;return bytes;
   })().catch(e=>{lastError=e.message;throw e;}).finally(()=>pending.delete(key)));
   return pending.get(key);
  },
 };
}
