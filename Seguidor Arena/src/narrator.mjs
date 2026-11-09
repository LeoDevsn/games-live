import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import path from 'node:path';
import {privateVoiceFile} from './private-voice-config.mjs';
export const PLANKTON_NARRATOR=Object.freeze({provider:'fish',name:'Plankton',voiceId:'84300d9b3d524313b5eebea451b4821f'});
export function narratorFile(root){return path.join(path.dirname(privateVoiceFile(root)),'game-narrators.json');}
export function readGameNarrator(root){
 try{const v=JSON.parse(readFileSync(narratorFile(root),'utf8'))['seguidor-arena'];if(v?.provider==='fish'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v.voiceId))return {provider:'fish',name:String(v.name||'Plankton').slice(0,40),voiceId:v.voiceId};}catch{}
 return {...PLANKTON_NARRATOR};
}
export function saveGameNarrator(root,value=PLANKTON_NARRATOR){
 if(value.provider!=='fish'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.voiceId))throw Error('Narrador inválido');
 const file=narratorFile(root);let profiles={};try{profiles=JSON.parse(readFileSync(file,'utf8'));}catch{}
 profiles['seguidor-arena']={provider:'fish',name:String(value.name||'Plankton').slice(0,40),voiceId:value.voiceId};
 mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file+'.tmp',JSON.stringify(profiles,null,2),{mode:0o600});renameSync(file+'.tmp',file);return profiles['seguidor-arena'];
}
