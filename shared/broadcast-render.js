const metricNames={blocks:'BLOCOS',wins:'VITÓRIAS',likes:'CURTIDAS',rounds:'RODADAS',xp:'XP',damage:'DANO',healing:'CURA',kills:'ELIMINAÇÕES',participations:'PARTIDAS'};
const number=n=>new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(Number(n)||0);
const rect=(c,x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
function text(c,t,x,y,size=24,color='#edf3ff',align='center',weight=650,maxWidth=1000){c.font=`${weight} ${size}px Segoe UI,system-ui,sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;let value=String(t);if(c.measureText(value).width>maxWidth){while(value.length&&c.measureText(value+'…').width>maxWidth)value=value.slice(0,-1);value+='…';}c.fillText(value,x,y);}
export function sortedRanking(rows=[],metric='wins'){return [...rows].sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0)||(b.wins||0)-(a.wins||0)||(b.xp||0)-(a.xp||0)||String(a.name).localeCompare(String(b.name)));}
function crown(c,x,y,size,color){c.save();c.translate(x,y);c.beginPath();c.moveTo(-size,.3*size);c.lineTo(-1.15*size,-.6*size);c.lineTo(-.35*size,-.08*size);c.lineTo(0,-size);c.lineTo(.35*size,-.08*size);c.lineTo(1.15*size,-.6*size);c.lineTo(size,.3*size);c.closePath();c.fillStyle=color;c.fill();rect(c,-size,.42*size,size*2,.28*size,3,color);c.restore();}
function detail(r,kind){return kind==='tower'?`${number(r.blocks)} blocos · ${number(r.wins)} vit · ${number(r.likes)} likes`:`${number(r.wins)} vit · ${number(r.xp)} XP · ${number(r.damage)} dano · ${number(r.healing)} cura`;}
export function drawBroadcast(c,{kind='arena',title,mode,round,ranking=[],broadcast={},time=0,status='',avatar=()=>null,total,theme=null,publicView=false}={}){
 const submarine=['plankton','construction'].includes(theme);
 const config=broadcast.config||{},metric=config.metric||(kind==='tower'?'blocks':'wins'),rows=sortedRanking(ranking,metric),accent=config.accent||'#b69aff';
 const top=c.createLinearGradient(0,0,0,415);top.addColorStop(0,submarine?'#062b2bd9':'#14182c');top.addColorStop(1,submarine?'#032027cc':'#090f20');c.fillStyle=top;c.fillRect(0,0,1080,385);
 for(let i=0;i<22;i++){c.globalAlpha=.1+(i%4)*.025;c.fillStyle=accent;c.beginPath();c.arc((i*151+70)%1080,90+(i*87)%290,1.4,0,Math.PI*2);c.fill();}c.globalAlpha=1;
 text(c,title||'ARENA BATTLE',52,43,29,'#f2f5ff','left',850,690);
 text(c,publicView?`RODADA ${round||1}`:`${mode==='live'?'LIVE':mode==='replay'?'REPLAY':'SIMULAÇÃO'}  ·  R${round||1}`,1028,43,20,publicView||mode==='live'?'#9fe6bc':'#eac590','right');
 text(c,config.title||'PÓDIO DA COMUNIDADE',540,92,21,accent,'center',750);
 for(const [index,x,y,w,h,color,label] of [[1,45,160,302,210,'#b7d0e5','PRATA'],[2,733,175,302,195,'#e3a575','BRONZE'],[0,370,122,340,248,'#f4d283','OURO']]){
  const r=rows[index],cx=x+w/2,g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,index===0?'#433828':'#1c2c42');g.addColorStop(1,'#111b2e');rect(c,x,y,w,h,23,g,color+'98');
  c.fillStyle=color;c.globalAlpha=.16;c.fillRect(x+18,y+h-6,w-36,4);c.globalAlpha=1;
  text(c,`${index+1}º`,x+25,y+28,24,color,'left',850);
  if(index===0)crown(c,cx,y+17,21,color);
  const cy=y+(index===0?67:57),radius=index===0?38:31;c.save();c.beginPath();c.arc(cx,cy,radius,0,Math.PI*2);c.clip();const image=r?.avatar?avatar(r.avatar):null;
  if(image){const size=Math.min(image.width,image.height);c.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,cx-radius,cy-radius,radius*2,radius*2);}else{const a=c.createRadialGradient(cx-10,cy-10,2,cx,cy,radius);a.addColorStop(0,color);a.addColorStop(1,index===0?'#91653a':'#3e5771');c.fillStyle=a;c.fillRect(cx-radius,cy-radius,radius*2,radius*2);text(c,r?String(r.name).slice(0,2).toUpperCase():String(index+1),cx,cy,index===0?28:24,'#142135','center',850);}c.restore();
  c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(cx,cy,radius+4,0,Math.PI*2);c.stroke();
  text(c,r?.name||'Vaga no pódio',cx,cy+radius+(index===0?29:24),index===0?31:28,r?'#f5f5ff':'#7c8da7','center',750,w-30);
  text(c,r?`${number(r[metric])} ${metricNames[metric]}`:'AGUARDANDO',cx,y+h-49,index===0?27:23,color,'center',800,w-24);
  text(c,r?(kind==='tower'?`${number(r.wins)} vitórias · ${number(r.likes)} likes`:r.rank||`${number(r.xp)} XP`):label,cx,y+h-20,17,'#9baec8','center',550,w-24);
 }
 rect(c,44,1320,992,320,25,submarine?'#072c2df5':'#111c30f5',submarine?'#447a68':'#40506c');
 text(c,theme==='construction'?'RÁDIO DA CONSTRUÇÃO':theme==='plankton'?'TRANSMISSÃO DO LABORATÓRIO':'CHAT DA COMUNIDADE',73,1355,22,accent,'left',750);
 text(c,broadcast.nativeGiftsOnly?'':broadcast.alert?'EFEITO DE PRESENTE':`${broadcast.queued||0} efeitos na fila`,1008,1355,18,'#8da0bc','right',550);
 const chat=config.showChat===false?[]:(broadcast.chat||[]).slice(-4);
 if(!chat.length){text(c,config.showChat===false?(publicView?'Entre na batalha pelo chat!':'CHAT OCULTO'):'Mensagens da LIVE aparecem aqui.',theme==='plankton'?428:540,1455,theme==='plankton'?25:27,'#6f86a5');if(!publicView&&!broadcast.nativeGiftsOnly)text(c,'GIFs e vídeos de presentes ficam acima desta área.',540,1510,22,'#6f86a5');}
 chat.forEach((m,i)=>{const y=(theme==='plankton'?1432:1411)+i*57;text(c,m.name,77,y,23,accent,'left',750,theme==='plankton'?155:250);text(c,m.text,theme==='plankton'?248:345,y,23,'#d1dced','left',500,theme==='plankton'?530:660);});
 rect(c,44,1658,992,226,24,theme==='plankton'?'#082b2df0':'#111b2ff0',theme==='plankton'?'#3d7768':'#34445e');
 const others=rows.slice(3),pages=Math.max(1,Math.ceil(others.length/5)),page=Math.floor(time/7000)%pages,start=page*5;
 text(c,'CLASSIFICAÇÃO · '+metricNames[metric],73,1687,20,accent,'left',750);
 text(c,`${total||rows.length} participantes`,1007,1687,18,'#8298b6','right',550);
 if(!others.length)text(c,'Os próximos colocados aparecem aqui.',540,1775,24,'#7086a3');
 others.slice(start,start+5).forEach((r,i)=>{const y=1726+i*30; text(c,`${start+i+4}º`,76,y,21,'#a4b5cf','left',750);text(c,r.name,125,y,21,'#e3eaf8','left',650,300);text(c,detail(r,kind),1005,y,19,'#94a9c6','right',550,565);});
 if(!publicView)text(c,status,540,1908,17,'#7189a8','center',500,990);
}
