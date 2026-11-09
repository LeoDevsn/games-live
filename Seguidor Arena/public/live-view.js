import {createRenderer} from './render.js';
import {createSoundtrack} from './soundtrack.js';
import {createAudienceUI} from './audience.js';
const renderer=createRenderer(document.getElementById('arena'),{publicView:true});
const music=createSoundtrack({studio:true});
const narrator=createAudienceUI({studio:true,onSpeaking:(speaking,job)=>{music.duck(speaking);renderer.setNarratorState({speaking,kind:speaking?job?.kind:null});}});
const stream=new EventSource('/api/stream?audience=1');
stream.onmessage=event=>{try{const view=JSON.parse(event.data);renderer.accept(view);music.update(view.music,view.game.phase);narrator.update(view.audience,view.liveActive?'live':'stopped');}catch{}};
function frame(time){renderer.draw(time);requestAnimationFrame(frame);}requestAnimationFrame(frame);
