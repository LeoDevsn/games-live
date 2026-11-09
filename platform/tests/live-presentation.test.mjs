import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRenderer,themeReady} from '../../Seguidor Arena/public/render.js';
import {createEngine as arenaEngine} from '../../Seguidor Arena/src/engine.mjs';
import {drawArena} from '../../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/public/render.js';
import {createEngine as towerEngine} from '../../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/src/engine.mjs';
const {createCanvas}=createRequire(new URL('../../Seguidor Arena/package.json',import.meta.url))('@napi-rs/canvas');

test('public Arena and Tower render round/game instructions without internal modes, diagnostic text or pause labels',async()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};await themeReady;
 for(const kind of ['arena','tower']){
  const canvas=createCanvas(1080,1920),context=canvas.getContext('2d'),lines=[],fill=context.fillText.bind(context);
  context.fillText=(value,...args)=>{lines.push(String(value));fill(value,...args);};
  if(kind==='arena'){
   const renderer=createRenderer(canvas,{publicView:true});renderer.accept({mode:'simulation',paused:true,latest:'SIMULAÇÃO · TESTE · WebSocket · SQLite',game:arenaEngine().snapshot(),broadcast:{nativeGiftsOnly:true,config:{showChat:false}}},0);renderer.draw(100);
  }else drawArena(canvas,towerEngine().snapshot(),100,'REPLAY TÉCNICO · WebSocket','TESTE','simulation',{nativeGiftsOnly:true},{publicView:true});
  assert.ok(lines.some(line=>line.startsWith('RODADA ')),kind);
  assert.ok(lines.some(line=>/SIGA O CANAL|SR. SIRIGUEIJO/.test(line)),kind);
  assert.doesNotMatch(lines.join('\n'),/SIMULAÇÃO|TESTE|REPLAY|TÉCNICO|WebSocket|SQLite|PAUSADO|CHAT OCULTO/,kind);
 }
});
