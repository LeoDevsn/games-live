const norm = s => String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const integer = (value, fallback=0, max=500) => Number.isFinite(Number(value)) ? Math.max(0,Math.min(max,Math.floor(Number(value)))) : fallback;
const clean = value => String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,45);
const stable = value => typeof value==='string'&&value.length>0&&value.length<=160?value:typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?String(value):'';

/**
 * TikFinity documented envelope: {event:'chat|gift|like|...',data:{...}}.
 * No credentials are needed for the local WebSocket endpoint.
 * Accept only known event payloads, deduplicate by event ID, ignore in-progress gift streaks.
 */
export function createTikFinityAdapter(saved=[],dedupeKey=value=>value) {
  const seen=new Map(saved);
  function normalize(message, now=Date.now()) {
    if (!message || typeof message!=='object' || typeof message.data!=='object' || !message.data) return null;
    const {event,data}=message;
    if (!['chat','like','gift','member','follow','share'].includes(event)) return null;
    const user = data.user && typeof data.user==='object' ? data.user : data;
    const id=stable(user.userId??user.id??data.userId??data.id??user.uniqueId??data.uniqueId);
    if(!id)return null;
    const name=clean(user.nickname||data.nickname||user.uniqueId||id);
    const details=data.giftDetails||data.extendedGiftInfo||{};
    // Repeated gifts may be reported before completion. Process once on final.
    if(event==='gift'&&Number(data.giftType??details.giftType)===1&&!([true,1,'1'].includes(data.repeatEnd)))return null;
    // A streak's final delivery may have a fresh msgId after reconnect.
    const eventId = event==='gift' && data.groupId ? `group:${data.groupId}:${data.giftId??details.id??''}` : data.transactionId||data.msgId||data.common?.msgId;
    const unique=eventId ? dedupeKey(`${event}:${id}:${eventId}`) : null;
    for(const [key,stamp] of seen) if(now-stamp>600000)seen.delete(key);
    if(unique&&seen.has(unique))return null;
    if(unique){seen.set(unique,now);if(seen.size>20000)seen.delete(seen.keys().next().value);}
    if(event==='chat') {
      const command=norm(data.comment);
      if(['!ajuda','!help','!comandos'].includes(command))return {kind:'help',id,name};
      if(!['a','b'].includes(command))return null;
      return {kind:'join',team:command.toUpperCase(),id,name};
    }
    if(event==='like') return {kind:'like',id,name,count:integer(data.likeCount,0,500)};
    if(['member','follow','share'].includes(event))return {kind:'identity',id,name};
    return {kind:'gift',id,name,giftId:clean(data.giftId??details.id??''),giftName:clean(data.giftName??details.name??'Presente'),count:integer(data.repeatCount,1,10000)};
  }
  return {normalize,exportState:()=>[...seen]};
}
