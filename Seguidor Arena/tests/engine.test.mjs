import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../src/engine.mjs';
import {RULES,validateSettings} from '../src/config.mjs';
const join=(g,id)=>{g.apply({kind:'follow',id,name:id});g.apply({kind:'like',id,name:id,count:1});};
function duel(hp=10,targetHp=20){const g=createEngine();join(g,'a');join(g,'b');g.tick(35000);const state=g.exportState();state.players.find(([id])=>id==='a')[1].hp=hp;state.players.find(([id])=>id==='b')[1].hp=targetHp;return createEngine(g.settings,state);}
const player=(g,id)=>g.snapshot().players.find(p=>p.id===id);

test('existing follower enters by like alone; member confirmation survives rounds/restart; explicit non-follower revokes entry',()=>{
 let g=createEngine();
 assert.equal(g.apply({kind:'like',id:'old-direct',following:true,count:1}),true);
 assert.ok(player(g,'old-direct'));
 g.apply({kind:'identity',id:'old-member',following:true});assert.equal(player(g,'old-member'),undefined);
 g.apply({kind:'like',id:'old-member',following:null,count:1});assert.ok(player(g,'old-member'));
 g.resetRound();g=createEngine(g.settings,g.exportState());
 assert.equal(g.snapshot().alive,0);assert.equal(g.apply({kind:'like',id:'old-member',following:null,count:1}),true);
 g.resetRound();g.apply({kind:'identity',id:'old-member',following:false});assert.equal(g.apply({kind:'like',id:'old-member',count:1}),false);
 g.apply({kind:'like',id:'new',count:1});g.apply({kind:'follow',id:'new'});assert.equal(player(g,'new'),undefined);
 g.apply({kind:'like',id:'new',count:1});assert.equal(player(g,'new').likes,1);
});
test('20 HP para todos; sem seguidor confirmado ou sem primeiro like não há spawn',()=>{
 const g=createEngine();assert.equal(g.apply({kind:'like',id:'unknown',count:50}),false);g.apply({kind:'follow',id:'a'});assert.equal(g.snapshot().alive,0);g.apply({kind:'like',id:'a',count:1});assert.equal(player(g,'a').hp,20);assert.equal(g.snapshot().phase,'waiting');assert.equal(g.snapshot().ranking[0].xp,0);join(g,'b');assert.equal(g.snapshot().phase,'announcement');g.tick(35000);assert.equal(g.snapshot().phase,'running');assert.equal(player(g,'b').hp,20);
});
test('um acerto tira 2 HP e cura 1 HP real, sem ultrapassar o limite',()=>{
 const g=duel();assert.equal(g.hit('a','b'),true);assert.equal(player(g,'b').hp,18);assert.equal(player(g,'a').hp,11);assert.equal(g.snapshot().ranking.find(r=>r.id==='a').healing,1);assert.equal(g.hit('a','b'),false);const full=duel(20);full.hit('a','b');assert.equal(player(full,'a').hp,20);assert.equal(full.snapshot().ranking.find(r=>r.id==='a').healing,0);
});
test('cura: 1 HP por segundo por 5s, exatamente 5 HP; acerto cura 2 enquanto ativa',()=>{
 let g=createEngine();join(g,'a');const s=g.exportState();s.phase='running';s.players[0][1].hp=3;g=createEngine(g.settings,s);g.activateAbility('a','heal');g.tick(5000);assert.equal(player(g,'a').hp,8);g.tick(1000);assert.equal(player(g,'a').hp,8);
 const d=duel();d.activateAbility('a','heal');d.hit('a','b');assert.equal(player(d,'a').hp,12);
});

