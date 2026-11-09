import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,Image} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRenderer} from '../public/render.js';
import {createEngine} from '../src/engine.mjs';
import {BASE_BOUNDS,boundsForArea} from '../src/arena.mjs';

test('LIVE shows winner photo, rewards and countdown only after the real round ends',async()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.Image=Image;
 const seed=createEngine();for(const [id,name]of [['winner','Luna'],['other','Rafa']]){seed.apply({kind:'follow',id,name});seed.apply({kind:'like',id,count:1});}seed.tick(35000);
 const saved=seed.exportState();saved.players.find(([id])=>id==='other')[1].hp=2;
 const game=createEngine(seed.settings,saved),canvas=createCanvas(1080,1920),c=canvas.getContext('2d'),drawn=[];
 const fill=c.fillText.bind(c);c.fillText=(value,...args)=>{drawn.push(String(value));return fill(value,...args);};
 const renderer=createRenderer(canvas,{publicView:true});
 renderer.accept({mode:'live',paused:false,game:game.snapshot(),latest:''},0);renderer.draw(1);
 assert.ok(!drawn.includes('VENCEDOR DA RODADA'),'winner announcement must not cover combat');
 game.hit('winner','other');const state=game.snapshot();assert.equal(state.phase,'intermission');assert.equal(state.winner.id,'winner');
 const photo=createCanvas(48,48),pc=photo.getContext('2d');pc.fillStyle='#ff0000';pc.fillRect(0,0,48,48);state.players.find(p=>p.id==='winner').avatar=photo.toDataURL();
 drawn.length=0;renderer.accept({mode:'live',paused:false,game:state,latest:''},0);renderer.draw(2);await new Promise(r=>setImmediate(r));renderer.draw(3);
 assert.ok(drawn.includes('VENCEDOR DA RODADA'));assert.ok(drawn.includes('Luna'));
 assert.ok(drawn.some(v=>v.includes('VITÓRIA +50 XP')&&v.includes('PARTICIPAÇÃO +10 XP')));
 assert.ok(drawn.includes(`Próxima rodada em ${state.countdown}s`));
 assert.ok(drawn.includes('Dê um novo like para confirmar a próxima rodada.'));
 const pixel=c.getImageData(540,765,1,1).data;assert.ok(pixel[0]>240&&pixel[1]<15&&pixel[2]<15,'victory portrait must show the winner photo');
});
test('arena Canvas renderiza participantes, vida, habilidades, rastros e resultado sem DOM externo',()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas),game=createEngine();
 for(let i=0;i<36;i++){const id='preview-'+i,name=['Luna','Rafa','Bia','Caio','Duda','Leo'][i%6]+' '+i;game.apply({kind:'follow',id,name});game.apply({kind:'like',id,name,count:1});if(i%5===0)game.activateAbility(id,'heal');if(i%7===0)game.activateAbility(id,'damage');if(i%4===0)game.apply({kind:'gift',id,giftId:'unmapped'});}
 game.tick(35000);for(let i=0;i<10;i++){game.tick(100);renderer.accept({mode:'simulation',paused:false,game:game.snapshot(),latest:'Prévia com participantes sintéticos'},i*100);renderer.draw(i*100+50);}
 const data=canvas.getContext('2d').getImageData(0,0,1080,1920).data;assert.equal(data.length,1080*1920*4);assert.ok(data.some((n,i)=>i%4===0&&n>100));mkdirSync('evidence',{recursive:true});writeFileSync('evidence/arena-preview.png',canvas.toBuffer('image/png'));
});
test('imagem decodificada aparece dentro do avatar, em vez das iniciais',async()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.Image=Image;
 const image=createCanvas(48,48),c=image.getContext('2d');c.fillStyle='#ff0000';c.fillRect(0,0,48,48);
 const game=createEngine();game.apply({kind:'follow',id:'image-user',name:'Foto'});game.apply({kind:'like',id:'image-user',count:1});
 // Running fixture hides the waiting overlay so the avatar's actual center can be inspected.
 const state=game.snapshot();state.phase='running';state.players[0].x=540;state.players[0].y=950;state.players[0].avatar=image.toDataURL('image/png');
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas);renderer.accept({mode:'simulation',paused:false,game:state,latest:''},0);renderer.draw(1);await new Promise(r=>setImmediate(r));renderer.draw(2);
 const pixel=canvas.getContext('2d').getImageData(540,950,1,1).data;assert.ok(pixel[0]>240&&pixel[1]<15&&pixel[2]<15,'center should contain decoded photo pixel');
});

test('visible wall uses the engine collision bounds and shades the space outside the reduced arena',()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};
 const space=createCanvas(1080,940),bg=space.getContext('2d');bg.fillStyle='#244466';bg.fillRect(0,0,1080,940);
 const game=createEngine().snapshot();Object.assign(game,{phase:'running',bounds:boundsForArea(.4),arena:{...game.arena,area:.4,target:.4,areaPercent:40,targetPercent:40,baseBounds:BASE_BOUNDS}});
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas,{backgroundImage:space});renderer.accept({mode:'simulation',paused:false,game,latest:''},0);renderer.draw(1);
 const c=canvas.getContext('2d'),outside=c.getImageData(60,860,1,1).data,inside=c.getImageData(540,860,1,1).data,wall=c.getImageData(Math.round(game.bounds.left),860,1,1).data;
 assert.ok(outside[2]<inside[2]*.6);assert.ok(wall[1]>inside[1]+30,'energy wall must be drawn at collision x');
 const corner=c.getImageData(Math.round(game.bounds.left+20),Math.round(game.bounds.top+20),1,1).data;
 assert.ok(corner[2]<inside[2]*.6,'corners of the bounding square are outside the circular field');
});

test('energy arcs animate outside the collision circle without moving the wall',()=>{
 globalThis.document={createElement:()=>createCanvas(1,1)};
 const game=createEngine().snapshot();game.phase='running';
 const canvas=createCanvas(1080,1920),renderer=createRenderer(canvas);renderer.accept({mode:'simulation',paused:true,game,latest:''},0);
 const c=canvas.getContext('2d'),b=game.bounds;
 renderer.draw(50);const first=c.getImageData(b.right+3,b.cy-30,28,60).data;
 renderer.draw(470);const second=c.getImageData(b.right+3,b.cy-30,28,60).data;
 assert.notDeepEqual(first,second);const wall=c.getImageData(b.right,b.cy,1,1).data;
 assert.ok(wall[1]>200&&wall[0]>90,'green energy barrier remains at the collision boundary');
});
