# Evidências0.4.0 — arena medieval / Arqueiro sem recuo

Execução:2026-10-29T16:55:22.672Z. Nodev24.19.0; ChromiumChrome/154.0.8037.57; CPUAMD EPYC 9V74 80-Core Processor; máquina Linux,4CPUs de quota,32GiB de limite. Renderer Canvas/Phaser3.90.0,1080×1920,headless/software. Os resultados abaixo vêm dos runners executados, não de análise documental.

Digest de fontes: `d0b0124acbef9942b5b413e6b2b31bfce649d0acc29fe1d159c29c2f7611b716`. Digest do motor medido: `6e1e93d74fd44898198406f909bd6ef48cd638c76879bb54fae9018e4bf5aefc`. Regras numéricas: `f3602e48` (mesmo f3602e48 da0.2); perfil atual:`5081aacf`, spatial-3-no-archer-retreat. Única mudança funcional0.3: eliminar retirada e afastamento automático do Arqueiro; fator2× aprovado anteriormente permanece.

## Pass / fail / skip

- L01–L40: **40pass / 0fail / 0skip**.
- V01–V08: **8pass / 0fail / 0skip**.
- Movimento2×:pass; navegador completo:pass; objetivos/Nexus no navegador:pass; render122:pass; bundle limpo:pass.

|ID|Resultado|Caso|
|---|---|---|
|L01|pass|timeout 1×0 em ambas facções|
|L02|pass|igualdade não usa HP|
|L03|pass|dono contestado conta 2×1|
|L04|pass|dano simultâneo e último ciclo|
|L05|pass|território sem vitória antecipada; resultado imutável|
|L06|pass|25+90+15 e ciclo máximo 340 segundos|
|L07|pass|formação de 24 comuns e 6 Cercos|
|L08|pass|ondas 20..280, nunca 300 ou após resultado|
|L09|pass|captura neutra e reversão sem empilhar Cerco|
|L10|pass|captura dinâmica 5+3+9=17 e congelamento|
|L11|pass|atributos, derivados e exclusividade de habilidades|
|L12|pass|arredondamento único G campeão composto =12|
|L13|pass|Muralha 40→25, categorias, não soma e expira|
|L14|pass|cadência 60/42/72/30/60 e troca de alvo|
|L15|pass|decisão 29/10: Arqueiro sem recuo, ataque contínuo e avanço|
|L16|pass|prioridade Nexus e cadência única três rotas|
|L17|pass|DEC-01: 35/41, HP0, efetivo34, buffs não protegem|
|L18|pass|likes resíduos e dedupe pessoal/coletivo|
|L19|pass|decaimento até gasto; sem banco acima de20|
|L20|pass|nove faixas, duas amostras, zero ativos|
|L21|pass|autocasts efeitos, CDs, turnos e Cerco novo|
|L22|pass|janelas independentes e fronteira exclusiva|
|L23|pass|parser, substituição e categorias exclusivas|
|L24|pass|matriz custos fallback e Campeão existente|
|L25|pass|duas tentativas A: Campeão2 + comum1|
|L26|pass|G10 D8 A2 sem promover terceira classe|
|L27|pass|última vaga global e fallback de rota|
|L28|pass|falha sem saldo não cria fila de compra|
|L29|pass|representação grupos, exclusão vivo e genérico|
|L30|pass|overkill, eliminação única, soma e fração exata|
|L31|pass|território não estorna; proteção marginal sem duplicar|
|L32|pass|três replays e coleções invertidas por commit|
|L33|pass|falhas compra/onda/resultado/checkpoint e corrupção|
|L34|pass|entrada inválida diagnóstica; presentes inertes|
|L35|pass|tardio próxima partida, pausa sem relógio e resultado preservado|
|L36|pass|resultados três telas e interface em navegador|
|L37|pass|stress 12000 ticks / 60000 eventos persistidos + replay|
|L38|pass|disco cheio, publicação só durável e replay novo processo|
|L39|pass|manifesto fechado, perfil e alteração durante partida|
|L40|pass|duas batalhas, habilidades, captura, reforço, build isolado|

