import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanvas} from '../../Faction-Wars-LIVE-0.4.0/node_modules/@napi-rs/canvas/index.js';
import {entryModel,drawGameEntry} from '../../shared/game-entry.js';
import {createEngine as createTower} from '../../Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/src/engine.mjs';
import {createEngine as createArena} from '../../Seguidor Arena/src/engine.mjs';

test('entry follows real round phases and configurable rules without modifying engines',()=>{
 const tower=createTower({likesPerBlock:40,chatCooldownSeconds:5}),waiting=tower.snapshot(),original=JSON.stringify(waiting);
 let model=entryModel('tower',waiting);assert.equal(model.cards[0].command,'A');assert.match(model.steps[1][1],/40 likes/);assert.match(model.steps[0][2],/5s/);assert.equal(model.seconds,null);
 const c=createCanvas(1080,1920).getContext('2d');assert.equal(drawGameEntry(c,model,100),true);assert.equal(JSON.stringify(waiting),original);
 tower.apply({kind:'join',id:'t1',name:'Fixture',team:'A'});assert.equal(entryModel('tower',tower.snapshot()),null);assert.equal(entryModel('tower',tower.snapshot(),{preview:true}).preview,true);
 const arena=createArena();model=entryModel('arena',arena.snapshot());assert.match(model.steps[0][1],/20 HP/);assert.match(model.steps[1][1],/50 likes/);assert.match(model.steps[1][2],/5s.*10s/);assert.match(model.tips[0],/\+1 HP/);assert.equal(model.cards[0].command,'SEGUIR');
 for(const id of ['p1','p2']){arena.apply({kind:'follow',id,name:id});arena.apply({kind:'like',id,count:1});}assert.equal(entryModel('arena',arena.snapshot()).phase,'announcement');arena.tick(5000);assert.equal(entryModel('arena',arena.snapshot()).seconds,30);arena.tick(30000);assert.equal(entryModel('arena',arena.snapshot()),null);
 model=entryModel('arena',{...arena.snapshot(),phase:'intermission',countdown:7,winner:{name:'Campeão'}});assert.equal(model.seconds,7);assert.equal(model.subtitle,'Campeão');drawGameEntry(c,model,200);
 const jelly=entryModel('jelly',{phase:'preparation',seconds:12,round:1});assert.equal(jelly.seconds,12);assert.match(jelly.steps[2][2],/2 minutos/);assert.equal(entryModel('jelly',{phase:'running'}),null);drawGameEntry(c,jelly,300);
 const image=c.getImageData(0,0,1080,1920).data;assert.ok(image.some((n,i)=>i%4===3&&n>0));
});

test('portable renderer copies match; Jelly entry stays in the existing arena and portrait format is preserved',()=>{
 const canonical=readFileSync(new URL('../../shared/game-entry.js',import.meta.url),'utf8');for(const dir of ['Jelly-Battle-LIVE-9x16','Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE','Seguidor Arena'])assert.equal(readFileSync(new URL('../../'+dir+'/public/game-entry.js',import.meta.url),'utf8'),canonical);
 const css=readFileSync(new URL('../../Jelly-Battle-LIVE-9x16/public/style.css',import.meta.url),'utf8');assert.ok(css.includes('aspect-ratio:9/16'));assert.ok(css.includes('.studio-mode .ocean{flex:1 1 auto;min-height:0;height:auto'));
 const js=readFileSync(new URL('../../Jelly-Battle-LIVE-9x16/public/entry.js',import.meta.url),'utf8');assert.ok(js.includes('overlay.prepend(canvas)'));assert.ok(!js.includes('append(overlay)'));assert.ok(js.includes('ocean.clientHeight'));
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.ok(html.indexOf('id="arena"')<html.indexOf('id="panel"'));assert.ok(html.includes('Link / Navegador'));
});
