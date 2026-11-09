// Audience guidance is presentation only: it never joins a faction or advances the engine.
export const WELCOME='Bem-vindo ao Faction Wars! Entre com !vermelho ou !azul. Para aprender a jogar, envie !ajuda, !help ou !comandos.';
export const HELP=[
 'ENTRAR: !vermelho (Rubra) ou !azul (Safira). O primeiro abre 25s de preparação. Entrou no combate? Joga na próxima rodada.',
 'TROPAS: vote !defensor, !guerreiro ou !arqueiro. Combine a rota: !esquerda, !centro ou !direita. Ex.: !defensor !centro.',
 'ESTRATÉGIA: !atacar, !defender ou !equilibrar. Até 3 ações por comentário. Votos de classe são resolvidos em janelas de 10s.',
 'OBJETIVO: domine A/B/C e destrua o Nexus rival. Likes geram créditos para sua facção. Presentes não mudam o combate.',
];
export const VOICE='Bem-vindo ao Faction Wars! Escolha sua facção: escreva exclamação vermelho, ou exclamação azul. Para saber como jogar, escreva exclamação ajuda no chat.';
export const HELP_VOICE='Para jogar, escolha vermelho ou azul no chat. Vote em defensor, guerreiro ou arqueiro e escolha uma rota. O objetivo é destruir o Nexus rival. Veja os comandos na tela.';
export const DEFAULTS={welcome:true,help:true,voice:true,voiceEngine:'browser',chat:true,volume:.8};
export function guidanceConfig(input={},base=DEFAULTS){
 const out={...base};for(const k of ['welcome','help','voice','chat'])if(typeof input[k]==='boolean')out[k]=input[k];
 if(['browser','fish'].includes(input.voiceEngine))out.voiceEngine=input.voiceEngine;
 if(Number.isFinite(input.volume))out.volume=Math.max(0,Math.min(1,input.volume));return out;
}
export function createAudience({config={},now=Date.now,save=()=>{},sendChat=()=>false}={}){
 let settings=guidanceConfig(config),serial=0,current=null,voice=null,lastWelcome=-Infinity,lastVoice=-Infinity,lastDispatch=-Infinity;
 let welcomed=0,helped=0,relayed=0,dropped=0;const users=new Map(),seen=new Map(),outbox=[];
 const clean=v=>String(v??'').replace(/[\p{Cc}\p{Cf}<>]/gu,'').trim().slice(0,40);
 function prune(at){for(const map of [users,seen]){for(const [id,v] of map)if(at-v.at>600000)map.delete(id);while(map.size>5000)map.delete(map.keys().next().value);}}
 function notify(kind,name,at,simulate=false){
  const pages=kind==='help'?HELP:[WELCOME];
  current={id:++serial,kind,name,at,expiresAt:at+(kind==='help'?18000:9000),pages,simulate};
  if(settings.voice&&(simulate||at-lastVoice>=30000)){voice={id:serial,at,expiresAt:at+15000,text:kind==='help'?HELP_VOICE:VOICE,engine:settings.voiceEngine,volume:settings.volume,simulate};lastVoice=at;}
  return current;
 }
 function queueChat(kind,name,at){
  if(!settings.chat)return;
  if(kind==='help'){for(let i=outbox.length-1;i>=0;i--)if(outbox[i].kind==='welcome')outbox.splice(i,1);}
  const lines=kind==='help'?HELP:[WELCOME];
  for(const line of lines){if(outbox.length>=12){dropped++;break;}outbox.push({kind,text:(name?'@'+name+' ':'')+line,expiresAt:at+60000});}
 }
 function receive(message,at=now()){
  if(!['member','chat','like','follow'].includes(message.event))return;
  const d=message.data||{},u=d.user||d,id=clean(u.userId||u.id||u.uniqueId||d.userId||d.uniqueId);if(!id)return;
  prune(at);const msgId=clean(d.msgId||d.messageId||d.common?.msgId);const key=msgId&&message.event+':'+msgId;
  if(key&&seen.has(key))return;if(key)seen.set(key,{at});
  const name=clean(u.uniqueId||d.uniqueId||u.nickname||d.nickname||'jogador').replace(/[^\p{L}\p{N}_.-]/gu,'').slice(0,24);
  const command=message.event==='chat'&&String(d.comment||'').trim().toLowerCase().split(/\s+/).find(x=>['!ajuda','!help','!comandos','!jogar','!regras','!acoes','!ações'].includes(x));
  const user=users.get(id)||{at,welcomeAt:-Infinity,helpAt:-Infinity};user.at=at;users.set(id,user);
  if(command&&settings.help){
   if(at-user.helpAt<30000)return;user.helpAt=at;helped++;notify('help',name,at);queueChat('help',name,at);return;
  }
  // Some TikFinity builds omit member. First interaction is a fallback, never roomUser (viewer count).
  if(!settings.welcome||at-user.welcomeAt<600000)return;user.welcomeAt=at;
  if(at-lastWelcome<20000||current?.kind==='help'&&current.expiresAt>at)return;
  lastWelcome=at;welcomed++;notify('welcome',name,at);queueChat('welcome',name,at);
 }
 return {
  receive,
  tick(at=now()){
   while(outbox.length&&outbox[0].expiresAt<=at){outbox.shift();dropped++;}
   if(settings.chat&&outbox.length&&at-lastDispatch>=6000&&sendChat(outbox[0].text)){outbox.shift();lastDispatch=at;relayed++;}
  },
  configure(input){settings=guidanceConfig(input,settings);save(settings);if(!settings.chat)outbox.length=0;if(!settings.voice)voice=null;return settings;},
  test(kind='welcome'){return notify(kind==='help'?'help':'welcome','Prévia local',now(),true);},
  stop(){outbox.length=0;current=null;voice=null;},
  snapshot(){const at=now();return {config:{...settings},current:current?.expiresAt>at?current:null,voice:settings.voice&&voice?.expiresAt>at?voice:null,welcomed,helped,relayed,dropped,queued:outbox.length};},
 };
}
