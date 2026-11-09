export function mountAudience(root,{publicView=false}={}){
 const box=document.createElement('div');box.className='audience-guide';box.hidden=true;box.setAttribute('role','status');
 const heading=document.createElement('strong'),body=document.createElement('p'),footer=document.createElement('small');box.append(heading,body,footer);root.append(box);
 let current=null;
 function draw(){if(!current||Date.now()>=current.expiresAt){box.hidden=true;return;}box.hidden=false;
  heading.textContent=current.kind==='help'?'COMO JOGAR · '+current.name:'BEM-VINDO, '+current.name;
  const i=Math.min(current.pages.length-1,Math.floor((Date.now()-current.at)/4500));body.textContent=current.pages[Math.max(0,i)];footer.textContent='!ajuda  ·  !help  ·  !comandos'+(current.simulate?'  /  PRÉVIA LOCAL':'');
 }
 const timer=setInterval(draw,500);
 return {accept(frame){const candidate=frame.audience?.current,next=publicView&&candidate?.simulate?null:candidate;if(next?.id!==current?.id)current=next;draw();},destroy(){clearInterval(timer);box.remove();}};
}

export function createAudiencePanel(){
 const panel=document.getElementById('audience-panel');if(!panel)return {accept(){},update(){}};
 const $=id=>document.getElementById(id),guide=mountAudience($('arena'));
 let enabled=false,busy=false,lastVoice=0,latest=null,audio=null,abort=null,generation=0;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('fw-guide-voice'):null;
 function status(text){$('audience-voice-status').textContent=text;}
 function stop(){generation++;abort?.abort();audio?.pause();audio=null;window.speechSynthesis?.cancel();busy=false;}
 function disable(){enabled=false;stop();$('audience-enable-voice').textContent='Ativar voz neste painel';status('Voz desligada neste painel.');}
 channel?.addEventListener('message',event=>{if(event.data==='active')disable();});
 async function speak(job){
  if(!enabled||busy||job.expiresAt<=Date.now())return;lastVoice=job.id;busy=true;const token=++generation;
  const watchdog=setTimeout(()=>{if(token===generation){stop();status('Tempo da fala esgotado. A próxima orientação poderá tocar.');}},job.engine==='fish'?45000:25000);
  try{
   if(job.engine==='fish'){
    status('Gerando voz Fish Audio…');abort=new AbortController();const r=await fetch('/api/audience/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:job.text.startsWith('Para jogar')?'help':'welcome'}),signal:abort.signal});
    if(!r.ok){const e=await r.json();throw Error(e.error||'API de voz indisponível');}const blob=await r.blob();if(token!==generation)return;
    const url=URL.createObjectURL(blob);audio=new Audio(url);audio.volume=job.volume;
    try{await new Promise((resolve,reject)=>{audio.onended=resolve;audio.onerror=()=>reject(Error('Falha ao reproduzir áudio'));audio.play().then(()=>status('Falando · Fish Audio')).catch(reject);});}finally{URL.revokeObjectURL(url);}
   }else{
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)throw Error('Este navegador não oferece voz. Use Fish Audio.');
    await new Promise(resolve=>{const utterance=new SpeechSynthesisUtterance(job.text);utterance.lang='pt-BR';utterance.volume=job.volume;utterance.rate=1.03;
     const voices=window.speechSynthesis.getVoices();utterance.voice=voices.find(v=>/^pt[-_]BR/i.test(v.lang))||voices.find(v=>/^pt/i.test(v.lang))||null;
     utterance.onend=resolve;utterance.onerror=()=>{status('Voz bloqueada. Clique em Ativar voz novamente.');resolve();};status('Falando · voz do navegador');window.speechSynthesis.speak(utterance);});
   }
  }catch(e){if(token===generation)status(e.name==='NotAllowedError'?'Áudio bloqueado. Clique em Ativar voz novamente.':e.message);}
  finally{clearTimeout(watchdog);if(token===generation)busy=false;}
 }
 async function post(body){const r=await fetch('/api/audience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const v=await r.json();if(!r.ok)throw Error(v.error);update(v);return v;}
 function update(v){const a=v.audience||v;if(!a.config)return;latest=a;
  for(const [id,key]of [['audience-welcome','welcome'],['audience-help','help'],['audience-chat','chat'],['audience-voice','voice']])$(id).checked=a.config[key];
  $('audience-engine').value=a.config.voiceEngine;
  const bot=a.chatbot;$('audience-chat-status').textContent=bot?.connected?`Relay TikFinity conectado · ${bot.forwarded} mensagens encaminhadas. Confira a entrega no chat.`:'Chat do TikTok: aguardando configurar o relay no TikFinity (veja abaixo).';
  $('audience-counters').textContent=`${a.welcomed} boas-vindas · ${a.helped} pedidos de ajuda · ${a.queued} respostas na fila`;
  if(!a.config.voice)stop();
 }
 $('audience-save').onclick=()=>post({action:'configure',config:{welcome:$('audience-welcome').checked,help:$('audience-help').checked,chat:$('audience-chat').checked,voice:$('audience-voice').checked,voiceEngine:$('audience-engine').value}}).catch(e=>status(e.message));
 $('audience-test-welcome').onclick=()=>post({action:'test',kind:'welcome'}).catch(e=>status(e.message));
 $('audience-test-help').onclick=()=>post({action:'test',kind:'help'}).catch(e=>status(e.message));
 $('audience-enable-voice').onclick=()=>{
  if(enabled){disable();return;}enabled=true;channel?.postMessage('active');$('audience-enable-voice').textContent='Desligar voz neste painel';
  // User gesture unlocks Web Speech. Real welcomes remain rate-limited by the server.
  if(latest?.config.voiceEngine!=='fish'&&window.speechSynthesis){const u=new SpeechSynthesisUtterance('Orientações por voz ativadas.');u.lang='pt-BR';window.speechSynthesis.speak(u);}
  status('Voz ativa. Mantenha este painel aberto e capture o áudio do computador na transmissão.');
 };
 $('audience-check-api').onclick=async()=>{try{const r=await fetch('/api/audience/voice-status'),v=await r.json();status(v.configured?'Fish Audio pronta · voz A do Jelly.':v.lastError||'Configure a voz A no Jelly Battle em /setup.html.');}catch{status('Não foi possível consultar a API.');}};
 return {update,accept(frame){guide.accept(frame);if((frame.paused||frame.demo)&&!frame.audience?.voice?.simulate||!frame.audience?.config?.voice){if(busy)stop();return;}
  const job=frame.audience?.voice;if(job&&job.id!==lastVoice&&enabled&&!busy)speak(job);
 }};
}
