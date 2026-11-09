import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {saveTowerNarrators,readTowerNarrators,narratorFile,TOWER_NARRATORS} from '../src/narrators.mjs';
import {createTowerVoice} from '../src/voice.mjs';
import {createAudience,phrase} from '../src/audience.mjs';
import {createTikFinityAdapter} from '../src/tikfinity.mjs';
import {createEngine} from '../src/engine.mjs';
import {drawArena,setThemeAssets,setNarratorState} from '../public/render.js';
const {createCanvas,loadImage}=createRequire(new URL('../../../Seguidor Arena/package.json',import.meta.url))('@napi-rs/canvas');
test('both saved Tower narrators preserve Jelly and Arena profiles; each team uses its own voice and cache',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'tower-voice-')),file=narratorFile(root);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,JSON.stringify({'seguidor-arena':{voiceId:'original-plankton'},jelly:{voiceId:'original-bob'}}));saveTowerNarrators(root);
 const profiles=JSON.parse(readFileSync(file,'utf8'));assert.equal(profiles['seguidor-arena'].voiceId,'original-plankton');assert.equal(profiles.jelly.voiceId,'original-bob');assert.deepEqual(readTowerNarrators(root),TOWER_NARRATORS);
 const env={FISH_AUDIO_API_KEY:'test-private-key',FISH_AUDIO_VOICE_ID_A:TOWER_NARRATORS.A.voiceId,FISH_AUDIO_VOICE_ID_B:TOWER_NARRATORS.B.voiceId,FISH_AUDIO_MODEL:'s2.1-pro-free'},calls=[];
 const voice=createTowerVoice({root,folder:path.join(root,'cache'),readConfig:()=>env,generate:async(req,config)=>{calls.push({body:await req.json(),config});return new Response('fake audio',{headers:{'Content-Type':'audio/mpeg'}});}});
 assert.equal(voice.status().configured,true);for(const team of ['A','B'])await voice.audio({team,text:'Mãos à obra!'});await voice.audio({team:'A',text:'Mãos à obra!'});assert.equal(calls.length,2);assert.equal(calls[0].body.team,'A');assert.equal(calls[1].body.team,'B');assert.notEqual(calls[0].config.FISH_AUDIO_VOICE_ID_A,calls[1].config.FISH_AUDIO_VOICE_ID_B);assert.ok(!JSON.stringify(voice.status()).includes('test-private-key'));await assert.rejects(()=>voice.audio(null));
});
test('member arrivals and help normalize without spawning; A/B remain the only way to start or choose a team',()=>{
 const a=createTikFinityAdapter(),g=createEngine();for(const event of ['member','follow','share']){const action=a.normalize({event,data:{userId:event,nickname:'Rafa'}});assert.equal(action.kind,'identity');assert.equal(g.apply(action),false);}const help=a.normalize({event:'chat',data:{userId:'help',comment:'!ajuda'}});assert.equal(help.kind,'help');assert.equal(g.apply(help),false);assert.equal(g.snapshot().phase,'waiting');g.apply({kind:'join',id:'worker',team:'B',name:'Luna'},0);assert.equal(g.teamFor('worker'),'B');assert.equal(g.teamFor('unknown'),null);
});
test('invitations alternate bosses; join, gifts and victory speak as the correct boss, with cooldowns and no duplicate victory',async()=>{
 let at=0;const sent=[],messages=[],a=createAudience({clock:()=>at,onMessage:j=>messages.push(j),sendChat:async message=>{sent.push(message);return true;}}),waiting={phase:'waiting',round:0};a.observe(waiting);a.receive({kind:'identity',id:'first',name:'Luna'},waiting);assert.equal(messages.at(-1).team,'A');assert.match(messages.at(-1).text,/Siri Cascudo/);a.receive({kind:'identity',id:'first',name:'Luna'},waiting);assert.equal(messages.length,1);
 at=26000;a.receive({kind:'identity',id:'second',name:'Rafa'},waiting);assert.equal(messages.at(-1).team,'B');assert.match(messages.at(-1).text,/Plankton/);
 at=48000;a.receive({kind:'join',id:'rafa',name:'Rafa',team:'B'},{round:1});assert.equal(messages.at(-1).kind,'join');a.receive({kind:'join',id:'rafa',name:'Rafa',team:'B'},{round:1});assert.equal(messages.filter(j=>j.kind==='join').length,1);
 a.receive({kind:'gift',id:'rafa',name:'Rafa',team:'B',giftName:'Rosa'},{});assert.equal(messages.at(-1).team,'B');assert.match(messages.at(-1).text,/Rosa/);a.observe({phase:'running',round:1});a.observe({phase:'intermission',round:1,lastWinner:'A'});a.observe({phase:'intermission',round:1,lastWinner:'A'});assert.equal(messages.filter(j=>j.kind==='winner').length,1);assert.equal(messages.at(-1).team,'A');
 const count=messages.length,job=a.test('welcome','B');assert.equal(job.test,true);assert.equal(job.team,'B');assert.equal(messages.length,count);await a.pump();assert.equal(sent.length,1);const recovered=createAudience({clock:()=>at,seen:a.exportSeen()});recovered.receive({kind:'identity',id:'first',name:'Luna'},waiting);assert.equal(recovered.snapshot().jobs.length,0);
 for(const team of ['A','B'])for(const kind of ['welcome','join','gift','start','taunt','winner','help'])assert.ok(phrase(team,kind,{name:'n'.repeat(45),giftName:'g'.repeat(45)}).length<=300);
});
test('portrait theme renders both bosses, underwater field and construction entry without technical labels in public view',async()=>{
 const assets={};for(const [key,file]of [['background','construction-seabed-v1.png'],['krabs','mr-krabs-nickrewind-v1.png'],['plankton','plankton-reactions-v1.png']])assets[key]=await loadImage(fileURLToPath(new URL('../public/assets/'+file,import.meta.url)));
 setThemeAssets(assets);const g=createEngine(),canvas=createCanvas(1080,1920),c=canvas.getContext('2d'),lines=[],fill=c.fillText.bind(c);c.fillText=(t,...args)=>{lines.push(String(t));fill(t,...args);};drawArena(canvas,g.snapshot(),100,'WebSocket SIMULAÇÃO','TESTE','simulation',{nativeGiftsOnly:true},{publicView:true});assert.ok(lines.includes('ESCOLHA SEU CHEFE'));assert.ok(lines.includes('SR. SIRIGUEIJO'));assert.ok(lines.includes('PLANKTON'));assert.doesNotMatch(lines.join('\n'),/WebSocket|SIMULAÇÃO|TESTE|REPLAY/);
 g.apply({kind:'join',id:'a',name:'Luna',team:'A'},0);drawArena(canvas,g.snapshot(),200,'','','live',{nativeGiftsOnly:true},{publicView:true});const before=c.getImageData(0,970,230,280).data;setNarratorState({speaking:true,team:'A',kind:'gift'});drawArena(canvas,g.snapshot(),400,'','','live',{nativeGiftsOnly:true},{publicView:true});assert.notDeepEqual(before,c.getImageData(0,970,230,280).data);setNarratorState({speaking:false});
});
