import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {sourceDigest,engineDigest} from './source-digest.js';
const read=n=>JSON.parse(readFileSync(`evidence/${n}.json`));
const a=read('acceptance'),v=read('medieval'),u=read('medieval-browser'),b=read('browser'),r=read('render-load'),p=read('stress'),m=read('movement-2x'),c=read('clean-smoke'),battles=[read('phaser-battle-1'),read('phaser-battle-2')];
const n=x=>Number(x).toFixed(2);
writeFileSync('docs/EVIDENCIAS.md',`# Evidências${JSON.parse(readFileSync("package.json")).version} — arena medieval / Arqueiro sem recuo

Execução:${a.timestamp}. Node${a.runtime}; Chromium${b.browser.product}; CPU${b.cpu}; máquina Linux,4CPUs de quota,32GiB de limite. Renderer Canvas/Phaser3.90.0,1080×1920,headless/software. Os resultados abaixo vêm dos runners executados, não de análise documental.

Digest de fontes: \`${sourceDigest()}\`. Digest do motor medido: \`${engineDigest()}\`. Regras numéricas: \`${a.rulesHash}\` (mesmo f3602e48 da0.2); perfil atual:\`${a.profileHash}\`, spatial-3-no-archer-retreat. Única mudança funcional0.3: eliminar retirada e afastamento automático do Arqueiro; fator2× aprovado anteriormente permanece.

## Pass / fail / skip

- L01–L40: **${a.totals.pass}pass / ${a.totals.fail}fail / ${a.totals.skip}skip**.
- V01–V08: **${v.totals.pass}pass / ${v.totals.fail}fail / ${v.totals.skip}skip**.
- Movimento2×:${m.status}; navegador completo:${b.status}; objetivos/Nexus no navegador:${u.status}; render122:${r.status}; bundle limpo:${c.status}.

|ID|Resultado|Caso|
|---|---|---|
${a.results.map(x=>`|${x.id}|${x.status}|${x.title}|`).join('\n')}

|ID|Resultado|Caso novo|
|---|---|---|
${v.results.map(x=>`|${x.id}|${x.status}|${x.name}|`).join('\n')}

L15 anterior exigia recuo irreversível; foi substituído pela decisão explícita atual e teste correspondente. O histórico0.2 continua no Git/ZIP anterior; não é regra vigente. V01 executa24situações de Arqueiro, comum/Campeão, protegido/sozinho, duas facções, inimigo a diferentes distâncias. V02 comprova6disparos/5s e avanço após perder alvo. V03 executa24combinações de classe/facção/lane: todas alcançam e atacam o mesmo Nexus adversário. Seu Defensor-tanque imortal é somente fixture para isolar acesso/alcance sem que o Nexus elimine a tropa antes da medição; atributos da tropa testada permanecem normais.

## DEC-01 / L17 executado

${a.results.find(x=>x.id==='L17').status}: Cerco35base e41comOfensiva+Chama; proteção do Nexus sempre0 mesmo sob postura defensiva/Muralha/buffs. HP35→0 e HP34→0, neste último dano efetivo34. Nexus2000HP; ataque20,1/s,4tiles preservado. L04 executa ambos destruídos no mesmo ciclo e empate técnico. A decisão está encerrada pelo proprietário, sem pendência.

## Animação e interface reais

Oito spritesheets PNG,256poses originais de modelos3D no Blender4.3.2: caminhada, ataque, dano e morte em duas direções. Phaser reproduz animações; dano continua no tick autoritativo e projéteis são cosméticos. Campeões possuem manto/escala visual/anel/estrela/nome/cooldown. Arte em produção inicial de estilo low-poly; não é reprodução idêntica da referência nem3D em tempo real.

Navegador completo: sprites carregados=${b.renderer.assetsReady}, ${b.finalRenderer.damageEffects}efeitos de dano, ${b.finalRenderer.hurtEffects}animações de dano, ${b.finalRenderer.deathEffects}mortes e ${b.finalRenderer.abilityEffects}habilidades (${JSON.stringify(b.finalRenderer.abilities)}). Testou seleção real por pointer, texto de nome literal, viewport390px, pausa20s, entrada409durante pausa, motor avançando com JS visual suspenso e resultados3×5s seguidos de nova preparação. Não houve eleição de MVP.

Teste de objetivos no navegador:${u.status}. Sidebar A contestado com donoRubra mantido, B Safira e C neutro; progresso neutro atualizado após step real. Cerco da laneC destruiu o único NexusSafira (fixtureHP35), barra chegou a0, vitóriaRubra confirmada e replay conferido. Interface de Nexus contém facção e barra, sem rótulo de defesa. ui-objectives.png/ui-combat.png/ui-mobile.png são capturas do Phaser em execução.

## Batalhas completas / persistência / replay

${battles.map(x=>`- ${x.id}:${x.ticks}ticks,${x.logicalMs/1000}s,${x.result.reason},vencedor=${x.result.winner??'empate'},${x.purchases}compras,${x.captures}pontos capturados; habilidades:${x.abilities.join(', ')}. SHA256 final=replay:\`${x.hash}\`.`).join('\n')}

