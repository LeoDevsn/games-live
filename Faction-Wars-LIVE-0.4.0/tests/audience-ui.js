import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {WELCOME,HELP,VOICE,DEFAULTS} from '../integrations/tikfinity/audience.js';
const html=readFileSync('src/ui/index.html','utf8'),nodes=new Map(),spoken=[],requests=[];let interval;
function node(){return {children:[],textContent:'',hidden:false,value:'',checked:false,setAttribute(){},append(...n){this.children.push(...n);},remove(){}};}
for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],node());
const synth={getVoices:()=>[{lang:'pt-BR',name:'fixture'}],speak:u=>{spoken.push(u.text);queueMicrotask(()=>u.onend?.());},cancel(){}};
class Utterance{constructor(text){this.text=text;}}
const context={Date,console,SpeechSynthesisUtterance:Utterance,window:{speechSynthesis:synth,SpeechSynthesisUtterance:Utterance},document:{getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},createElement:node},setInterval:fn=>{interval=fn;return 1;},clearInterval(){},fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({config:DEFAULTS,queued:0,welcomed:0,helped:0,chatbot:{connected:false}})};}};
context.setTimeout=setTimeout;context.clearTimeout=clearTimeout;
vm.createContext(context);vm.runInContext(readFileSync('src/ui/audience-ui.js','utf8').replaceAll('export function','function'),context);
vm.runInContext('globalThis.panel=createAudiencePanel()',context);const panel=context.panel;
panel.update({audience:{config:DEFAULTS,welcomed:2,helped:3,queued:1,chatbot:{connected:false}}});assert.equal(nodes.get('audience-welcome').checked,true);assert.match(nodes.get('audience-chat-status').textContent,/aguardando/);
nodes.get('audience-enable-voice').onclick();assert.equal(spoken.length,1);
const at=Date.now(),frame={paused:true,demo:true,audience:{config:DEFAULTS,current:{id:1,kind:'help',name:'<texto seguro>',pages:HELP,at,expiresAt:at+18000,simulate:true},voice:{id:1,text:VOICE,engine:'browser',volume:.8,at,expiresAt:at+15000,simulate:true}}};
panel.accept(frame);await new Promise(r=>setImmediate(r));assert.equal(spoken.length,2,'preview speaks while paused');assert.equal(spoken[1],VOICE);
const banner=nodes.get('arena').children[0];assert.equal(banner.hidden,false);assert.equal(banner.children[0].textContent,'COMO JOGAR · <texto seguro>');assert.equal(banner.children[1].textContent,HELP[0]);
panel.accept(frame);assert.equal(spoken.length,2,'SSE repeats do not repeat speech');
panel.accept({...frame,audience:{...frame.audience,current:null,voice:{...frame.audience.voice,id:2,simulate:false}}});assert.equal(banner.hidden,true);assert.equal(spoken.length,2,'paused real voice skipped');
await nodes.get('audience-test-help').onclick();assert.equal(JSON.parse(requests.at(-1).options.body).kind,'help');await nodes.get('audience-save').onclick();assert.equal(JSON.parse(requests.at(-1).options.body).action,'configure');
assert.ok(WELCOME.includes('!comandos'));console.log('PASS audience UI: DOM wiring, safe text, real speech adapter with stub, preview while paused, repeated frame dedupe, pause gating and settings/test actions.');
