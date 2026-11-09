import {nativeUnitPosition,SCALE_X,SCALE_Y,OBJECTIVES} from './arena-navigation.js';
// The engine owns lane progress/range; its on-screen trajectory respects Figma's obstacles.
export const LANES=OBJECTIVES.map(p=>p.x),TOP=244*SCALE_Y,BOTTOM=1290*SCALE_Y,POINT_Y=OBJECTIVES[1].y;
export function number(s){let n=0;for(const c of s)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;}
export function unitPosition(u,profile={path:32000}){const h=number(u.id),jitter=((h%5)-2)*11,p=nativeUnitPosition(u,profile,jitter);return {x:p.x*SCALE_X,y:p.y*SCALE_Y};}
export function objectiveState(point){const owner=point.owner==='R'?'Aliança Rubra':point.owner==='S'?'Coalizão Safira':'Neutro';return {owner:point.owner,status:point.contested?'Em contestação':owner,label:point.contested?`Em contestação · Proprietário: ${owner}`:owner,progress:point.progress,contested:point.contested};}
