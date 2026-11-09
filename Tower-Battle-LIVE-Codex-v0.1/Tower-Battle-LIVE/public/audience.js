export const SPEECH_BOUNDS=Object.freeze({x:64,y:1360,width:952,height:78});
export function speechPages(value,max=76){
 const chunks=String(value).trim().split(/\s+/).flatMap(word=>{const chars=Array.from(word),parts=[];while(chars.length)parts.push(chars.splice(0,max).join(''));return parts;});
 const pages=[];let page='';for(const chunk of chunks){if(page&&Array.from(page+' '+chunk).length>max){pages.push(page);page=chunk;}else page+=(page?' ':'')+chunk;}if(page)pages.push(page);return pages.length?pages:[''];
}
export function createAudienceUI({studio=false,document:doc=globalThis.document,AudioClass=globalThis.Audio,fetcher=globalThis.fetch,onSpeaking=()=>{},clock=Date.now}={}){
 const empty={value:'',checked:false,textContent:'',hidden:true};const $=id=>doc.getElementById(id)||empty,audio=new AudioClass(),seen=new Set(),queue=[];
 let state=null,active=null,controller=null,ready=false,blocked=false,initialized=false,retryAt=0,url=null,generation=0,preview=false,priming=false,playTimer=null;
 const unlock=doc.createElement('button');unlock.type='button';unlock.className='voice-unlock';unlock.textContent='Ativar narrador';unlock.hidden=true;if(!studio)doc.querySelector('.preview').append(unlock);
 const caption=doc.createElement('div');caption.className='voice-caption';caption.hidden=true;doc.querySelector('.preview').append(caption);
 const status=t=>$('audienceStatus').textContent=t;
 function cleanup(){clearTimeout(playTimer);playTimer=null;audio.ontimeupdate=null;if(url){URL.revokeObjectURL(url);url=null;}caption.hidden=true;onSpeaking(false);}
 function stop(){generation++;controller?.abort();audio.pause();audio.onended=audio.onerror=null;active=null;queue.length=0;cleanup();}
 async function prime(){
  if(ready)return true;if(priming)return false;priming=true;
  audio.src='/voice-unlock.wav';audio.volume=state?.config.volume??.8;
  try{await audio.play();audio.pause();ready=true;blocked=false;unlock.hidden=true;return true;}
  catch{blocked=true;unlock.hidden=false;status('Clique em Ativar narrador na arena para liberar as vozes.');return false;}finally{priming=false;}
 }
 async function pump(){
  if(active||!ready||blocked||clock()<retryAt||(!studio&&!preview)||(!state?.config.voice&&!preview))return;
  queue.sort((a,b)=>b.priority-a.priority);const job=queue.shift();if(!job)return;
  if(job.expiresAt<=clock())return pump();active=job;const token=++generation,abort=new AbortController();controller=abort;
  const timer=setTimeout(()=>abort.abort(),20000);
  try{
   status('Gerando fala com a API salva...');
   const r=await fetcher('/api/audience/audio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id}),signal:abort.signal});
   if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'API de voz indisponível.');}
   const blob=await r.blob();if(!blob.type.startsWith('audio/')||!blob.size)throw Error('Áudio inválido.');if(token!==generation)return;if(job.expiresAt<=clock()){active=null;cleanup();void pump();return;}
   url=URL.createObjectURL(blob);audio.src=url;audio.volume=state.config.volume;const pages=speechPages(job.text);caption.textContent=pages[0];caption.hidden=false;
   audio.ontimeupdate=()=>{const progress=Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:audio.currentTime/(pages.length*5);caption.textContent=pages[Math.min(pages.length-1,Math.max(0,Math.floor(progress*pages.length)))];};
   audio.onended=()=>{if(token!==generation)return;active=null;cleanup();status('Narrador pronto.');void pump();};
   audio.onerror=()=>{if(token!==generation)return;active=null;cleanup();retryAt=clock()+30000;status('Falha ao tocar a voz. Nova tentativa em 30s.');};
   await audio.play();if(token!==generation)return;playTimer=setTimeout(()=>{if(token!==generation)return;audio.pause();active=null;cleanup();status('A fala demorou a terminar. Narrador liberado.');void pump();},45000);onSpeaking(true,job);status('Narrador falando pela API.');
  }catch(e){if(token!==generation)return;active=null;cleanup();
   if(e.name==='NotAllowedError'){ready=false;blocked=true;unlock.hidden=false;status('Clique em Ativar narrador para liberar o áudio.');}
   else{retryAt=clock()+30000;status(e.name==='AbortError'?'API de voz demorou a responder.':e.message);}
  }finally{clearTimeout(timer);}
 }
 unlock.onclick=async()=>{retryAt=0;if(await prime()){status('\u00c1udio liberado.');void pump();}};
 if(!studio)for(const key of ['voice','chat'])$('audience'+(key==='voice'?'Voice':'Chat')).onchange=()=>save({[key]:$('audience'+(key==='voice'?'Voice':'Chat')).checked});
 if(!studio)$('audienceCharacter').onchange=()=>save({previewTeam:$('audienceCharacter').value});
 if(!studio)$('audienceVolume').onchange=()=>save({volume:Number($('audienceVolume').value)/100});
 async function save(body){try{const r=await fetcher('/api/audience/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error();update((await r.json()).audience);}catch{status('Não foi possível salvar o narrador.');}}
 if(!studio)for(const kind of ['welcome','gift','winner'])$('test'+kind).onclick=async()=>{
  preview=true;stop();retryAt=0;const token=generation;if(!await prime()||token!==generation)return;
  try{const r=await fetcher('/api/audience/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,team:$('audienceCharacter').value||'A',name:'Trabalhador de teste'})});if(!r.ok)throw Error();const {job}=await r.json();if(token!==generation)return;queue.push(job);void pump();}catch{status('Não foi possível iniciar o teste local.');}
 };
 function update(value,mode='live'){
  if(!value)return;state=value;const c=value.config;
  $('audienceVoice').checked=c.voice;$('audienceChat').checked=c.chat;$('audienceCharacter').value=c.previewTeam||'A';$('audienceVolume').value=Math.round(c.volume*100);audio.volume=c.volume;
  $('audienceRelay').textContent=value.relay.connected?'Chat conectado ao relay local · a entrega no TikTok precisa ser conferida.':value.relay.lastError||'Chat reutiliza a conexão TikFinity em 127.0.0.1:4173/chatbot.';
  if(!initialized){initialized=true;for(const j of value.jobs)seen.add(j.id);status(value.voice.configured?'Chefes da obra prontos \u00b7 API de voz salva.':'Não foi possível carregar a configuração privada de voz.');}
  if(!c.voice||mode!=='live'){if(active&&!preview)stop();queue.length=0;for(const j of value.jobs)seen.add(j.id);return;}
  if(!studio)return;
  if(c.voice&&value.voice.configured&&!ready&&!blocked)void prime();
  for(const job of value.jobs){if(job.test||job.simulate||seen.has(job.id))continue;seen.add(job.id);if(seen.size>500)seen.delete(seen.values().next().value);if(['deathmatch','winner'].includes(job.kind))for(let i=queue.length-1;i>=0;i--)if(['start','closing','taunt','deathmatch'].includes(queue[i].kind))queue.splice(i,1);if(job.expiresAt>clock())queue.push(job);}
  while(queue.length>5)queue.shift();if(!blocked&&value.voice.configured)void pump();
 }
 if(studio)doc.addEventListener?.('pointerdown',()=>{if(!ready){blocked=false;void prime().then(ok=>{if(ok)void pump();});}},{passive:true});
 return {update,stop};
}
