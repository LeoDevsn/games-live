import {FIGMA_LAYOUT} from './figma-layout.js';
export const HUD_ASSETS=FIGMA_LAYOUT.assets;
const P=FIGMA_LAYOUT.placements,W=941,H=1672;
const colors={R:'#ff2545',S:'#00aaff',neutral:'#394b50'},gold='#bb8c42';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function text(c,value,x,y,size,color='#ffffff',weight=700,align='center',width=1000){c.font=`${weight} ${size}px Inter,Segoe UI,Arial,sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(String(value),x,y,width);}
function box(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function gradient(c,y,h,top,bottom){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,top);g.addColorStop(1,bottom);return g;}
function start(c){c.save();c.clearRect(0,0,c.canvas.width,c.canvas.height);c.scale(c.canvas.width/W,c.canvas.height/H);}
function image(c,assets,key,padding=0,topPadding=padding){const p=P[key],img=assets[key];if(img)c.drawImage(img,p.x-padding,p.y-topPadding,img.width,img.height);}
function arc(c,x,y,r,start,end,color,width){c.beginPath();c.arc(x,y,r,start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
export function markerState(p){return p.contested?'contested':Math.abs(p.progress)>=200&&p.owner?'owned':p.progress!==0||p.owner?'capturing':'neutral';}
export function pointView(point,frame){
 const present=new Set(frame.units.filter(u=>u.lane===point.lane&&Math.abs(u.pos-(frame.profile.center??frame.profile.path/2))<=(frame.profile.zoneHalf??1000)).map(u=>u.faction));
 const captureTeam=present.size===1?[...present][0]:null;
 const captureRatio=captureTeam?(point.owner&&point.owner!==captureTeam?(captureTeam==='R'?point.progress+200:200-point.progress)/400:Math.max(0,point.progress*(captureTeam==='R'?1:-1))/200):Math.abs(point.progress)/200;
 return {...point,captureTeam,captureRatio:clamp(captureRatio,0,1)};
}
export function drawObjective(c,x,y,p,letter,time=0,asset=null){
 if(asset)c.drawImage(asset,x-38,y-38,76,76);
 else{c.fillStyle='#060f15';c.beginPath();c.arc(x,y,38,0,Math.PI*2);c.fill();arc(c,x,y,37.5,0,Math.PI*2,gold,1);arc(c,x,y,34.5,0,Math.PI*2,'#17303c',1);}
 const state=markerState(p),color=p.owner?colors[p.owner]:colors.neutral;
 c.fillStyle=color;c.beginPath();c.arc(x,y,30,0,Math.PI*2);c.fill();arc(c,x,y,30.5,0,Math.PI*2,'#142a35',1);
 // A dark track is always present; completed capture fills the center as in the reference.
 arc(c,x,y,34.5,0,Math.PI*2,p.owner?colors[p.owner]:'#1d3d4e',2);
 if(state==='capturing')arc(c,x,y,34.5,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(p.captureRatio??Math.abs(p.progress)/200,0,1),colors[p.captureTeam||(p.progress>0?'R':'S')],3);
 if(state==='contested'){
  c.save();c.beginPath();c.arc(x,y,30,0,Math.PI*2);c.clip();c.fillStyle=colors.S;c.fillRect(x-30,y-30,30,60);c.fillStyle=colors.R;c.fillRect(x,y-30,30,60);c.restore();
  arc(c,x,y,34.5,-Math.PI/2,Math.PI/2,colors.R,3);arc(c,x,y,34.5,Math.PI/2,Math.PI*1.5,colors.S,3);
 }
 text(c,letter,x,y+1,22,'#ffffff');
}
export function drawMapObjectives(c,frame,assets,time=0){start(c);frame.points.forEach((p,i)=>{const key='point-'+['A','B','C'][i],slot=P[key];drawObjective(c,slot.x+38,slot.y+38,pointView(p,frame),['A','B','C'][i],time,assets[key]);});c.restore();}
function status(p){if(p.contested)return ['Em','contestação'];if(p.owner==='R')return ['Equipe','Rubra'];if(p.owner==='S')return ['Equipe','Safira'];if(p.progress)return ['Capturando',p.progress>0?'Rubra':'Safira'];return ['Neutro'];}
export function drawFigmaHud(c,frame,assets,time=0){
 start(c);image(c,assets,'title',8,8);image(c,assets,'clock',8,8);
 const clock=P.clock,phase=frame.waitingForFirstJoin?'AGUARDANDO':frame.phase==='combat'?'COMBATE':frame.phase==='preparation'?'PREPARAÇÃO':frame.phase==='done'?'ENCERRADO':'RESULTADO';
 // Only the data-bearing parts of exported templates are repainted. Decorative art,
 // gilded frames, faction names and gemstone images remain the supplied local assets.
 c.fillStyle=gradient(c,clock.y,clock.height,'#0e1f29','#04090d');c.fillRect(clock.x+10,clock.y+10,138,75);
 const remaining=frame.phase==='combat'?Math.max(0,300000-frame.combatMs):frame.phase==='preparation'?Math.max(0,25000-frame.phaseMs):Math.max(0,15000-frame.phaseMs);
 text(c,phase,clock.x+79,clock.y+24,phase.length>10?10:12,'#e8eef1',500, 'center',138);text(c,frame.waitingForFirstJoin?'—':Math.ceil(remaining/1000)+'s',clock.x+79,clock.y+61,34,'#ffe296',750);
 for(const faction of ['S','R']){
  const key='credits-'+faction,p=P[key],team=frame.teams[faction];image(c,assets,key);
  c.fillStyle=gradient(c,p.y,111,...(faction==='S'?['#0b2b4a','#050b13']:['#5c060e','#130306']));c.fillRect(p.x+37,p.y+51,74,32);text(c,`${team.credits}/20`,p.x+74,p.y+68,25,'#ffffff',750,'center',70);
  const barColor=faction==='S'?'#1a8cdb':'#ff3048';box(c,p.x+15,p.y+92,89*clamp(team.credits/20,0,1),5,2,barColor);
  const lifeKey='nexus-'+faction,life=P[lifeKey];image(c,assets,lifeKey);
  const x=life.x+16.1075,y=life.y+41.2317,w=182.785,h=16.829;
  box(c,x,y,w,h,3,faction==='S'?'#031327':'#1d0509','#b68c49');const health=clamp(frame.nexus[faction].hp/2000,0,1);if(health>0)box(c,x+2,y+2,(w-4)*health,h-4,2,gradient(c,y,h,faction==='S'?'#1ad3ff':'#ff5264',faction==='S'?'#0083ff':'#d90e30'));
 }
 image(c,assets,'objectives');const panel=P.objectives;
 frame.points.forEach((p,i)=>{const top=panel.y+55+i*180;
  c.fillStyle='#061117';c.fillRect(panel.x+9,top+1,107,166);
  const x=panel.x+62.5,y=top+53;drawObjective(c,x,y,pointView(p,frame),['A','B','C'][i],time);
  const lines=status(p);lines.forEach((line,j)=>text(c,line,x,top+112+j*15,12,'#fff5df',600));
 });
 // Operational telemetry belongs in the operator panel, leaving the composition intact.
 c.restore();
}