|ID|Resultado|Caso novo|
|---|---|---|
|V01|pass|Arqueiro não recua sozinho ou protegido, comum ou Campeão|
|V02|pass|Arqueiro retoma avanço, sem a restrição de um único disparo|
|V03|pass|Quatro classes alcançam e atacam o Nexus pelas três rotas|
|V04|pass|Objetivo contestado informa e mantém o proprietário real|
|V05|pass|Journal0.2 reexecutado com perfil histórico e hashes originais|
|V06|pass|Falha transacional e recuperação mantêm nova decisão e replay|
|V07|pass|Layout não sobrepõe sidebar e converge para um Nexus por facção|
|V08|pass|Regras numéricas e perfil2× intactos|

L15 anterior exigia recuo irreversível; foi substituído pela decisão explícita atual e teste correspondente. O histórico0.2 continua no Git/ZIP anterior; não é regra vigente. V01 executa24situações de Arqueiro, comum/Campeão, protegido/sozinho, duas facções, inimigo a diferentes distâncias. V02 comprova6disparos/5s e avanço após perder alvo. V03 executa24combinações de classe/facção/lane: todas alcançam e atacam o mesmo Nexus adversário. Seu Defensor-tanque imortal é somente fixture para isolar acesso/alcance sem que o Nexus elimine a tropa antes da medição; atributos da tropa testada permanecem normais.

## DEC-01 / L17 executado

pass: Cerco35base e41comOfensiva+Chama; proteção do Nexus sempre0 mesmo sob postura defensiva/Muralha/buffs. HP35→0 e HP34→0, neste último dano efetivo34. Nexus2000HP; ataque20,1/s,4tiles preservado. L04 executa ambos destruídos no mesmo ciclo e empate técnico. A decisão está encerrada pelo proprietário, sem pendência.

## Animação e interface reais

Oito spritesheets PNG,256poses originais de modelos3D no Blender4.3.2: caminhada, ataque, dano e morte em duas direções. Phaser reproduz animações; dano continua no tick autoritativo e projéteis são cosméticos. Campeões possuem manto/escala visual/anel/estrela/nome/cooldown. Arte em produção inicial de estilo low-poly; não é reprodução idêntica da referência nem3D em tempo real.

Navegador completo: sprites carregados=true, 1948efeitos de dano, 932animações de dano, 125mortes e 42habilidades ({"Disparo Preciso":15,"Golpe Poderoso":14,"Muralha":13}). Testou seleção real por pointer, texto de nome literal, viewport390px, pausa20s, entrada409durante pausa, motor avançando com JS visual suspenso e resultados3×5s seguidos de nova preparação. Não houve eleição de MVP.

Teste de objetivos no navegador:pass. Sidebar A contestado com donoRubra mantido, B Safira e C neutro; progresso neutro atualizado após step real. Cerco da laneC destruiu o único NexusSafira (fixtureHP35), barra chegou a0, vitóriaRubra confirmada e replay conferido. Interface de Nexus contém facção e barra, sem rótulo de defesa. ui-objectives.png/ui-combat.png/ui-mobile.png são capturas do Phaser em execução.

## Batalhas completas / persistência / replay

- phaser-battle-1:6009ticks,300.45s,nexus,vencedor=S,52compras,3pontos capturados; habilidades:Disparo Preciso, Golpe Poderoso, Muralha. SHA256 final=replay:`91bbfcda1e2e58b5f400fa1808dd7fd2ec40bcbd532da07f89f12fbf4d8ff190`.
- phaser-battle-2:6009ticks,300.45s,nexus,vencedor=S,52compras,3pontos capturados; habilidades:Disparo Preciso, Golpe Poderoso, Muralha. SHA256 final=replay:`a5e4245a5b17790594ab926eea7224845056ce07783e785aadf9bea2be41bf10`.

V05 reexecuta40commits de checkpoint1800 de journal real0.2, mantendo hashes e perfil histórico; test:movement também reexecuta fixture0.1. V06 e L33/L38injetam falhas de transação/disco/publicação/checkpoint e reexecutam após recuperação. Hash novo de movimento/recuperação:`3640593dd55904eeccf209ca34e3a21471188bc9e56bdb438d74afe7c125ee42`. Bundle em pasta temporária sem node_modules:pass, duas batalhas e replays em processos novos. Caminhos Windows têm teste simulado win32; não houve execução física em Windows.

## Medições executadas

