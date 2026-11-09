import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../src/engine.mjs';
const join=(id,team,name=id)=>({kind:'join',id,team,name});

test('nenhum início automático sem escolha A/B',()=>{
  const g=createEngine();assert.equal(g.snapshot().phase,'waiting');
  assert.equal(g.apply({kind:'like',id:'x',count:20}),false);
  assert.equal(g.snapshot().phase,'waiting');
});
test('primeiro chat A inicia rodada e constrói primeiro bloco',()=>{
  const g=createEngine();assert.equal(g.apply(join('alice','A'),0),true);
  const s=g.snapshot();assert.equal(s.phase,'running');assert.equal(s.round,1);assert.equal(s.teams.A.blocks,1);assert.equal(s.teams.A.hp,120);
});
test('chat repetido respeita cooldown de usuário',()=>{
  const g=createEngine();g.apply(join('alice','A'),0);g.apply(join('alice','A'),500);
  assert.equal(g.snapshot().teams.A.blocks,1);
  g.apply(join('alice','A'),3500);assert.equal(g.snapshot().teams.A.blocks,2);
});
test('jogador não consegue trocar de time na mesma rodada',()=>{
  const g=createEngine();g.apply(join('a','A'),0);assert.equal(g.apply(join('a','B'),4000),false);
  assert.equal(g.snapshot().teams.B.memberCount,0);
});
test('likes são convertidos em blocos só depois da escolha do time',()=>{
  const g=createEngine();g.apply(join('a','A'),0);
  g.apply({kind:'like',id:'a',count:15},1);assert.equal(g.snapshot().teams.A.blocks,1);
  g.apply({kind:'like',id:'a',count:10},2);assert.equal(g.snapshot().teams.A.blocks,2);
  assert.equal(g.apply({kind:'like',id:'unknown',count:999},3),false);
});
test('presentes são opcionais, capados por usuário/rodada',()=>{
  const g=createEngine();g.apply(join('a','A'),0);
  for(let i=0;i<9;i++)g.apply({kind:'gift',id:'a'},i);
  assert.equal(g.snapshot().teams.A.gifts,9);
  assert.equal(g.snapshot().teams.A.blocks,7);
  assert.equal(g.snapshot().teams.A.shield,9);
});
test('ambas as torres atacam em intervalos determinísticos',()=>{
  const g=createEngine();g.apply(join('a','A'),0);g.apply(join('b','B'),0);
  g.tick(3999);assert.equal(g.snapshot().teams.A.hp,120);
  g.tick(1);assert.equal(g.snapshot().teams.A.hp,119);assert.equal(g.snapshot().teams.B.hp,119);
});
test('rodada termina por tempo e reinicia automaticamente',()=>{
  const g=createEngine({roundSeconds:4,intermissionSeconds:2,attackIntervalSeconds:5});
  g.apply(join('a','A'),0);g.apply(join('b','B'),0);
  g.tick(4000);assert.equal(g.snapshot().phase,'intermission');
  g.tick(2000);assert.equal(g.snapshot().phase,'running');assert.equal(g.snapshot().round,2);
  assert.equal(g.snapshot().teams.A.hp,120);
});
test('progresso e ranking não desaparecem entre rodadas',()=>{
  const g=createEngine({roundSeconds:1,intermissionSeconds:1,attackIntervalSeconds:5});
  g.apply(join('a','A'),0);g.apply(join('b','B'),0);
  g.apply(join('a2','A'),0);g.tick(1000);
  assert.equal(g.snapshot().lastWinner,'A');assert.equal(g.snapshot().teams.A.wins,1);
  g.tick(1000);assert.equal(g.snapshot().teams.A.wins,1);
});
test('regra de HP máximo e limite de blocos',()=>{
  const g=createEngine({maxHp:50,maxBlocks:2});g.apply(join('a','A'),0);
  for(let i=0;i<20;i++)g.apply(join(`a${i}`,'A'),i*10);
  assert.equal(g.snapshot().teams.A.hp,50);assert.equal(g.snapshot().teams.A.blocks,2);
});
