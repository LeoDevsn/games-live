// World coordinates are screen coordinates: visible walls and collision walls agree.
export const BASE_BOUNDS=Object.freeze({left:28,right:1052,top:420,bottom:1300});
export const LEGACY_BOUNDS=Object.freeze({left:85,right:995,top:415,bottom:1455});
export const ARENA_VERSION=13;
export const LOW_COUNT_CLOSING=Object.freeze({below:10,intervalMs:5000,areaStep:.01,minArea:.3});
export const DEATH_MATCH=Object.freeze({startArea:.2,minArea:.05,intervalMs:3000,areaStep:.01});
export const CLOSING_AREA_PER_SECOND=1/30; // Ten percentage points over three seconds.
export function areaForSurvivors(alive,total){
 if(total<=0)return 1;
 // Hold the preceding size in the gaps between the requested survivor bands.
 if(alive*100<=total*20)return .2;
 if(alive*100<=total*40)return .4;
 if(alive*100<=total*60)return .6;
 if(alive*100<=total*80)return .8;
 return 1;
}
export function boundsForArea(area=1){
 const current=Math.max(DEATH_MATCH.minArea,Math.min(1,area)),cx=(BASE_BOUNDS.left+BASE_BOUNDS.right)/2,cy=(BASE_BOUNDS.top+BASE_BOUNDS.bottom)/2;
 const initialHalfW=(BASE_BOUNDS.right-BASE_BOUNDS.left)/2,initialHalfH=(BASE_BOUNDS.bottom-BASE_BOUNDS.top)/2,initialArea=4*initialHalfW*initialHalfH;
 // Use the full available width; compensate corner area throughout the circle transition.
 const t=Math.max(0,Math.min(1,(.8-current)/.4));
 const finalRadius=Math.sqrt(initialArea*.4/Math.PI);
 const halfWidth=current>=.8?initialHalfW*Math.sqrt(current):current<=.4?Math.sqrt(initialArea*current/Math.PI):initialHalfW*Math.sqrt(.8)*(1-t)+finalRadius*t;
 const halfHeight=current>=.8?initialHalfH*Math.sqrt(current):current<=.4?halfWidth:initialHalfH*Math.sqrt(.8)*(1-t)+finalRadius*t;
 const radius=Math.min(halfWidth,halfHeight),cornerRadius=current>=.8?0:current<=.4?radius:Math.min(radius,Math.sqrt(Math.max(0,(4*halfWidth*halfHeight-current*initialArea)/(4-Math.PI))));
 const morph=cornerRadius/radius;
 return {left:cx-halfWidth,right:cx+halfWidth,top:cy-halfHeight,bottom:cy+halfHeight,cx,cy,radius,halfWidth,halfHeight,cornerRadius,morph};
}
export function constrainToArena(p,b,reflect=false){
 const dx=p.x-b.cx,dy=p.y-b.cy,limitX=Math.max(0,b.halfWidth-p.radius),limitY=Math.max(0,b.halfHeight-p.radius),corner=Math.max(0,b.cornerRadius-p.radius),innerX=limitX-corner,innerY=limitY-corner;
 const qx=Math.max(Math.abs(dx)-innerX,0),qy=Math.max(Math.abs(dy)-innerY,0),d=Math.hypot(qx,qy);
 if(d>corner){const nx=Math.sign(dx)*qx/d,ny=Math.sign(dy)*qy/d;
  p.x=b.cx+Math.sign(dx)*Math.min(Math.abs(dx),innerX)+nx*corner;p.y=b.cy+Math.sign(dy)*Math.min(Math.abs(dy),innerY)+ny*corner;
  if(reflect){const vx=Math.cos(p.angle),vy=Math.sin(p.angle),dot=vx*nx+vy*ny;if(dot>0)p.angle=Math.atan2(vy-2*dot*ny,vx-2*dot*nx);}
 }
 return p;
}
