import {createEngine} from './engine.mjs';
import {createTikFinityAdapter} from './tikfinity.mjs';

// Isolated, synthetic/anonymous replay: never opens a socket or modifies live rankings.
export function replayEvents(records,rules={}) {
  if(!Array.isArray(records)||records.length>100000)throw Error('Replay deve conter até 100000 eventos');
  const engine=createEngine(rules),adapter=createTikFinityAdapter();
  let now=0,accepted=0;
  for(const record of records){
    if(!Number.isFinite(record.at)||record.at<now||record.at>86400000)throw Error('Timestamps devem ser crescentes, em milissegundos, até 24h');
    let delta=record.at-now;
    while(delta>0){const step=Math.min(delta,30000);engine.tick(step);delta-=step;}
    now=record.at;
    const action=adapter.normalize(record.message,now);
    if(action&&engine.apply(action,now))accepted++;
  }
  return {accepted,elapsedMs:now,snapshot:engine.snapshot()};
}
