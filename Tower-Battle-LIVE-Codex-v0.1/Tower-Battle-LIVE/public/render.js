import {drawBroadcast} from './broadcast-render.js';
import {drawGameEntry,entryModel} from './game-entry.js';
import {TEAMS,drawBackdrop,drawHosts,themeAssets} from './tower-theme.js';
export {themeReady,setThemeAssets,setNarratorState} from './tower-theme.js';
let scene3D=null,renderFailure='';
import('./scene.js').then(m=>{try{scene3D=m.createScene();}catch{renderFailure='WebGL indisponível · visual Canvas ativo';}}).catch(()=>{renderFailure='Falha ao carregar 3D · visual Canvas ativo';});
export const renderDiagnostics=()=>({renderer:scene3D?'WebGL 3D':'Canvas',failure:renderFailure});
const rect=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
const text=(c,t,x,y,size=28,color='#f3f8f3',align='center',weight=700)=>{c.font=`${weight} ${size}px Segoe UI,system-ui,sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(String(t),x,y);};
function tower(c,x,base,team,state,time){
 const data=state.teams[team],color=TEAMS[team].color,levels=3+Math.round(data.blocks/state.rules.maxBlocks*10),height=levels*29;
 c.save();c.shadowColor='#093f3b88';c.shadowBlur=17;c.fillStyle=team==='A'?'#b7955b':'#677b69';c.beginPath();c.ellipse(x,base+15,155,39,0,0,Math.PI*2);c.fill();c.shadowBlur=0;
 for(let i=0;i<levels;i++){
  const y=base-i*29,wood=team==='A',light=wood?(i%3?'#dbae6e':'#edc987'):(i%3?'#7faaa2':'#b6d3b4'),dark=wood?'#85643f':'#426d65';
  c.fillStyle=dark;c.beginPath();c.moveTo(x+80,y-44);c.lineTo(x+121,y-62);c.lineTo(x+121,y-34);c.lineTo(x+80,y-15);c.closePath();c.fill();
  c.fillStyle=light;c.fillRect(x-100,y-43,180,28);c.strokeStyle='#183c3e50';c.lineWidth=2;c.strokeRect(x-100,y-43,180,28);
  c.fillStyle=wood?'#f1d69c':'#d6eac8';c.beginPath();c.moveTo(x-100,y-44);c.lineTo(x-59,y-63);c.lineTo(x+121,y-63);c.lineTo(x+80,y-44);c.closePath();c.fill();
  for(const shift of [-50,40]){c.fillStyle=wood?'#694d35':'#32575a';c.beginPath();c.arc(x+shift,y-29,3,0,Math.PI*2);c.fill();}
 }
 const top=base-height-26;c.strokeStyle=team==='A'?'#8d6545':'#365c60';c.lineWidth=5;c.beginPath();c.moveTo(x+5,top);c.lineTo(x+5,top-80);c.stroke();c.fillStyle=color;c.beginPath();c.moveTo(x+8,top-78);c.lineTo(x+77,top-60);c.lineTo(x+8,top-43);c.closePath();c.fill();
 if(data.shield>0){c.strokeStyle=color+'c0';c.lineWidth=3;c.shadowColor=color;c.shadowBlur=15;c.beginPath();c.ellipse(x,base-height/2-30,147,height*.65+40,0,Math.PI*2);c.stroke();}
 for(const e of state.effects||[])if(['build','like','gift'].includes(e.kind)&&e.team===team){const p=(time*.001+e.id*.23)%1;c.globalAlpha=(1-p)*.7;c.fillStyle=color;c.beginPath();c.arc(x+Math.sin(e.id*2.4)*115,base-height-40-p*70,2+(e.id%3),0,Math.PI*2);c.fill();}
 c.restore();
}
export function drawArena(canvas,s,time=0,status='',lastEvent='',mode='live',broadcast={},entryOptions={}){
 const c=canvas.getContext('2d');c.clearRect(0,0,1080,1920);drawBackdrop(c,time);
 let drawn=false;if(scene3D){try{c.drawImage(scene3D.render(s,time),0,550,1080,740);drawn=true;}catch{renderFailure='Falha WebGL · usando Canvas';scene3D=null;}}
 if(!drawn){tower(c,340,1170,'A',s,time);tower(c,744,1170,'B',s,time);}
 drawHosts(c,s,time);
 for(const [team,x]of [['A',44],['B',558]]){
  const t=s.teams[team],color=TEAMS[team].color;rect(c,x,427,478,116,18,'#073a3eec',color+'bb');text(c,TEAMS[team].name,x+22,454,team==='A'?25:28,color,'left',850);text(c,`${t.hp} HP`,x+452,454,29,'#f3f9f0','right');rect(c,x+24,481,430,15,8,'#092b32');rect(c,x+24,481,Math.max(.01,430*t.hp/s.rules.maxHp),15,8,color);text(c,`${t.blocks} blocos · ${t.shield} escudo · ${t.memberCount} trabalhadores`,x+239,521,19,'#d0e6d5');
 }
 text(c,s.phase==='waiting'?'A / B INICIA A OBRA':s.phase==='running'?`OBRA EM ANDAMENTO · ${s.timeLeftSeconds}s`:`PRÓXIMA OBRA EM ${s.timeLeftSeconds}s`,540,400,22,'#e1f4d8');
 for(const [team,x]of [['A',340],['B',744]]){rect(c,x-128,1240,256,54,13,'#07343ded',TEAMS[team].color);text(c,'COMENTE '+team,x,1268,25,TEAMS[team].color,'center',850);}
 drawBroadcast(c,{kind:'tower',title:'TOWER BATTLE · FUNDO DO MAR',theme:'construction',mode,round:s.round,ranking:s.ranking,broadcast,time,status:`${status} · ${s.rules.likesPerBlock} curtidas = 1 bloco`,total:s.rankingTotal||s.ranking?.length,publicView:!!entryOptions.publicView});
 const art=themeAssets(),options={...entryOptions,theme:'construction',images:{...entryOptions.images,KRABS:art.krabs,PLANKTON:art.plankton}};
 drawGameEntry(c,entryModel('tower',s,options),time,options);
 if(entryOptions.publicView)text(c,'Sr. Sirigueijo · NickRewind / CC BY 3.0 · créditos na descrição',540,1906,14,'#8bb6b6','center',500);
}
