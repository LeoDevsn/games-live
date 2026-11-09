// Pure event routing shared by the browser and the integration tests.
(() => {
  const positive = (value, fallback=1, max=1000000) => Number.isFinite(Number(value)) && Number(value)>0 ? Math.min(max,Math.floor(Number(value))) : fallback;
  const name = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function createRouter(config={}) {
    const members=new Map(), seen=new Map(), welcomed=new Map();
    function audience(message,now=Date.now()){
      if(!message?.data||!['member','chat','like','follow'].includes(message.event))return null;
      const d=message.data,u=d.user||d,id=String(u.userId||u.id||u.uniqueId||d.userId||d.uniqueId||'');if(!id)return null;
      if(welcomed.has(id)&&now-welcomed.get(id)<600000)return null;
      welcomed.set(id,now);if(welcomed.size>10000)welcomed.delete(welcomed.keys().next().value);
      const who=String(u.nickname||d.nickname||u.uniqueId||d.uniqueId||id).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,60);
      return {type:'welcome',who,id,text:`${who}, bem-vindo ao Jelly Battle! Qual time você escolhe? Digite A para Bob Esponja ou B para Patrick!`};
    }
    function route(message, now=Date.now()) {
      if (!message || typeof message!=='object' || !message.data || typeof message.data!=='object') return null;
      const {event,data}=message;
      const user=data.user || data;
      const id=String(user.userId || user.id || user.uniqueId || data.userId || data.uniqueId || '');
      if (!id || !['member','chat','like','gift'].includes(event)) return null;
      const who=String(user.nickname || data.nickname || user.uniqueId || data.uniqueId || id).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,60);
      if(event==='member')return audience(message,now);
      // Streak gifts are cumulative; process only the final notification.
      const details=data.giftDetails || data.extendedGiftInfo || data.gift || {};
      if (event==='gift' && Number(data.giftType ?? details.giftType)===1 && ![true,1,'1'].includes(data.repeatEnd)) return null;
      const msgId=data.msgId || data.common?.msgId;
      const group=event==='gift' ? data.groupId : null;
      const key=group ? `gift:${id}:${group}:${data.giftId ?? details.id}` : msgId ? `${event}:${id}:${msgId}` : null;
      for (const [k,at] of seen) if (now-at>600000) seen.delete(k);
      if (key && seen.has(key)) return null;
      if (key) {seen.set(key,now);if(seen.size>10000)seen.delete(seen.keys().next().value)}
      if (event==='chat') {
        const command=name(data.comment);
        if (!['a','b'].includes(command)) return null;
        const team=command.toUpperCase();
        members.delete(id);members.set(id,team);
        if(members.size>50000)members.delete(members.keys().next().value);
        return {type:'join',team,who,id};
      }
      let team=members.get(id);
      if (event==='like') return team ? {type:'like',team,who,id,count:positive(data.likeCount)} : {type:'unassigned',who,id};
      const giftId=String(data.giftId ?? details.id ?? '');
      const giftName=String(data.giftName || details.name || 'Presente');
      const mapping=(config.gifts || []).find(g => (g.id!==undefined && String(g.id)===giftId) || (g.name && name(g.name)===name(giftName)));
      if (['A','B'].includes(mapping?.team)) team=mapping.team;
      if (!team) return {type:'unassigned',source:'gift',who,id,giftId,giftName,count:positive(data.repeatCount,1,10000)};
      return {type:'gift',team,who,id,giftId,giftName,count:positive(data.repeatCount,1,10000),seconds:positive(mapping?.seconds,positive(config.defaultGiftSeconds,2,60),60),gold:!!mapping?.gold};
    }
    return {route,audience};
  }
  globalThis.JellyLive={createRouter};
})();
