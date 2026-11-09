import test from 'node:test';
import assert from 'node:assert/strict';
import {createBroadcastUI} from '../../shared/broadcast-ui.js';
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.controls=new Map();this.value='';}
 setAttribute(){}
 set innerHTML(html){for(const match of html.matchAll(/data-([\w-]+)(?:[\s>])/g))this.controls.set('[data-'+match[1]+']',new Element('input'));}
 querySelector(s){return this.controls.get(s);}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 play(){this.played=true;return Promise.resolve();}
}
test('jogos com efeitos oficiais mantêm pódio/chat sem criar camada de GIF',()=>{
 globalThis.document={createElement:tag=>new Element(tag)};const stage=new Element('div'),host=new Element('aside');
 try{const ui=createBroadcastUI({stage,host,nativeGiftsOnly:true,api:async()=>{}}),broadcast={config:{title:'Pódio',accent:'#ab8fff',showChat:true,metric:'wins',giftMappings:[]},metrics:['wins'],alert:{sequence:'old-alert'},queued:2};ui.update({broadcast});assert.equal(ui.overlay,null);assert.equal(stage.children.length,0);assert.equal(broadcast.alert,null);assert.equal(broadcast.nativeGiftsOnly,true);assert.ok(ui.panel.querySelector('[data-title]'));assert.equal(ui.panel.querySelector('[data-file]'),undefined);}finally{delete globalThis.document;}
});
test('camada usa IMG para GIF, VIDEO mudo para vídeo, fallback e remoção ao terminar',{timeout:1000},()=>{
 globalThis.document={createElement:tag=>new Element(tag)};const stage=new Element('div'),host=new Element('aside');
 const ui=createBroadcastUI({stage,host,api:async()=>{},getMode:()=> 'simulation'});
 const broadcast={config:{title:'Meu pódio',accent:'#ab8fff',enabled:true,showChat:true,giftMappings:[],metric:'wins'},metrics:['wins'],assets:[],observedGifts:[],alert:{sequence:'one',name:'<img onerror=attack>',giftName:'Rosa',remainingMs:6000,media:{type:'image/gif',url:'/broadcast/media/abc'}}};
 try{
  ui.update({broadcast});assert.equal(ui.overlay.hidden,false);assert.equal(ui.overlay.children[0].children[0].tagName,'IMG');assert.equal(ui.overlay.children[0].children[0].src,'/broadcast/media/abc');assert.equal(ui.overlay.children[1].children[0].textContent,'<img onerror=attack>');
  broadcast.alert={...broadcast.alert,sequence:'two',media:{type:'video/webm',url:'/broadcast/media/def'}};ui.update({broadcast});const video=ui.overlay.children[0].children[0];assert.equal(video.tagName,'VIDEO');assert.equal(video.muted,true);assert.equal(video.played,true);video.onerror();assert.equal(ui.overlay.children[0].className,'gift-visual gift-celebration');
  broadcast.alert=null;ui.update({broadcast});assert.equal(ui.overlay.hidden,true);assert.equal(ui.overlay.children.length,0);
 }finally{ui.clear();delete globalThis.document;}
});
