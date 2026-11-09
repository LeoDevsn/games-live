import {RULES} from '../rules/rules.js';
import {createApprovedSheets,UNIT_VISUAL,IDLE_FRAME} from './approved-sprites.js';
import {LANES,unitPosition,objectiveState,number} from './arena-layout.js';
import {NEXUS,SCALE_X,SCALE_Y,OBJECTIVES} from './arena-navigation.js';
import {FIGMA_LAYOUT} from './figma-layout.js';
import {HUD_ASSETS,drawFigmaHud,drawMapObjectives} from './figma-hud.js';
import {drawFactionEntry,entryView} from './faction-entry.js';
const P=globalThis.Phaser;
const COLORS={R:0xff334d,S:0x1cbaff,neutral:0xc5b378};
const INK='#e9eddc',NAVY=0x172d3c,GOLD=0xe8c47d;

const names={R:'ALIANÇA RUBRA',S:'COALIZÃO SAFIRA'};
const classes={G:'Guerreiro',D:'Defensor',A:'Arqueiro',C:'Cerco'};
const stance={balanced:'Equilibrada',offensive:'Ofensiva',defensive:'Defensiva'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));


const label=(scene,x,y,text,size=20,color=INK,origin=.5)=>scene.add.text(x,y,text,{fontFamily:'Arial, sans-serif',fontSize:size,color,fontStyle:'bold',align:'center'}).setOrigin(origin,.5);
function setText(object,value){if(object.text!==String(value))object.setText(String(value));}

