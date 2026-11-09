// Real pose atlases for walking/attacking. Static poses remain for idle/hurt/death.
export const UNIT_VISUAL={normal:114,champion:128,protectionColor:0xffdf42};
export const IDLE_FRAME={up:32,down:33};
const CUTS={
 'walk-S':[0,228,435,648,873,1081,1300,1509,1774],
 'walk-R':[0,228,435,648,873,1081,1300,1510,1774],
 'attack-S':[0,348,662,957,1254],
 'attack-R':[0,350,664,959,1254],
};
export function poseCell(action,face,pose){
 if(action==='walk')return {row:face==='up'?pose:[4,5,6,5][pose],rows:8};
 return {row:(face==='up'?0:2)+(pose===1||pose===2?1:0),rows:4};
}
function rollingWheels(ctx,pose){
 // Frame-specific spokes rotate inside an elliptical wheel; the chassis never rotates.
 for(const x of [-39,39]){ctx.save();ctx.translate(x,-16);ctx.scale(.48,1);ctx.fillStyle='#25364b';ctx.strokeStyle='#edc36a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(pose*Math.PI/8);ctx.lineWidth=1.7;
  for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10);ctx.stroke();}
  ctx.fillStyle='#ffe7a0';ctx.beginPath();ctx.arc(0,0,2.3,0,Math.PI*2);ctx.fill();ctx.restore();}
}
export function createApprovedSheets(scene){
 const source=scene.textures.get('approved-troops').getSourceImage(),pixels=new Map();
 function image(key){return scene.textures.get(key).getSourceImage();}
 function foot(atlas,x,y,w,h){
  if(!pixels.has(atlas)){const canvas=document.createElement('canvas');canvas.width=atlas.width;canvas.height=atlas.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(atlas,0,0);pixels.set(atlas,c.getImageData(0,0,atlas.width,atlas.height).data);}
  const data=pixels.get(atlas),left=Math.ceil(x+w*.18),right=Math.floor(x+w*.82);
  for(let yy=Math.min(atlas.height-1,Math.floor(y+h)-1);yy>=y+h*.4;yy--)for(let xx=left;xx<right;xx++)if(data[(yy*atlas.width+xx)*4+3]>100)return yy-y+1;
  return h*.9;
 }
 function draw(ctx,atlas,col,row,key=null){
  const cuts=key?CUTS[key]:null,w=atlas.width/4,ratio=cuts?atlas.height/cuts.at(-1):1;
  const y=cuts?cuts[row]*ratio:row*atlas.height/4,h=cuts?(cuts[row+1]-cuts[row])*ratio:atlas.height/4;
  const baseline=foot(atlas,col*w,y,w,h),scale=112/w;
  ctx.drawImage(atlas,col*w,y,w,h,-56,-baseline*scale,112,h*scale);
 }
 for(const [faction,baseRow] of [['S',0],['R',2]])for(const [col,kind] of ['G','D','A','C'].entries()){
  const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=640;
  const ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(let index=0;index<34;index++){
   const group=Math.floor(index/4),action=Math.floor(group/2),face=index>=32?(index===32?'up':'down'):group%2===0?'up':'down',pose=index%4;
   ctx.save();ctx.beginPath();ctx.rect((index%8)*128,Math.floor(index/8)*128,128,128);ctx.clip();ctx.translate((index%8)*128+64,Math.floor(index/8)*128+109);
   if(action===0){const key='walk-'+faction;draw(ctx,image(key),col,kind==='C'?(face==='up'?0:4):poseCell('walk',face,pose).row,key);if(kind==='C')rollingWheels(ctx,pose);}
   else if(action===1&&pose!==3){const key='attack-'+faction;draw(ctx,image(key),col,poseCell('attack',face,pose).row,key);}
   else{
    if(action===2){ctx.translate(Math.sin(pose*Math.PI/2)*3,0);ctx.filter=pose%2?'brightness(1.5)':'none';}
    if(action===3){ctx.rotate((pose+1)*.25);ctx.scale(1,1-pose*.15);ctx.globalAlpha=1-pose*.18;}
    draw(ctx,source,col,baseRow+(face==='up'?1:0));
   }
   ctx.restore();
  }
  const key=`${faction}-${kind}`;scene.textures.remove(key);scene.textures.addSpriteSheet(key,sheet,{frameWidth:128,frameHeight:128});
  // Alpha-dilated outline follows each exact pose, not an oval around the unit.
  const outline=document.createElement('canvas');outline.width=sheet.width;outline.height=sheet.height;const oc=outline.getContext('2d');
  for(let index=0;index<34;index++){
   const x=(index%8)*128,y=Math.floor(index/8)*128;oc.save();oc.beginPath();oc.rect(x,y,128,128);oc.clip();
   for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]])oc.drawImage(sheet,x,y,128,128,x+dx,y+dy,128,128);
   oc.restore();
  }
  oc.globalCompositeOperation='source-in';oc.fillStyle='#ffdf42';oc.fillRect(0,0,outline.width,outline.height);oc.globalCompositeOperation='destination-out';oc.drawImage(sheet,0,0);
  const shieldKey=key+'-protection';if(scene.textures.exists(shieldKey))scene.textures.remove(shieldKey);scene.textures.addSpriteSheet(shieldKey,outline,{frameWidth:128,frameHeight:128});
 }
}
