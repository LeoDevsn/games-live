import {drawArena,setNarratorState} from './render.js';
import {createAudienceUI} from './audience.js';
const canvas=document.getElementById('arena');let view=null;
const narrator=createAudienceUI({studio:true,onSpeaking:(speaking,job)=>setNarratorState({speaking,team:job?.team,kind:job?.kind})});
const stream=new EventSource('/api/stream?audience=1');stream.onmessage=event=>{try{view=JSON.parse(event.data);narrator.update(view.audience,view.audienceActive?'live':'stopped');}catch{}};
function frame(time){if(view)drawArena(canvas,view.game,time,'','','live',view.broadcast,{publicView:true});requestAnimationFrame(frame);}requestAnimationFrame(frame);