export class ArenaScene extends P.Scene{
 constructor(onSelect){super({key:'Arena'});this.onSelect=onSelect;this.units=new Map();this.fx=new Set();this.processed=new Set();this.latest=null;this.assetFailures=[];this.stats={frames:0,framesReceived:0,interpolatedFrames:0,damageEffects:0,abilityEffects:0,birthEffects:0,deathEffects:0,droppedCosmetics:0,abilities:{},animationFrames:{walk:[],attack:[],hurt:[],death:[]}};}
 preload(){
  this.load.image('plaza','/src/ui/assets/figma/background.png');
  for(const key of HUD_ASSETS)this.load.image('figma-'+key,'/src/ui/assets/figma/'+key+'.png');
  this.load.image('approved-troops','/src/ui/assets/troops-approved-v1.png');
  for(const faction of ['R','S'])for(const action of ['walk','attack'])this.load.image(`${action}-${faction}`,`/src/ui/assets/${action}-${faction}-v2.png`);
  for(const f of ['R','S'])for(const k of ['G','D','A','C'])this.load.spritesheet(`${f}-${k}`,`/src/ui/assets/troops/${f}-${k}.png`,{frameWidth:128,frameHeight:128});
  this.load.on('loaderror',file=>{this.assetFailures.push(file.key);document.dispatchEvent(new CustomEvent('arena-error',{detail:`Falha ao carregar arte local: ${file.key}`}));});
 }
 create(){
  if(this.assetFailures.length)throw Error('Arte local indisponível: '+this.assetFailures.join(', '));
  for(const f of ['R','S'])for(const k of ['G','D','A','C'])if(!this.textures.exists(`${f}-${k}`)||this.textures.get(`${f}-${k}`).frameTotal!==33)throw Error('Sprite sheet inválido: '+f+'-'+k);
  // Rasterize SVG once. CanvasRenderer must not repaint the vector trees for every sprite/frame.
  for(const key of ['plaza',...['R','S'].flatMap(f=>['G','D','A','C'].map(k=>`${f}-${k}`))]){
   const image=this.textures.get(key).getSourceImage(),canvas=document.createElement('canvas');
   canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;
   canvas.getContext('2d').drawImage(image,0,0);this.textures.remove(key);
   if(key==='plaza')this.textures.addCanvas(key,canvas);else this.textures.addSpriteSheet(key,canvas,{frameWidth:128,frameHeight:128});
  }
  createApprovedSheets(this);
  this.add.image(540,960,'plaza').setDisplaySize(1080,1920);this.cameras.main.setBackgroundColor('#0c1e27');
  for(const f of ['R','S'])for(const k of ['G','D','A','C'])for(const [face,index] of [['up',0],['down',1]])for(const [action,row] of [['walk',0],['attack',2],['hurt',4],['death',6]]){
   this.anims.create({key:`${f}-${k}-${face}-${action}`,frames:this.anims.generateFrameNumbers(`${f}-${k}`,{start:(row+index)*4,end:(row+index)*4+3}),frameRate:action==='walk'?8:action==='death'?8:12,repeat:action==='walk'?-1:0});
  }
  this.createHud();this.createSectors();this.createResults();this.ready=true;
  document.dispatchEvent(new CustomEvent('arena-ready'));
  if(this.pending)this.applyFrame(this.pending);
  this.input.on('gameout',()=>{for(const r of this.units.values())r.hover.setVisible(false);});
 }
 createHud(){
  this.hudAssets=Object.fromEntries(HUD_ASSETS.map(key=>[key,this.textures.get('figma-'+key).getSourceImage()]));
  this.hudSurface=this.textures.createCanvas('fw-runtime-hud',1080,1920);
  if(!this.hudSurface)throw Error('Não foi possível criar a textura dinâmica do HUD.');
  this.add.image(540,960,'fw-runtime-hud').setDepth(9000);
  this.nexusHud={};
  for(const faction of ['R','S']){
   const p=NEXUS[faction],glow=this.add.ellipse(p.x,p.y,150*SCALE_X,55*SCALE_Y,COLORS[faction],.1).setDepth(4);
   this.nexusHud[faction]={bar:{width:182.785*SCALE_X},glow};
  }
 }
 createSectors(){
  this.objectiveSurface=this.textures.createCanvas('fw-runtime-objectives',1080,1920);
  if(!this.objectiveSurface)throw Error('Não foi possível criar a textura dinâmica dos marcadores.');
  this.add.image(540,960,'fw-runtime-objectives').setDepth(3);
  this.sectors=OBJECTIVES.map((p,i)=>({x:p.x,y:p.y,state:null,owner:{text:''},actual:{text:''}}));
 }
 createResults(){
  this.entrySurface=this.textures.createCanvas('fw-runtime-faction-entry',1080,1920);
  if(!this.entrySurface)throw Error('Faction entry canvas unavailable');
  this.entryImage=this.add.image(540,960,'fw-runtime-faction-entry').setDepth(20010).setVisible(false);
  this.entryPortraits=Object.fromEntries(['R','S'].map(f=>[f,this.textures.get(f+'-D')?.getSourceImage()]));
  this.overlay=this.add.container(0,0).setDepth(20000).setVisible(false);
  this.overlay.add(this.add.rectangle(540,995,1080,1720,0x102432,.79));
  this.overlay.add(this.add.rectangle(540,950,836,690,0x193543,.97).setStrokeStyle(3,0xb9a472,.85));
  this.overlay.add(this.add.rectangle(540,622,400,4,GOLD));
  this.overlayTag=label(this,540,680,'A ARENA ESTÁ SE FORMANDO',20,'#c8caaa');
  this.overlayTitle=label(this,540,777,'PREPARAÇÃO',40,'#f3e1b8');
  this.overlayCount=label(this,540,895,'25',110,'#f4e8cc');
  this.overlayInfo=label(this,540,1015,'Escolha sua facção / Choose your faction',22,'#ceded5');
  this.overlayNote=label(this,540,1213,'Entrada local  •  identidades fictícias',18,'#8eb3b7');
  this.overlay.add([this.overlayTag,this.overlayTitle,this.overlayCount,this.overlayInfo,this.overlayNote]);
  this.resultCards=[];
  for(let i=0;i<3;i++){
   const x=265+i*275;
   const box=this.add.rectangle(x,1090,248,150,0x264651).setStrokeStyle(1,0x8f9c86,.5);
   const title=label(this,x,1048,['GUERREIRO','DEFENSOR','ARQUEIRO'][i],16,'#efdeb4');
   const data=label(this,x,1101,'',17,'#ccded5');
   this.resultCards.push({box,title,data});this.overlay.add([box,title,data]);
  }
 }
 accept(frame){if(!this.ready){this.pending=frame;return;}this.applyFrame(frame);}
 applyFrame(frame){
  const now=performance.now(),previous=this.latest;
  if(previous?.id!==frame.id){for(const rec of this.units.values())rec.container.destroy();this.units.clear();for(const obj of this.fx)obj.destroy();this.fx.clear();this.processed.clear();}
  this.latest=frame;this.stats.framesReceived++;
  const live=new Set(frame.units.map(u=>u.id));
  for(const [id,rec] of this.units)if(!live.has(id))this.removeUnit(rec);
  for(const unit of frame.units){let rec=this.units.get(unit.id);if(!rec)rec=this.createUnit(unit,frame,!!previous&&previous.id===frame.id);const target=unitPosition(unit,frame.profile),targetY=target.y;
   rec.fromX=rec.container.x;rec.toX=target.x;rec.fromY=rec.container.y;rec.toY=targetY;rec.receivedAt=now;rec.duration=frame.paused?0:50;rec.moving=Math.hypot(target.x-rec.fromX,targetY-rec.fromY)>.25;rec.fromPos=rec.renderPos??rec.data.pos;rec.toPos=unit.pos;
   if(Math.abs(targetY-rec.fromY)>1)rec.face=targetY<rec.fromY?'up':'down';
   rec.data=unit;rec.maxHp=unit.champion?Math.ceil(RULES.units[unit.kind].hp*1.15):RULES.units[unit.kind].hp;
   rec.health.width=60*clamp(unit.hp/rec.maxHp,0,1);rec.shield.setVisible(unit.walls.some(w=>w.end>frame.combatMs));
   const selected=unit.id===this.selected;rec.hover.setVisible(selected||rec.hovered);
   const t=frame.teams[unit.faction];rec.flame.setVisible(t.buffs.flame>frame.combatMs);rec.speech.setVisible(t.buffs.speech>frame.combatMs);
   if(unit.champion){setText(rec.name,(frame.people[unit.actorId]?.name||'Campeão genérico').slice(0,14));setText(rec.cooldown,unit.cd>frame.combatMs?`${Math.ceil((unit.cd-frame.combatMs)/1000)}s`:'●');rec.cooldown.setColor(unit.cd>frame.combatMs?'#6b593b':'#387568');}
  }
  for(const e of frame.effects){if(this.processed.has(e.id))continue;this.processed.add(e.id);this.playEffect(e);}
  while(this.processed.size>2000)this.processed.delete(this.processed.values().next().value);
  this.updateHud(frame);
 }
 createUnit(u,frame,animate){
  const h=number(u.id),{x,y}=unitPosition(u,frame.profile);
  const container=this.add.container(x,y).setDepth(y+100);
  const shadow=this.add.ellipse(0,0,u.kind==='C'?64:44,17,0x142c37,.21);
  const champion=this.add.ellipse(0,-1,62,24,GOLD,.12).setStrokeStyle(3,GOLD,.9).setVisible(u.champion);
  const hover=this.add.ellipse(0,-3,80,30,0xffffff,.1).setStrokeStyle(3,0xf9edc8,.9).setVisible(false);
  const speech=this.add.ellipse(0,-3,65,24,0xade0cb,.13).setStrokeStyle(2,0xaee8d2,.6).setVisible(false);
  const flame=this.add.ellipse(0,-15,66,85,0xf7af53,.2).setStrokeStyle(2,0xe8b75e,.65).setVisible(false);
  const face=u.faction==='R'?'up':'down';
  const size=u.champion?UNIT_VISUAL.champion:UNIT_VISUAL.normal;
  const sprite=this.add.sprite(0,0,`${u.faction}-${u.kind}`,IDLE_FRAME[face]).setOrigin(.5,.85).setDisplaySize(size,size);
  const shield=this.add.sprite(0,0,`${u.faction}-${u.kind}-protection`,IDLE_FRAME[face]).setOrigin(.5,.85).setDisplaySize(size,size).setVisible(false);
  const hpBg=this.add.rectangle(-30,-89,60,5,0x233e46).setOrigin(0,.5);
  const health=this.add.rectangle(-30,-89,60,5,COLORS[u.faction]).setOrigin(0,.5);
  container.add([shadow,speech,flame,champion,hover,sprite,shield,hpBg,health]);
  let name=null,cooldown=null;
  if(u.champion){const star=this.add.star(0,-132,5,6,15,GOLD).setStrokeStyle(2,0x5d4721);const mantle=this.add.triangle(0,-30,-28,-12,28,-12,0,35,0x9a6c27,.85).setStrokeStyle(2,GOLD);container.addAt(mantle,4);name=label(this,0,-151,'',17,'#283e45');name.setBackgroundColor('#f5e1ad').setPadding(5,3);cooldown=label(this,0,-66,'●',14,'#6b593b');container.add([star,name,cooldown]);}
  sprite.on('animationupdate',(animation,frame)=>{const action=animation.key.split('-').at(-1),seen=this.stats.animationFrames[action];if(seen&&!seen.includes(frame.index))seen.push(frame.index);});
  sprite.setInteractive(new P.Geom.Rectangle(24,16,82,102),P.Geom.Rectangle.Contains);
  const rec={id:u.id,container,sprite,shadow,health,hover,shield,flame,speech,name,cooldown,face,data:u,fromX:x,toX:x,fromY:y,toY:y,receivedAt:performance.now(),duration:0,attackUntil:0,hurtUntil:0,phase:h%100,fromPos:u.pos,toPos:u.pos,renderPos:u.pos};
  sprite.on('pointerover',()=>{rec.hovered=true;hover.setVisible(true);this.game.canvas.style.cursor='pointer';});
  sprite.on('pointerout',()=>{rec.hovered=false;hover.setVisible(this.selected===u.id);this.game.canvas.style.cursor='default';});
  sprite.on('pointerdown',()=>{this.selected=u.id;this.onSelect?.(u.id);for(const r of this.units.values())r.hover.setVisible(r.id===u.id);});
  this.units.set(u.id,rec);
  if(animate){this.stats.birthEffects++;sprite.setAlpha(0);this.tweens.add({targets:sprite,alpha:1,duration:220});this.ripple(x,y,COLORS[u.faction],46,350);}
  return rec;
 }
 removeUnit(rec){
  this.units.delete(rec.id);this.stats.deathEffects++;
  if(!this.reserveFx(rec.container)){rec.container.destroy();return;}
  rec.health.setVisible(false);rec.hover.setVisible(false);rec.shield.setVisible(false);rec.flame.setVisible(false);rec.speech.setVisible(false);
  rec.sprite.play(`${rec.data.faction}-${rec.data.kind}-${rec.face}-death`);this.tweens.add({targets:rec.container,alpha:0,delay:260,duration:280,onComplete:()=>this.releaseFx(rec.container)});
 }
 reserveFx(object){if(this.fx.size>=240){this.stats.droppedCosmetics++;return false;}this.fx.add(object);return true;}
 releaseFx(object){this.fx.delete(object);object.destroy();}
 ripple(x,y,color,radius=60,duration=400){const circle=this.add.ellipse(x,y,18,10).setStrokeStyle(3,color,.85).setDepth(6000);if(!this.reserveFx(circle)){circle.destroy();return;}this.tweens.add({targets:circle,displayWidth:radius*2,displayHeight:radius,alpha:0,duration,onComplete:()=>this.releaseFx(circle)});}
 floatText(x,y,value,color='#fff1c8',size=25){const t=label(this,x,y,value,size,color).setStroke('#203d46',4).setDepth(8000);if(!this.reserveFx(t)){t.destroy();return;}this.tweens.add({targets:t,y:y-48,alpha:0,duration:650,ease:'Cubic.easeOut',onComplete:()=>this.releaseFx(t)});}
 position(id){const rec=this.units.get(id);if(rec)return {x:rec.container.x,y:rec.container.y-33};if(id==='nexus-R')return {...NEXUS.R};if(id==='nexus-S')return {...NEXUS.S};return null;}
 projectile(source,target,kind,color){
  const p=kind==='C'?this.add.rectangle(source.x,source.y,17,24,0xf0dfa9).setStrokeStyle(2,0x586d6e):this.add.rectangle(source.x,source.y,5,29,color);
  p.setRotation(P.Math.Angle.Between(source.x,source.y,target.x,target.y)+Math.PI/2).setDepth(6500);
  if(!this.reserveFx(p)){p.destroy();return;}
  this.tweens.add({targets:p,x:target.x,y:target.y,duration:kind==='C'?165:105,ease:'Quad.easeOut',onComplete:()=>{this.ripple(target.x,target.y,color,28,180);this.releaseFx(p);}});
 }
 playEffect(e){
  const f=this.latest;
  if(e.type==='damage'){
   this.stats.damageEffects++;if(e.effective<=0)return;
   const rec=this.units.get(e.source),source=this.position(e.source),target=this.position(e.target);
   if(rec){if(target&&source)rec.face=target.y<source.y?'up':'down';rec.attackUntil=performance.now()+340;rec.sprite.play(`${rec.data.faction}-${rec.data.kind}-${rec.face}-attack`,true);}
   if(target){this.floatText(target.x,target.y-36,`−${e.effective}`,e.skill?'#ffe096':'#fff6dc',e.skill?32:24);
    if(source&&!rec)this.projectile(source,target,'N',COLORS[e.source==='nexus-R'?'R':'S']);else if(source&&rec&&['A','C'].includes(rec.data.kind))this.projectile(source,target,rec.data.kind,COLORS[rec.data.faction]);else this.ripple(target.x,target.y,e.skill?GOLD:0xffedb5,24,180);
    const hit=this.units.get(e.target);if(hit){this.stats.hurtEffects=(this.stats.hurtEffects??0)+1;hit.hurtUntil=performance.now()+220;hit.sprite.play(`${hit.data.faction}-${hit.data.kind}-${hit.face}-hurt`);hit.sprite.setTintFill(0xfff1d2);this.time.delayedCall(85,()=>{if(hit.sprite.active)hit.sprite.clearTint();});}
   }
  }else if(e.type==='ability'){
   this.stats.abilityEffects++;this.stats.abilities[e.ability]=(this.stats.abilities[e.ability]??0)+1;
   const p=this.position(e.unitId);if(p){this.ripple(p.x,p.y,e.ability==='Muralha'?UNIT_VISUAL.protectionColor:GOLD,e.ability==='Muralha'?130:85,480);this.floatText(p.x,p.y-70,e.ability,'#f5e5ac',22);}
  }else if(e.type==='collective'){
   const y=e.faction==='R'?1470:450;this.ripple(540,y,e.name==='flame'?0xffb55c:0xa9dfc6,180,680);this.floatText(540,y-22,e.name==='flame'?'CHAMA DA BATALHA':'DISCURSO INSPIRADOR','#f4e5b2',25);
  }else if(e.type==='purchase'){
   const p=this.position(e.unitId);if(p)this.floatText(p.x,p.y-60,'REFORÇO','#ccebd6',18);
  }
 }
 updateHud(f){
  drawFigmaHud(this.hudSurface.getContext(),f,this.hudAssets);
  this.hudSurface.refresh();
  for(const faction of ['R','S']){this.nexusHud[faction].bar.width=182.785*SCALE_X*f.nexus[faction].hp/2000;this.nexusHud[faction].glow.setVisible(f.nexus[faction].hp>0);}
  for(const [i,p] of f.points.entries()){
   const v=this.sectors[i];v.state=objectiveState(p);v.owner.text=v.state.status;v.actual.text=p.owner==='R'?'Rubra':p.owner==='S'?'Safira':'Neutro';
  }
  const prep=f.phase==='preparation',results=f.phase==='results'||f.phase==='done';this.overlay.setVisible(results);this.entryImage.setVisible(prep);
  for(const c of this.resultCards){c.box.setVisible(false);c.title.setVisible(false);c.data.setVisible(false);}
  if(prep)this.drawEntry(performance.now());
  else if(results){
   const screen=f.screen??{screen:0,faction:null},winner=f.result?.winner;
   setText(this.overlayTag,screen.screen===0?'RESULTADO CONFIRMADO':`REGISTROS DA FACÇÃO  •  ${screen.screen+1}/3`);
   setText(this.overlayTitle,screen.screen===0?(winner?`VITÓRIA ${winner==='R'?'RUBRA':'SAFIRA'}`:f.result?.reason==='annulled'?'PARTIDA ANULADA':'EMPATE'):names[screen.faction]);
   this.overlayCount.setFontSize(screen.screen===0?54:42);setText(this.overlayCount,screen.screen===0?(f.result?.reason==='nexus'?'NEXUS DESTRUÍDO':f.result?.reason==='technical-draw'?'EMPATE':'CONTROLE TERRITORIAL'):'CAMPEÕES');
   setText(this.overlayInfo,screen.screen===0?'Preparem-se para a próxima batalha':'Desempenho dos Campeões nesta partida');setText(this.overlayNote,`${Math.max(0,Math.ceil((15000-f.phaseMs)/1000))}s para a próxima preparação`);
   if(screen.screen>0)for(const [i,k] of ['G','D','A'].entries()){const c=this.resultCards[i],sum=f.champions[screen.faction]?.[k];c.box.setVisible(true);c.title.setVisible(true);c.data.setVisible(true);setText(c.data,sum?`${sum.kills} eliminações\n${sum.unitDamage} dano tropas\n${sum.nexusDamage} dano Nexus`:'Sem registro\nde Campeão');}
  }
 }
 drawEntry(time){
  if(this.latest?.phase!=='preparation')return;
  const key=JSON.stringify(entryView(this.latest));
  if(key===this.lastEntryKey&&this.lastEntryDraw!==undefined&&time-this.lastEntryDraw<65)return;
  this.entryState=drawFactionEntry(this.entrySurface.getContext(),this.latest,time,this.entryPortraits);
  this.entrySurface.refresh();this.lastEntryDraw=time;this.lastEntryKey=key;
 }
 drawObjectives(time){
  if(this.objectiveFrame===this.latest)return;
  drawMapObjectives(this.objectiveSurface.getContext(),this.latest,this.hudAssets,time);
  this.objectiveSurface.refresh();this.objectiveFrame=this.latest;
 }
 update(time,delta){
  if(!this.latest)return;const now=performance.now(),f=this.latest;let interpolated=false;this.stats.frames++;
  for(const rec of this.units.values()){
   const a=rec.duration?clamp((now-rec.receivedAt)/rec.duration,0,1):1;
   if(a>0&&a<1&&rec.moving)interpolated=true;
   rec.renderPos=rec.fromPos+(rec.toPos-rec.fromPos)*a;const position=unitPosition({...rec.data,pos:rec.renderPos},f.profile);rec.container.x=position.x;rec.container.y=position.y;rec.container.setDepth(100+rec.container.y);
   rec.sprite.anims.timeScale=f.paused?0:Math.min(2,f.speed);
   if(now>=rec.attackUntil&&now>=rec.hurtUntil){const walk=rec.moving&&!f.paused;if(walk){const key=`${rec.data.faction}-${rec.data.kind}-${rec.face}-walk`;if(rec.sprite.anims.currentAnim?.key!==key||!rec.sprite.anims.isPlaying)rec.sprite.play(key);}else{rec.sprite.anims.stop();rec.sprite.setFrame(IDLE_FRAME[rec.face]);}}
   rec.shield.setFrame(rec.sprite.frame.name);
   rec.sprite.y=0;
   rec.flame.setAlpha(.6+Math.sin(time*.008+rec.phase)*.16);rec.speech.setAlpha(.6+Math.sin(time*.004+rec.phase)*.12);
  }
  this.drawObjectives(time);this.drawEntry(now);
  for(const v of Object.values(this.nexusHud))v.glow.setAlpha(.5+Math.sin(time*.004)*.18);
  if(interpolated)this.stats.interpolatedFrames++;
  globalThis.__fps=Math.round(this.game.loop.actualFps||0);globalThis.__renderedTick=f.tick;
  globalThis.__FW_RENDER__={engine:'Phaser',version:P.VERSION,ready:true,assetsReady:this.assetFailures.length===0,canvasWidth:1080,canvasHeight:1920,art:'Figma final layout with directional sprite sheets',layout:'figma-2026-11-02',colliders:FIGMA_LAYOUT.colliders.length,objectiveCenters:OBJECTIVES,nexusPositions:NEXUS,spriteSize:UNIT_VISUAL.normal,protectionColor:UNIT_VISUAL.protectionColor,siegeWaveMs:f.profile.siegeWaveMs??20000,objectiveStates:this.sectors.map(v=>v.state),nexusLabels:['ALIANÇA RUBRA','COALIZÃO SAFIRA'],nexusBars:Object.fromEntries(Object.entries(this.nexusHud).map(([f,v])=>[f,v.bar.width])),objectiveSidebar:this.sectors.map(v=>({state:v.owner.text,owner:v.actual.text})),units:this.units.size,activeFx:this.fx.size,phase:f.phase,paused:f.paused,...this.stats};
 }
}
export function createArena(onSelect){
 const scene=new ArenaScene(onSelect);
 const game=new P.Game({type:P.CANVAS,parent:'arena',width:1080,height:1920,backgroundColor:'#cbd0af',scene:[scene],antialias:true,roundPixels:false,transparent:false,scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH},fps:{target:60,forceSetTimeOut:false},banner:false,audio:{noAudio:true},render:{clearBeforeRender:true}});
 return {game,accept:frame=>scene.accept(frame),get scene(){return scene;}};
}
