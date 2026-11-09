import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FIGMA_LAYOUT} from '../src/ui/figma-layout.js';
import {blockedNative,segmentClear,ROUTES,SCALE_X,SCALE_Y,OBJECTIVES} from '../src/ui/arena-navigation.js';
import {unitPosition} from '../src/ui/arena-layout.js';
import {markerState,pointView} from '../src/ui/figma-hud.js';
const source=JSON.parse(readFileSync('design-import/arena-2026-11-02/layout.json'));
assert.equal(FIGMA_LAYOUT.colliders.length,10);assert.deepEqual(FIGMA_LAYOUT.stage,source.stage);
for(const key of FIGMA_LAYOUT.assets)assert.ok(readFileSync('src/ui/assets/figma/'+key+'.png').length>1000,key);
// Verify the runtime slots still match the editable file, including the (−32,−32) group offset.
for(const slot of Object.values(FIGMA_LAYOUT.placements)){const original=source.placements.find(n=>n.id===slot.nodeId);assert.equal(slot.x,original.transform.m02);assert.equal(slot.y,original.transform.m12);assert.equal(slot.width,original.size.x);assert.equal(slot.height,original.size.y);}
for(const n of source.colliders){const m=n.transform,x=m.m00*n.size.x/2+m.m01*n.size.y/2+m.m02,y=m.m10*n.size.x/2+m.m11*n.size.y/2+m.m12;assert.equal(blockedNative(x,y),true,'blocked shape '+n.id);}
for(const r of ROUTES)for(let i=1;i<r.path.length;i++)assert.equal(segmentClear(r.path[i-1],r.path[i],30),true);
let samples=0;for(const faction of ['R','S'])for(const kind of ['D','G','A','C'])for(let lane=0;lane<3;lane++)for(let id=0;id<16;id++){
 let last;for(let i=0;i<=800;i++){
  const pos=faction==='R'?i*40:32000-i*40,p=unitPosition({id:'fixture-'+id,faction,kind,lane,pos},{path:32000});
  assert.equal(blockedNative(p.x/SCALE_X,p.y/SCALE_Y,kind==='C'?28:18),false,`${faction}/${kind}/${lane}/${pos}`);
  if(last)assert.equal(segmentClear({x:last.x/SCALE_X,y:last.y/SCALE_Y},{x:p.x/SCALE_X,y:p.y/SCALE_Y},kind==='C'?27:17),true,'interpolation clearance');last=p;samples++;
 }
}
for(let lane=0;lane<3;lane++){const p=unitPosition({id:'objective',lane,pos:16000,kind:'C'},{path:32000});assert.equal(p.y,OBJECTIVES[lane].y);assert.ok(Math.abs(p.x-OBJECTIVES[lane].x)<=23*SCALE_X);}
assert.equal(markerState({owner:null,progress:0,contested:false}),'neutral');assert.equal(markerState({owner:null,progress:90,contested:false}),'capturing');assert.equal(markerState({owner:'R',progress:200,contested:false}),'owned');assert.equal(markerState({owner:'R',progress:-20,contested:true}),'contested');
const reversal=pointView({lane:0,owner:'R',progress:90,contested:false},{units:[{lane:0,pos:16000,faction:'S'}],profile:{center:16000,zoneHalf:1000}});assert.equal(reversal.owner,'R');assert.equal(reversal.captureTeam,'S');assert.equal(reversal.captureRatio,.275);assert.equal(markerState({...reversal,progress:0}),'capturing');
const files=['src/core/engine.js','src/core/state.js','src/combat/combat.js','src/rules/rules.js'].map(file=>({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
const report={status:'pass',samples,colliders:10,slots:Object.keys(FIGMA_LAYOUT.placements).length,checks:['native editable positions','all exported assets exist','blocked shape interiors','three continuous traversable routes','all classes and both factions','cannon footprint and interpolated paths','exact objective progress placement','marker states'],engineFiles:files,scope:'Fixed-lane navigation projected onto supplied collision geometry; combat retains its authoritative logical distances. Not a browser FPS measurement.'};writeFileSync('evidence/figma-layout.json',JSON.stringify(report,null,2));console.log('PASS Figma layout/navigation: '+samples+' unit positions and their interpolated segments.');
