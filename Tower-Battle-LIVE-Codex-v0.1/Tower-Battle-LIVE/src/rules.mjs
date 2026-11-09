export const DEFAULT_RULES = Object.freeze({
  roundSeconds: 120,
  intermissionSeconds: 12,
  attackIntervalSeconds: 4,
  maxHp: 120,
  maxBlocks: 32,
  chatCooldownSeconds: 3,
  likesPerBlock: 25,
  maxLikesPerEvent: 500,
  giftBlocks: 2,
  giftShield: 3,
  maxGiftEffectsPerUserRound: 3,
  autoRestart: true,
});

export function rulesWithOverrides(overrides = {}) {
  const rules = {...DEFAULT_RULES};
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in rules)) continue;
    if (typeof rules[key] === 'boolean') {
      if (typeof value === 'boolean') rules[key] = value;
    } else if (Number.isFinite(value) && value >= (['giftBlocks','giftShield','maxGiftEffectsPerUserRound'].includes(key)?0:key.endsWith('Seconds')?0.1:1) && value <= RULE_LIMITS[key][1] && (key.endsWith('Seconds') || Number.isInteger(value))) {
      rules[key] = value;
    }
  }
  return rules;
}

export const RULE_LIMITS = Object.freeze({
  roundSeconds:[5,1800],intermissionSeconds:[1,120],attackIntervalSeconds:[0.1,120],
  maxHp:[1,10000],maxBlocks:[1,200],chatCooldownSeconds:[0.1,60],likesPerBlock:[1,10000],
  maxLikesPerEvent:[1,500],giftBlocks:[0,32],giftShield:[0,40],maxGiftEffectsPerUserRound:[0,10],
});

export function validateRules(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Configuração inválida');
  for(const [key,value] of Object.entries(input)) {
    if(key==='autoRestart'){if(typeof value!=='boolean')throw Error('Reinício deve ser booleano');continue;}
    const range=RULE_LIMITS[key];
    if(!range||!Number.isFinite(value)||value<range[0]||value>range[1]||(!key.endsWith('Seconds')&&!Number.isInteger(value)))throw Error(`Valor inválido: ${key}`);
  }
  return rulesWithOverrides(input);
}
