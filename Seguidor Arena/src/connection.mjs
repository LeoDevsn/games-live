// Local TikFinity transport. No gameplay, identities, or raw payloads in diagnostics.
export function createConnection({onMessage=()=>{},onStatus=()=>{},WebSocketClass=globalThis.WebSocket,clock=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,endpoints=['ws://localhost:21213/','ws://127.0.0.1:21213/']}={}) {
  let socket=null,timer=null,deadline=null,wanted=false,index=0,failures=0,generation=0;
  const state={status:'disconnected',endpoint:null,lastEventAt:null,lastEvent:null,lastFailure:null,received:0,invalid:0,reconnects:0};
  const snapshot=()=>({...state,status:state.status==='receiving'&&clock()-state.lastEventAt>60000?'inactive':state.status});
  const update=(status)=>{state.status=status;onStatus(snapshot());};
  function cancel(){clearTimer(timer);clearTimer(deadline);timer=deadline=null;}
  function stop(){wanted=false;generation++;cancel();const old=socket;socket=null;old?.close();update('disconnected');}
  function retry(){if(!wanted)return;state.reconnects++;index++;const delay=index%endpoints.length?750:Math.min(30000,1500*2**Math.min(failures++,5));update('retrying');timer=setTimer(open,delay);timer?.unref?.();}
  function open(){
    if(!wanted)return;
    cancel();const token=++generation;const endpoint=endpoints[index%endpoints.length];state.endpoint=endpoint;update('connecting');
    let ws;
    try{const url=new URL(endpoint);if(!['ws:','wss:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('Endpoint deve ser local');ws=new WebSocketClass(endpoint);socket=ws;}
    catch{state.lastFailure='Falha ao abrir WebSocket local';retry();return;}
    deadline=setTimer(()=>{if(token!==generation)return;state.lastFailure='Tempo esgotado ao conectar';socket=null;generation++;ws.close();retry();},5000);deadline?.unref?.();
    ws.onopen=()=>{if(token!==generation)return;clearTimer(deadline);state.lastEventAt=null;state.lastEvent=null;update('connected');};
    ws.onmessage=ev=>{
      if(token!==generation)return;
      try{
        if(typeof ev.data!=='string'||ev.data.length>131072)throw Error('Tamanho inválido');
        const message=JSON.parse(ev.data);
        if(!message||typeof message!=='object'||typeof message.event!=='string')throw Error('Envelope inválido');
        if(['streamEnd','streamEnded','liveEnd'].includes(message.event)){state.lastEventAt=clock();state.lastEvent='streamEnd';update('ended');return;}
        if(!['chat','like','gift','follow','share','member'].includes(message.event)||!message.data||typeof message.data!=='object')return;
        state.received++;state.lastEvent=message.event;state.lastEventAt=clock();failures=0;update('receiving');onMessage(message,state.lastEventAt);
      }catch{state.invalid++;state.lastFailure='Evento inválido ignorado';onStatus(snapshot());}
    };
    ws.onerror=()=>{if(token===generation){state.lastFailure='WebSocket local indisponível';onStatus(snapshot());}};
    ws.onclose=()=>{if(token!==generation)return;clearTimer(deadline);socket=null;generation++;retry();};
  }
  function start(){stop();wanted=true;index=0;failures=0;open();}
  return {start,stop,snapshot};
}
