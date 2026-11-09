const stable=v=>typeof v==='string'&&v.length>0&&v.length<=160?v:typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?String(v):null;
const clean=v=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,45);
export function allowedAvatar(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))return null;const hosts=['tiktokcdn.com','tiktokcdn-us.com','tiktokcdn-eu.com','byteoversea.com','ibytedtos.com','muscdn.com'];return hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))?u.href:null;}catch{return null;}}
export function followingStatus(data,user=data){
 const explicit=user.isFollower??data.isFollower;
 if(typeof explicit==='boolean')return explicit;
 const roles=[user.followRole,data.followRole,user.followInfo?.followStatus,data.followInfo?.followStatus];
 if(roles.some(role=>[1,2,'1','2'].includes(role)))return true;
 // Zero-valued relationship metadata is not an unfollow event. Preserve positive
 // evidence received earlier; a newcomer still stays unconfirmed until positive evidence.
 return null;
}
export function createAdapter({seen=[],key=value=>value}={}){
 const delivered=new Map(seen);
 function normalize(frame,now=Date.now()){
  if(!frame||!frame.data||typeof frame.data!=='object'||!['follow','like','gift','chat','member','share'].includes(frame.event))return null;
  const d=frame.data,u=d.user&&typeof d.user==='object'?d.user:d,id=stable(u.userId??u.id??d.userId??d.id??u.uniqueId??d.uniqueId);if(!id)return null;
  const details=d.giftDetails||d.extendedGiftInfo||{};
  if(frame.event==='gift'&&Number(d.giftType??details.giftType)===1&&![true,1,'1'].includes(d.repeatEnd))return null;
  const token=frame.event==='gift'&&d.groupId?`group:${d.groupId}:${d.giftId??details.id??''}`:d.transactionId??d.msgId??d.common?.msgId;
  const eventKey=token?key(`${frame.event}:${id}:${token}`):null;
  for(const [k,t] of delivered)if(now-t>86400000)delivered.delete(k);
  if(eventKey&&delivered.has(eventKey))return null;if(eventKey){delivered.set(eventKey,now);if(delivered.size>50000)delivered.delete(delivered.keys().next().value);}
  const name=clean(u.nickname??d.nickname??u.uniqueId??d.uniqueId)||null;
  const avatar=allowedAvatar(u.profilePictureUrl??d.profilePictureUrl??u.avatarThumb?.urlList?.[0]??u.avatar?.urlList?.[0]??u.userDetails?.profilePictureUrls?.[0]??d.userDetails?.profilePictureUrls?.[0]);
  const base={id,name,avatar,following:frame.event==='follow'?true:followingStatus(d,u)};
  if(frame.event==='like'){const count=Number(d.likeCount);if(!Number.isSafeInteger(count)||count<=0)return null;return {...base,kind:'like',count:Math.min(count,500)};}
  if(frame.event==='gift')return {...base,kind:'gift',giftId:clean(d.giftId??details.id??''),giftName:clean(d.giftName??details.name??'Presente')};
  return {...base,kind:frame.event==='follow'?'follow':'identity'};
 }
 return {normalize,exportState:()=>[...delivered]};
}
