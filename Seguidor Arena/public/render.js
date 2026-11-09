let PLANKTON_TITLE='ARENA ROYALE DO PLANKTON',drawLabHost=()=>{},drawWater=()=>{};
export const themeReady=import('./plankton-theme.js').then(theme=>{PLANKTON_TITLE=theme.PLANKTON_TITLE;drawLabHost=theme.drawLabHost;drawWater=theme.drawWater;}).catch(()=>{});
import {drawBroadcast} from './broadcast-render.js';
import {drawGameEntry,entryModel} from './game-entry.js';
const colors=['#b7ee83','#89d9ff','#ffb387','#cfadff','#ffe591','#7ee4d5','#f696b9'];
const text=(c,t,x,y,size=28,color='#ecf4ff',align='center',weight=650)=>{c.font=`${weight} ${size}px Segoe UI,system-ui,sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(String(t),x,y);};
const rect=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
const hash=id=>{let h=0;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;return h;};
function drawVictory(c,g,time,avatar){
 const winner=g.winner,ranking=g.ranking.find(r=>r.id===winner?.id),x=110,y=470,w=860,h=800;
 c.save();c.fillStyle='#02171dbd';c.fillRect(28,420,1024,880);c.shadowColor='#06101b';c.shadowBlur=38;
 const panel=c.createLinearGradient(x,y,x+w,y+h);panel.addColorStop(0,'#16494c');panel.addColorStop(1,'#071d29');rect(c,x,y,w,h,30,panel,'#f3cd7d');c.shadowBlur=0;
 c.save();c.beginPath();c.roundRect(x+7,y+7,w-14,h-14,25);c.clip();
 for(let i=0;i<42;i++){const progress=(time*.00015+i*.137)%1,px=x+25+(i*157)%(w-50),py=y+progress*h;c.globalAlpha=.3*(1-progress);c.fillStyle=i%2?'#ffda87':'#b8f081';c.save();c.translate(px,py);c.rotate(time*.001+i);c.fillRect(-3,-6,6,12);c.restore();}c.restore();
 text(c,winner?'VENCEDOR DA RODADA':'RODADA ENCERRADA',540,535,40,'#ffe4a0','center',850);text(c,winner?'O ÚLTIMO ALIADO EM PÉ!':'Preparem-se para a próxima batalha',540,582,22,'#b9e49f');
 const glow=c.createRadialGradient(540,765,60,540,765,220);glow.addColorStop(0,'#f8ce794d');glow.addColorStop(1,'#f8ce7900');c.fillStyle=glow;c.fillRect(310,605,460,320);
 const r=116,cy=765;c.save();c.beginPath();c.arc(540,cy,r,0,Math.PI*2);c.clip();const row=g.players.find(p=>p.id===winner?.id)||ranking,image=row?.avatar?avatar(row.avatar):null;
 if(image){const size=Math.min(image.width,image.height);c.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,540-r,cy-r,r*2,r*2);}else{c.fillStyle='#b9eb8d';c.fillRect(540-r,cy-r,r*2,r*2);text(c,winner?winner.name.slice(0,2).toUpperCase():'—',540,cy,70,'#173b37','center',850);}c.restore();
 c.strokeStyle='#ffe2a0';c.lineWidth=7;c.beginPath();c.arc(540,cy,r+5,0,Math.PI*2);c.stroke();c.strokeStyle='#b9ef6d66';c.lineWidth=2;c.beginPath();c.arc(540,cy,r+16,0,Math.PI*2);c.stroke();
 c.fillStyle='#ffd97e';c.beginPath();c.moveTo(495,656);c.lineTo(484,614);c.lineTo(520,637);c.lineTo(540,602);c.lineTo(560,637);c.lineTo(596,614);c.lineTo(585,656);c.closePath();c.fill();rect(c,495,663,90,10,3,'#ffe9a8');
 const name=winner?.name||'Sem vencedor nesta rodada';let size=48;c.font=`800 ${size}px Segoe UI,system-ui,sans-serif`;while(c.measureText(name).width>760&&size>22){size--;c.font=`800 ${size}px Segoe UI,system-ui,sans-serif`;}text(c,name,540,937,size,'#fff6de','center',800);
 const wins=ranking?.wins||1;text(c,winner?`${ranking?.rank||'Recruta'} · ${wins} vitória${wins===1?'':'s'}`:'NOVO DESAFIO EM INSTANTES',540,990,23,'#d7e6cb');
 if(winner)text(c,`VITÓRIA +${g.settings.victoryXp} XP · PARTICIPAÇÃO +${g.settings.participationXp} XP`,540,1036,23,'#ffe2a0');
 rect(c,235,1090,610,82,18,'#155041','#b9ef6d77');text(c,`Próxima rodada em ${g.countdown}s`,540,1133,31,'#e5ffd1','center',750);
 text(c,'Dê um novo like para confirmar a próxima rodada.',540,1220,22,'#c3e3d0');c.restore();
}
function drawLegacyBoundary(c,g,time){
 const b=g.bounds,base=g.arena?.baseBounds||b;if(!b||!g.arena)return;
 const closing=(g.arena?.area||1)>(g.arena?.target||1)+.0001,color=closing?'#ffc27c':'#88e8ee';
 c.save();c.beginPath();c.rect(base.left,base.top,base.right-base.left,base.bottom-base.top);c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.fillStyle='#030817b0';c.fill('evenodd');
 if(g.arena?.area<.999){c.setLineDash([5,12]);c.strokeStyle='#abc9ed28';c.lineWidth=1;c.strokeRect(base.left,base.top,base.right-base.left,base.bottom-base.top);c.setLineDash([]);}
 c.shadowColor=color;c.shadowBlur=closing?17:10;rect(c,b.left,b.top,b.right-b.left,b.bottom-b.top,10,'#11375212',color+'85');c.shadowBlur=0;
 c.lineWidth=4;c.strokeStyle=color;const size=25;
 for(const [x,y,sx,sy]of [[b.left,b.top,1,1],[b.right,b.top,-1,1],[b.left,b.bottom,1,-1],[b.right,b.bottom,-1,-1]]){c.beginPath();c.moveTo(x,y+size*sy);c.lineTo(x,y);c.lineTo(x+size*sx,y);c.stroke();}
 if(closing){c.globalAlpha=.4+.2*Math.sin(time*.005);c.setLineDash([9,15]);c.strokeStyle='#ffe1a9';c.lineWidth=1;c.strokeRect(b.left+5,b.top+5,b.right-b.left-10,b.bottom-b.top-10);}
 c.restore();
}
function perimeterPoint(b,offset){
 const hw=b.halfWidth??b.radius,hh=b.halfHeight??b.radius,r=b.cornerRadius??b.radius,arc=Math.PI*r/2,perimeter=4*(hw+hh-2*r)+Math.PI*2*r;
 let s=offset*perimeter,q=0,flat=0;for(;q<4;q++){flat=2*((q%2?hh:hw)-r);if(s<=flat+arc||q===3)break;s-=flat+arc;}
 let x,y,nx,ny;
 if(s<=flat||r<.001){
  if(q===0){x=-hw+r+s;y=-hh;nx=0;ny=-1;}
  else if(q===1){x=hw;y=-hh+r+s;nx=1;ny=0;}
  else if(q===2){x=hw-r-s;y=hh;nx=0;ny=1;}
  else{x=-hw;y=hh-r-s;nx=-1;ny=0;}
 }else{const a=-Math.PI/2+q*Math.PI/2+(s-flat)/r;nx=Math.cos(a);ny=Math.sin(a);x=(q<2?hw-r:-hw+r)+nx*r;y=(q===0||q===3?-hh+r:hh-r)+ny*r;}
 return {x:b.cx+x,y:b.cy+y,nx,ny};
}
function drawBoundary(c,g,time){
 if(!['circle','morph'].includes(g.arena?.shape))return drawLegacyBoundary(c,g,time);
 const b=g.bounds,{cx,cy,radius:r}=b,hw=b.halfWidth??r,hh=b.halfHeight??r,corner=b.cornerRadius??r,base=g.arena.baseBounds,closing=g.arena.area>g.arena.target+.0001;
 const path=()=>{c.beginPath();c.roundRect(b.left,b.top,hw*2,hh*2,corner);};
 c.save();c.beginPath();c.rect(base.left,base.top,base.right-base.left,base.bottom-base.top);c.roundRect(b.left,b.top,hw*2,hh*2,corner);c.fillStyle='#030817b8';c.fill('evenodd');
 path();for(const [width,color]of [[28,'#95ff4315'],[18,'#88ff4c35'],[10,'#51da56'],[4,'#b1ff6e'],[1.5,'#f0ffd2']]){c.lineWidth=width;c.strokeStyle=color;c.stroke();}
 const perimeter=4*(hw+hh-2*corner)+2*Math.PI*corner,count=Math.ceil(perimeter/16);
 for(let i=0;i<count;i+=2){
  const {x,y,nx,ny}=perimeterPoint(b,i/count),pulse=.5+.5*Math.sin(time*.007+i*2.399),length=4+pulse*(closing?20:11),tx=-ny,ty=nx;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+nx*length*.4+tx*3,y+ny*length*.4+ty*3);c.lineTo(x+nx*length*.7-tx*3,y+ny*length*.7-ty*3);c.lineTo(x+nx*length,y+ny*length);c.strokeStyle=i%4?'#cfff899a':'#72ffb5cf';c.lineWidth=1.4;c.stroke();
 }
 for(let i=0;i<36;i++){const progress=(time*.00035+i*.618)%1,{x,y,nx,ny}=perimeterPoint(b,(i*.618+time*.000015)%1),d=8+progress*38;c.globalAlpha=(1-progress)*.8;c.fillStyle=i%2?'#d4ffa0':'#68eaa0';c.beginPath();c.arc(x+nx*d,y+ny*d,1.2+(i%3)*.5,0,Math.PI*2);c.fill();}
 c.restore();
}
function constrainDisplay(p,g,radius){
 if(['circle','morph'].includes(g.arena?.shape)){const b=g.bounds,dx=p.x-b.cx,dy=p.y-b.cy,limitX=Math.max(0,(b.halfWidth??b.radius)-radius),limitY=Math.max(0,(b.halfHeight??b.radius)-radius),corner=Math.max(0,(b.cornerRadius??b.radius)-radius),innerX=limitX-corner,innerY=limitY-corner,qx=Math.max(Math.abs(dx)-innerX,0),qy=Math.max(Math.abs(dy)-innerY,0),d=Math.hypot(qx,qy);
  if(d>corner){p.x=b.cx+Math.sign(dx)*(Math.min(Math.abs(dx),innerX)+qx/d*corner);p.y=b.cy+Math.sign(dy)*(Math.min(Math.abs(dy),innerY)+qy/d*corner);}
 }else{p.x=Math.max(g.bounds.left+radius,Math.min(g.bounds.right-radius,p.x));p.y=Math.max(g.bounds.top+radius,Math.min(g.bounds.bottom-radius,p.y));}
}
function drawItems(c,g,now){
 const b=g.bounds;c.save();c.beginPath();c.roundRect(b.left,b.top,b.right-b.left,b.bottom-b.top,b.cornerRadius||0);c.clip();
 for(const item of g.items||[]){
  const fire=item.kind==='fire',color=fire?'#ff9d38':'#78e9ff',r=item.radius||18,pulse=1+Math.sin(now*.006+item.id)*.08;
  c.save();c.translate(item.x,item.y);c.scale(pulse,pulse);c.shadowColor=color;c.shadowBlur=17;
  c.beginPath();c.arc(0,0,r+4,0,Math.PI*2);c.fillStyle=fire?'#5e281bea':'#123c50ed';c.fill();c.lineWidth=2;c.strokeStyle=color;c.stroke();c.shadowBlur=0;
  if(fire){c.font='25px "Segoe UI Emoji","Apple Color Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffdb88';c.fillText('🔥',0,0);}
  else{c.beginPath();c.moveTo(0,-12);c.lineTo(10,-7);c.lineTo(8,5);c.quadraticCurveTo(5,10,0,13);c.quadraticCurveTo(-5,10,-8,5);c.lineTo(-10,-7);c.closePath();c.fillStyle='#b2f7ff';c.fill();c.strokeStyle='#ecffff';c.stroke();}
  c.restore();
 }
 for(const p of g.projectiles||[]){
  const dt=Math.max(0,now-g.now)/1000,x=p.x+p.vx*dt,y=p.y+p.vy*dt,length=Math.hypot(p.vx,p.vy),nx=p.vx/length,ny=p.vy/length;
  c.shadowColor='#ff8c22';c.shadowBlur=16;c.lineCap='round';c.lineWidth=9;c.strokeStyle='#ff6c2d';c.beginPath();c.moveTo(x-nx*24,y-ny*24);c.lineTo(x,y);c.stroke();c.shadowBlur=0;c.fillStyle='#fff2a4';c.beginPath();c.arc(x,y,p.radius||7,0,Math.PI*2);c.fill();
 }
 c.restore();
}
export function createRenderer(canvas,{backgroundImage=null,hostImage=null,publicView=false}={}){
 const ctx=canvas.getContext('2d'),background=document.createElement('canvas');background.width=1080;background.height=1920;const bg=background.getContext('2d');
 const gradient=bg.createLinearGradient(0,0,0,1920);gradient.addColorStop(0,'#0b393e');gradient.addColorStop(1,'#05272b');bg.fillStyle=gradient;bg.fillRect(0,0,1080,1920);
 const halo=bg.createRadialGradient(540,970,40,540,970,850);halo.addColorStop(0,'#253f5777');halo.addColorStop(1,'#14243d00');bg.fillStyle=halo;bg.fillRect(0,280,1080,1300);
 let space=backgroundImage,spaceReady=!!backgroundImage;if(!space&&typeof Image!=='undefined'){space=new Image();space.onload=()=>spaceReady=true;space.onerror=()=>{};space.src='/assets/plankton-lab-v1.png';}
 let host=hostImage,hostReady=!!hostImage;if(!host&&typeof Image!=='undefined'){host=new Image();host.onload=()=>hostReady=true;host.onerror=()=>{};host.src='/assets/plankton-reactions-v1.png';}
 let narrator={speaking:false,kind:null};
 const images=new Map(),positions=new Map(),trails=new Map();let view=null,receivedAt=0;
 function avatar(url){if(!url)return null;let entry=images.get(url);if(!entry||(entry.failed&&performance.now()-entry.at>60000)){const image=new Image();entry={image,ready:false,failed:false,at:performance.now()};image.onload=()=>entry.ready=true;image.onerror=()=>entry.failed=true;image.src=url;images.set(url,entry);if(images.size>500)images.delete(images.keys().next().value);}return entry.ready?entry.image:null;}
 function accept(next,time=performance.now()){
  const old=view?.game;view=next;receivedAt=time;
  if(old?.round!==next.game.round){positions.clear();trails.clear();}
  const ids=new Set(next.game.players.map(p=>p.id));for(const id of positions.keys())if(!ids.has(id)){positions.delete(id);trails.delete(id);}
  for(const p of next.game.players){const rec=positions.get(p.id)||{x:p.x,y:p.y};positions.set(p.id,{x:rec.x,y:rec.y,fromX:rec.x,fromY:rec.y,targetX:p.x,targetY:p.y});}
 }
 function draw(time=performance.now(),entryOptions={}){
  ctx.drawImage(background,0,0);if(!view)return;
  const g=view.game,rules=g.rules||view.rules||{regenMs:5000,damageMs:10000},now=g.now+(view.paused?0:Math.min(150,time-receivedAt)),a=Math.min(1,(time-receivedAt)/100);
  if(spaceReady){if(space.height>space.width*1.4)ctx.drawImage(space,0,0,1080,1920);else ctx.drawImage(space,0,380,1080,940);}
  // Morphing boundary, avatar radius and drawing share world coordinates.
  const point=p=>g.arena?({x:p.x,y:p.y}):({x:540+(p.x-540)*.86,y:400+(p.y-415)*.86});
  drawWater(ctx,now);
  drawBoundary(ctx,g,time);
  for(const p of g.players){const rec=positions.get(p.id);rec.x=rec.fromX+(rec.targetX-rec.fromX)*a;rec.y=rec.fromY+(rec.targetY-rec.fromY)*a;constrainDisplay(rec,g,p.radius);
   let list=trails.get(p.id)||[];if(p.boostUntil>now){const last=list[0];if(!last||Math.hypot(rec.x-last.x,rec.y-last.y)>2||now-last.at>35)list.unshift({x:rec.x,y:rec.y,at:now});}
   list=list.filter(q=>now-q.at<1350).slice(0,55);if(!list.length){trails.delete(p.id);continue;}trails.set(p.id,list);
   const pts=list.map(point),fresh=Math.max(0,1-(now-list[0].at)/1350),fire=p.trail==='fire',laser=p.trail==='laser';
   ctx.save();ctx.globalAlpha=.7*fresh;ctx.lineCap='round';ctx.lineJoin='round';
   if(laser||fire){ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.strokeStyle=fire?'#ff703b':'#bc7dff';ctx.lineWidth=fire?25:19;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=fire?26:32;ctx.stroke();ctx.shadowBlur=0;ctx.lineWidth=fire?9:5;ctx.strokeStyle=fire?'#ffeaa6':'#f3e4ff';ctx.stroke();
    if(fire)for(let i=0;i<pts.length;i+=5){const q=pts[i];ctx.globalAlpha=(1-i/pts.length)*.6*fresh;ctx.fillStyle=i%2?'#ffbe57':'#ff6031';ctx.beginPath();ctx.arc(q.x+Math.sin(now*.01+i)*9,q.y-5,6+(i%3)*2,0,Math.PI*2);ctx.fill();}
   }else{for(let i=pts.length-1;i>=0;i-=2){const q=pts[i];ctx.globalAlpha=(1-i/pts.length)*.27*fresh;ctx.fillStyle=i%2?'#b8c6e1':'#7a8da9';ctx.beginPath();ctx.arc(q.x+Math.sin(i+now*.002)*7,q.y,13+i*.38,0,Math.PI*2);ctx.fill();}}
   ctx.restore();
  }
  drawItems(ctx,g,now);
  for(const p of [...g.players].sort((a,b)=>a.y-b.y)){
   const rec=positions.get(p.id);constrainDisplay(rec,g,p.radius);const screen=point(rec),x=screen.x,y=screen.y,r=p.radius*(g.arena?1:.86),color=colors[hash(p.id)%colors.length];
   ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(x,y+r*.75,r*.95,r*.22,0,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.beginPath();ctx.arc(x,y,r-3,0,Math.PI*2);ctx.clip();const image=avatar(p.avatar);
   if(image){const size=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,x-r,y-r,r*2,r*2);}else{ctx.fillStyle=color;ctx.fillRect(x-r,y-r,r*2,r*2);text(ctx,p.name.slice(0,2).toUpperCase(),x,y,r*.7,'#17283a','center',800);}ctx.restore();
   ctx.strokeStyle='#172e44';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle=p.hp>15?'#b7ee83':'#ff8c7a';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*p.hp/g.initialHp);ctx.stroke();
   if(p.healUntil>now||p.damageUntil>now){ctx.strokeStyle=p.damageUntil>now?'#ffb16d':'#74e0af';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+7,0,Math.PI*2);ctx.stroke();text(ctx,p.damageUntil>now?'×2':'+',x+r*.8,y-r*.8,19,ctx.strokeStyle);}
   if(p.shieldUntil>now){ctx.save();ctx.fillStyle='#8aedff28';ctx.strokeStyle='#a3f3ff';ctx.lineWidth=3;ctx.shadowColor='#66e4ff';ctx.shadowBlur=17;ctx.beginPath();ctx.arc(x,y,r+11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;text(ctx,'ESCUDO '+Math.ceil((p.shieldUntil-now)/1000)+'s',x,y-r-22,16,'#c4faff');ctx.restore();}
   ctx.font='650 18px Segoe UI,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=5;ctx.strokeStyle='#07101f';const name=p.name.slice(0,17);ctx.strokeText(name,x,y+r+17);ctx.fillStyle='#edf3ff';ctx.fillText(name,x,y+r+17);
  }
  for(const e of g.effects){const age=now-e.at;if(age<0||age>900)continue;const fade=1-age/900;ctx.globalAlpha=fade;
   const screen=point(e);const fx=screen.x,fy=screen.y;
   if(e.kind==='hit'){ctx.strokeStyle='#ffb887';ctx.lineWidth=3;ctx.beginPath();ctx.arc(fx,fy,20+age*.045,0,Math.PI*2);ctx.stroke();text(ctx,'−'+e.damage,fx,fy-45-age*.05,26,'#ffcc9f');}
   if(e.kind==='ability'){text(ctx,e.ability==='heal'?'CURA 5s':'DANO ×2',fx,fy-65-age*.035,23,e.ability==='heal'?'#9aefbd':'#ffc185');}
   if(e.kind==='pickup'){text(ctx,e.item==='fire'?'FOGO · 8 DISPAROS':'PROTEÇÃO · 3s',fx,fy-65-age*.035,21,e.item==='fire'?'#ffcb82':'#a3f3ff');}
   if(e.kind==='blocked'){text(ctx,'PROTEGIDO',fx,fy-48-age*.035,18,'#c4faff');}
   ctx.globalAlpha=1;
  }
  if(view.paused&&!publicView){rect(ctx,350,670,380,65,16,'#523c28');text(ctx,'PAUSADO',540,704,30,'#ffdea9');}
  text(ctx,`${g.alive}/${g.totalParticipants} VIVOS · ${g.elapsed}s`,35,400,19,'#b6cfe6','left');
  text(ctx,`${g.deathMatch?.active?'DEATH MATCH · ':'ARENA '}${g.arena?.areaPercent??100}%${g.arena?.targetPercent<(g.arena?.areaPercent??100)?' → '+g.arena.targetPercent+'%':''}`,540,400,19,g.deathMatch?.active?'#ffcc81':'#a8e7e9');
  if(g.deathMatch?.active&&g.now-g.deathMatch.startedAt<6000){
   ctx.save();ctx.shadowColor='#ff8d3b';ctx.shadowBlur=22;rect(ctx,200,440,680,108,18,'#2e181df2','#ffc879');ctx.shadowBlur=0;text(ctx,'DEATH MATCH',540,477,39,'#ffce87','center',850);text(ctx,g.players.map(p=>p.name.slice(0,20)).join('  ×  '),540,520,23,'#fff1d6');ctx.restore();
  }
  text(ctx,`${g.initialHp} HP · CURA ${rules.regenMs/1000}s · DANO ×2 ${rules.damageMs/1000}s`,1045,400,17,'#b6cfe6','right');
  drawBroadcast(ctx,{kind:'arena',title:PLANKTON_TITLE,theme:'plankton',mode:view.mode,round:g.round,ranking:g.ranking,broadcast:view.broadcast,time,status:view.latest||'',avatar,total:g.ranking.length,publicView});
  drawLabHost(ctx,hostReady?host:null,{...narrator,kind:narrator.kind||((g.effects||[]).some(e=>e.kind==='boost'&&g.now-e.at>=0&&g.now-e.at<1800)?'gift':null),phase:g.phase},time);
  if(g.phase==='running'&&!narrator.speaking)text(ctx,`BATALHA EM ANDAMENTO \u00b7 1 LIKE CONFIRMA A PR\u00d3XIMA \u00b7 ${g.queued||0} NA FILA`,428,1381,15,'#ffd69a');
  if(g.phase==='intermission'&&!entryOptions.preview)drawVictory(ctx,g,time,avatar);
  else drawGameEntry(ctx,entryModel('arena',{...g,rules},entryOptions),time,{...entryOptions,images:{...entryOptions.images,PLANKTON:hostReady?host:null,PLANKTON_FRAME:narrator.kind==='winner'||g.phase==='intermission'?3:narrator.kind==='gift'?2:narrator.speaking?1:0}});

 }
 return {accept,draw,setNarratorState:value=>{narrator={...narrator,...value};}};
}
