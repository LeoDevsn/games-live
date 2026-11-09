import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createEngine} from '../src/engine.mjs';
import {DEFAULT_RULES,RULE_LIMITS} from '../src/rules.mjs';

test('painel real inicializa, recebe SSE, alterna modo e envia controles do simulador',async()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 function element(){return {children:[],value:'',classList:{toggle(){},contains:()=>false},append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},querySelectorAll(){return this.children.flatMap(c=>c.children).filter(c=>c.name);}};}
 const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],element()]));
 const requests=[];let source;
 const state={mode:'live',game:createEngine().snapshot(),connection:{status:'connected',received:0,invalid:0,reconnects:0},latest:'Esperando',limits:RULE_LIMITS,rules:DEFAULT_RULES,settings:{giftsEnabled:true,giftIds:[]}};
 const context={createAudienceUI:()=>({update(){}}),createEntryControls:()=>({preview:false,page:0}),createBroadcastUI:()=>({update(){}}),document:{getElementById:id=>nodes.get(id)||null,createElement:element,body:element(),querySelector:()=>element()},location:{search:'',origin:'http://127.0.0.1:4175'},performance:{now:()=>0},URLSearchParams,EventSource:class{constructor(){source=this;}},requestAnimationFrame(){},drawArena(){},renderDiagnostics(){return {renderer:'test'};},navigator:{clipboard:{writeText:async()=>{}}},fetch:async(url,init)=>{requests.push({url,body:init?.body?JSON.parse(init.body):null});if(url==='/api/mode')state.mode=JSON.parse(init.body).mode;return {ok:true,json:async()=>state};}};
 const code=readFileSync(new URL('../public/main.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');
 runInNewContext(code,context);source.onopen();source.onmessage({data:JSON.stringify(state)});
 assert.ok(nodes.get('connection').textContent.includes('aguardando'));assert.equal(nodes.get('demoControls').inert,true);assert.equal(nodes.get('ruleFields').children.length,Object.keys(RULE_LIMITS).length);
 nodes.get('mode').value='simulation';await nodes.get('mode').onchange();assert.equal(nodes.get('demoControls').inert,false);await nodes.get('demoA').onclick();assert.equal(requests.at(-1).url,'/api/demo');assert.deepEqual(requests.at(-1).body,{team:'A',event:'chat'});
 source.onerror();assert.ok(nodes.get('connection').textContent.includes('indisponível'));
});
