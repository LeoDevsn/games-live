import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {voiceStatus} from '../worker/voice.js';
import {savePrivateVoice} from './private-voice-config.mjs';

const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fields={key:'FISH_AUDIO_API_KEY',voiceA:'FISH_AUDIO_VOICE_ID_A',voiceB:'FISH_AUDIO_VOICE_ID_B',model:'FISH_AUDIO_MODEL'};
const models=new Set(['s1','s2-pro','s2.1-pro','s2.1-pro-free','drama-3']);
export function voiceId(input){
  let value=typeof input==='string'?input.trim():'';
  if(/^https:\/\//i.test(value)){
    try{
      const url=new URL(value);
      if(!['fish.audio','www.fish.audio','beta.fish.audio'].includes(url.hostname))return null;
      value=url.pathname.split('/').filter(Boolean).at(-1)||'';
    }catch{return null}
  }
  return /^[a-zA-Z0-9_-]{1,80}$/.test(value)?value:null;
}
function publicStatus(env){return {keySaved:!!env.FISH_AUDIO_API_KEY,voiceA:env.FISH_AUDIO_VOICE_ID_A||'',voiceB:env.FISH_AUDIO_VOICE_ID_B||'',model:env.FISH_AUDIO_MODEL||'s2.1-pro',...voiceStatus(env)}}

export function createLocalConfig({root,env=process.env}){
  let saving=false;
  return async request=>{
    if(request.method==='GET')return json(publicStatus(env));
    if(request.method!=='POST')return json({error:'Método não permitido.'},405);
    if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Abra a configuração pelo endereço local do jogo.'},403);
    if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Envie a configuração em JSON.'},415);
    let body;try{const raw=await request.text();if(raw.length>2048)return json({error:'Configuração muito grande.'},413);body=JSON.parse(raw)}catch{return json({error:'Configuração inválida.'},400)}
    if(!body||typeof body!=='object'||(body.key!==undefined&&typeof body.key!=='string'))return json({error:'Configuração inválida.'},400);
    const values={key:body.key?.trim()||env.FISH_AUDIO_API_KEY||'',voiceA:voiceId(body.voiceA),voiceB:voiceId(body.voiceB),model:body.model||'s2.1-pro'};
    if(!/^[a-zA-Z0-9._~+/=-]{1,1024}$/.test(values.key))return json({error:'Preencha uma chave Fish Audio válida.'},400);
    if(!values.voiceA||!values.voiceB)return json({error:'Informe o ID ou o link Fish Audio de cada voz.'},400);
    if(!models.has(values.model))return json({error:'Escolha um modelo Fish Audio disponível.'},400);
    if(saving)return json({error:'Aguarde a configuração anterior terminar.'},409);
    saving=true;
    const file=path.join(root,'.env'),temporary=file+'.'+randomUUID()+'.tmp';
    try{
      let existing='';try{existing=await readFile(file,'utf8')}catch(error){if(error.code!=='ENOENT')throw error}
      const lines=existing.split(/\r?\n/).filter(line=>!Object.values(fields).some(field=>new RegExp('^\\s*(?:export\\s+)?'+field+'\\s*=').test(line)));
      while(lines.length&&!lines.at(-1).trim())lines.pop();
      for(const [field,key]of Object.entries(fields))lines.push(key+'='+JSON.stringify(values[field]));
      await writeFile(temporary,lines.join('\n')+'\n',{mode:0o600,flag:'wx'});
      await rename(temporary,file);
      for(const [field,key]of Object.entries(fields))env[key]=values[field];
      savePrivateVoice(root,env);
      return json({saved:true,...publicStatus(env)});
    }catch{return json({error:'Não foi possível salvar .env. Confira o acesso à pasta do jogo.'},500)}
    finally{saving=false;await unlink(temporary).catch(()=>{})}
  };
}