test('partida antiga com 50 HP migra para 20 sem cura negativa e com até 5s de recuperação',()=>{
 const old=createEngine();join(old,'a');const saved=old.exportState();Object.assign(saved.players[0][1],{hp:50,healUntil:10000,healTick:1000});
 const restored=createEngine(old.settings,saved);assert.equal(player(restored,'a').hp,20);assert.equal(player(restored,'a').healUntil,5000);restored.tick(6000);assert.equal(player(restored,'a').hp,20);assert.equal(restored.snapshot().ranking[0].healing,0);
});
test('dano ampliado dura 10s, causa 4 HP e volta a 2; ambas as habilidades podem coexistir',()=>{
 const g=duel();g.activateAbility('a','damage');g.activateAbility('a','heal');g.hit('a','b');assert.equal(player(g,'b').hp,16);assert.equal(player(g,'a').hp,12);assert.equal(player(g,'a').damageUntil,g.snapshot().now+10000);const saved=g.exportState();saved.now+=10000;const restored=createEngine(g.settings,saved);const hp=player(restored,'b').hp;restored.hit('a','b');assert.equal(player(restored,'b').hp,hp-2);
});
test('cada 50 likes pessoais ativa uma habilidade; saldo é carregado e spam não troca HP inicial',()=>{
 const g=createEngine();join(g,'a');join(g,'b');g.tick(35000);g.apply({kind:'like',id:'a',count:48});assert.equal(g.snapshot().effects.filter(e=>e.kind==='ability').length,0);g.apply({kind:'like',id:'a',count:101});assert.equal(g.snapshot().effects.filter(e=>e.kind==='ability').length,3);assert.equal(player(g,'a').likes,0);assert.equal(player(g,'a').hp,RULES.initialHp);
});
test('último sobrevivente vence uma vez e recebe XP, participação, dano, cura e patente',()=>{
 const g=duel(10,2);g.hit('a','b');const s=g.snapshot();assert.equal(s.phase,'intermission');assert.equal(s.winner.id,'a');assert.equal(s.alive,1);const a=s.ranking.find(r=>r.id==='a'),b=s.ranking.find(r=>r.id==='b');assert.equal(a.wins,1);assert.equal(a.xp,60);assert.equal(b.xp,10);assert.equal(a.damage,2);assert.equal(a.healing,1);assert.equal(a.participations,1);assert.equal(g.hit('a','b'),false);assert.equal(g.snapshot().ranking.find(r=>r.id==='a').wins,1);
});
test('eliminado não renasce na rodada; próximo like entra na fila e reaparece na seguinte',()=>{
 const g=duel(10,2);g.hit('a','b');g.apply({kind:'like',id:'b',count:1});assert.equal(g.snapshot().alive,1);assert.equal(g.snapshot().queued,1);g.tick(10000);assert.equal(g.snapshot().round,2);assert.equal(player(g,'b').hp,20);assert.equal(g.snapshot().phase,'waiting');
});
test('presentes usam 1–5s e rastros configurados; repetição não acumula duração além de 5s',()=>{
 const settings={giftMappings:[{id:'rose',seconds:5,trail:'fire'},{id:'star',seconds:2,trail:'laser'}]},g=createEngine(settings);join(g,'a');join(g,'b');g.tick(35000);const start=g.snapshot().now;g.apply({kind:'gift',id:'a',giftId:'rose'});assert.equal(player(g,'a').boostUntil,start+5000);g.apply({kind:'gift',id:'a',giftId:'rose'});assert.equal(player(g,'a').boostUntil,start+5000);assert.equal(player(g,'a').trail,'fire');g.tick(5000);assert.equal(player(g,'a').boostUntil,g.snapshot().now);g.apply({kind:'gift',id:'a',giftId:'star'});assert.equal(player(g,'a').boostUntil,g.snapshot().now+2000);assert.equal(player(g,'a').trail,'laser');
});
test('movimento e colisões são determinísticos; recuperação mantém partida e ranking',()=>{
 const a=createEngine(),b=createEngine();for(let i=0;i<30;i++){join(a,'u'+i);join(b,'u'+i);}a.tick(35000);b.tick(35000);for(let i=0;i<150;i++){a.tick(100);b.tick(100);}assert.deepEqual(a.exportState(),b.exportState());const c=createEngine(a.settings,a.exportState());assert.deepEqual(c.snapshot().players,a.snapshot().players);assert.deepEqual(c.snapshot().ranking,a.snapshot().ranking);assert.ok(a.snapshot().ranking.some(r=>r.damage>0));
});
test('configuração rejeita impulso >5s, patentes incoerentes e XP inválido',()=>{
 for(const s of [{giftMappings:[{id:'x',seconds:6,trail:'fire'}]},{giftMappings:[{id:'x',seconds:3,trail:'invalid'}]},{ranks:[{xp:10,name:'A'}]},{participationXp:-1},{maxPlayers:1}])assert.throws(()=>validateSettings(s));
});
