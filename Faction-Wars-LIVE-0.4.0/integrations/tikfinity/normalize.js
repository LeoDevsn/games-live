// Contract adapter, not a claim that the owner's installed TikFinity was verified.
// totalLikeCount is a room counter and MUST NEVER be attributed to one viewer.
const stable=value=>typeof value==='string'&&value.length>0&&value.length<=160?value:typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?String(value):null;
export function normalizeFrame(frame,{roomId,likeMode='disabled',userCounterField='userLikeTotal'}={}){
 const rejected=reason=>({status:'quarantine',reason});if(!stable(roomId))return rejected('missing-room-id');
 if(!frame||typeof frame!=='object'||!frame.data||typeof frame.data!=='object')return rejected('invalid-envelope');
 const type=frame.event,data=frame.data;
 if(!['chat','like','gift'].includes(type))return {status:'ignored',reason:'unsupported-event'};
 const eventId=stable(data.msgId??data.messageId??data.common?.msgId),userId=stable(data.userId??data.user?.userId??data.user?.id??data.id??data.user?.uniqueId??data.uniqueId);
 if(!eventId)return rejected('missing-stable-event-id');if(!userId)return rejected('missing-stable-user-id');
 const name=String(data.nickname??data.user?.nickname??userId).slice(0,80);
 const base={source:'tikfinity',providerEventId:`tikfinity:${encodeURIComponent(roomId)}:${encodeURIComponent(eventId)}`,actorId:`tt:${userId}`,roomId:String(roomId),name};
 if(type==='chat'){if(typeof data.comment!=='string'||data.comment.length>1000)return rejected('invalid-chat');return {status:'ready',event:{...base,kind:'command',payload:{text:data.comment,name}}};}
 if(type==='gift')return {status:'ready',event:{...base,kind:'cosmeticGift',payload:{giftId:stable(data.giftId)||'unknown'}}};
 if(likeMode==='disabled')return rejected('like-semantics-unverified');
 if(likeMode==='delta'){if(!Number.isSafeInteger(data.likeCount)||data.likeCount<0)return rejected('invalid-like-delta');return {status:'ready',event:{...base,kind:'likesDelta',payload:{delta:data.likeCount},semantics:'explicit-delta'}};}
 if(likeMode==='cumulative-user'){
  if(userCounterField==='totalLikeCount')return rejected('room-counter-is-not-personal');
  const count=data[userCounterField];if(!Number.isSafeInteger(count)||count<0)return rejected('invalid-personal-counter');return {status:'counter',event:{...base,kind:'likesDelta',counter:count,semantics:'personal-cumulative'}};
 }
 return rejected('unknown-like-semantics');
}
export function validateLocalSocket(url){const value=new URL(url);if(value.protocol!=='ws:'||!['127.0.0.1','localhost','[::1]'].includes(value.hostname)||value.username||value.password)throw Error('TikFinity deve usar WebSocket local no PC');return value.href;}
