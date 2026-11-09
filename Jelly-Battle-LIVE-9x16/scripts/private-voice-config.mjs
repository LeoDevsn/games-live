import {existsSync,readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {parseEnv} from 'node:util';
import path from 'node:path';
const fields=['FISH_AUDIO_API_KEY','FISH_AUDIO_VOICE_ID_A','FISH_AUDIO_VOICE_ID_B','FISH_AUDIO_MODEL','TIKFINITY_ACTIONS_OVERLAY_URL','JELLY_VOICE_VOLUME_A','JELLY_VOICE_VOLUME_B'];
export function privateVoiceFile(root){
 let base=path.resolve(root);for(let i=0;i<5;i++){if(existsSync(path.join(base,'INICIAR-GAMES-LIVE.bat')))return path.join(base,'.runtime','private','jelly-voices.env');const parent=path.dirname(base);if(parent===base)break;base=parent;}
 return path.join(root,'.runtime','private','jelly-voices.env');
}
export function readPrivateVoice(root){try{return parseEnv(readFileSync(privateVoiceFile(root),'utf8'));}catch{return {};}}
export function savePrivateVoice(root,env){
 if(!env.FISH_AUDIO_API_KEY||!env.FISH_AUDIO_VOICE_ID_A||!env.FISH_AUDIO_VOICE_ID_B)return false;
 const file=privateVoiceFile(root),tmp=file+'.tmp';mkdirSync(path.dirname(file),{recursive:true});
 writeFileSync(tmp,fields.filter(k=>Object.hasOwn(env,k)||k==='FISH_AUDIO_MODEL').map(k=>k+'='+JSON.stringify(env[k]||(k==='FISH_AUDIO_MODEL'?'s2.1-pro':''))).join('\n')+'\n',{mode:0o600});renameSync(tmp,file);return true;
}
export function restorePrivateVoice(root,env=process.env){
 const stored=readPrivateVoice(root);for(const key of fields)if(!env[key]&&stored[key])env[key]=stored[key];
 // A newer folder may lack .env; restore only voice fields, keeping other settings.
 const local=path.join(root,'.env');if(!existsSync(local)&&env.FISH_AUDIO_API_KEY){writeFileSync(local,fields.filter(k=>env[k]).map(k=>k+'='+JSON.stringify(env[k])).join('\n')+'\n',{mode:0o600});}
 if(env.FISH_AUDIO_API_KEY)savePrivateVoice(root,env);
}
