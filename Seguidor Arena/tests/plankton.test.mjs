import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {saveGameNarrator,readGameNarrator,narratorFile,PLANKTON_NARRATOR} from '../src/narrator.mjs';
import {createArenaVoice} from '../src/voice.mjs';
import {createAudience,phrase} from '../src/audience.mjs';
import {hostFrame} from '../public/plankton-theme.js';
import {createRenderer,themeReady} from '../public/render.js';
import {createEngine} from '../src/engine.mjs';

test('per-game Plankton voice persists without replacing other profiles or the original A/B voice settings',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'plankton-profile-')),file=narratorFile(root);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,JSON.stringify({tower:{provider:'fish',name:'Outro',voiceId:'other'}}));
 saveGameNarrator(root);assert.equal(readGameNarrator(root).voiceId,PLANKTON_NARRATOR.voiceId);assert.equal(JSON.parse(readFileSync(file,'utf8')).tower.voiceId,'other');
 const env={FISH_AUDIO_API_KEY:'test-only-key',FISH_AUDIO_VOICE_ID_A:'bob-original',FISH_AUDIO_VOICE_ID_B:'patrick-original',FISH_AUDIO_MODEL:'s2.1-pro-free'},original={...env};let generated=0;
 const voice=createArenaVoice({root,folder:path.join(root,'cache'),readConfig:()=>env,generate:async(req,config)=>{generated++;assert.equal(config.FISH_AUDIO_VOICE_ID_A,PLANKTON_NARRATOR.voiceId);assert.equal(config.FISH_AUDIO_VOICE_ID_B,PLANKTON_NARRATOR.voiceId);assert.equal((await req.json()).team,'A');return new Response('test-mp3',{headers:{'Content-Type':'audio/mpeg'}});}});
 assert.equal(voice.status().character,'Plankton');await voice.audio({team:'PLANKTON',text:'Meu plano perfeito!'});assert.equal(generated,1);assert.deepEqual(env,original);assert.equal(JSON.stringify(voice.status()).includes(env.FISH_AUDIO_API_KEY),false);
});

test('Plankton announces countdown/start/closing, uses spaced taunts, and all templates fit the TTS limit',()=>{
 let at=0;const messages=[],a=createAudience({clock:()=>at,onMessage:j=>messages.push(j)});const view={phase:'waiting',round:1,alive:10,arena:{targetPercent:100}};
 a.observe(view);at=5000;a.observe({...view,phase:'preparation'});a.observe({...view,phase:'preparation'});assert.equal(messages.filter(j=>j.kind==='countdown').length,1);
 at=20000;a.observe({...view,phase:'running'});assert.equal(messages.at(-1).kind,'start');assert.equal(messages.at(-1).team,'PLANKTON');
 at=65000;a.observe({...view,phase:'running',arena:{targetPercent:60}});assert.equal(messages.at(-1).kind,'closing');
 at=110000;a.observe({...view,phase:'running',arena:{targetPercent:60}});assert.equal(messages.at(-1).kind,'taunt');a.observe({...view,phase:'running',arena:{targetPercent:60}});assert.equal(messages.filter(j=>j.kind==='taunt').length,1);
 for(const kind of ['welcome','gift','winner','help','countdown','start','closing','taunt']){const text=phrase(kind,{name:'A'.repeat(45),giftName:'B'.repeat(50)});assert.ok(text.length<=300,kind+': '+text.length);}
 assert.match(phrase('welcome',{following:true}),/like/);assert.match(phrase('welcome',{entryClosed:true}),/próxima rodada/);assert.match(phrase('winner',{name:'Luna'}),/Luna.*aliado/);
});

test('closing announcement explains the five-second rhythm, thirty-percent floor and elimination exception for three to nine survivors',()=>{
 for(const alive of [3,9]){
  let at=0;const a=createAudience({clock:()=>at});a.observe({phase:'running',round:1,alive,arena:{targetPercent:60}});at=20000;a.observe({phase:'running',round:1,alive,arena:{targetPercent:30}});
  const job=a.snapshot().jobs.at(-1);assert.equal(job.kind,'closing');assert.match(job.text,/cinco segundos/);assert.match(job.text,/trinta por cento/);assert.match(job.text,/vinte por cento/);assert.ok(job.text.length<=300);
 }
 assert.match(phrase('deathmatch'),/três segundos, até cinco por cento/);
});

test('transparent reaction sheet renders distinct idle, speech, gift and winner poses in the right side of the broadcast panel',async()=>{
 await themeReady;globalThis.document={createElement:()=>createCanvas(1,1)};
 const [background,host]=await Promise.all([loadImage(fileURLToPath(new URL('../public/assets/plankton-lab-v1.png',import.meta.url))),loadImage(fileURLToPath(new URL('../public/assets/plankton-reactions-v1.png',import.meta.url)))]);
 const sheet=createCanvas(host.width,host.height),sc=sheet.getContext('2d');sc.drawImage(host,0,0);assert.equal(sc.getImageData(0,0,1,1).data[3],0);assert.equal(host.width%2,0);assert.equal(host.height%2,0);
 assert.equal(hostFrame({}),0);assert.equal(hostFrame({speaking:true}),1);assert.equal(hostFrame({kind:'gift'}),2);assert.equal(hostFrame({kind:'winner'}),3);
 const g=createEngine().snapshot();g.phase='running';const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage:background,hostImage:host});renderer.accept({mode:'simulation',paused:false,game:g,broadcast:{nativeGiftsOnly:true}},0);
 renderer.draw(100);const idle=canvas.getContext('2d').getImageData(812,1378,202,245).data;
 renderer.setNarratorState({speaking:true,kind:'welcome'});renderer.draw(100);const talk=canvas.getContext('2d').getImageData(812,1378,202,245).data;assert.notDeepEqual(idle,talk);
 renderer.setNarratorState({speaking:false,kind:'winner'});renderer.draw(100);const winner=canvas.getContext('2d').getImageData(812,1378,202,245).data;assert.notDeepEqual(talk,winner);
});
