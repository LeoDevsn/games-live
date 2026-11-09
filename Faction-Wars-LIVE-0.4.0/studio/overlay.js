import {createArena} from '/src/ui/arena-scene.js';
import {mountAudience} from '/src/ui/audience-ui.js';
const arena=createArena(),root=document.getElementById('arena'),status=document.getElementById('status');
const stream=new EventSource('/api/stream?audience=1'),audience=mountAudience(root,{publicView:true});
const audio=new Audio();let lastVoice=0,busy=false;
async function speak(job){
 if(!job||job.simulate||job.id===lastVoice||busy||job.expiresAt<=Date.now())return;
 lastVoice=job.id;busy=true;
 try{
  if(job.engine==='fish'){
   const r=await fetch('/api/audience/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:job.text.startsWith('Para jogar')?'help':'welcome',id:job.id,public:true})});if(!r.ok)return;
   const url=URL.createObjectURL(await r.blob());audio.src=url;audio.volume=job.volume;
   try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{audio.pause();resolve();},45000);audio.onended=()=>{clearTimeout(timer);resolve();};audio.onerror=()=>{clearTimeout(timer);reject(Error('audio'));};audio.play().catch(e=>{clearTimeout(timer);reject(e);});});}finally{URL.revokeObjectURL(url);}
  }else if(window.speechSynthesis){
   await new Promise(resolve=>{const voice=new SpeechSynthesisUtterance(job.text);voice.lang='pt-BR';voice.volume=job.volume;voice.rate=1.03;voice.onend=voice.onerror=resolve;window.speechSynthesis.speak(voice);setTimeout(resolve,25000);});
  }
 }catch{}finally{busy=false;}
}
stream.onmessage=event=>{try{const frame=JSON.parse(event.data);arena.accept(frame);audience.accept(frame);void speak(frame.audience?.voice);status.hidden=true;}catch{status.textContent='A batalha começa em instantes.';status.hidden=false;}};
stream.onerror=()=>{status.textContent='A batalha começa em instantes.';status.hidden=false;};document.addEventListener('arena-error',()=>{status.textContent='A batalha começa em instantes.';status.hidden=false;});
