const cache=new Map(), pending=new Map(), limits=new Map();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const validVoice=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const models=new Set(['s1','s2-pro','s2.1-pro','s2.1-pro-free','drama-3']);
export function voiceStatus(env){
  const configured=!!env.FISH_AUDIO_API_KEY&&models.has(env.FISH_AUDIO_MODEL||'s2.1-pro');
  return {provider:'Fish Audio',teams:{A:configured&&validVoice(env.FISH_AUDIO_VOICE_ID_A),B:configured&&validVoice(env.FISH_AUDIO_VOICE_ID_B)},missing:{key:!env.FISH_AUDIO_API_KEY,A:!validVoice(env.FISH_AUDIO_VOICE_ID_A),B:!validVoice(env.FISH_AUDIO_VOICE_ID_B),model:!models.has(env.FISH_AUDIO_MODEL||'s2.1-pro')}};
}
function allow(request){
  const now=Date.now(),key=request.headers.get('oai-authenticated-user-id')||'local';
  for(const [id,bucket]of limits)if(now-bucket.at>=60000)limits.delete(id);
  const bucket=limits.get(key)||{at:now,count:0};bucket.count++;limits.set(key,bucket);
  return bucket.count<=30;
}
const audio=(bytes,hit=false)=>new Response(bytes,{headers:{'content-type':'audio/mpeg','cache-control':'private, no-store','x-voice-provider':'Fish Audio',...(hit?{'x-voice-cache':'hit'}:{})}});
async function requestAudio(env,voice,model,text,key){
  try{
    const response=await fetch('https://api.fish.audio/v1/tts',{
      method:'POST',headers:{Authorization:'Bearer '+env.FISH_AUDIO_API_KEY,'content-type':'application/json','accept':'audio/mpeg',model},
      body:JSON.stringify({text,reference_id:voice,format:'mp3',mp3_bitrate:128,latency:'balanced'}),signal:AbortSignal.timeout(15000)
    });
    if(!response.ok){
      if(response.status===401)return {error:'A Fish Audio não aceitou a chave de API. Confira a chave na configuração local.',code:'invalid_api_key',status:502};
      if(response.status===402)return {error:'A Fish Audio informou falta de saldo na API. Confira os créditos ou selecione S2.1 Pro Free na configuração local.',code:'insufficient_credits',status:502};
      return {error:response.status===429?'A Fish Audio atingiu o limite de uso. Aguarde.':'A Fish Audio recusou a geração. Confira a voz e as permissões da conta.',code:'provider_error',status:response.status===429?429:502};
    }
    if(!response.headers.get('content-type')?.startsWith('audio/'))return {error:'A Fish Audio retornou um áudio inválido.',status:502};
    const reader=response.body.getReader(),parts=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024){await reader.cancel();return {error:'O áudio gerado excede o tamanho permitido.',status:502}}parts.push(value)}
    if(!size)return {error:'A Fish Audio retornou um áudio vazio.',status:502};
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
    if(cache.size>=30)cache.delete(cache.keys().next().value);cache.set(key,{bytes,at:Date.now()});return {bytes};
  }catch{return {error:'O serviço de voz demorou a responder ou está indisponível.',code:'provider_timeout',status:504}}
}
export async function generateVoice(request,env){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Solicitação não permitida.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Envie o pedido em JSON.'},415);
  if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Pedido muito grande.'},413);
  let body;try{const raw=await request.text();if(raw.length>2048)return json({error:'Pedido muito grande.'},413);body=JSON.parse(raw)}catch{return json({error:'Pedido inválido.'},400)}
  if(!['A','B'].includes(body?.team)||typeof body?.text!=='string'||!body.text.trim()||body.text.length>300)return json({error:'Escolha um personagem e uma frase de até 300 caracteres.'},400);
  if(!voiceStatus(env).teams[body.team])return json({error:'A voz Fish Audio deste personagem ainda não foi configurada.',code:'not_configured'},503);
  const voice=env['FISH_AUDIO_VOICE_ID_'+body.team],model=env.FISH_AUDIO_MODEL||'s2.1-pro',text=body.text.trim();
  // Hash the credential to isolate caches across accounts without retaining the key in a cache key.
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.FISH_AUDIO_API_KEY));
  const scope=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
  const key=JSON.stringify([scope,voice,model,text]),cached=cache.get(key);
  if(cached&&Date.now()-cached.at<900000)return audio(cached.bytes,true);
  if(!allow(request))return json({error:'Limite de geração atingido. Aguarde um minuto.',code:'rate_limit'},429);
  if(!pending.has(key)){if(pending.size>=2)return json({error:'As vozes estão ocupadas. Aguarde a próxima fala.',code:'busy'},429);pending.set(key,requestAudio(env,voice,model,text,key).finally(()=>pending.delete(key)))}
  const result=await pending.get(key);
  return result.bytes?audio(result.bytes):json({error:result.error,code:result.code||'provider_error'},result.status);
}
