export const PLANKTON_TITLE='ARENA ROYALE DO PLANKTON';
const label=(c,t,x,y,size=15,color='#b9efb6')=>{c.font=`700 ${size}px Segoe UI,system-ui,sans-serif`;c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y);};
export function hostFrame({speaking=false,kind=null,phase=null}={},time=0){
 if(kind==='winner'||phase==='intermission')return 3;
 if(kind==='gift')return 2;
 return speaking?1:0;
}
export function drawLabHost(c,sheet,state,time=0){
 const x=812,y=1378,w=202,h=245,frame=hostFrame(state,time),speaking=!!state.speaking;
 c.save();const glass=c.createLinearGradient(x,y,x+w,y+h);glass.addColorStop(0,'#10484de8');glass.addColorStop(1,'#06282be8');
 c.beginPath();c.roundRect(x,y,w,h,18);c.fillStyle=glass;c.fill();c.strokeStyle=speaking?'#b8ff6f':'#528b7b';c.lineWidth=speaking?3:2;c.stroke();
 c.fillStyle='#183e3d';c.fillRect(x+12,y+9,w-24,29);label(c,'CENTRAL DO PLANKTON',x+w/2,y+25,12,'#d8eda0');
 const dx=x+7,dy=y+34+Math.sin(time*.0025)*2,dw=188,dh=186;
 c.beginPath();c.roundRect(x+3,y+35,w-6,h-64,12);c.clip();
 if(sheet){const cw=sheet.width/2,ch=sheet.height/2,fx=frame%2*cw,fy=Math.floor(frame/2)*ch;c.drawImage(sheet,fx,fy,cw,ch,dx,dy,dw,dh);
  // Hold the gesturing body still; alternate only the mouth patch while speech plays.
  if(speaking&&frame===1&&Math.sin(time*.023)<-.15){c.save();c.beginPath();c.ellipse(dx+dw*.535,dy+dh*.615,dw*.14,dh*.115,0,0,Math.PI*2);c.clip();c.drawImage(sheet,0,0,cw,ch,dx,dy,dw,dh);c.restore();}
 }else{label(c,'PLANKTON',x+w/2,y+116,17);label(c,'CONTROLE DO LABORATÓRIO',x+w/2,y+142,10);}
 c.restore();c.save();c.fillStyle=speaking?'#c1ff75':'#5ee5c7';c.beginPath();c.arc(x+24,y+h-18,4,0,Math.PI*2);c.fill();label(c,speaking?'PLANO EM TRANSMISSÃO':state.phase==='intermission'?'ALIADO SELECIONADO':'OBSERVANDO RECRUTAS',x+w/2+8,y+h-17,10);c.restore();
}
export function drawWater(c,time){
 c.save();
 for(let i=0;i<19;i++){const x=18+(i*173)%1044,y=420+((i*179-time*.022)%865+865)%865,r=2+(i%4)*2;c.globalAlpha=.12+(i%3)*.035;c.strokeStyle='#a4f3e5';c.lineWidth=1.2;c.beginPath();c.arc(x+Math.sin(time*.0008+i)*9,y,r,0,Math.PI*2);c.stroke();}
 c.restore();
}
