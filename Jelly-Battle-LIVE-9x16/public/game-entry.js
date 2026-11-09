// Presentation only. Models describe the real engines; these cards never send chat,
// follow an account, join a team or change a round.
export function entryModel(kind,s,options={}){
 const preview=!!options.preview,phase=s.phase||'waiting';if(!preview&&!['waiting','announcement','preparation','intermission'].includes(phase))return null;
 const waiting=preview||phase==='waiting',result=!preview&&phase==='intermission';
 const construction=kind==='tower'&&options.theme==='construction';
 if(kind==='tower')return {kind,phase,preview,result,theme:construction?'construction':null,seconds:result?s.timeLeftSeconds:null,round:s.round,
  eyebrow:result?'FIM DA RODADA':construction?'TRABALHADORES, MÃOS À OBRA!':'SEU CHAT CONSTRÓI A BATALHA',title:result?(s.lastWinner==='draw'?'AS TORRES EMPATARAM':construction?(s.lastWinner==='A'?'SIRI CASCUDO VENCEU!':'PLANKTON VENCEU!'):`TIME ${s.lastWinner} VENCEU!`):construction?'ESCOLHA SEU CHEFE':'ESCOLHA SUA TORRE',subtitle:construction?'Sr. Sirigueijo ou Plankton: para quem você vai construir?':'Construa em equipe. Proteja sua torre. Derrube a rival.',
  colors:construction?['#ffc371','#b6ed70']:['#ff648c','#53d8f6'],cards:construction?[{name:'SR. SIRIGUEIJO',label:'SIRI CASCUDO · TIME A',command:'A',detail:`${s.teams?.A?.memberCount||0} trabalhadores`},{name:'PLANKTON',label:'LABORATÓRIO · TIME B',command:'B',detail:`${s.teams?.B?.memberCount||0} trabalhadores`}]:[{name:'TORRE RUBRA',label:'TIME A',command:'A',detail:`${s.teams?.A?.memberCount||0} construtores`},{name:'TORRE SAFIRA',label:'TIME B',command:'B',detail:`${s.teams?.B?.memberCount||0} construtores`}],
  steps:[['CONSTRUA',`A / B = +1 bloco`,`Intervalo de ${s.rules.chatCooldownSeconds}s`],['FORTALEÇA',`${s.rules.likesPerBlock} likes = 1 bloco`,'Likes contam para seu time'],['VENÇA','Destrua a torre rival',`Batalha de ${Math.round(s.rules.roundSeconds)} segundos`]],
  footer:result?`Próxima rodada em ${s.timeLeftSeconds}s`:'O primeiro A ou B começa a batalha.',hint:result?'Prepare seu time para construir de novo.':'Comente a letra do seu time no chat da live.',tips:['Ataques entre as torres acontecem automaticamente.','Repita A ou B respeitando o intervalo para construir.','Os construtores ganham posição no ranking do jogo.']};
 if(kind==='arena')return {kind,phase,preview,result,seconds:result||phase==='preparation'?s.countdown:null,round:s.round,pending:s.pendingRegistrations||[],alive:s.alive||0,
  eyebrow:result?'ALIADO SELECIONADO PELO PLANKTON':phase==='announcement'?'AVISO ANTES DA CONTAGEM':phase==='preparation'?'INSCRIÇÕES ABERTAS':'RECRUTAMENTO DO PLANKTON',title:result?'ÚLTIMO EM PÉ!':phase==='announcement'?'GARANTA SUA VAGA':phase==='preparation'?'PREPAREM O PLANO!':'ALIADOS, APRESENTEM-SE!',subtitle:result?(s.winner?.name||'Empate na arena'):phase==='announcement'?'Após o início, novas inscrições entram só na próxima.':phase==='preparation'?'Você pode entrar até a contagem zerar.':'Meu plano perfeito precisa de aliados. Siga e curta!',
  colors:['#b9ef6d','#7ce8d2'],cards:[{name:'SIGA O CANAL',label:'NOVOS PARTICIPANTES',command:'SEGUIR',detail:'Já segue? Basta dar like.'},{name:'MANDE 1 LIKE',label:'TODOS OS SEGUIDORES',command:'CURTIR A LIVE',detail:'Confirme sua vaga na rodada.'}],
  steps:[['SOBREVIVA',`${s.initialHp||20} HP iniciais`,'Acertar: −2 HP no rival / +1 HP'],['ATIVE PODERES','A cada 50 likes',`Cura ${(s.rules?.regenMs??5000)/1000}s ou dano ×2 por ${(s.rules?.damageMs??10000)/1000}s`],['CONQUISTE','Último em pé vence',`Vitória +${s.settings?.victoryXp??50} XP · participação +${s.settings?.participationXp??10} XP`]],
  footer:result?`Próxima rodada em ${s.countdown}s`:phase==='preparation'?'Contagem iniciada, prepare-se!':phase==='announcement'?`A contagem de ${s.preparationSeconds||30}s começa em instantes.`:`${s.alive||0} / 2 prontos para começar`,hint:result?'Novo like confirma sua presença na próxima.':phase==='preparation'?'Ao zerar, novos inscritos ficam para a próxima.':phase==='announcement'?'Curta agora para entrar nesta rodada.':'Após o início, inscrições vão para a próxima.',tips:[`Cura: +${s.rules?.regenPerSecond??1} HP por segundo por 5s e +2 HP por acerto.`,'Dano ampliado: cada acerto causa 4 HP durante 10s.','3 a 9 vivos: menos 1 ponto a cada 5s, até 30%. Eliminações podem reduzir a 20%.','Novo like durante a batalha confirma a próxima rodada.','Impulsos de 1 a 5 segundos deixam rastros pela arena.','Runas a cada 10s: fogo dispara em 8 direções; escudo protege por 3s.','Dois finalistas: Death Match! Zona de 20% a 5%, menos 1 ponto a cada 3s.']};
 if(kind==='jelly')return {kind,phase,preview,result:false,seconds:!preview&&phase==='preparation'?s.seconds:null,round:s.round,
  eyebrow:phase==='preparation'&&!preview?'REDES PRONTAS · PREPARANDO':'UMA DISPUTA NO FUNDO DO MAR',title:'ESCOLHA SEU CAÇADOR',subtitle:'Ajude seu time a capturar mais águas-vivas.',colors:['#ffe66e','#ffa4ce'],
  cards:[{name:'BOB ESPONJA',label:'TIME A',command:'A',detail:'Redes prontas para a caça!'},{name:'PATRICK',label:'TIME B',command:'B',detail:'Uma estrela na captura!'}],
  steps:[['ESCOLHA','Comente A ou B','Você joga pelo time escolhido'],['AJUDE','Likes dão força','Mais chances de capturar'],['VENÇA','Mais capturas = vitória','Rodadas de 2 minutos']],
  footer:phase==='preparation'&&!preview?'A caça já vai começar!':'O primeiro A ou B inicia a batalha.',hint:'Comente a letra do time no chat da live.',tips:['Presentes ativam os especiais do seu time.','A água-viva dourada vale 2 pontos: vença a disputa de likes.','Seu apoio aparece nos rankings de likes e presentes.']};
 return null;
}
const TAU=Math.PI*2;
function rect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function text(c,t,x,y,size=24,color='#eff6ff',weight=600,max=930){c.font=`${weight} ${size}px Segoe UI,Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(String(t),x,y,max);}
function grad(c,x,y,w,h,a,b){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function heart(c,x,y,r,color){c.save();c.translate(x,y);c.scale(r/30,r/30);c.beginPath();c.moveTo(0,27);c.bezierCurveTo(-60,-10,-22,-47,0,-19);c.bezierCurveTo(22,-47,60,-10,0,27);c.fillStyle=color;c.fill();c.restore();}
function tower(c,x,y,color,time){
 c.save();c.translate(x,y+Math.sin(time*.0018)*4);c.scale(.82,.82);c.shadowColor=color+'66';c.shadowBlur=20;
 const cube=(x,y,w,h)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x+w*.7,y-15);c.lineTo(x+w*.7,y+h-15);c.lineTo(x,y+h);c.closePath();c.fillStyle='#132840';c.fill();c.beginPath();c.moveTo(x-w*.65,y-15);c.lineTo(x,y);c.lineTo(x,y+h);c.lineTo(x-w*.65,y+h-15);c.closePath();c.fillStyle=color;c.fill();c.beginPath();c.moveTo(x-w*.65,y-15);c.lineTo(x,y-30);c.lineTo(x+w*.7,y-15);c.lineTo(x,y);c.closePath();c.fillStyle='#dcf4ff';c.fill();};
 cube(0,55,110,20);for(let i=0;i<4;i++)cube(0,28-i*31,73,27);
 c.shadowBlur=0;c.strokeStyle='#e8e5cb';c.lineWidth=4;c.beginPath();c.moveTo(0,-98);c.lineTo(0,-157);c.stroke();c.beginPath();c.moveTo(2,-156);c.quadraticCurveTo(38,-163,55,-141);c.lineTo(3,-127);c.closePath();c.fillStyle=color;c.fill();c.restore();
}
function orbit(c,x,y,color,time,follow=false){
 c.save();c.translate(x,y);c.rotate(time*.00015);c.strokeStyle=color+'66';c.lineWidth=2;c.beginPath();c.ellipse(0,0,110,38,-.4,0,TAU);c.stroke();
 for(let i=0;i<3;i++){const a=i*TAU/3+time*.00045;c.beginPath();c.arc(Math.cos(a)*100,Math.sin(a)*38,13,0,TAU);c.fillStyle=i%2?'#b4a0ff':color;c.fill();}c.restore();
 c.beginPath();c.arc(x,y,68,0,TAU);c.fillStyle=grad(c,0,y-68,0,136,'#233c59','#101629');c.fill();c.strokeStyle=color;c.lineWidth=3;c.stroke();
 if(follow){c.fillStyle=color;c.beginPath();c.arc(x,y-17,21,0,TAU);c.fill();c.beginPath();c.ellipse(x,y+30,35,22,0,0,TAU);c.fill();text(c,'+',x+47,y-38,43,'#fff',700);}else heart(c,x,y+3,40,color);
}
export function drawGameEntry(c,model,time=0,{bounds={x:42,y:424,w:996,h:900},images={},page=0}={}){
 if(!model)return false;const {kind,colors,cards}=model,{x,y,w,h}=bounds;
 c.save();c.fillStyle=kind==='jelly'?'#042b364d':'#040b185c';c.fillRect(x-42,y-12,w+84,h+24);c.translate(x,y);c.scale(w/1000,h/900);
 c.save();c.shadowColor='#000b';c.shadowBlur=45;c.shadowOffsetY=12;rect(c,0,0,1000,900,26,grad(c,0,0,650,900,kind==='jelly'?'#103f49':'#14263f',kind==='arena'?'#05292b':'#081624'),colors[0]+'88');c.restore();
 rect(c,9,9,982,882,20,'#ffffff00','#c7dbff19');
 for(let i=0;i<22;i++){const xx=30+(i*173)%940,yy=20+(i*127)%850;c.globalAlpha=.06+.04*Math.sin(time*.001+i);c.fillStyle=colors[i%2];c.beginPath();c.arc(xx,yy,kind==='jelly'?3+i%5:1+i%2,0,TAU);c.fill();}c.globalAlpha=1;
 c.strokeStyle=colors[0]+'55';c.beginPath();c.moveTo(250,28);c.lineTo(480,28);c.moveTo(520,28);c.lineTo(750,28);c.stroke();c.beginPath();c.moveTo(500,20);c.lineTo(505,28);c.lineTo(500,36);c.lineTo(495,28);c.closePath();c.fillStyle=colors[0];c.fill();
 text(c,model.eyebrow,500,62,20,colors[0],700);text(c,model.title,500,110,43,'#f5f4e9',800);text(c,model.subtitle,500,159,26,'#d9e9ed',550);
 const centralCountdown=kind==='arena'&&model.phase==='preparation'&&!model.preview;
 if(centralCountdown){
  const seconds=Math.max(0,model.seconds),color=seconds<=5?'#ffcd82':colors[0];
  text(c,seconds<=5?'ÚLTIMOS SEGUNDOS PARA ENTRAR!':'ENTRADAS ABERTAS',500,215,26,color,750);
  c.save();c.shadowColor=color+'88';c.shadowBlur=24;rect(c,315,250,370,255,30,'#041f2bf2',color+'99');c.shadowBlur=0;
  c.beginPath();c.arc(500,365,103,0,TAU);c.strokeStyle='#cce8d826';c.lineWidth=7;c.stroke();
  c.beginPath();c.arc(500,365,103,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,seconds/30));c.strokeStyle=color;c.lineWidth=7;c.stroke();
  text(c,seconds,500,362,118,'#fff8de',850,260);text(c,'SEGUNDOS',500,477,23,color,750);c.restore();
  text(c,'SIGA O CANAL + MANDE 1 LIKE',500,540,31,'#efffe3',800);
  text(c,`${model.alive} participantes prontos para a batalha`,500,571,23,'#d8efe7',600);
 }
 for(let i=0;i<2&&!centralCountdown;i++){
  const cx=260+i*480,left=cx-211,color=colors[i],bob=Math.sin(time*.0015+i*Math.PI)*3;
  c.save();c.shadowColor=color+'33';c.shadowBlur=22;rect(c,left,205,422,366,18,grad(c,left,205,400,366,kind==='jelly'?'#17424b':i?'#192842':'#302135','#0a1828'),color+'88');c.restore();
  rect(c,left+6,211,410,354,14,'#ffffff00',color+'22');
  const halo=c.createRadialGradient(cx,310,5,cx,310,130);halo.addColorStop(0,color+'2e');halo.addColorStop(1,color+'00');c.fillStyle=halo;c.fillRect(left+20,211,380,218);
  if(kind==='tower'){
   const image=model.theme==='construction'?(i?images.PLANKTON:images.KRABS):null;
   if(image){if(i){const cw=image.width/2,ch=image.height/2;c.drawImage(image,0,0,cw,ch,cx-100,213,200,200);}else{const scale=Math.min(200/image.width,200/image.height);c.drawImage(image,cx-image.width*scale/2,213,image.width*scale,image.height*scale);}}
   else tower(c,cx,344,color,time+i*900);
  }
  if(kind==='arena'){if(i===0&&images.PLANKTON){const sheet=images.PLANKTON,frame=images.PLANKTON_FRAME||0,cw=sheet.width/2,ch=sheet.height/2;c.drawImage(sheet,frame%2*cw,Math.floor(frame/2)*ch,cw,ch,cx-100,212,200,200);}else orbit(c,cx,310,color,time,i===0);}
  if(kind==='jelly'){
   const image=images[i?'B':'A'];if(image){const scale=Math.min(158/image.width,190/image.height);c.drawImage(image,cx-image.width*scale/2,218+bob,image.width*scale,image.height*scale);}else{c.fillStyle=color;c.beginPath();c.arc(cx,310,64,0,TAU);c.fill();text(c,i?'★':'A',cx,310,60,'#21323c',900);}
  }
  text(c,cards[i].label,cx,419,20,color,700,390);text(c,cards[i].name,cx,449,32,'#fff5e6',800,390);text(c,cards[i].detail,cx,479,24,'#e0edf1',550,390);
  rect(c,left+22,501,378,62,12,grad(c,0,501,0,62,color+'c0',color+'45'),color+'aa');
  text(c,kind==='arena'?cards[i].command:`COMENTE  ${cards[i].command}`,cx,532,30,'#fff',800);
 }
 if(kind!=='arena'){c.beginPath();c.arc(500,375,31,0,TAU);c.fillStyle='#0c1929';c.fill();c.strokeStyle='#b6c9d97d';c.lineWidth=2;c.stroke();text(c,'VS',500,377,19,'#dbe5ef',800);}
 {
  // Wide rule rows keep the type readable when the portrait source is scaled to a phone.
  for(let i=0;i<3;i++){
   const yy=590+i*52,color=colors[i%2],[,title,detail]=model.steps[i];
   rect(c,42,yy,916,46,10,kind==='jelly'?'#052c35ee':'#031c25e6','#c6f3d629');
   text(c,'0'+(i+1),70,yy+23,19,color,800,40);
   text(c,title,245,yy+23,26,'#fff6de',750,290);
   c.strokeStyle='#cfefdb33';c.beginPath();c.moveTo(406,yy+10);c.lineTo(406,yy+36);c.stroke();
   text(c,detail,685,yy+23,24,'#e1efeb',550,520);
  }
  c.strokeStyle='#c9d8ee44';c.beginPath();c.moveTo(45,753);c.lineTo(955,753);c.stroke();
  if(model.seconds!==null&&!centralCountdown){
   const sec=Math.max(0,model.seconds);c.beginPath();c.arc(113,799,35,0,TAU);c.strokeStyle=colors[0];c.lineWidth=3;c.stroke();
   text(c,sec,113,794,36,'#fff7de',800,65);text(c,'SEGUNDOS',113,821,10,colors[0],750,75);
   text(c,model.footer,545,790,28,'#fff7de',750,750);text(c,model.hint,545,827,24,'#e0efe9',550,780);
  }else{text(c,model.footer,500,790,30,'#fff7de',750);text(c,model.hint,500,827,25,'#e0efe9',550,920);}
  const tip=model.pending?.length?'Aguardando confirmação de seguidor: '+model.pending.slice(0,3).map(p=>p.name).join(', '):model.tips[(Math.floor(time/6000)+page)%model.tips.length],lines=[];let line='';c.font='600 22px Segoe UI,Arial,sans-serif';
  for(const word of tip.split(' ')){if(line&&c.measureText(line+' '+word).width>910){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
  lines.slice(0,2).forEach((value,i)=>text(c,value,500,lines.length>1?864+i*25:877,22,'#aeeddf',600,920));
 }
 c.restore();return true;
}

// Operator-only preview controls. They never send game/provider events.
export function createEntryControls({host,onChange=()=>{}}={}){
 let preview=false,page=0;if(!host)return {get preview(){return preview;},get page(){return page;}};
 const box=document.createElement('section'),title=document.createElement('h3'),description=document.createElement('p'),toggle=document.createElement('button'),next=document.createElement('button');
 title.textContent='Entrada da LIVE';description.textContent='Confira o convite e as instruções. A prévia aparece só nesta janela.';toggle.textContent='Prévia da entrada';next.textContent='Próxima dica';box.className='entry-controls panel';
 toggle.type=next.type='button';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{preview=!preview;toggle.textContent=preview?'Voltar à partida':'Prévia da entrada';toggle.setAttribute('aria-pressed',String(preview));onChange({preview,page});};next.onclick=()=>{page++;onChange({preview,page});};box.append(title,description,toggle,next);host.append(box);
 return {get preview(){return preview;},get page(){return page;}};
}
