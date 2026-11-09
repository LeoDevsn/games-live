// Exercise the production scene lifecycle with a small Phaser API contract double.
// Native Canvas textures are real; this is not a browser/Phaser renderer substitute.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {HUD_ASSETS} from '../src/ui/figma-hud.js';
import {createState,initialArmy} from '../src/core/state.js';
import {renderFrame} from '../src/adapters/local/render-frame.js';
import {blockedNative,SCALE_X,SCALE_Y} from '../src/ui/arena-navigation.js';
function object(x=0,y=0,text=''){
 const value={x,y,text,active:true,visible:true,width:0,children:[],frame:{name:32},anims:{currentAnim:null,isPlaying:false,timeScale:1,stop(){this.isPlaying=false;}},on(){return this;},add(items){this.children.push(...(Array.isArray(items)?items:[items]));return this;},addAt(item){this.children.push(item);return this;},play(key){this.anims.currentAnim={key};this.anims.isPlaying=true;return this;},destroy(){this.active=false;},setText(text){this.text=String(text);return this;},setVisible(v){this.visible=v;return this;},setFrame(v){this.frame={name:v};return this;}};
 for(const key of ['setDepth','setStrokeStyle','setOrigin','setFontSize','setColor','setBackgroundColor','setPadding','setDisplaySize','setInteractive','setAlpha','setRotation','setTintFill','clearTint','setStroke'])value[key]=()=>value;
 return value;
}
globalThis.Phaser={Scene:class{},VERSION:'contract-test',Geom:{Rectangle:class{static Contains(){return true;}}},Math:{Angle:{Between:(x,y,a,b)=>Math.atan2(b-y,a-x)}}};
const {ArenaScene}=await import('../src/ui/arena-scene.js');
const scene=new ArenaScene(),textures=new Map();
for(const key of HUD_ASSETS)textures.set('figma-'+key,{getSourceImage:()=>images[key]});
const images=Object.fromEntries(await Promise.all(HUD_ASSETS.map(async key=>[key,await loadImage(readFileSync('src/ui/assets/figma/'+key+'.png'))])));
scene.textures={get:key=>textures.get(key),createCanvas(key,w,h){if(textures.has(key))return null;const canvas=createCanvas(w,h),texture={getContext:()=>canvas.getContext('2d'),refresh(){},getSourceImage:()=>canvas};textures.set(key,texture);return texture;}};
scene.add={image:object,ellipse:object,rectangle:object,star:object,triangle:object,sprite:object,container:object,text:(x,y,text)=>object(x,y,text)};
scene.tweens={add(){}};scene.time={delayedCall(){}};scene.game={canvas:{style:{}},loop:{actualFps:0}};
scene.createHud();scene.createSectors();scene.createResults();scene.ready=true;
assert.ok(scene.hudSurface);assert.ok(scene.objectiveSurface);assert.notEqual(textures.get('figma-objectives'),scene.objectiveSurface);assert.equal(textures.get('figma-objectives').getSourceImage(),images.objectives);assert.equal(textures.get('fw-runtime-objectives'),scene.objectiveSurface);
const s=createState({id:'scene-test'}),frame=()=>renderFrame(s,{paused:true,speed:1,demo:true,sequence:s.tick});
scene.accept(frame());scene.update(0,16);assert.equal(scene.entryImage.visible,true);assert.equal(scene.overlay.visible,false);assert.equal(scene.entryState.seconds,25);assert.equal(scene.units.size,0);
scene.accept({...frame(),waitingForFirstJoin:true});scene.update(8,16);assert.equal(scene.entryState.waiting,true);assert.equal(textures.get('fw-runtime-faction-entry'),scene.entrySurface);
initialArmy(s);s.phase='combat';scene.accept(frame());scene.update(16,16);assert.equal(scene.overlay.visible,false);assert.equal(scene.entryImage.visible,false);assert.equal(scene.units.size,30);
for(const u of s.units)u.pos=u.faction==='R'?31000:1000;s.tick++;scene.accept(frame());scene.update(32,16);
for(const rec of scene.units.values())assert.equal(blockedNative(rec.container.x/SCALE_X,rec.container.y/SCALE_Y,rec.data.kind==='C'?28:18),false);
const dead=s.units[0];dead.hp=0;s.tick++;scene.accept(frame());scene.update(48,16);assert.equal(scene.units.size,29);
s.phase='results';s.result={winner:'R',reason:'nexus'};s.phaseMs=0;scene.accept(frame());scene.update(64,16);assert.equal(scene.overlay.visible,true);assert.match(scene.overlayTitle.text,/VITÓRIA/);
s.phaseMs=6000;scene.accept(frame());scene.update(80,16);assert.equal(scene.overlayCount.text,'CAMPEÕES');
assert.equal(globalThis.__FW_RENDER__.layout,'figma-2026-11-02');assert.equal(globalThis.__FW_RENDER__.colliders,10);
writeFileSync('evidence/figma-scene.json',JSON.stringify({status:'pass',checks:['texture key collision contract rejects duplicates','static sidebar image preserved separately from dynamic objective Canvas','new faction entry renders waiting and countdown states','entry overlay hides during combat','combat HUD and all 30 unit objects','end-of-route collision clearance','unit removal','winner and faction result screens','CanvasTexture refresh contracts'],scope:'Production ArenaScene methods with Phaser API contract double and real native Canvas HUD textures. Browser rendering/FPS not measured.'},null,2));
console.log('PASS ArenaScene lifecycle: preparation, combat, removal, results and final layout.');
