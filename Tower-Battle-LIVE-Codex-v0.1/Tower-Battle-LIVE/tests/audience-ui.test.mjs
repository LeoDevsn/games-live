import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudienceUI,SPEECH_BOUNDS,speechPages} from '../public/audience.js';
const settle=()=>new Promise(r=>setImmediate(r));
function fixture(studio){
 const nodes=new Map(),children=[],requests=[],speaking=[];let audio;
 const element=()=>({value:'',checked:false,hidden:true,textContent:''});const node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 class Media{constructor(){audio=this;this.plays=0;}play(){this.plays++;return Promise.resolve();}pause(){}}
 const doc={getElementById:node,createElement:element,querySelector:()=>({append:e=>children.push(e)}),addEventListener(){}};
 const ui=createAudienceUI({studio,document:doc,AudioClass:Media,clock:()=>1000,onSpeaking:(yes,job)=>speaking.push({yes,team:job?.team}),fetcher:async(url,options)=>{const body=JSON.parse(options.body);requests.push({url,body});return url.endsWith('/test')?Response.json({job:{id:'test-B',team:'B',text:'Convite da prévia',test:true,priority:1,expiresAt:90000}}):new Response('ID3-fixture',{headers:{'Content-Type':'audio/mpeg'}});}});
 const state=jobs=>({config:{voice:true,chat:true,volume:.8,previewTeam:'B'},voice:{configured:true},jobs,relay:{connected:false}});
 return {ui,audio,nodes,children,requests,speaking,state};
}
test('public voice serializes the two bosses, captions long speech without covering their faces, and rejects preview audio',async()=>{
 const f=fixture(true);f.ui.update(f.state([]));await settle();const a={id:'A',team:'A',text:'Trabalhadores do Siri Cascudo, vamos erguer nossa torre!',priority:1,expiresAt:90000},b={...a,id:'B',team:'B',text:'Trabalhadores do Plankton, executem meu plano perfeito!'};
 f.ui.update(f.state([a,{...b,id:'test',test:true}]));await settle();assert.equal(f.requests.length,1);assert.equal(f.speaking.at(-1).team,'A');f.ui.update(f.state([a,b]));await settle();assert.equal(f.requests.length,1);f.audio.onended();await settle();assert.equal(f.requests.length,2);assert.equal(f.speaking.at(-1).team,'B');assert.ok(SPEECH_BOUNDS.y>1251);assert.ok(SPEECH_BOUNDS.y+SPEECH_BOUNDS.height<1640);assert.equal(f.children.length,1);assert.ok(!f.nodes.get('testwelcome')?.onclick);f.ui.stop();
});
test('operator stays silent for real jobs; its explicit preview uses selected boss and never publishes to the public voice queue',async()=>{
 const f=fixture(false);f.ui.update(f.state([{id:'real',team:'A',text:'Mãos à obra!',priority:1,expiresAt:90000}]));await settle();assert.equal(f.requests.length,0);assert.equal(f.audio.plays,0);await f.nodes.get('testwelcome').onclick();await settle();assert.equal(f.requests[0].url,'/api/audience/test');assert.equal(f.requests[0].body.team,'B');assert.equal(f.requests[1].url,'/api/audience/audio');const long='Trabalhadores, preciso de vocês para erguer minha torre! '.repeat(8);assert.equal(speechPages(long).join(' '),long.trim());assert.ok(speechPages(long).every(s=>s.length<=76));f.ui.stop();
});
