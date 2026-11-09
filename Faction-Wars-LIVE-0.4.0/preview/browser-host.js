import {createState,totals} from '../src/core/state.js';
import {nextMatch,localEvent} from '../src/core/engine.js';
import {demoEvents} from '../scenarios/demo.js';
import {resultScreen} from '../src/match/result.js';
import {renderFrame} from '../src/adapters/local/render-frame.js';
import {BrowserStore,digest} from './browser-store.js';
let store,state,paused=true,demo=true,speed=1,error=null,sequence=0,frameSequence=0,lastCompletedId=null,queue=[],busy=false,timer,operations=Promise.resolve();const streams=new Set();
const serial=fn=>{const task=operations.then(fn);operations=task.catch(()=>{});return task;};
const id=()=>`web-${crypto.randomUUID()}`;
const view=async()=>({state,paused,demo,speed,error,pendingEvents:queue.length,hash:await digest(state),screen:resultScreen(state),totals:Object.fromEntries(Object.keys(state.people).map(p=>[p,totals(state,p)]))});
function publish(effects=[]){const frame=renderFrame(state,{paused,speed,demo,sequence:++frameSequence,effects});for(const stream of streams)stream.onmessage?.({data:JSON.stringify(frame)});}
async function start(useDemo){const next=state?nextMatch(state,id()):createState({id:id(),seed:29});await store.start(next,useDemo);state=next;demo=useDemo;queue=[];error=null;}
async function advance(ticks){let effects=[];for(let i=0;i<ticks;i++){const entries=[...queue,...(demo?demoEvents(state):[])];state=await store.commit(state,entries);queue=[];effects.push(...state.effects);if(state.phase==='done'){lastCompletedId=state.id;await start(demo);effects=[];break;}}publish(effects);}
export async function initializePreview(){store=await BrowserStore.open();const saved=await store.recover();if(saved){state=saved.state;demo=saved.demo;}else await start(true);timer=setInterval(()=>{if(paused||busy)return;busy=true;serial(()=>advance(speed)).catch(e=>{error=e.message;paused=true;publish();}).finally(()=>busy=false);},50);
 globalThis.__FW_PREVIEW__={get state(){return state;},get paused(){return paused;},async advance(n){return serial(async()=>{paused=true;await advance(n);return view();});},async recover(){return serial(async()=>{paused=true;const saved=await store.recover({fromGenesis:true});state=saved.state;demo=saved.demo;publish();return view();});},async exportReplay({lastCompleted=false}={}){return store.export(lastCompleted?lastCompletedId:null);},close(){clearInterval(timer);store.close();}};
}
export class PreviewStream{constructor(){streams.add(this);queueMicrotask(()=>{this.onopen?.();publish();});}close(){streams.delete(this);}}
export async function previewFetch(path,options={}){try{return await serial(async()=>{
 const action=path.replace(/^\/api\//,'');let status=200;
 if(action==='control'){const body=JSON.parse(options.body||'{}');if(body.action==='pause')paused=true;else if(body.action==='resume')paused=false;else if(body.action==='step'){paused=true;await advance(Math.max(1,Math.min(200,Number(body.ticks)||1)));}else if(body.action==='new'){paused=true;await start(Boolean(body.demo));if(demo)await advance(1);}else if(body.action==='speed')speed=[1,4,16].includes(body.speed)?body.speed:1;else if(body.action==='recover'){paused=true;const recovered=await store.recover();state=recovered.state;demo=recovered.demo;queue=[];}else status=400;publish();}
 else if(action==='event'){if(paused)return new Response(JSON.stringify({error:'Pausado: retome antes de enviar ações competitivas.'}),{status:409});const body=JSON.parse(options.body||'{}');queue.push(localEvent(state,String(body.actorId||''),body.kind,body.payload,sequence++,body.eventId||`${state.id}:browser:${crypto.randomUUID()}`));}
 else if(action!=='state')status=404;
 return new Response(JSON.stringify(status===200?await view():{error:'Ação desconhecida'}),{status,headers:{'Content-Type':'application/json'}});
 });}catch(e){error=e.message;paused=true;publish();return new Response(JSON.stringify({error:e.message}),{status:500});}}
export async function exportPreviewReplay(){const replay=await store.export(),url=URL.createObjectURL(new Blob([JSON.stringify(replay)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`${state.id}-diagnostico.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
