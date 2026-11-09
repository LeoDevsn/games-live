export const THEME_VERSION=1;
export const TEAMS={A:{name:'SR. SIRIGUEIJO',workshop:'SIRI CASCUDO',color:'#ffc371'},B:{name:'PLANKTON',workshop:'LABORATÓRIO',color:'#b6ed70'}};
const assets={};let narrator={speaking:false,team:null,kind:null};
export const setThemeAssets=values=>Object.assign(assets,values);
export const themeAssets=()=>assets;
export const setNarratorState=value=>{narrator={...narrator,...value};};
export function loadThemeAssets(){if(typeof Image==='undefined')return Promise.resolve(assets);return Promise.all([['background','construction-seabed-v1.png'],['krabs','mr-krabs-nickrewind-v1.png'],['plankton','plankton-reactions-v1.png']].map(([key,file])=>new Promise(resolve=>{const img=new Image();img.onload=()=>{assets[key]=img;resolve();};img.onerror=()=>resolve();img.src='/assets/'+file;}))).then(()=>assets);}
export const themeReady=loadThemeAssets();
export function drawBackdrop(c,time){
 const g=c.createLinearGradient(0,0,0,1920);g.addColorStop(0,'#073e46');g.addColorStop(.62,'#146867');g.addColorStop(1,'#082e34');c.fillStyle=g;c.fillRect(0,0,1080,1920);
 if(assets.background)c.drawImage(assets.background,0,385,1080,930);
 const shade=c.createLinearGradient(0,385,0,1320);shade.addColorStop(0,'#07566d33');shade.addColorStop(.6,'#ffffff00');shade.addColorStop(1,'#07343255');c.fillStyle=shade;c.fillRect(0,385,1080,935);
 c.save();for(let i=0;i<20;i++){const x=(i*173+55)%1080,y=500+(i*81-time*.018)%780;c.globalAlpha=.15;c.strokeStyle='#e7ffff';c.lineWidth=2;c.beginPath();c.arc(x,y,4+i%7,0,Math.PI*2);c.stroke();}c.restore();
}
export function drawHosts(c,game,time){
 for(const team of ['A','B']){
  const active=narrator.speaking&&narrator.team===team,winning=game.phase==='intermission'&&game.lastWinner===team,color=TEAMS[team].color,x=team==='A'?16:858,y=team==='A'?985:1008,w=team==='A'?205:202,h=team==='A'?266:230;
  const bounce=Math.sin(time*(active?.015:.0025))*(active?5:2)+(winning?Math.sin(time*.008)*5:0);
  c.save();c.fillStyle='#062a354c';c.beginPath();c.ellipse(x+w/2,y+h-9,w*.5,15,0,0,Math.PI*2);c.fill();
  c.translate(x+w/2,y+h);c.rotate(active?Math.sin(time*.009)*.022:0);c.scale(winning?1.04:1,winning?1.04:1);c.translate(-w/2,-h+bounce);
  if(active||winning){c.shadowColor=color;c.shadowBlur=20;}
  if(team==='A'&&assets.krabs)c.drawImage(assets.krabs,0,0,w,h);
  if(team==='B'&&assets.plankton){const sheet=assets.plankton,frame=winning?3:active&&narrator.kind==='gift'?2:active?1:0,cw=sheet.width/2,ch=sheet.height/2;c.drawImage(sheet,frame%2*cw,Math.floor(frame/2)*ch,cw,ch,0,0,w,h);}
  c.restore();
  if(active){c.fillStyle=color;c.beginPath();for(let i=0;i<3;i++)c.roundRect(x+73+i*16,y-18-((Math.sin(time*.01+i)+1)*7),7,12+(Math.sin(time*.01+i)+1)*9,4);c.fill();}
 }
}
