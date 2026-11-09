import {createAudienceUI} from '/audience.js';
import {createBroadcastUI} from '/broadcast-ui.js';
import {drawArena,renderDiagnostics,setNarratorState} from '/render.js';
import {createEntryControls} from '/game-entry.js';
const $=id=>document.getElementById(id),canvas=$('arena');
document.body.classList.toggle('studio',new URLSearchParams(location.search).get('studio')==='1');
document.title=document.body.classList.contains('studio')?'Tower Battle LIVE — Tela da LIVE':'Tower Battle LIVE — Painel de testes';
let view=null,status='Carregando sessão local…',feedOpen=false,formReady=false,frames=0,fps=0,lastFps=performance.now();
const broadcastUI=createBroadcastUI({nativeGiftsOnly:true,stage:document.querySelector('.preview'),host:document.querySelector('aside'),api,getMode:()=>view?.mode});
const narrator=createAudienceUI({studio:false,onSpeaking:(speaking,job)=>setNarratorState({speaking,team:job?.team,kind:job?.kind})});
const entryControls=createEntryControls({host:document.querySelector('aside')});
const labels={disconnected:'TikFinity desconectado',connecting:'Conectando ao TikFinity…',connected:'WebSocket aberto · aguardando primeiro evento real',receiving:'Eventos da LIVE recebidos',inactive:'Sem eventos há mais de 60s · socket aberto',retrying:'TikFinity indisponível · reconectando',ended:'LIVE encerrada pelo provedor'};
async function api(route,body){
 try{const response=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const result=await response.json();if(!response.ok)throw Error(result.error);update(result);$('notice').textContent='';return result;}
 catch(error){$('notice').textContent=error.message;}
}
function update(next){
 view=next;broadcastUI.update(next);narrator.update(next.audience,next.audienceActive?'live':'stopped');const c=next.connection;
 status=!feedOpen?'Reconectando à sessão local…':next.mode==='live'?labels[c.status]:next.mode==='replay'?'REPLAY TÉCNICO · sem efeitos na LIVE':'SIMULAÇÃO · sem efeitos na LIVE';
 $('connection').textContent=status;$('lastEvent').textContent=next.latest;
 $('mode').value=next.mode==='replay'?'simulation':next.mode;
 const at=c.lastEventAt?new Date(c.lastEventAt).toLocaleTimeString('pt-BR'):'nenhum';
 $('diagnostics').textContent=`Último evento real: ${c.lastEvent||'nenhum'} às ${at}\nRecebidos: ${c.received} · inválidos: ${c.invalid} · reconexões: ${c.reconnects}\nEndpoint: ${c.endpoint||'nenhum'}\nÚltima falha: ${c.lastFailure||'nenhuma'}`;
 $('demoControls').inert=next.mode!=='simulation';$('demoControls').classList.toggle('disabled',next.mode!=='simulation');
 $('ranking').replaceChildren();
 const rows=next.game.ranking||[];
 if(!rows.length)$('ranking').textContent='Os construtores aparecem aqui após participar.';
 rows.forEach((r,i)=>{const row=document.createElement('p');row.textContent=`${i+1}. ${r.name} · ${r.blocks} blocos · ${r.wins} vitórias`; $('ranking').append(row);});
 $('rankMode').textContent=next.mode==='live'?'Ranking local da LIVE · salvo em SQLite':'Ranking de teste · isolado';
 $('pending').textContent=next.game.pendingRules?'Configuração salva: será aplicada na próxima rodada.':'';
 if(!formReady){
   formReady=true;
   const fields=$('ruleFields');
   const names={roundSeconds:'Duração da rodada (s)',intermissionSeconds:'Intervalo (s)',attackIntervalSeconds:'Intervalo de ataques (s)',maxHp:'Vida da torre',maxBlocks:'Limite de blocos',chatCooldownSeconds:'Cooldown do chat (s)',likesPerBlock:'Curtidas por bloco',maxLikesPerEvent:'Curtidas máximas por evento',giftBlocks:'Blocos por reforço',giftShield:'Escudo por reforço',maxGiftEffectsPerUserRound:'Reforços por usuário / rodada'};
   for(const [key,range] of Object.entries(next.limits)){
     const label=document.createElement('label');label.textContent=names[key];const input=document.createElement('input');input.type='number';input.name=key;input.min=range[0];input.max=range[1];input.step=key.endsWith('Seconds')?'.1':'1';input.value=next.rules[key];input.required=true;label.append(input);fields.append(label);
   }
   $('autoRestart').checked=next.rules.autoRestart;$('giftsEnabled').checked=next.settings.giftsEnabled;$('giftIds').value=next.settings.giftIds.join(', ');
 }
}
const stream=new EventSource('/api/stream');
stream.onopen=()=>{feedOpen=true;};
stream.onmessage=event=>{try{update(JSON.parse(event.data));}catch{$('notice').textContent='Falha ao ler sessão';}};
stream.onerror=()=>{feedOpen=false;status='Servidor local indisponível · reconectando';$('connection').textContent=status;};
$('mode').onchange=()=>api('mode',{mode:$('mode').value});
$('connect').onclick=()=>api('connect');$('disconnect').onclick=()=>api('disconnect');
for(const [id,team,event] of [['demoA','A','chat'],['demoB','B','chat'],['likesA','A','like'],['likesB','B','like'],['giftA','A','gift'],['giftB','B','gift']])$(id).onclick=()=>api('demo',{team,event});
$('studioUrl').textContent=location.origin+'/?studio=1#tiktok.studio';$('studioLink').href=location.origin+'/?studio=1';
$('copyUrl').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/?studio=1#tiktok.studio');$('copyUrl').textContent='Copiado!';}catch{$('notice').textContent='Copie o endereço exibido acima.';}};
$('configForm').onsubmit=async event=>{event.preventDefault();const rules={autoRestart:$('autoRestart').checked};for(const input of $('ruleFields').querySelectorAll('input'))rules[input.name]=Number(input.value);await api('config',{rules,giftsEnabled:$('giftsEnabled').checked,giftIds:$('giftIds').value.split(',').map(x=>x.trim()).filter(Boolean)});};
$('replayFile').onchange=async()=>{const file=$('replayFile').files[0];if(!file)return;try{if(file.size>8000000)throw Error('Arquivo deve ter até 8 MB');const events=JSON.parse(await file.text());await api('replay',{events});}catch(error){$('notice').textContent=error.message;}finally{$('replayFile').value='';}};
$('sampleReplay').onclick=async()=>{const result=await fetch('/replay-example.json');await api('replay',{events:await result.json()});};
function frame(now){
 frames++;if(now-lastFps>1000){fps=Math.round(frames*1000/(now-lastFps));frames=0;lastFps=now;$('renderStatus').textContent=`${renderDiagnostics().renderer} · ${fps} FPS · ${renderDiagnostics().failure}`;}
 if(view)drawArena(canvas,view.game,now,status,view.latest,view.mode,view.broadcast,{preview:entryControls.preview,page:entryControls.page});
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
