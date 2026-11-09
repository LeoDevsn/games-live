import {FIGMA_LAYOUT} from './figma-layout.js';
const {width:W,height:H}=FIGMA_LAYOUT.stage;
export const SCALE_X=1080/W,SCALE_Y=1920/H;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function segmentDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);}
export function blockedNative(x,y,r=0){
 if(x<r||y<r||x>W-r||y>H-r)return true;
 for(const c of FIGMA_LAYOUT.colliders){
  if(c.type==='rect'){if(Math.hypot(Math.max(c.x-x,0,x-c.x-c.width),Math.max(c.y-y,0,y-c.y-c.height))<=r)return true;}
  else if(c.type==='ellipse'){
   // Conservative Minkowski clearance for the nearly circular Nexus footprints.
   const padding=r*1.02+0.15;if(((x-c.x)/(c.rx+padding))**2+((y-c.y)/(c.ry+padding))**2<=1)return true;
  }else{let inside=false;const p=c.points;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;if(segmentDistance(x,y,a,b)<=r)return true;}if(inside)return true;}
 }
 return false;
}
export function segmentClear(a,b,r=0){const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(distance/2));for(let i=0;i<=steps;i++){const t=i/steps;if(blockedNative(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,r))return false;}return true;}
export const NEXUS={R:{x:469.5*SCALE_X,y:1359.5*SCALE_Y},S:{x:469.5*SCALE_X,y:185.5*SCALE_Y}};
const points=['A','B','C'].map(k=>FIGMA_LAYOUT.placements['point-'+k]);
export const OBJECTIVES=points.map(p=>({x:(p.x+p.width/2)*SCALE_X,y:(p.y+p.height/2)*SCALE_Y}));
// Shared corridors join at the exact capture position. Both factions traverse the same
// obstacle-free path in opposite directions; logical combat distances stay authoritative.
const raw=[
 [[306,1290],[224,1260],[224,724],[224,300],[272,260],[306,244]],
 [[470,1214],[470,724],[470,330]],
 [[630,1290],[716,1260],[716,727],[716,300],[666,260],[630,244]]
];
export const ROUTES=raw.map((list,lane)=>{
 const path=list.map(([x,y])=>({x,y})),objective={x:points[lane].x+38,y:points[lane].y+38},mid=path.findIndex(p=>Math.abs(p.y-objective.y)<10);path[mid]=objective;
 for(let i=1;i<path.length;i++)if(!segmentClear(path[i-1],path[i],30))throw Error('Blocked Figma route '+lane+' segment '+i);
 const length=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
 return {path,mid,length};
});
function along(path,t){const lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y)),sum=lengths.reduce((a,b)=>a+b,0);let distance=clamp(t,0,1)*sum;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=path[i],b=path[i+1],v=clamp(distance/lengths[i],0,1);return {x:a.x+(b.x-a.x)*v,y:a.y+(b.y-a.y)*v};}distance-=lengths[i];}return path[0];}
export function nativeUnitPosition(unit,profile={path:32000},jitter=0){const route=ROUTES[unit.lane],t=clamp(unit.pos/(profile.path||32000),0,1),path=t<=.5?route.path.slice(0,route.mid+1):route.path.slice(route.mid),p=along(path,t<=.5?t*2:(t-.5)*2),radius=unit.kind==='C'?28:18;
 let shift=jitter;if(blockedNative(p.x+shift,p.y,radius)){let lo=0,hi=1;for(let i=0;i<8;i++){const f=(lo+hi)/2;if(blockedNative(p.x+shift*f,p.y,radius))hi=f;else lo=f;}shift*=lo;}
 return {x:p.x+shift,y:p.y};
}
