import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import path from 'node:path';
import {privateVoiceFile,readPrivateVoice} from './private-voice-config.mjs';
export const TOWER_NARRATORS=Object.freeze({A:{provider:'fish',name:'Sr. Sirigueijo',voiceId:'feb8db8e9f364804a7759663359a483e'},B:{provider:'fish',name:'Plankton',voiceId:'84300d9b3d524313b5eebea451b4821f'}});
export const narratorFile=root=>path.join(path.dirname(privateVoiceFile(root)),'game-narrators.json');
export function readTowerNarrators(root){
 let saved={};try{saved=JSON.parse(readFileSync(narratorFile(root),'utf8'))['tower-battle']||{};}catch{}
 return Object.fromEntries(['A','B'].map(team=>{const p=saved[team];return [team,p?.provider==='fish'&&/^[a-zA-Z0-9_-]{1,80}$/.test(p.voiceId)?{provider:'fish',name:String(p.name||TOWER_NARRATORS[team].name).slice(0,40),voiceId:p.voiceId}:{...TOWER_NARRATORS[team]}];}));
}
export function saveTowerNarrators(root){
 const file=narratorFile(root);let profiles={};try{profiles=JSON.parse(readFileSync(file,'utf8'));}catch{}
 profiles['tower-battle']=readTowerNarrators(root);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file+'.tmp',JSON.stringify(profiles,null,2),{mode:0o600});renameSync(file+'.tmp',file);return profiles['tower-battle'];
}
export function towerVoiceConfig(root){const p=readTowerNarrators(root);return {...readPrivateVoice(root),FISH_AUDIO_VOICE_ID_A:p.A.voiceId,FISH_AUDIO_VOICE_ID_B:p.B.voiceId};}
