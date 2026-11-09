import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {musicConfig} from '../src/music.mjs';
import {createSoundtrack} from '../public/soundtrack.js';
const settle=()=>new Promise(r=>setImmediate(r));
function fixture(studio,blocked=false,deferred=false){
 const gestures=new Map(),nodes=new Map(),html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 const element=()=>({value:'',checked:false,hidden:false,textContent:'',children:[],append(n){this.children.push(n);}});
 for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],element());const stage=element(),media=[],saved=[],pending=[];
 class Media{constructor(){this.plays=0;this.pauses=0;this.currentTime=0;this.handlers={};media.push(this);}addEventListener(kind,fn){this.handlers[kind]=fn;}play(){this.plays++;if(deferred)return new Promise((resolve,reject)=>pending.push({resolve,reject}));return blocked?Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'})):Promise.resolve();}pause(){this.pauses++;}}
 const doc={addEventListener:(name,fn)=>gestures.set(name,fn),getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},createElement:element,querySelector:()=>stage};
 const player=createSoundtrack({studio,AudioClass:Media,document:doc,save:async value=>saved.push(value)});
 return {player,nodes,stage,audio:media[0],saved,pending,gesture:()=>gestures.get('pointerdown')?.(),unblock(){blocked=false;}};
}
test('soundtrack loops continuously in the live source, retains position and follows saved volume/on-off',async()=>{
 const f=fixture(true);f.player.update({enabled:true,volume:.22});await settle();assert.equal(f.audio.loop,true);assert.equal(f.audio.src,'/assets/audio/filmic-remix.mp3');assert.equal(f.audio.plays,1);
 f.audio.currentTime=85;for(let i=0;i<20;i++)f.player.update({enabled:true,volume:.22});assert.equal(f.audio.currentTime,85);assert.equal(f.audio.plays,1);
 f.player.duck(true);assert.equal(f.audio.volume,.22*.28);f.player.update({enabled:true,volume:.22});assert.equal(f.audio.volume,.22*.28);f.player.duck(false);assert.equal(f.audio.volume,.22);assert.equal(f.audio.currentTime,85);
 f.player.update({enabled:true,volume:.4});assert.equal(f.audio.volume,.4);assert.equal(f.audio.plays,1);f.player.update({enabled:false,volume:.4});assert.ok(f.audio.pauses>0);f.player.update({enabled:true,volume:.4});await settle();assert.equal(f.audio.plays,2);assert.equal(f.audio.currentTime,85);f.player.stop();
});
test('operator panel stays silent by default and only plays its explicit preview; controls save settings',async()=>{
 const f=fixture(false);f.player.update({enabled:true,volume:.22});await settle();assert.equal(f.audio.plays,0);f.nodes.get('musicPreview').onclick();await settle();assert.equal(f.audio.plays,1);f.nodes.get('musicPreview').onclick();assert.ok(f.audio.pauses>0);
 f.nodes.get('musicEnabled').checked=false;await f.nodes.get('musicEnabled').onchange();assert.deepEqual(f.saved.at(-1),{enabled:false});f.nodes.get('musicVolume').value='37';f.nodes.get('musicVolume').oninput();await f.nodes.get('musicVolume').onchange();assert.deepEqual(f.saved.at(-1),{volume:.37});
});
test('public autoplay waits for a gesture without showing technical buttons or retrying every SSE frame',async()=>{
 const f=fixture(true,true);f.player.update({enabled:true,volume:.22});await settle();assert.equal(f.stage.children.length,0);for(let i=0;i<20;i++)f.player.update({enabled:true,volume:.22});assert.equal(f.audio.plays,1);f.unblock();f.gesture();await settle();assert.equal(f.stage.children.length,0);assert.equal(f.audio.plays,2);f.player.stop();
});
test('music preferences are validated and the installed MP3 matches the user-provided track',()=>{
 for(const input of [{volume:-1},{volume:1.1},{volume:NaN},{enabled:'true'},{selection:'../../private'},{selection:['sailor']},null])assert.throws(()=>musicConfig(input));assert.deepEqual(musicConfig({volume:.3},{enabled:false,volume:.22}),{enabled:false,volume:.3});
 const hash=file=>createHash('sha256').update(readFileSync(new URL(file,import.meta.url))).digest('hex');assert.equal(hash('../public/assets/audio/filmic-remix.mp3'),hash('../Filmic Remix (fb9f2092cf4d415ab9206b1def2f8bc5).mp3'));
});

test('automatic music loops Rag before combat, switches to Sailor during battle and returns after victory without restarting on snapshots',async()=>{
 const f=fixture(true),config=musicConfig({volume:.3});assert.equal(config.selection,'liberadas');f.player.update(config,'waiting');await settle();assert.equal(f.audio.loop,true);assert.match(f.audio.src,/12th-street/);assert.match(f.nodes.get('musicCredits').value,/CC BY 4.0/);
 f.audio.currentTime=40;for(const phase of ['notice','preparation','preparation'])f.player.update(config,phase);await settle();assert.equal(f.audio.currentTime,40);assert.equal(f.audio.plays,1);
 f.player.duck(true);f.player.update(config,'running');await settle();assert.match(f.audio.src,/drunken-sailor/);assert.equal(f.audio.volume,.3*.28);assert.equal(f.audio.plays,2);
 for(let i=0;i<30;i++)f.player.update(config,'running');await settle();assert.equal(f.audio.plays,2);
 f.player.update(config,'intermission');await settle();assert.match(f.audio.src,/12th-street/);assert.equal(f.audio.plays,3);f.player.update(config,'waiting');assert.equal(f.audio.plays,3);
 f.player.update({...config,enabled:false},'running');await settle();assert.equal(f.audio.plays,3);assert.match(f.audio.src,/drunken-sailor/);
 f.player.update({...config,selection:'rag'},'running');await settle();assert.match(f.audio.src,/12th-street/);assert.equal(f.audio.loop,true);f.player.stop();
});

test('phase changes during pending playback use the latest track and ignore cancellation of the old source',async()=>{
 const f=fixture(true,false,true),config=musicConfig();f.player.update(config,'waiting');assert.equal(f.audio.plays,1);f.player.update(config,'running');assert.match(f.audio.src,/drunken-sailor/);f.pending[0].reject(Object.assign(Error('source changed'),{name:'AbortError'}));await settle();assert.equal(f.audio.plays,2);f.pending[1].resolve();await settle();assert.match(f.audio.src,/drunken-sailor/);assert.equal(f.stage.children.length,0);f.player.update(config,'running');assert.equal(f.audio.plays,2);f.player.stop();
});
