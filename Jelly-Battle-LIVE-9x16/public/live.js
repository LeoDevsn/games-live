let liveSocket=null,liveRetry=null,liveWanted=false,liveRouter=null,liveConfig=null,liveRetryCount=0;
let liveAddresses=[],liveAddressIndex=0,botOverlay=null;
let lastLiveWelcomeAt=-Infinity,liveVoiceGeneration=0;
async function inviteLiveViewer(event,now=Date.now()){
 if(!dynamicVoiceSettings.welcomes||now-lastLiveWelcomeAt<20000)return;
 lastLiveWelcomeAt=now;const generation=liveVoiceGeneration;await refreshCloudStatus();if(generation!==liveVoiceGeneration||!dynamicVoiceSettings.welcomes)return;
 for(const t of ['A','B'])voiceLine(phraseFor(t,'welcome',event.who),t,'welcome',false,{who:event.who,dynamic:true});
}
const studioMode=new URLSearchParams(location.search).get('studio')==='1';
document.body.classList.toggle('studio-mode',studioMode);
document.title=studioMode?'Jelly Battle — Tela da LIVE 9:16':'Jelly Battle — Painel de testes';
function liveStatus(text){$('liveStatus').textContent=text;$('connectionBadge').textContent=text;$('arenaConnection').textContent=studioMode?'':text}
function waitForTeam(){
  if(running||preparing)return;
  $('state').textContent='AGUARDANDO ESCOLHA DE TIME';
  $('startoverlay').style.display='flex';
  if(studioMode){
    $('start').textContent='AGUARDANDO A OU B NO CHAT';
    $('start').disabled=true;
    $('startoverlay').querySelector('span').textContent='Digite A para Bob Esponja ou B para Patrick no chat da live';
  }
  notify('Esperando alguém escolher o Time A ou B no chat da live.');
}
async function attachBotOverlay(){
  try{
    const res=await fetch('/api/live/overlay',{cache:'no-store'});if(!res.ok)return;
    const config=await res.json();if(!config.url||!liveWanted||botOverlay)return;
    const target=new URL(config.url);if(target.protocol!=='https:'||target.hostname!=='widgets.tikfinity.com')return;
    const frame=document.createElement('iframe');frame.src=target.href;frame.title='Convites do Jelly Battle';frame.className='bot-overlay';frame.referrerPolicy='no-referrer';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
    document.body.append(frame);botOverlay=frame;
  }catch{}
}
async function loadLiveConfig(){
  if(liveConfig)return liveConfig;
  const res=await fetch('live-config.json',{cache:'no-store'});
  if(!res.ok)throw Error('Não foi possível carregar live-config.json. Use INICIAR.bat.');
  const cfg=await res.json(),url=new URL(cfg.websocketUrl);
  if(!['ws:','wss:'].includes(url.protocol)||!Array.isArray(cfg.gifts))throw Error('Configuração do TikFinity inválida.');
  liveConfig=cfg;liveRouter=JellyLive.createRouter(cfg);
  // Some Windows setups resolve localhost to IPv6, while TikFinity listens on IPv4.
  liveAddresses=[url.href];
  if(url.hostname==='localhost')liveAddresses.push(url.href.replace('localhost','127.0.0.1'));
  else if(url.hostname==='127.0.0.1')liveAddresses.push(url.href.replace('127.0.0.1','localhost'));
  return cfg;
}
function receiveLiveEvent(message){
  const invitation=liveRouter.audience(message);if(invitation){$('lastLiveEvent').textContent=invitation.text;notify(invitation.text);inviteLiveViewer(invitation);}
  const event=liveRouter.route(message);if(!event)return;
  if(event.type==='welcome'){$('lastLiveEvent').textContent=event.text;notify(event.text);inviteLiveViewer(event);return}
  $('lastLiveEvent').textContent=event.type==='join'?`${event.who} escolheu o Time ${event.team}.`:event.type==='unassigned'?`${event.who}: digite A ou B no chat para entrar em um time.`:`${event.who} · Time ${event.team} · ${event.type==='like'?event.count+' likes':event.giftName+' × '+event.count}`;
  if(event.type==='join'){
    // First team choice launches the match immediately, with no manual button or countdown.
    if(!running&&!preparing){$('modal').close();start();speak(phraseFor(event.team,'intro'),event.team,'intro')}
    if(running){participant(event.team,event.who,event.id);render()}
    notify(`${event.who} entrou no Time ${event.team}!`);
    return;
  }
  if(event.type==='like')likes(event.team,event.count,event.who,event.id);
  if(event.type==='gift')gift(event.team,event.seconds,event.who,event.count,{gold:event.gold,userId:event.id});
  if(event.type==='unassigned'&&event.source==='gift'){const t=lastChatter==='A'?'B':'A';lastChatter=t;speak(phraseFor(t,'special',event.who),t,'special',{who:event.who});}
}
async function connectLive(){
  if(!liveWanted){liveWanted=true;liveRetryCount=0;liveAddressIndex=0}
  if(liveSocket&&[0,1].includes(liveSocket.readyState))return;
  clearTimeout(liveRetry);
  try{
    await loadLiveConfig();if(!liveWanted)return;
    $('auto').checked=false;$('auto').disabled=true;
    const endpoint=liveAddresses[liveAddressIndex%liveAddresses.length];
    liveStatus('Conectando ao TikFinity local…');
    const socket=new WebSocket(endpoint);liveSocket=socket;
    socket.onopen=()=>{
      if(liveSocket!==socket)return;
      liveRetryCount=0;liveStatus('TikFinity local conectado · esperando chat');
      $('lastLiveEvent').textContent='WebSocket conectado em '+endpoint+'. Aguarde uma mensagem da LIVE para confirmar que os eventos estão chegando.';
      $('connectLive').textContent='Desconectar TikFinity';attachBotOverlay();
    };
    socket.onmessage=e=>{
      if(liveSocket!==socket)return;
      try{receiveLiveEvent(JSON.parse(e.data))}
      catch(error){console.warn('Jelly Battle: evento TikFinity ignorado',error)}
    };
    socket.onerror=()=>{};
    socket.onclose=()=>{
      if(liveSocket!==socket)return;
      liveSocket=null;if(!liveWanted)return;
      liveAddressIndex++;
      const delay=liveAddresses.length>1&&liveAddressIndex%liveAddresses.length!==0?1200:Math.min(30000,2000*2**Math.min(liveRetryCount++,4));
      liveStatus('TikFinity indisponível · reconectando…');
      $('lastLiveEvent').textContent='Abra o TikFinity Desktop no mesmo PC, conecte sua LIVE e habilite Event API / WebSocket (porta 21213). O jogo tentará novamente.';
      liveRetry=setTimeout(()=>{connectLive()},delay);
    };
  }catch(error){liveWanted=false;$('auto').disabled=false;liveStatus(error.message)}
}
function disconnectLive(){liveVoiceGeneration++;liveWanted=false;clearTimeout(liveRetry);liveSocket?.close();liveSocket=null;botOverlay?.remove();botOverlay=null;$('auto').disabled=false;liveStatus('TikFinity desconectado');$('connectLive').textContent='Conectar TikFinity'}
$('connectLive').onclick=()=>liveWanted?disconnectLive():connectLive();
$('liveSettings').onclick=()=>{$('liveModal').showModal();refreshCloudStatus()};
$('closeLive').onclick=()=>$('liveModal').close();
$('liveModal').onclick=e=>{if(e.target===$('liveModal'))$('liveModal').close()};
$('studioView').href=location.protocol==='file:'?'#':location.origin+'/?studio=1';
if(studioMode){waitForTeam();connectLive()}
else loadLiveConfig().then(config=>{if(config.autoConnect)connectLive()}).catch(error=>liveStatus(error.message));
window.addEventListener('beforeunload',disconnectLive);
