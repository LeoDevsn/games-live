const TAU=Math.PI*2;
const C={gold:'#d7b777',ivory:'#fff1d2',muted:'#a8bcc6',R:'#ff4967',S:'#36c6ff'};
function text(c,value,x,y,size,color=C.ivory,weight=600,max=900){c.font=`${weight} ${size}px Segoe UI,Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(String(value),x,y,max);}
function rounded(c,x,y,w,h,r,fill,stroke,width=1){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function linear(c,x,y,w,h,a,b){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function line(c,x1,y1,x2,y2,color,width=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function diamond(c,x,y,r,color){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.65,y);c.lineTo(x,y+r);c.lineTo(x-r*.65,y);c.closePath();c.fillStyle=color;c.fill();}
function shield(c,x,y,color){c.save();c.translate(x,y);c.beginPath();c.moveTo(-42,-49);c.lineTo(42,-49);c.lineTo(38,13);c.quadraticCurveTo(22,43,0,57);c.quadraticCurveTo(-22,43,-38,13);c.closePath();c.fillStyle=linear(c,0,-50,0,105,color,'#112336');c.fill();c.strokeStyle=C.gold;c.lineWidth=3;c.stroke();line(c,0,-40,0,32,'#ffe8ae',3);diamond(c,0,-7,15,'#fff1c1');c.restore();}
function factionCard(c,f,x,time,portrait){
 const y=545,w=398,h=424,color=C[f],red=f==='R',cx=x+w/2;
 c.save();c.shadowColor=red?'#bd173c55':'#008bd455';c.shadowBlur=26;
 rounded(c,x,y,w,h,20,linear(c,x,y,w,h,red?'#301624':'#102f48','#0a1421'),red?'#d9576c99':'#47b9ef99',1.5);c.restore();
 rounded(c,x+7,y+7,w-14,h-14,15,'#ffffff02',red?'#c44b6033':'#49ade333');
 const shine=c.createLinearGradient(x+30,0,x+w-30,0);shine.addColorStop(0,color+'00');shine.addColorStop(.5,color);shine.addColorStop(1,color+'00');line(c,x+25,y+1,x+w-25,y+1,shine,3);
 const cy=y+111,bob=Math.sin(time*.0014+(red?0:Math.PI))*2;
 const glow=c.createRadialGradient(cx,cy,18,cx,cy,120);glow.addColorStop(0,red?'#d92b4545':'#159fe54d');glow.addColorStop(1,'#0b172000');c.fillStyle=glow;c.fillRect(x+45,y+8,w-90,222);
 c.beginPath();c.arc(cx,cy,85,0,TAU);c.fillStyle=linear(c,0,cy-85,0,170,red?'#421c2b':'#143f5d','#101c2b');c.fill();c.strokeStyle=color+'60';c.lineWidth=1;c.stroke();
 c.beginPath();c.arc(cx,cy,93,-Math.PI*.92,Math.PI*.12);c.strokeStyle=C.gold+'70';c.lineWidth=1;c.stroke();
 if(portrait){c.save();c.beginPath();c.arc(cx,cy,83,0,TAU);c.clip();c.drawImage(portrait,128,512,128,128,cx-87,cy-90+bob,174,174);c.restore();}else shield(c,cx,cy,color);
 diamond(c,cx,cy+95,7,C.gold);
 text(c,red?'ALIANÇA':'COALIZÃO',cx,y+231,24,red?'#ffd0d7':'#c0eaff',700);
 text(c,red?'RUBRA':'SAFIRA',cx,y+268,40,'#fff6e4',750);
 text(c,'COMENTE NO CHAT',cx,y+307,22,'#d8e6ed',650);
 c.save();c.shadowColor=red?'#ff315333':'#21b5ff33';c.shadowBlur=14;
 rounded(c,x+22,y+333,w-44,65,12,linear(c,0,y+333,0,65,red?'#b52948':'#1473ab',red?'#711a35':'#11426a'),red?'#e95e7988':'#54c4f188');c.restore();
 text(c,red?'!vermelho':'!azul',cx,y+365,35,'#fff6ec',750);
}
export function entryView(frame){return {waiting:!!frame.waitingForFirstJoin,seconds:Math.max(0,Math.ceil((25000-frame.phaseMs)/1000)),demo:!!frame.demo};}
export function drawFactionEntry(c,frame,time=0,portraits={}){
 const view=entryView(frame);c.save();c.clearRect(0,0,c.canvas.width,c.canvas.height);c.scale(c.canvas.width/1080,c.canvas.height/1920);
 const shade=c.createRadialGradient(540,940,250,540,940,1120);shade.addColorStop(0,'#02091655');shade.addColorStop(1,'#020916c2');c.fillStyle=shade;c.fillRect(0,0,1080,1920);
 c.save();c.shadowColor='#000000bb';c.shadowBlur=55;c.shadowOffsetY=18;
 rounded(c,64,340,952,1068,28,linear(c,64,340,450,1068,'#122c3e','#07111e'),'#bb9b5b99',1.5);c.restore();
 rounded(c,73,349,934,1050,21,'#00000000','#d7b77722');
 // A restrained field of points gives depth without competing with the commands.
 c.save();c.beginPath();c.roundRect(78,352,924,1038,18);c.clip();
 for(let i=0;i<16;i++){const x=92+(i*197)%896,y=500+(i*103)%870;c.globalAlpha=.08+.06*Math.sin(time*.001+i);diamond(c,x,y,2+(i%2),i%2?C.S:C.gold);}c.restore();
 line(c,302,368,508,368,'#c5a46a70');diamond(c,540,368,8,C.gold);line(c,572,368,778,368,'#c5a46a70');
 text(c,view.waiting?'A COMUNIDADE VAI ENTRAR EM CAMPO':'ENTRADAS ABERTAS',540,410,22,C.gold,700);
 text(c,'ESCOLHA SUA FACÇÃO',540,460,43,C.ivory,750);
 text(c,'Uma arena. Duas facções. A sua escolha.',540,508,26,'#d6e6ed',550);
 factionCard(c,'R',104,time,portraits.R);factionCard(c,'S',578,time,portraits.S);
 c.save();c.shadowColor='#00000099';c.shadowBlur=15;c.beginPath();c.arc(540,757,33,0,TAU);c.fillStyle='#0a1724';c.fill();c.strokeStyle='#c6a56a';c.lineWidth=1.5;c.stroke();c.restore();text(c,'VS',540,758,21,C.gold,750);
 const rows=[['APOIE SUA FACÇÃO','Likes ajudam os reforços do seu time.'],['VOTE NAS TROPAS','!guerreiro · !defensor · !arqueiro'],['COMO JOGAR','!ajuda · !help · !comandos']];
 rows.forEach(([title,detail],i)=>{const y=990+i*60;rounded(c,104,y,872,50,10,'#061824ed','#d7b77733');text(c,title,270,y+25,24,C.ivory,750,300);line(c,438,y+11,438,y+39,'#d7b77744');text(c,detail,707,y+25,24,'#e0eaf0',550,508);});
 line(c,104,1185,976,1185,'#d7b77744');
 if(view.waiting){
  text(c,'A batalha começa com a sua escolha.',540,1220,30,C.ivory,700);
  text(c,'O primeiro comentário abre 25s para entrar.',540,1262,26,'#d6e6ed',550);
  rounded(c,242,1311,596,45,22,'#16383180','#69cbb344');c.beginPath();c.arc(283,1333,4,0,TAU);c.fillStyle='#8bdfbc';c.fill();
  text(c,'AGUARDANDO PRIMEIRO COMENTÁRIO',554,1334,20,'#d2f6e5',650,520);
 }else{
  const x=224,y=1232,progress=Math.min(1,view.seconds/25);c.beginPath();c.arc(x,y,52,0,TAU);c.strokeStyle='#ffffff12';c.lineWidth=4;c.stroke();c.beginPath();c.arc(x,y,52,-Math.PI/2,-Math.PI/2+TAU*progress);c.strokeStyle=C.gold;c.lineWidth=4;c.stroke();
  text(c,view.seconds,x,y-3,51,C.ivory,700);text(c,'SEGUNDOS',x,y+32,12,C.gold,650);
  text(c,'A batalha está chegando.',540,1216,30,C.ivory,700,560);text(c,'Comente para entrar no seu time.',540,1260,25,'#d6e6ed',550,560);
  text(c,view.demo?'CENÁRIO DE TESTE · PARTICIPANTES FICTÍCIOS':'ENTRE AGORA E DEFENDA O SEU NEXUS',540,1333,21,C.gold,650,850);
 }
 const bar=linear(c,104,1374,872,0,'#ba4558','#298cb5');rounded(c,104,1374,872,3,2,'#ffffff0c');if(!view.waiting)rounded(c,104,1374,872*Math.min(1,view.seconds/25),3,2,bar);else{const center=104+((Math.sin(time*.0007)+1)/2)*872;const light=c.createLinearGradient(center-100,0,center+100,0);light.addColorStop(0,'#d7b77700');light.addColorStop(.5,'#d7b777aa');light.addColorStop(1,'#d7b77700');c.save();c.beginPath();c.rect(104,1371,872,7);c.clip();c.fillStyle=light;c.fillRect(center-100,1373,200,3);c.restore();}
 c.restore();return view;
}
