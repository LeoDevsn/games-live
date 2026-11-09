const field=id=>document.getElementById(id);
let previewURL=null,tikSocket=null,tikTimeout=null;
function message(id,text,error=false){field(id).textContent=text;field(id).className=error?'error':'success'}
async function settings(){
  try{
    const res=await fetch('/api/setup/voice',{cache:'no-store'});if(!res.ok)throw Error('Abra esta tela pelo INICIAR.bat no servidor local.');
    const state=await res.json();field('voiceA').value=state.voiceA;field('voiceB').value=state.voiceB;field('model').value=state.model;
    field('apiKey').required=!state.keySaved;
    field('apiKey').placeholder=state.keySaved?'Chave já salva · deixe vazio para manter':'Cole a chave de API aqui';
    message('keyState',state.keySaved?'Chave cadastrada neste computador.':'Nenhuma chave cadastrada.');
  }catch(error){message('keyState',error.message,true);field('save').disabled=true}
}
field('setupForm').addEventListener('submit',async event=>{
  event.preventDefault();field('save').disabled=true;
  try{
    const res=await fetch('/api/setup/voice',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:field('apiKey').value,voiceA:field('voiceA').value,voiceB:field('voiceB').value,model:field('model').value})});
    const body=await res.json();if(!res.ok)throw Error(body.error||'Não foi possível salvar.');
    field('apiKey').value='';message('saveStatus','Configuração salva. Teste os dois personagens abaixo para validar a chave e as vozes.');await settings();
  }catch(error){message('saveStatus',error.message,true)}finally{field('save').disabled=false}
});
async function testVoice(team){
  const who=field('testName').value.trim();if(!who){message('testStatus','Preencha um nome para testar.',true);return}
  field('testA').disabled=true;field('testB').disabled=true;
  const preview=field('preview');preview.pause();
  if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null}
  try{
    message('testStatus','Gerando a fala de '+(team==='A'?'Bob Esponja':'Patrick')+'…');
    const text=team==='A'?`Vamos lá, ${who}! Vamos pegar todas as águas-vivas!`:`Obrigado, ${who}! Vamos botar para quebrar!`;
    const res=await fetch('/api/voice/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({team,text}),signal:AbortSignal.timeout(20000)});
    if(!res.ok){const body=await res.json().catch(()=>({}));throw Error(body.error||'Falha ao gerar a fala.')}
    const blob=await res.blob();if(!blob.type.startsWith('audio/')||!blob.size)throw Error('A Fish Audio não retornou um áudio válido.');
    previewURL=URL.createObjectURL(blob);preview.src=previewURL;preview.hidden=false;
    try{await preview.play();message('testStatus','Áudio recebido da Fish Audio. Confira se é a voz esperada.')}catch{message('testStatus','Áudio recebido. Aperte play para ouvir e conferir a voz.')}
  }catch(error){message('testStatus',error.name==='TimeoutError'?'A Fish Audio demorou a responder. Tente novamente.':error.message,true)}finally{field('testA').disabled=false;field('testB').disabled=false}
}
field('testA').onclick=()=>testVoice('A');field('testB').onclick=()=>testVoice('B');
field('checkTikfinity').onclick=async()=>{
  tikSocket?.close();clearTimeout(tikTimeout);field('checkTikfinity').disabled=true;
  message('tikfinityStatus','Verificando a porta local 21213 do TikFinity…');
  const probe=url=>new Promise(resolve=>{
    let socket,done=false;
    function finish(connected){if(done)return;done=true;clearTimeout(tikTimeout);if(tikSocket===socket)tikSocket=null;socket?.close();resolve(connected)}
    try{
      socket=new WebSocket(url);tikSocket=socket;
      tikTimeout=setTimeout(()=>finish(false),3500);
      socket.onopen=()=>finish(true);
      socket.onerror=()=>finish(false);
      socket.onclose=()=>finish(false);
    }catch{finish(false)}
  });
  try{
    const res=await fetch('live-config.json',{cache:'no-store'});
    if(!res.ok)throw Error('Configuração local indisponível.');
    const config=await res.json(),url=new URL(config.websocketUrl);
    const endpoints=[url.href];
    if(url.hostname==='localhost')endpoints.push(url.href.replace('localhost','127.0.0.1'));
    else if(url.hostname==='127.0.0.1')endpoints.push(url.href.replace('127.0.0.1','localhost'));
    let working=null;
    for(const endpoint of endpoints){if(await probe(endpoint)){working=endpoint;break}}
    if(working)message('tikfinityStatus','Porta WebSocket conectada em '+working+'. Confirme que a LIVE está conectada enviando A ou B no chat.');
    else message('tikfinityStatus','Não foi possível abrir a porta 21213. Abra TikFinity Desktop no MESMO computador, conecte a LIVE e ative a Event API/WebSocket antes de testar.',true);
  }catch(error){message('tikfinityStatus',error.message,true)}
  finally{field('checkTikfinity').disabled=false}
};
window.addEventListener('beforeunload',()=>{tikSocket?.close();clearTimeout(tikTimeout);if(previewURL)URL.revokeObjectURL(previewURL)});
settings();
