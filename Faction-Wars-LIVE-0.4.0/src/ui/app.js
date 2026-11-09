import {createArena} from './arena-scene.js';
import {createAudiencePanel} from './audience-ui.js';
const $=id=>document.getElementById(id);
let view=null,selected=null,lastSequence=-1,polling=false,visualError='';
const arena=createArena(id=>{selected=id;updateInspector();});
const audiencePanel=createAudiencePanel();
window.addEventListener('error',event=>{visualError=event.message;$('error').textContent=visualError;});
document.addEventListener('arena-error',event=>{visualError=event.detail;$('error').textContent=visualError;});
document.addEventListener('arena-ready',()=>{$('loading').hidden=true;});
async function api(path,body){
 const response=await fetch('/api/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
 const result=await response.json();
 if(!response.ok){$('error').textContent=result.error;throw Error(result.error);}
 view=result;update();return result;
}
function control(action,extra={}){return api('control',{action,...extra}).catch(()=>{});}
function send(kind,payload){return api('event',{actorId:$('actor').value,kind,payload}).catch(()=>{});}
for(const [id,action] of [['live-start','start'],['live-resume','resume'],['live-connect','connect'],['live-stop','disconnect']])if($(id))$(id).onclick=()=>api('live',{action}).catch(()=>{});
if($('copy-source'))$('copy-source').onclick=async()=>{const url='http://127.0.0.1:4176/#tiktok.studio';try{await navigator.clipboard.writeText(url);$('source-feedback').textContent='URL copiada. Use 1080 × 1920 na Fonte Navegador.';}catch{$('source-feedback').textContent='Copie esta URL: '+url;}};
$('demo').onclick=()=>control('new',{demo:true});$('new').onclick=()=>control('new',{demo:false});
$('toggle').onclick=()=>control(view?.paused?'resume':'pause');$('step').onclick=()=>control('step');$('recover').onclick=()=>control('recover');
$('speed').onchange=()=>control('speed',{speed:Number($('speed').value)});
for(const [id,faction] of [['red','R'],['blue','S']])$(id).onclick=()=>send('joinFaction',{faction,name:$('name').value});
$('likes').onclick=()=>send('likesDelta',{delta:Number($('delta').value)});$('send').onclick=()=>send('command',{text:$('command').value});
$('command').addEventListener('keydown',event=>{if(event.key==='Enter')send('command',{text:$('command').value});});
$('focus').onclick=()=>{document.body.classList.toggle('focus-arena');$('focus').textContent=document.body.classList.contains('focus-arena')?'Mostrar painel':'Foco na arena';window.dispatchEvent(new Event('resize'));};
function updateInspector(){
 const box=$('inspector');box.replaceChildren();
 if(!selected||!view){box.textContent='Clique em uma tropa para ver classe, vida e estatísticas.';return;}
 const u=view.state.units.find(u=>u.id===selected),s=view.state.stats[selected];
 if(!u||!s){selected=null;updateInspector();return;}
 const name=u.champion?(view.state.people[u.actorId]?.name||'Campeão genérico'):'Tropa comum';
 const title=document.createElement('strong');title.textContent=`${{G:'Guerreiro',D:'Defensor',A:'Arqueiro',C:'Cerco'}[u.kind]} · ${name}`;box.append(title);
 const info=document.createElement('p');info.textContent=`${u.faction==='R'?'Aliança Rubra':'Coalizão Safira'} · ${['Esquerda','Centro','Direita'][u.lane]} · ${u.hp>0?u.hp+' HP':'Eliminado'}`;box.append(info);
 const stats=document.createElement('p');stats.textContent=`${s.kills} eliminações · ${s.unitDamage} dano tropas · ${s.received} recebido · ${(s.zoneMs/1000).toFixed(1)}s na zona · ${s.nexusDamage} dano Nexus · ${(s.aliveMs/1000).toFixed(1)}s vivo`;box.append(stats);
}
function update(){
 if(!view)return;const s=view.state;
 audiencePanel.update(view);
 const l=view.live;if(l){const labels={disconnected:'Desconectado',connecting:'Conectando…',connected:'WebSocket aberto · aguardando evento real',receiving:'Eventos reais recebidos',inactive:'Conectado · sem eventos há mais de 60s',retrying:'Reconectando automaticamente',ended:'LIVE encerrada pelo provedor'};$('live-status').textContent=(l.enabled?'CONTROLE LIVE ATIVO · ':'MONITOR · ')+labels[l.status];$('live-detail').textContent=`${l.received} eventos · ${l.applied} ações encaminhadas · último: ${l.lastEvent||'nenhum'} · ${l.lastReason||l.lastFailure||'sem falhas'}`;}
 if(l){$('input-details').inert=l.enabled;$('live-ready').textContent=l.enabled?(view.waitingForFirstJoin?'Jogo armado: aguardando o primeiro !vermelho ou !azul. A preparação de 25s começa nesse comentário.':view.paused?'Partida LIVE pausada. Use Retomar LIVE salva para continuar.':'Partida LIVE em andamento. As próximas rodadas são automáticas.'):'Clique em Nova partida LIVE para preparar o jogo.';if(l.status==='retrying'||l.status==='disconnected')$('live-ready').textContent+=' Abra o TikFinity neste PC e conecte sua live.';}
 $('toggle').textContent=view.paused?'▶ Retomar':'Ⅱ Pausar';$('toggle').classList.toggle('running',!view.paused);
 $('operation').textContent=`${view.paused?'PAUSADO':view.waitingForFirstJoin?'AGUARDANDO A AUDIÊNCIA':view.live?.enabled?'LIVE EM ANDAMENTO':'SIMULAÇÃO LOCAL'} · ${s.units.filter(u=>u.hp>0).length} tropas vivas`;
 const wave=s.profile.siegeWaveMs??20000;
 const siege=s.phase==='combat'?`Próxima onda de Cerco em ${Math.max(0,Math.ceil((s.nextWave-s.combatMs)/1000))}s · ondas a cada ${wave/1000}s`:'Cerco inicial no começo do combate';
 $('combat-details').textContent=[siege,...['S','R'].map(f=>{const t=s.teams[f],window=t.window?Math.max(0,Math.ceil((t.window.end-s.combatMs)/1000))+'s':'fechados',buffs=[];if(t.buffs.speech>s.combatMs)buffs.push('Discurso '+Math.ceil((t.buffs.speech-s.combatMs)/1000)+'s');if(t.buffs.flame>s.combatMs)buffs.push('Chama '+Math.ceil((t.buffs.flame-s.combatMs)/1000)+'s');return `${f==='S'?'Safira':'Rubra'} · ${t.credits}/20 créditos · ${t.energy} energia\n${{balanced:'Equilibrada',offensive:'Ofensiva',defensive:'Defensiva'}[t.stance]} · reforços ${window}${buffs.length?' · '+buffs.join(' / '):''}`;})].join('\n');
 $('error').textContent=view.error||visualError;
 $('movement').textContent=`Movimento das tropas ${s.profile.movementScale??1}×`;
 $('caption').textContent=s.profile.archerRetreat!==false?'Perfil histórico com recuo. Use Nova batalha para aplicar a decisão atual.':`${view.live?.enabled?'TikTok LIVE':view.demo?'Cenário de teste':'Partida local'} · ${view.paused?'Pausado':view.waitingForFirstJoin?'Aguardando o primeiro comentário':s.phase==='preparation'?'Preparação':s.phase==='combat'?'Combate':'Resultados'}`;
 $('version').textContent=`Faction Wars ${view.version||'0.4.5'} · Phaser ${globalThis.Phaser.VERSION} · ${Math.round(globalThis.__fps||0)} FPS medidos · motor20Hz\nPerfil ${s.profile.version} (${s.profileHash}) · regras ${s.rulesVersion}\nSHA256 ${view.hash}\nPartida ${s.id} · tick ${s.tick}`;
 $('diagnostics').textContent=s.diagnostics.slice(-12).map(x=>`${x.tick} / ${x.reason} / ${x.id}`).join('\n');
 $('stats').replaceChildren();
 for(const [id,t] of Object.entries(view.totals)){
  const row=document.createElement('div');row.className='stat-row';
  const name=document.createElement('strong');name.textContent=s.people[id].name;row.append(name);
  const role=document.createElement('small');role.textContent=`${s.people[id].faction==='R'?'Rubra':'Safira'} · energia pessoal${s.people[id].E} · votos${s.people[id].V}`;row.append(role);
  const data=document.createElement('span');data.textContent=`${t.kills} eliminações · ${t.unitDamage} dano tropas · ${t.received} recebido · ${(t.zoneMs/1000).toFixed(1)}s zona · ${t.nexusDamage} dano Nexus · ${(t.aliveMs/1000).toFixed(1)}s vivo`;row.append(data);$('stats').append(row);
 }
 if(!Object.keys(view.totals).length){const p=document.createElement('p');p.textContent='Os participantes fictícios aparecem aqui durante a preparação.';$('stats').append(p);}
 if($('birth-details').open){$('births').replaceChildren();for(const b of Object.values(s.stats).filter(x=>x.champion)){const row=document.createElement('p');row.textContent=`${b.id} / ${b.actorId||'genérico'}: K${b.kills}, D${b.unitDamage}, R${b.received}, Z${b.zoneMs}ms, N${b.nexusDamage}, V${b.aliveMs}ms`;$('births').append(row);}}
 updateInspector();
}
const stream=new EventSource('/api/stream');
stream.onopen=()=>{lastSequence=-1;$('connection').textContent='Simulador conectado';$('connection').classList.remove('disconnected');};
stream.onmessage=event=>{try{const frame=JSON.parse(event.data);if(frame.sequence<lastSequence)return;lastSequence=frame.sequence;arena.accept(frame);audiencePanel.accept(frame);}catch(error){$('error').textContent='Falha visual local: '+error.message;}};
stream.onerror=()=>{$('connection').textContent='Reconectando ao simulador…';$('connection').classList.add('disconnected');};
async function poll(){if(polling)return;polling=true;try{await api('state');}catch(error){$('error').textContent=error.message;}finally{polling=false;}}
$('birth-details').addEventListener('toggle',update);
setInterval(poll,1000);poll();