V05 reexecuta40commits de checkpoint1800 de journal real0.2, mantendo hashes e perfil histórico; test:movement também reexecuta fixture0.1. V06 e L33/L38injetam falhas de transação/disco/publicação/checkpoint e reexecutam após recuperação. Hash novo de movimento/recuperação:\`${m.newReplayHash}\`. Bundle em pasta temporária sem node_modules:${c.status}, duas batalhas e replays em processos novos. Caminhos Windows têm teste simulado win32; não houve execução física em Windows.

## Medições executadas

- Motor:${p.ticks}ticks/${p.events}eventos únicos,100/s,${n(p.admissionWallMs/1000)}s de admissão real, SQLiteWAL/FULL. p95tick=${n(p.p95TickMs)}ms,p99=${n(p.p99TickMs)}ms; backlog final=${p.backlog}. Hardware/versões/memória/série de fila em stress.json. HP elevado e ondas fechadas apenas na fixture para122entidades. Duas reconstruções completas e dois replays em processos novos conferiram hashes.
- Render122sprites reais (90Cercos+32convencionais): estático${n(r.meanFps)}FPS em${n(r.durationMs/1000)}s; animado${n(r.active.meanFps)}FPS em${n(r.active.durationMs/1000)}s,${r.active.renderer.interpolatedFrames}frames com interpolação,${r.active.renderer.damageEffects}eventos de dano apresentados. Nenhuma unidade ocultada para medição. Dados/hardware/versões em render-load.json.

Medições locais em ambiente compartilhado não garantem60FPS no computador do proprietário ou em transmissão. Não foi executado ensaio24h. Não há integração LIVE, TikTok/TikFinity, ranking/XP/recompensas reais, teste de publicação ou prova de integração por simulador.

## Falha corrigida na produção da arte

A primeira tentativa de render Cycles solicitou denoiser não incluído neste Blender e falhou. Log preservado em evidence/iterations/medieval-render-denoiser-unavailable.log. Corrigido para48samples sem denoiser; arte efetivamente gerada e carregada foi validada no navegador. Nenhuma funcionalidade foi declarada concluída com base nesse render falho.

Fontes do pacote permanecem intactas e manifesto original é conferido ao empacotar. Arquivos editáveis3D e scripts estão incluídos; Blender/Python são necessários somente para recriar arte, não para executar o jogo. Instruções de execução e de continuidade no VS Code estão no README e docs/CONTINUIDADE_VSCODE.md.
`);
console.log('Generated current0.3 evidence report from executed runners');

if(existsSync('evidence/mobile.json')){const mobile=read('mobile'),touch=read('mobile-browser');appendFileSync('docs/EVIDENCIAS.md',`
## Acesso móvel0.3.1

Apenas scripts/CLI, versão npm e documentação foram alterados. Motor, renderer, arte, profiles/ e scenarios/ têm os mesmos digests da0.3.0; medições anteriores correspondem aos mesmos fontes, sem alegar nova medição de desempenho.

Rede local: ${mobile.status},${mobile.totals.pass}pass/${mobile.totals.fail}fail/${mobile.totals.skip}skip, Node${mobile.runtime}. HTTP/assets reais, POST com Origin local, frames SSE, rejeição de Host/Origin externo e ciclo dos processos foram executados. Evidência: mobile.json e mobile.log.

Interface com toque: ${touch.status},${touch.browser.product},390×844/mobile:true, seleção de tropa/HP e botão Retomar confirmados. O Chromium da nuvem recusa o IP LAN com Domain forbidden; a UI foi testada pela mesma ponte via loopback, respeitando a política. HTTP/LAN/SSE foram exercitados separadamente. Log da restrição em iterations/mobile-browser-cloud-lan-policy.log. Não houve teste em aparelho Android/iPhone físico nem no roteador/firewall do proprietário.

No PC: npm.cmd run mobile. No celular: endereço Celular (Wi-Fi) impresso, normalmente http://IP-DO-PC:4174, ambos na mesma rede. Backend original permanece em127.0.0.1:4173; ponte opcional LAN4174 valida Host/Origin e preserva estado/controles/SSE. PC e celular compartilham a partida. Não cria túnel/deploy nem conecta à LIVE. Instruções completas no README.
`);}

if(existsSync('evidence/preview.json')){const web=read('preview'),integration=read('integration'),studio=read('studio');appendFileSync('docs/EVIDENCIAS.md',`
## Prévia externa e preparação0.4.0

Os mesmos módulos puros, atributos, perfil e renderer da0.3.1 foram preservados. Build estático só adapta transporte/controller e caminhos na cópia publicada; não simplifica habilidades ou economia.

- Prévia web:${web.status},${web.battle.ticks}ticks de batalha completa,resultado=${web.battle.result.reason},vencedor=${web.battle.result.winner}; SHA256 do journal reconstruído em Node:\`${web.battle.hash}\`. Testou prefixo de hospedagem,390px/toque,recuperação IndexedDB e rejeição transacional de escritor antigo. Esta execução acelerada levou${Number(web.battle.wallMs/1000).toFixed(2)}s reais, não é medição de FPS/cadência em aparelho físico.
- Adaptador:${integration.status},${integration.totals.pass}pass/${integration.totals.fail}fail/${integration.totals.skip}skip; contrato,IDs/deduplicação/reinício,contador pessoal,fixtures no motor e WebSocket sintético,sempre com0eventos reais aplicados. Modos off/shadow; likes desativados até verificar semântica.
- Fonte de captura:${studio.status}; assets reais e arena1080×1920,sem botões/POST/estado privado,acompanhando ticks oficiais porSSE. Não é teste no LIVE Studio instalado.

A API do GitHub retornouForbidden e este ambiente não oferece URL pública de hospedagem. Nenhum link publicado foi inventado. Entrega inclui bundle web,netlify.toml e workflow Pages manual. Ativação do serviço pelo proprietário permanece necessária; não houve mudança de visibilidade do repositório. Também faltam versões/amostras dos programas e validação controlada no PC; não há conexão/transmissão real ou prova de integração em produção. Veja docs/PREVIEW_E_INTEGRACAO.md e ADR0006.
`);}
