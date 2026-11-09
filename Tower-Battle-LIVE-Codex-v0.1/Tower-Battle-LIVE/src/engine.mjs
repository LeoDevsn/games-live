import {rulesWithOverrides} from './rules.mjs';

const TEAM_KEYS = ['A','B'];
const OTHER = {A:'B',B:'A'};
const cleanName = value => String(value ?? 'Espectador').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 38);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function freshTeam(wins = 0,maxHp=120) {
  return {hp:maxHp,blocks:0,shield:0,memberCount:0,builds:0,likes:0,gifts:0,wins};
}

/** Deterministic, dependency-free gameplay. All times use explicit deltaMs. */
export function createEngine(overrides = {}, saved = null) {
  const rules = rulesWithOverrides(overrides);
  let phase = 'waiting', round = 0, roundMs = 0, intermissionMs = 0, attackMs = 0;
  let lastWinner = null;
  let teams = {A:freshTeam(0,rules.maxHp), B:freshTeam(0,rules.maxHp)};
  const members = new Map(); // stable ID => team, round, cooldown, gift effects
  const log = [];
  let sequence = 0, effects=[], effectSequence=0,pendingRules=saved?.pendingRules??null;
  const rankings = new Map();
  if(saved) {
    ({phase,round,roundMs,intermissionMs,attackMs,lastWinner,teams,sequence}=saved);
    for(const m of saved.members||[])members.set(m.id,m);
    for(const r of saved.rankings||[])rankings.set(r.id,r);
    log.push(...(saved.log||[]));
  }
  function visual(kind,team,extra={}) {effects.push({id:++effectSequence,kind,team,...extra});if(effects.length>60)effects.shift();}
  function credit(m,blocks=0,likes=0) {
    const r=rankings.get(m.id)||{id:m.id,name:m.name,blocks:0,likes:0,rounds:0,wins:0};
    r.name=m.name;r.blocks+=blocks;r.likes+=likes;rankings.set(m.id,r);
    if(rankings.size>10000)rankings.delete(rankings.keys().next().value);
  }
  function exportState(){return structuredClone({phase,round,roundMs,intermissionMs,attackMs,lastWinner,teams,sequence,pendingRules,members:[...members.values()],rankings:[...rankings.values()],log});}

  function announce(text, team = null) {
    log.unshift({id:++sequence,text:String(text).replace(/[\u0000-\u001f\u007f]/g, '').slice(0,90),team});
    if (log.length > 9) log.length = 9;
  }
  function scoreSnapshot() {
    return {
      phase, round, lastWinner, rules,
      rankingTotal:rankings.size,pendingRules,
      effects:effects.map(e=>({...e})),
      ranking:[...rankings.values()].sort((a,b)=>b.blocks-a.blocks||b.wins-a.wins||a.id.localeCompare(b.id)).slice(0,100).map(r=>({...r})),
      timeLeftSeconds: Math.ceil((phase === 'running' ? Math.max(0,rules.roundSeconds*1000-roundMs) : phase === 'intermission' ? Math.max(0,rules.intermissionSeconds*1000-intermissionMs) : 0)/1000),
      teams: structuredClone(teams),
      entries: log.map(x => ({...x})),
      totalMembers:members.size,
      latestMembers:[...members.values()].sort((a,b)=>b.seq-a.seq).slice(0,7).map(m => ({name:m.name,team:m.team})),
    };
  }
  function resetRound() {
    if(pendingRules){Object.assign(rules,pendingRules);pendingRules=null;}
    effects=[];
    round++;
    roundMs=0;attackMs=0;phase='running';
    for (const key of TEAM_KEYS) teams[key] = freshTeam(teams[key].wins,rules.maxHp);
    for (const m of members.values()) {
      m.round = 0;
      m.cooldownUntil = -Infinity;
      m.giftEffects = 0;
      m.likesOverflow = 0;
      // Members remain registered, but each new round counts only active participants.
    }
    announce(`Rodada ${round} começou!`);
  }
  function concludeRound() {
    if (phase !== 'running') return;
    const a=teams.A,b=teams.B;
    const aScore=a.hp+a.shield*0.3+a.blocks*0.1;
    const bScore=b.hp+b.shield*0.3+b.blocks*0.1;
    lastWinner=Math.abs(aScore-bScore)<0.01 ? 'draw' : aScore>bScore ? 'A' : 'B';
    if(lastWinner!=='draw') teams[lastWinner].wins++;
    for(const m of members.values())if(m.round===round){credit(m);const r=rankings.get(m.id);r.rounds++;if(m.team===lastWinner)r.wins++;}
    visual('victory',lastWinner);
    announce(lastWinner==='draw'?'Empate!':`Time ${lastWinner} venceu!`,lastWinner==='draw'?null:lastWinner);
    phase='intermission';intermissionMs=0;
  }
  function applyDamage(team, amount) {
    const t=teams[team];
    const absorbed=Math.min(t.shield,amount);
    t.shield-=absorbed;
    t.hp=clamp(t.hp-(amount-absorbed),0,rules.maxHp);
  }
  function attack() {
    // Towers attack one another automatically; both shots resolve simultaneously.
    const dmgA=1+Math.floor(teams.A.blocks/8),dmgB=1+Math.floor(teams.B.blocks/8);
    applyDamage('B',dmgA);
    applyDamage('A',dmgB);
    visual('attack','A',{damage:dmgA});visual('attack','B',{damage:dmgB});
    if (teams.A.hp===0 || teams.B.hp===0) concludeRound();
  }
  function build(team, amount) {
    const t=teams[team];
    const previous=t.blocks;
    t.blocks=clamp(t.blocks+amount,0,rules.maxBlocks);
    const actual=t.blocks-previous;
    t.builds+=actual;
    return actual;
  }
  function ensureMember(event) {
    const id=String(event.id||'').slice(0,100);
    if (!id) return null;
    let m=members.get(id);
    if (!m) {
      m={id,name:cleanName(event.name || id),team:null,round:0,cooldownUntil:-Infinity,giftEffects:0,likesOverflow:0,seq:0};
      members.set(id,m);
      if (members.size>10000) members.delete(members.keys().next().value);
    }
    m.name=cleanName(event.name||m.name);
    return m;
  }
  function apply(event, nowMs=0) {
    if (!event || !['join','like','gift'].includes(event.kind)) return false;
    const m=event.kind==='join'?ensureMember(event):members.get(String(event.id||''));
    if(!m) return false;
    if (event.kind==='join') {
      const team=event.team;
      if (!TEAM_KEYS.includes(team)) return false;
      if (phase==='waiting') resetRound();
      if (phase!=='running') return false;
      // Prevent team hopping during the same round.
      if (m.round===round && m.team && m.team!==team) return false;
      if (m.round!==round) {
        m.round=round;m.team=team;m.giftEffects=0;m.cooldownUntil=-Infinity;m.likesOverflow=0;
        teams[team].memberCount++;
        announce(`${m.name} entrou no time ${team}`,team);
        visual('join',team,{name:m.name});credit(m);
      }
      m.seq=++sequence;
      if (nowMs<m.cooldownUntil) return true;
      m.cooldownUntil=nowMs+rules.chatCooldownSeconds*1000;
      const added=build(team,1);
      if (added) announce(`${m.name} construiu +${added}`,team);
      if(added){credit(m,added);visual('build',team,{amount:added,name:m.name});}
      return true;
    }
    if (phase!=='running' || m.round!==round || !m.team) return false;
    const team=m.team;
    if (event.kind==='like') {
      const count=clamp(Math.floor(Number(event.count)||0),0,rules.maxLikesPerEvent);
      if(!count) return false;
      teams[team].likes+=count;
      credit(m,0,count);
      m.likesOverflow+=count;
      const awarded=Math.floor(m.likesOverflow/rules.likesPerBlock);
      m.likesOverflow%=rules.likesPerBlock;
      if(awarded) {
        const actual=build(team,awarded);
        if(actual) announce(`${m.name} curtidas: +${actual} bloco(s)`,team);
        if(actual){credit(m,actual);visual('like',team,{amount:actual,name:m.name});}
      }
      return true;
    }
    if (event.kind==='gift') {
      teams[team].gifts++;
      if (m.giftEffects>=rules.maxGiftEffectsPerUserRound) return true;
      m.giftEffects++;
      const actual=build(team,rules.giftBlocks);credit(m,actual);
      teams[team].shield=clamp(teams[team].shield+rules.giftShield,0,40);
      announce(`${m.name} ativou reforço visual!`,team);
      visual('gift',team,{name:m.name,amount:actual});
      return true;
    }
    return false;
  }
  function tick(deltaMs) {
    let remaining=clamp(Number(deltaMs)||0,0,30000);
    while (remaining>0) {
      if(phase==='waiting') break;
      if(phase==='running') {
        const endMs=rules.roundSeconds*1000;
        const attackEnd=rules.attackIntervalSeconds*1000;
        const step=Math.min(remaining,endMs-roundMs,attackEnd-attackMs);
        if(step<=0) { concludeRound();continue; }
        roundMs+=step;attackMs+=step;remaining-=step;
        if(attackMs>=attackEnd) {attackMs-=attackEnd;attack();}
        if(phase==='running'&&roundMs>=endMs) concludeRound();
      } else if(phase==='intermission') {
        const step=Math.min(remaining,rules.intermissionSeconds*1000-intermissionMs);
        if(step<=0) {
          if(rules.autoRestart&&members.size>0) resetRound();
          else phase='waiting';
          continue;
        }
        intermissionMs+=step;remaining-=step;
        if(intermissionMs>=rules.intermissionSeconds*1000) {
          if(rules.autoRestart&&members.size>0) resetRound();
          else phase='waiting';
        }
      }
    }
  }
  function configure(next){if(phase==='waiting'){Object.assign(rules,next);for(const t of Object.values(teams))t.hp=rules.maxHp;}else pendingRules=next;}
  return {apply,tick,snapshot:scoreSnapshot,exportState,rules,configure,teamFor:id=>{const m=members.get(id);return m?.round===round?m.team:null;}};
}
