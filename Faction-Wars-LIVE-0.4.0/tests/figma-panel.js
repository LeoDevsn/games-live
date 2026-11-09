import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {createState} from '../src/core/state.js';
const html=readFileSync('src/ui/index.html','utf8'),elements=new Map();
function element(){return {textContent:'',value:'',children:[],open:false,classList:{toggle(){},add(){},remove(){}},append(...x){this.children.push(...x);},replaceChildren(){this.children=[];},addEventListener(){}};}
for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],element());
const state=createState({id:'panel-synthetic'});state.phase='combat';let paused=true;const requests=[];
const context={document:{getElementById:id=>{assert.ok(elements.has(id),'DOM element '+id);return elements.get(id);},createElement:element,addEventListener(){},body:{classList:{toggle:()=>true,contains:()=>true}}},window:{addEventListener(){},dispatchEvent(){}},Event:class{},EventSource:class{},Phaser:{VERSION:'contract'},setInterval(){},createArena:()=>({accept(){}}),fetch:async(route,options)=>{requests.push({route,options});if(options?.body&&JSON.parse(options.body).action==='resume')paused=false;return {ok:true,json:async()=>({state,paused,demo:true,live:{enabled:false,status:'disconnected',received:0,applied:0},totals:{},hash:'fixture'})};}};
context.createAudiencePanel=()=>({update(){},accept(){}});
vm.createContext(context);const source=readFileSync('src/ui/app.js','utf8').replace(/^import .*;\s*$/gm,'');vm.runInContext(source,context);await new Promise(r=>setImmediate(r));
assert.match(elements.get('combat-details').textContent,/Próxima onda de Cerco em 30s/);assert.match(elements.get('combat-details').textContent,/Safira · 0\/20 créditos · 0 energia/);assert.match(elements.get('toggle').textContent,/Retomar/);
await elements.get('toggle').onclick();assert.match(elements.get('toggle').textContent,/Pausar/);await elements.get('live-start').onclick();assert.equal(requests.at(-1).route,'/api/live');assert.equal(JSON.parse(requests.at(-1).options.body).action,'start');
writeFileSync('evidence/figma-panel.json',JSON.stringify({status:'pass',checks:['all panel DOM targets exist','initial state updates telemetry','siege countdown and faction resources','resume action','LIVE start wiring'],scope:'Operator script executed with VM DOM/fetch doubles; no actual LIVE or browser UI was controlled.'},null,2));console.log('PASS operator panel wiring and final combat telemetry.');
