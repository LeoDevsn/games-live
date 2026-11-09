import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine} from '../src/engine.mjs';
import {BASE_BOUNDS,LEGACY_BOUNDS,areaForSurvivors,boundsForArea,constrainToArena} from '../src/arena.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const join=(g,id)=>{g.apply({kind:'follow',id,name:id});g.apply({kind:'like',id,count:1});};
function fixture(total,live){const g=createEngine();for(let i=0;i<total;i++)join(g,'p'+String(i).padStart(3,'0'));const state=g.exportState();state.phase='running';state.nextItemAt=1e9;state.players.forEach(([,p],i)=>{p.hp=i<live?20:0;p.attackAt=1e9;});return createEngine(g.settings,state);}
function inside(s){for(const p of s.players){const b=s.bounds,corner=Math.max(0,b.cornerRadius-p.radius),innerX=b.halfWidth-p.radius-corner,innerY=b.halfHeight-p.radius-corner;assert.ok(Math.hypot(Math.max(Math.abs(p.x-b.cx)-innerX,0),Math.max(Math.abs(p.y-b.cy)-innerY,0))<=corner+1e-9,p.id+' outside shape');}}

test('survivor bands include exact thresholds and never reduce usable area below twenty percent',()=>{
 for(const [live,expected]of [[100,1],[90,1],[81,1],[80,.8],[70,.8],[61,.8],[60,.6],[50,.6],[41,.6],[40,.4],[30,.4],[21,.4],[20,.2],[11,.2],[10,.2],[1,.2],[0,.2]])assert.equal(areaForSurvivors(live,100),expected,String(live));
 assert.equal(areaForSurvivors(0,0),1);const base=4*boundsForArea(1).halfWidth*boundsForArea(1).halfHeight;
 for(const area of [1,.8,.6,.4,.2]){const b=boundsForArea(area);near((4*b.halfWidth*b.halfHeight-(4-Math.PI)*b.cornerRadius**2)/base,area);near((b.left+b.right)/2,540);near((b.top+b.bottom)/2,860);}
});

test('initial field fills available width and avatars remain within the real visible collision bounds',()=>{
 assert.equal(boundsForArea(1).radius,440);assert.equal(boundsForArea(1).left,BASE_BOUNDS.left);assert.equal(boundsForArea(1).right,BASE_BOUNDS.right);assert.equal(boundsForArea(1).right-boundsForArea(1).left,1024);
 const g=fixture(100,100);for(let i=0;i<100;i++){g.tick(50);inside(g.snapshot());}assert.equal(g.snapshot().arena.areaPercent,100);
});

test('closing is gradual, constrains players, survives recovery and late entrants cannot reopen it',()=>{
 const g=fixture(100,10);let s=g.snapshot();assert.equal(s.arena.area,1);assert.equal(s.arena.target,.2);
 g.tick(1000);s=g.snapshot();assert.ok(s.arena.area<1&&s.arena.area>.9);inside(s);
 const restored=createEngine(g.settings,g.exportState());for(let i=0;i<520;i++){g.tick(50);restored.tick(50);inside(g.snapshot());}near(g.snapshot().arena.area,.2);assert.deepEqual(g.exportState(),restored.exportState());
 for(let i=0;i<100;i++){join(g,'late'+i);inside(g.snapshot());}g.tick(50);s=g.snapshot();assert.ok(s.arena.survivorsPercent===10);near(s.arena.area,.2);assert.equal(s.arena.target,.2);inside(s);
 g.resetRound();s=g.snapshot();assert.equal(s.arena.area,1);assert.equal(s.arena.target,1);assert.deepEqual(s.bounds,boundsForArea(1));
});

test('an actual elimination changes the closing target and total participants is the round denominator',()=>{
 const seed=createEngine();for(let i=0;i<10;i++)join(seed,'p'+i);const saved=seed.exportState();saved.phase='running';saved.players.find(([id])=>id==='p8')[1].hp=2;saved.players.find(([id])=>id==='p9')[1].hp=2;const g=createEngine(seed.settings,saved);
 g.hit('p0','p8');assert.equal(g.snapshot().arena.target,1);g.hit('p1','p9');assert.equal(g.snapshot().totalParticipants,10);assert.equal(g.snapshot().alive,8);assert.equal(g.snapshot().arena.target,.8);g.tick(50);assert.ok(g.snapshot().arena.area<1);
});

