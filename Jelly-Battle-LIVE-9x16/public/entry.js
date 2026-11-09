import {entryModel,drawGameEntry,createEntryControls} from './game-entry.js';
// Remains inside #ocean. The approved 9:16 scoreboard, flex layout and rankings
// retain their exact dimensions; only the old start box is replaced.
const overlay=document.getElementById('startoverlay'),ocean=document.getElementById('ocean');
const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1200;canvas.className='jelly-entry-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Entrada do Jelly Battle: comente A para Bob Esponja ou B para Patrick. Likes ajudam a capturar águas-vivas.');overlay.prepend(canvas);overlay.classList.add('rich-entry');
const ctx=canvas.getContext('2d'),images={},controls=new URLSearchParams(location.search).get('studio')==='1'?{preview:false,page:0}:createEntryControls({host:document.querySelector('.interaction')});
for(const [key,file] of [['A','spongebob.png'],['B','patrick.webp']]){const image=new Image();image.onload=()=>images[key]=image;image.src='assets/'+file;}
let rendered=0,lastHeight=1200;
function draw(time){
 requestAnimationFrame(draw);if(time-rendered<65)return;rendered=time;
 const active=!running||controls.preview;if(!active){overlay.style.display='none';return;}overlay.style.display='flex';
 const h=Math.max(300,Math.round(ocean.clientHeight/Math.max(1,ocean.clientWidth)*1080));if(h!==lastHeight){canvas.height=h;lastHeight=h;}
 const state={phase:preparing?'preparation':running?'running':'waiting',round,seconds:preparationSeconds};
 const model=entryModel('jelly',state,{preview:controls.preview});if(!model)return;
 ctx.clearRect(0,0,1080,h);const scale=Math.min(1,(h-55)/900),w=1000*scale,height=900*scale;
 drawGameEntry(ctx,model,time,{images,page:controls.page,bounds:{x:(1080-w)/2,y:(h-height)/2,w,h:height}});
}
requestAnimationFrame(draw);
