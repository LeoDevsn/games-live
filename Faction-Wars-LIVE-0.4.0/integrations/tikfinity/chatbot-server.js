import {WebSocketServer,WebSocket} from 'ws';
// TikFinity's documented Streamer.bot message contract. This is a small compatible
// local relay, not Streamer.bot. A socket delivery is NOT a TikTok delivery receipt.
// https://tikfinity.zerody.one/streamerbot-integration
export function createChatbotServer(server){
 const wss=new WebSocketServer({noServer:true,maxPayload:8192});let peer=null,forwarded=0,lastRelayAt=null,lastError=null;
 const info={instanceId:'faction-wars-chat-relay',name:'Faction Wars chat relay',version:'0.4.5',os:'windows'};
 server.on('upgrade',(req,socket,head)=>{
  if(new URL(req.url,'http://localhost').pathname!=='/chatbot'){socket.destroy();return;}
  const origin=req.headers.origin;
  // TikFinity Desktop / its website may initiate the documented local connection.
  if(origin&&!/^https:\/\/([a-z0-9-]+\.)?(tikfinity\.com|zerody\.one)$/.test(origin)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)){socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
 });
 wss.on('connection',ws=>{
  peer?.close(1000,'Novo cliente');peer=ws;lastError=null;
  ws.send(JSON.stringify({timeStamp:new Date().toISOString(),session:'faction-wars',request:'Hello',info}));
  ws.on('error',()=>{lastError='Falha no relay local';});
  ws.on('message',raw=>{
   try{const m=JSON.parse(raw.toString()),base={id:m.id,status:'ok'};
    if(m.request==='GetInfo')ws.send(JSON.stringify({...base,info}));
    else if(m.request==='GetActions')ws.send(JSON.stringify({...base,actions:[],count:0}));
    else if(['Subscribe','UnSubscribe','GetEvents','GetSubscriptions','GetBroadcaster'].includes(m.request))ws.send(JSON.stringify({...base,events:{},broadcasters:[]}));
    else ws.send(JSON.stringify({...base,status:'error',error:'Este relay oferece apenas mensagens do Faction Wars.'}));
   }catch{lastError='Pedido de relay inválido';}
  });
  ws.on('close',()=>{if(peer===ws)peer=null;});
 });
 return {
  send(message){if(peer?.readyState!==WebSocket.OPEN||peer.bufferedAmount>65536)return false;
   peer.send(JSON.stringify({action:'sendChatbotMessage',args:{message}}));forwarded++;lastRelayAt=Date.now();return true;},
  snapshot(){return {connected:peer?.readyState===WebSocket.OPEN,forwarded,lastRelayAt,lastError,receipt:'relay-only',endpoint:'/chatbot'};},
  close(){for(const ws of wss.clients)ws.terminate();wss.close();},
 };
}
