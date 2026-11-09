import {randomUUID} from 'node:crypto';
const clean=(s,n=45)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,n);
export const AUDIENCE_DEFAULTS={voice:true,chat:true,volume:.8,character:'plankton'};
export function audienceConfig(input={},base=AUDIENCE_DEFAULTS){
 const out={...base};for(const k of ['voice','chat'])if(typeof input[k]==='boolean')out[k]=input[k];
 if(Object.hasOwn(input,'volume')){if(typeof input.volume!=='number'||!Number.isFinite(input.volume)||input.volume<0||input.volume>1)throw Error('Volume deve ficar entre 0 e 1');out.volume=input.volume;}
 if(Object.hasOwn(input,'character')){if(!['plankton','A','B','alternate'].includes(input.character))throw Error('Voz desconhecida');out.character=input.character;}
 return out;
}
export function phrase(kind,{name='recruta',following=null,giftName='presente',variation=0,entryClosed=false,areaPercent=100,lowCount=false}={}){
 const who=clean(name)||'recruta';
 if(kind==='entry')return entryClosed?`${who}, vaga confirmada na próxima rodada!`:`${who}, você está na arena! Vaga confirmada.`;
 if(kind==='pending')return `${who}, like recebido! Sua vaga aguarda a confirmação de seguidor.`;
 if(kind==='welcome'&&entryClosed)return following===true?`${who}, bem-vindo à Arena Royale do Plankton! Para confirmar uma vaga na próxima rodada, dê um like!`:`${who}, bem-vindo à Arena Royale do Plankton! Sua inscrição ainda está pendente. Siga o canal e dê um like para disputar a próxima rodada!`;
 if(kind==='welcome')return following===true?`${who}, bem-vindo de volta à Arena Royale do Plankton! Dê um like para entrar na batalha!`:`${who}, bem-vindo à Arena Royale do Plankton! Para entrar, siga e depois dê um like. Aguarde a confirmação da vaga!`;
 if(kind==='gift')return variation%2?`${who}, excelente! Obrigado pelo ${clean(giftName,50)}. Cada contribuição me aproxima do meu plano perfeito!`:`Um ${clean(giftName,50)} para o meu laboratório? Muito bem, ${who}! Seu apoio será lembrado quando meu plano der certo!`;
 if(kind==='winner')return `${who}, você foi o último em pé! Finalmente, um aliado competente para o meu plano perfeito! Recrutas, um novo like confirma a próxima rodada!`;
 if(kind==='countdown')return 'Recrutas, a contagem começou! Preparem-se para executar meu plano perfeito! Quando a batalha começar, novos aliados entram só na próxima rodada!';
 if(kind==='start')return 'Executem o plano! Quero descobrir quem ficará de pé para me ajudar!';
 if(kind==='deathmatch')return 'Death Match! Restam apenas dois aliados! A zona vai fechar até vinte por cento e depois perder um ponto a cada três segundos, até cinco por cento. Quero ver quem ficará de pé para executar meu plano perfeito!';
 if(kind==='closing')return lowCount?`A zona vai fechar para ${areaPercent} por cento! Com três a nove aliados, fecho um ponto a cada cinco segundos, até trinta por cento. Eliminações podem reduzir até vinte por cento. Não se distraiam, recrutas!`:`Estou concentrando a energia do laboratório! A zona vai fechar para ${areaPercent} por cento. Não há espaço para recrutas distraídos!`;
 if(kind==='taunt')return ['Quem ficará de pé para me ajudar? Estou observando cada movimento!','Preciso de bons aliados! Cinquenta likes pessoais ativam um poder. Usem essa informação com sabedoria!','Nada de desistir, recrutas! Meu plano perfeito exige determinação!'][variation%3];
 if(kind==='help')return 'Arena Royale do Plankton: siga e dê um like para entrar com 20 de vida. Já segue? Basta um like! Cinquenta likes ativam um poder. Pegue as runas: fogo dispara em oito direções; escudo protege por três segundos. Novo like na batalha confirma a próxima rodada. O último em pé vence!';
 throw Error('Tipo de fala desconhecido');
}
export function createAudience({config={},seen=[],clock=Date.now,save=()=>{},onMessage=()=>{},sendChat=async()=>false}={}){
 let settings=audienceConfig(config),serial=0,lastWelcome=-Infinity,lastDispatch=-Infinity,pumping=false,voiceTurn=0,observedRound=null,observedPhase=null,observedArea=100,lastNarration=-Infinity,lastClosing=-Infinity,observedDeathRound=null;
 const session=randomUUID(),welcomed=new Map(seen),jobs=[],available=new Map(),outbox=[];
 const relay={connected:false,relayed:0,dropped:0,lastError:null};
 function prune(){const at=clock();for(const [k,v]of welcomed)if(at-v>600000)welcomed.delete(k);for(const [id,j]of available)if(at>j.availableUntil)available.delete(id);while(jobs.length&&jobs[0].expiresAt<at)jobs.shift();}
 function make(kind,details={},test=false){
  prune();const at=clock(),text=phrase(kind,{...details,variation:serial}),team=settings.character==='plankton'?'PLANKTON':settings.character==='alternate'?(voiceTurn++%2?'B':'A'):settings.character;
  const job={id:session+':'+(++serial),kind,text,team,at,expiresAt:at+(kind==='entry'?12000:['countdown','start','deathmatch'].includes(kind)?12000:45000),priority:{welcome:1,entry:2.4,pending:0,help:1,gift:2,winner:3,countdown:2,start:2,deathmatch:2.5,closing:1,taunt:0}[kind],test};
  // Reuse two short cached recordings; personalized visual receipts never wait for TTS.
  if(kind==='entry')job.audioText=details.entryClosed?'Vaga confirmada na próxima rodada!':'Vaga confirmada! Prepare-se para a batalha!';
  if(!test&&kind==='entry')for(const queue of [jobs,outbox])for(let i=queue.length-1;i>=0;i--)if(['entry','welcome','taunt','closing'].includes(queue[i].kind))queue.splice(i,1);
  if(!test&&['deathmatch','winner'].includes(kind))for(const queue of [jobs,outbox])for(let i=queue.length-1;i>=0;i--)if(['start','closing','taunt','deathmatch'].includes(queue[i].kind))queue.splice(i,1);
  available.set(job.id,{...job,availableUntil:at+120000});if(available.size>100)available.delete(available.keys().next().value);
  if(!test){if(kind!=='pending')lastNarration=at;if(settings.voice&&kind!=='pending'){jobs.push(job);if(jobs.length>8)jobs.shift();}onMessage(job);
   if(settings.chat){if(outbox.length>=12){outbox.shift();relay.dropped++;}outbox.push(job);}
  }return job;
 }
 return {
  receive(action){
   prune();const at=clock();
   if(action.kind==='pending')return make('pending',action);
   if(action.kind==='like'&&action.registration){welcomed.set(action.id,at);return make('entry',{...action,entryClosed:action.registration==='next'});}
   if(action.kind==='gift')return make('gift',action);
   if(!['identity','follow','like'].includes(action.kind))return;
   if(action.inGame){welcomed.set(action.id,at);return;}
   if(welcomed.has(action.id)||at-lastWelcome<20000)return;
   welcomed.set(action.id,at);if(welcomed.size>10000)welcomed.delete(welcomed.keys().next().value);lastWelcome=at;return make('welcome',action);
  },
  observe(game){
   const phase=game.phase,area=game.arena?.targetPercent??100,changed=phase!==observedPhase,at=clock();
   if(observedRound===null){observedRound=phase==='intermission'?`winner:${game.round}`:game.round;observedPhase=phase;observedArea=area;lastNarration=at;if(game.deathMatch?.active)observedDeathRound=game.round;return;}
   const previousArea=observedArea;observedPhase=phase;observedArea=area;
   if(phase==='intermission'&&observedRound!==`winner:${game.round}`){observedRound=`winner:${game.round}`;if(game.winner)return make('winner',{name:game.winner.name});}
   else if(phase!=='intermission')observedRound=game.round;
   if(changed&&phase==='preparation')return make('countdown');
   if(phase==='running'&&game.deathMatch?.active&&observedDeathRound!==game.round){observedDeathRound=game.round;return make('deathmatch');}
   if(changed&&phase==='running')return make('start');
   if(phase==='running'&&!game.deathMatch?.active&&area<previousArea&&area<=60&&at-lastClosing>=20000&&at-lastNarration>=15000){lastClosing=at;return make('closing',{areaPercent:area,lowCount:game.alive>=3&&game.alive<=9});}
   if(phase==='running'&&game.alive>=2&&at-lastNarration>=45000)return make('taunt');
  },
  configure(input){settings=audienceConfig(input,settings);save(settings);if(!settings.voice)jobs.length=0;if(!settings.chat)outbox.length=0;return settings;},
  test(kind,name='Teste'){return make(kind,{name,giftName:'presente de teste'},true);},
  getJob(id){prune();return available.get(id)||null;},
  stop(){jobs.length=0;outbox.length=0;},
  async pump(){if(pumping||!settings.chat||!outbox.length||clock()-lastDispatch<6000)return;pumping=true;lastDispatch=clock();
   try{while(outbox.length&&outbox[0].expiresAt<clock()){outbox.shift();relay.dropped++;}if(!outbox.length)return;
    const ok=await sendChat(outbox[0].text);relay.connected=!!ok;if(ok){outbox.shift();relay.relayed++;relay.lastError=null;}else relay.lastError='Chat aguardando a conexão já configurada no TikFinity.';
   }catch{relay.connected=false;relay.lastError='Relay de chat indisponível.';}finally{pumping=false;}
  },
  snapshot(){prune();return {config:{...settings},jobs:jobs.map(j=>({...j})),relay:{...relay,queued:outbox.length,receipt:'relay-only'}};},
  exportSeen:()=>[...welcomed],
 };
}

// Admission happens before narration. Only a real accepted state transition announces a vacancy.
export function receiveAudienceAction(engine,audience,action){
 const before=engine.entryStatus(action.id),remembered=engine.identity(action.id),accepted=engine.apply(action),after=engine.entryStatus(action.id);
 const registration=accepted&&action.kind==='like'?(after.current&&!before.current?'current':after.next&&!before.next&&!before.alive?'next':null):null;
 audience.receive({...action,name:action.name||remembered?.name,following:action.following??engine.identity(action.id)?.following,entryClosed:!after.entryOpen,inGame:after.current||after.next,registration});
 return accepted;
}