- Motor:12000ticks/60000eventos únicos,100/s,600.01s de admissão real, SQLiteWAL/FULL. p95tick=39.65ms,p99=61.62ms; backlog final=0. Hardware/versões/memória/série de fila em stress.json. HP elevado e ondas fechadas apenas na fixture para122entidades. Duas reconstruções completas e dois replays em processos novos conferiram hashes.
- Render122sprites reais (90Cercos+32convencionais): estático57.41FPS em10.01s; animado54.82FPS em10.01s,549frames com interpolação,38eventos de dano apresentados. Nenhuma unidade ocultada para medição. Dados/hardware/versões em render-load.json.

Medições locais em ambiente compartilhado não garantem60FPS no computador do proprietário ou em transmissão. Não foi executado ensaio24h. Não há integração LIVE, TikTok/TikFinity, ranking/XP/recompensas reais, teste de publicação ou prova de integração por simulador.

## Falha corrigida na produção da arte

A primeira tentativa de render Cycles solicitou denoiser não incluído neste Blender e falhou. Log preservado em evidence/iterations/medieval-render-denoiser-unavailable.log. Corrigido para48samples sem denoiser; arte efetivamente gerada e carregada foi validada no navegador. Nenhuma funcionalidade foi declarada concluída com base nesse render falho.

Fontes do pacote permanecem intactas e manifesto original é conferido ao empacotar. Arquivos editáveis3D e scripts estão incluídos; Blender/Python são necessários somente para recriar arte, não para executar o jogo. Instruções de execução e de continuidade no VS Code estão no README e docs/CONTINUIDADE_VSCODE.md.

## Acesso móvel0.3.1

Apenas scripts/CLI, versão npm e documentação foram alterados. Motor, renderer, arte, profiles/ e scenarios/ têm os mesmos digests da0.3.0; medições anteriores correspondem aos mesmos fontes, sem alegar nova medição de desempenho.

Rede local: pass,7pass/0fail/0skip, Nodev24.19.0. HTTP/assets reais, POST com Origin local, frames SSE, rejeição de Host/Origin externo e ciclo dos processos foram executados. Evidência: mobile.json e mobile.log.

Interface com toque: pass,Chrome/154.0.8037.57,390×844/mobile:true, seleção de tropa/HP e botão Retomar confirmados. O Chromium da nuvem recusa o IP LAN com Domain forbidden; a UI foi testada pela mesma ponte via loopback, respeitando a política. HTTP/LAN/SSE foram exercitados separadamente. Log da restrição em iterations/mobile-browser-cloud-lan-policy.log. Não houve teste em aparelho Android/iPhone físico nem no roteador/firewall do proprietário.

No PC: npm.cmd run mobile. No celular: endereço Celular (Wi-Fi) impresso, normalmente http://IP-DO-PC:4174, ambos na mesma rede. Backend original permanece em127.0.0.1:4173; ponte opcional LAN4174 valida Host/Origin e preserva estado/controles/SSE. PC e celular compartilham a partida. Não cria túnel/deploy nem conecta à LIVE. Instruções completas no README.

## Prévia externa e preparação0.4.0

Os mesmos módulos puros, atributos, perfil e renderer da0.3.1 foram preservados. Build estático só adapta transporte/controller e caminhos na cópia publicada; não simplifica habilidades ou economia.

- Prévia web:pass,6009ticks de batalha completa,resultado=nexus,vencedor=S; SHA256 do journal reconstruído em Node:`b4ba569bba9eddeec2757d34f5cf37d7aa78ad61456d6853e21714d112f7f919`. Testou prefixo de hospedagem,390px/toque,recuperação IndexedDB e rejeição transacional de escritor antigo. Esta execução acelerada levou143.09s reais, não é medição de FPS/cadência em aparelho físico.
- Adaptador:pass,6pass/0fail/0skip; contrato,IDs/deduplicação/reinício,contador pessoal,fixtures no motor e WebSocket sintético,sempre com0eventos reais aplicados. Modos off/shadow; likes desativados até verificar semântica.
- Fonte de captura:pass; assets reais e arena1080×1920,sem botões/POST/estado privado,acompanhando ticks oficiais porSSE. Não é teste no LIVE Studio instalado.

A API do GitHub retornouForbidden e este ambiente não oferece URL pública de hospedagem. Nenhum link publicado foi inventado. Entrega inclui bundle web,netlify.toml e workflow Pages manual. Ativação do serviço pelo proprietário permanece necessária; não houve mudança de visibilidade do repositório. Também faltam versões/amostras dos programas e validação controlada no PC; não há conexão/transmissão real ou prova de integração em produção. Veja docs/PREVIEW_E_INTEGRACAO.md e ADR0006.