test('old saved matches migrate into the expanded field and damage duration is capped at 10s',()=>{
 const g=fixture(10,5),old=g.exportState();delete old.arena;Object.assign(old.players[0][1],{x:LEGACY_BOUNDS.right-43,y:LEGACY_BOUNDS.bottom-43,radius:43,damageUntil:old.now+15000});
 const restored=createEngine(g.settings,old),s=restored.snapshot();inside(s);assert.equal(s.arena.target,.6);assert.equal(s.players[0].damageUntil,s.now+10000);assert.equal(s.players[0].radius,37.84);assert.ok(s.players[0].y<BASE_BOUNDS.bottom);
});

test('radial wall reflects outward movement and corners are inaccessible',()=>{
 const b=boundsForArea(.4),p={x:b.right+10,y:b.cy,radius:30,angle:0};constrainToArena(p,b,true);near(p.x,b.right-30);near(Math.cos(p.angle),-1);
 const corner={x:b.right-20,y:b.bottom-20,radius:20,angle:Math.PI};constrainToArena(corner,b,true);near(Math.hypot(corner.x-b.cx,corner.y-b.cy)+corner.radius,b.radius);
});
test('version 2 rectangle saves keep radius and shrink progress when moved into the circle',()=>{
 const g=fixture(100,30),saved=g.exportState();saved.arena={version:2,area:.7,target:.6};saved.players[0][1].x=28;saved.players[0][1].y=420;const radius=saved.players[0][1].radius;
 const s=createEngine(g.settings,saved).snapshot();assert.equal(s.arena.version,13);assert.equal(s.arena.shape,'morph');near(s.arena.area,.7);near(s.arena.target,.4);near(s.players[0].radius,radius);inside(s);
});

test('wide rectangle rounds gradually at 60 percent, is circular by 40, and never reopens during morph',()=>{
 assert.equal(boundsForArea(1).cornerRadius,0);assert.equal(boundsForArea(.8).cornerRadius,0);
 const mid=boundsForArea(.6);assert.ok(mid.cornerRadius>0&&mid.cornerRadius<mid.radius);near(boundsForArea(.4).cornerRadius,boundsForArea(.4).radius);
 let previous=boundsForArea(1);for(let i=1;i<=160;i++){const b=boundsForArea(1-i*.005);assert.ok(b.halfWidth<=previous.halfWidth+1e-9);assert.ok(b.halfHeight<=previous.halfHeight+1e-9);
  for(let j=0;j<64;j++){const a=j/64*Math.PI*2,p={x:b.cx+Math.cos(a)*1000,y:b.cy+Math.sin(a)*1000,radius:30};constrainToArena(p,b);const copy={...p};constrainToArena(copy,previous);near(copy.x,p.x);near(copy.y,p.y);}
  previous=b;
 }
});

test('under ten survivors close by one percentage point every five combat seconds, stopping at thirty percent',()=>{
 const ten=fixture(10,10);ten.tick(5000);near(ten.snapshot().arena.target,1);
 const nine=fixture(9,9);nine.tick(4950);near(nine.snapshot().arena.target,1);nine.tick(50);near(nine.snapshot().arena.target,.99);assert.ok(nine.snapshot().arena.area>.98);inside(nine.snapshot());
 for(let i=1;i<70;i++)nine.tick(5000);near(nine.snapshot().arena.target,.3);nine.tick(5000);near(nine.snapshot().arena.area,.3);near(nine.snapshot().arena.target,.3);inside(nine.snapshot());
});

test('timed closing starts from the elimination target; stronger survivor bands can still close below thirty percent',()=>{
 const g=fixture(20,9);near(g.snapshot().arena.target,.6);g.tick(5000);near(g.snapshot().arena.target,.59);
 for(let i=0;i<30;i++)g.tick(5000);near(g.snapshot().arena.target,.3);
 const saved=g.exportState();let remaining=0;for(const [,p]of saved.players)if(p.hp>0&&++remaining>4)p.hp=0;
 const reduced=createEngine(g.settings,saved);near(reduced.snapshot().arena.target,.2);reduced.tick(10000);near(reduced.snapshot().arena.area,.2);inside(reduced.snapshot());
});

test('timed closing survives recovery, resets each round and never counts entry or preparation time',()=>{
 const g=fixture(9,9);g.tick(4950);const restored=createEngine(g.settings,g.exportState());g.tick(50);restored.tick(50);assert.deepEqual(g.exportState(),restored.exportState());near(g.snapshot().arena.target,.99);
 g.resetRound();near(g.snapshot().arena.target,1);assert.equal(g.exportState().arena.lowCountElapsed,0);
 const waiting=createEngine();join(waiting,'a');join(waiting,'b');join(waiting,'c');waiting.tick(35000);near(waiting.snapshot().arena.target,1);waiting.tick(4950);near(waiting.snapshot().arena.target,1);waiting.tick(50);near(waiting.snapshot().arena.target,.99);
});
