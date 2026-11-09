import {randomUUID} from 'node:crypto';
const clean=value=>String(value??'trabalhador').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,45);
export function phrase(team,kind,{name='trabalhador',giftName='presente'}={}){
 const who=clean(name),gift=clean(giftName);
 const lines=team==='A'?{
  welcome:`${who}, o Siri Cascudo está contratando! Comente A para trabalhar comigo ou B para o Plankton. Quero essa torre maior que a dele!`,
  join:`Muito bem, ${who}! Bem-vindo à minha equipe. Comente A para levantar blocos e mande likes para acelerar a obra!`,
  gift:`Obrigado pelo ${gift}, ${who}! Esse reforço vale ouro! Trabalhadores, vamos construir e proteger a nossa torre!`,
  start:'Mãos à obra, trabalhadores! Comente A para construir com o Sr. Sirigueijo. Não vamos deixar o Plankton ganhar essa disputa!',
  taunt:'Equipe do Siri Cascudo, quero ver serviço! Comente A, mande likes e faça essa torre crescer!',
  winner:'Excelente trabalho, equipe do Siri Cascudo! Nossa torre venceu! Preparem as ferramentas para a próxima construção!',
  help:'Tower Battle: A constrói para o Sr. Sirigueijo; B constrói para o Plankton. Repita a letra do seu time respeitando o intervalo. Likes levantam blocos e presentes reforçam a construção. As torres atacam automaticamente!'
 }:{
  welcome:`${who}, meu plano precisa de bons trabalhadores! Comente B para construir comigo ou A para o Sirigueijo. Vamos erguer a torre do Plankton!`,
  join:`${who}, finalmente um trabalhador para meu plano perfeito! Comente B e mande likes para erguer nossa torre!`,
  gift:`Um ${gift} para minha obra? Excelente, ${who}! Esse reforço vai nos ajudar a superar o Sirigueijo!`,
  start:'Operação torre perfeita iniciada! Trabalhadores, comentem B e construam comigo. Essa vitória será do Plankton!',
  taunt:'Trabalhadores do Plankton, não parem! Comente B, mande likes e ajude a construir minha torre perfeita!',
  winner:'Finalmente! Meus trabalhadores construíram a torre vencedora! Sirigueijo, contemple o meu plano perfeito!',
  help:'Escolha seu chefe: A para o Sr. Sirigueijo, B para o Plankton. Cada comentário válido constrói um bloco. Likes e presentes ajudam seu time. Não é possível trocar de equipe na mesma rodada. Construa e proteja sua torre!'
 };
 if(!(kind in lines))throw Error('Tipo de fala desconhecido');return lines[kind];
}
export function createAudience({clock=Date.now,seen=[],config={},save=()=>{},onMessage=()=>{},sendChat=async()=>false}={}){
 let settings={voice:true,chat:true,volume:.8,previewTeam:'A',...config},serial=0,turn=0,lastWelcome=-Infinity,lastJoin=-Infinity,lastGift=-Infinity,lastNarration=-Infinity,lastDispatch=-Infinity,pumping=false,observedPhase=null,observedRound=null;
 const session=randomUUID(),welcomed=new Map(seen),joined=new Set(),available=new Map(),jobs=[],outbox=[];
 const relay={connected:false,relayed:0,dropped:0,lastError:null};
 function prune(){const at=clock();for(const [id,t]of welcomed)if(at-t>600000)welcomed.delete(id);for(const [id,j]of available)if(at>j.availableUntil)available.delete(id);while(jobs.length&&jobs[0].expiresAt<at)jobs.shift();}
 function make(kind,team,details={},test=false){
  prune();const at=clock(),job={id:session+':'+(++serial),kind,team,text:phrase(team,kind,details),at,expiresAt:at+(kind==='start'?15000:45000),priority:{welcome:1,join:1,help:1,gift:2,start:2,taunt:0,winner:3}[kind],test};
  available.set(job.id,{...job,availableUntil:at+120000});if(available.size>100)available.delete(available.keys().next().value);
  if(!test){lastNarration=at;if(settings.voice){jobs.push(job);if(jobs.length>8)jobs.shift();}onMessage(job);if(settings.chat){if(outbox.length>=8){outbox.shift();relay.dropped++;}outbox.push(job);}}return job;
 }
 return {
  receive(action,game){
   prune();const at=clock(),team=action.team||(['A','B'][turn%2]);const narrate=kind=>{if(!action.team)turn++;return make(kind,team,action);};
   if(action.kind==='gift'){if(at-lastGift<10000)return;lastGift=at;return narrate('gift');}
   if(action.kind==='join'){
    const key=game.round+':'+action.id;if(joined.has(key))return;joined.add(key);if(joined.size>10000)joined.delete(joined.values().next().value);welcomed.set(action.id,at);
    if(at-lastJoin<20000||at-lastNarration<8000)return;lastJoin=at;return narrate('join');
   }
   if(action.kind==='help'){if(at-lastNarration<12000)return;return narrate('help');}
   if(!['identity','like'].includes(action.kind)||welcomed.has(action.id)||at-lastWelcome<25000||at-lastNarration<12000)return;
   welcomed.set(action.id,at);if(welcomed.size>10000)welcomed.delete(welcomed.keys().next().value);lastWelcome=at;return narrate('welcome');
  },
  observe(game){
   const at=clock();if(observedRound===null){observedRound=game.round;observedPhase=game.phase;if(game.phase!=='waiting')lastNarration=at;return;}
   const changed=game.round!==observedRound||game.phase!==observedPhase;observedRound=game.round;observedPhase=game.phase;
   if(changed&&game.phase==='intermission'&&['A','B'].includes(game.lastWinner))return make('winner',game.lastWinner);
   if(changed&&game.phase==='running')return make('start',['A','B'][turn++%2]);
   if(game.phase==='running'&&at-lastNarration>=45000)return make('taunt',['A','B'][turn++%2]);
  },
  configure(input){const next={...settings};for(const k of ['voice','chat'])if(typeof input[k]==='boolean')next[k]=input[k];if('volume'in input){if(!Number.isFinite(input.volume)||input.volume<0||input.volume>1)throw Error('Volume inválido');next.volume=input.volume;}if('previewTeam'in input){if(!['A','B'].includes(input.previewTeam))throw Error('Voz inválida');next.previewTeam=input.previewTeam;}settings=next;save(settings);if(!settings.voice)jobs.length=0;if(!settings.chat)outbox.length=0;},
  test(kind,team='A'){if(!['A','B'].includes(team)||!['welcome','gift','winner'].includes(kind))throw Error('Prévia inválida');return make(kind,team,{name:'Trabalhador de teste'},true);},
  getJob(id){prune();return available.get(id)||null;},
  stop(){jobs.length=0;outbox.length=0;},
  snapshot(){prune();return {config:{...settings},jobs:jobs.map(j=>({...j})),relay:{...relay,queued:outbox.length,receipt:'relay-only'}};},
  exportSeen:()=>[...welcomed],
  async pump(){if(pumping||!settings.chat||!outbox.length||clock()-lastDispatch<12000)return;pumping=true;lastDispatch=clock();try{while(outbox.length&&outbox[0].expiresAt<clock()){outbox.shift();relay.dropped++;}if(!outbox.length)return;const ok=await sendChat(outbox[0].text);relay.connected=!!ok;if(ok){outbox.shift();relay.relayed++;relay.lastError=null;}else relay.lastError='Chat aguardando o relay da plataforma.';}catch{relay.connected=false;relay.lastError='Relay indisponível.';}finally{pumping=false;}}
 };
}
