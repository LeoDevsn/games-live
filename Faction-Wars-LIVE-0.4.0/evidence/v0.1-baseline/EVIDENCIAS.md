# Evidências e limites — Faction Wars offline0.1.0

Gerado de execuções reais em 2026-10-29T12:38:11.421Z. Fontes finais SHA256: `cbc205a6e8b0340615aed20242f2873ff249638fe9cebe3c2a799397daedb6a2`. Medição L37 carregada com SHA256 `89ba907e0357d3821ad6420653deb99f403d61b299926e828f6c4d4dc79d302d`. A única diferença posterior são os aliases oficiais de entrada !vermelho e !azul, adicionados à tabela de parser. L37 verifica byte a byte esse delta e confirma os hashes de todos os commits com os fontes finais; o tráfego de carga contém somente likes, sem comandos. Não houve alteração do motor medido, atributos, timers ou economia.
Regras `f3602e48`; perfil EXP `11166e9b`. Seeds: testes1 e cenários29. Estados/entradas preparadas por fixtures estão no código de cada teste, com snapshots completos, seed, perfil, efeitos e hashes por caso em acceptance.json. Cenários possuem journal SQLite original, eventos ordenados, checkpoints e todos os hashes por commit.

## Resultado local

**40 pass / 0 fail / 0 skip** em40grupos L01–L40. Cada grupo executa suas asserções; não representa apenas análise documental. A tabela abaixo é gerada do resultado do runner. Testes de carga, navegador e pacote limpo têm arquivos próprios; seus hashes de fonte são conferidos pelo runner para evitar validar artefato de outra versão.

|ID|Estado|Escopo executado|
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
|L15|pass|recuo irreversível e um disparo durante deslocamento|
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

## L17 — DEC-01 aprovada

Status executado: **pass**, não depende de nova confirmação. Nexus2000HP e proteção0%, inclusive sob postura defensiva e Muralha artificialmente inserida pela fixture. Dano recebido mantém os multiplicadores ofensivos do Cerco.

|Ofensiva+Chama|Dano calculado|Proteção Nexus|
|---|---|---|
|não|35|0%|
|sim|41|0%|

|Ataque efetivamente resolvido|Dano calculado|Dano efetivo|HP final|
|---|---|---|---|
|fixture:00000000:fixture:birth:000001|35|35|0|
|fixture:00000000:fixture:birth:000001|35|34|0|

HP35 remove35; HP34 remove34; ambos confirmam vitória por destruição no ciclo. L04 testa destruição de ambos no mesmo ciclo e no último intervalo: um único empate técnico. L12 testa o exemplo composto do Guerreiro=12. L13 cobre Muralha40%→25% sem soma; L11 preserva todos os atributos/derivados.

## Duas batalhas completas e replay

* acceptance-battle-1: 6800ticks / 340s totais, timeout, vencedor R; 60compras, 3pontos capturados. Habilidades: Disparo Preciso, Golpe Poderoso, Muralha.
  SHA256 final e replay: `47235cd2415ce1e5688f130144f02288119803adef5875292a46c2698cce709d` (iguais).
* acceptance-battle-2: 6800ticks / 340s totais, timeout, vencedor R; 60compras, 3pontos capturados. Habilidades: Disparo Preciso, Golpe Poderoso, Muralha.
  SHA256 final e replay: `c479c3a9d4902882477ffe7cbb4bd85d14dac60e95c23acfd1b5e2d15dd96295` (iguais).

A vitória repetida de Rubra nesse cenário simétrico em população, com posturas distintas, não foi usada para rebalancear nenhum atributo. Votos, IDs e seed tornam os casos reproduzíveis. Vitórias por Nexus e empates são exercitados também por fixtures de combate, sem editar regras da partida normal.

## Desempenho medido (L37)

12000ticks, 60000eventos únicos /100por segundo, 600s lógicos; admissão ritmada=true, 600.04s de parede para admissão. Duas fixtures independentes de300s, sempre90Cercos+32convencionais vivos. HP elevado e agenda de ondas fechada pertencem exclusivamente à fixture de carga; não são cap nem balanceamento do jogo. L08 testa as14ondas20..280 separadamente, sem mortes, com90Cercos totais.

* Trabalho+commit por tick: p95=36.23ms; p99=50.19ms; máximo=174.41ms. Meta p95<50ms: atingida neste ensaio.
* Latência de commit desde a agenda de admissão: p95=36.95ms / p99=85.88ms. Fila máxima estimada pela agenda50ms=40eventos, última amostra de backlog=0. Série a cada200ticks em stress.json; não é medição de payloads ou fila de provedor externo.
* RSS inicial=33.6MiB; final após replay=371.7MiB. Retenção de dedupe/journal por partida e GC afetam memória; não foi demonstrada estabilidade24h.
* SHA256 de gravação vs replay sem render/sem ritmo real: igual, igual. Verificação em cada commit, sem duplicar eventos, nascimento ou resultado.
* Ambiente: AMD EPYC 9V74 80-Core Processor; 5CPUs visíveis; quota cgroup4CPUs (400000/100000), limite memória32GiB; Node v24.19.0. Memória total reportada por os.totalmem=35743760384bytes pode refletir o host.

Render medido separadamente em Chromium Chrome/154.0.8037.57, headless/software (--disable-gpu), 122entidades, fixture pausada e identificada: 601intervalos em 10.02s, média 60.00FPS; frame p95=16.70ms / p99=16.80ms. Não comprova60FPS sob qualquer carga, GPU ou hardware. A UI consulta snapshots a200ms; FPS de desenho não é frequência de atualização de estado nem prova de movimento a60Hz. Browser.json mede ainda uma amostra operacional de 60FPS, verifica9:16, viewport390px, texto literal, HUD,20s reais de pausa, render interrompido com motor ainda avançando e próxima preparação imediatamente após15s de resultados. Screenshots em ui-*.png.

## Persistência e falhas (L32/L33/L35/L38)

Transações SQLite WAL/FULL, checkpoint a cada10s lógicos. Foram injetadas falhas antes do commit, dentro da transação (SQLITE_FULL simulado), e depois do commit antes da publicação, em compra, onda, resultado e checkpoint. Checkpoint corrompido recupera anterior+journal; journal irrecuperável anula sem inventar eventos, preservando resultado previamente confirmado. Replay em processo novo reconstitui o mesmo hash e representantes. Falha de escrita pausa confirmação; não é apenas teste de retorno de função. Não foi feito corte físico de energia/disco do host nem teste de hardware de produção.

## Pacote limpo (L40)

clean-smoke.json: pass. Bundle copiado para pasta temporária limpa; npm ci offline; servidor loopback respondeu HTML e estado de preparação; duas partidas completas e dois replays em processos separados. Comandos e stdout/stderr preservados. Build copia aplicação, scripts, perfis e lockfile; Node24 permanece requisito, não é executável nativo autocontido. README contém os comandos usados.

## Rastreabilidade E0–E7

E0:fontes preservadas/manifesto verificado, regras e ADR0001. E1:state/step, relógio50ms, seed/versão/IDs e determinismo. E2:combat/territory e ADR0002 com perfilEXP explícito. E3:economy/commands, representação e seis estatísticas por nascimento, soma local por espectador. E4:Store SQLite e ADR0003. E5:DEC-01 e ciclos completos. E6:Canvas/HUD/painel local e resultados3×5s. E7:L01–L40, medições, pacote limpo e esta entrega.

## Limites da entrega

* Somente offline. Nenhum TikTok/TikFinity, LIVE, publicação, chat externo, pagamento ou recompensa real foi executado/homologado.
* MVP definitivo não apurado. Não foram usados pesos provisórios para eleger campeões de desempenho. XP real, rankings, temporadas e conquistas estão fora.
* Arte Canvas/cartoon e avatares de iniciais fictícias são provisórios; não há assets de pessoas reais, locução ou áudio final. Apresentação não altera o motor.
* Geometria, escala, spawns, raio da Muralha e política de amostragem são escolhasEXP/ENG versionadas em ADR0002, não atributos de gameplay aprovados adicionais.
* Causalidade de proteção é contabilizada onde demonstrável por Muralha com atribuição estável; interceptação/atração não demonstráveis permanecem não apuradas. Não foram inventadas mecânicas de taunt, cura ou escudo deHP.
* Não foi feito ensaio24h, homologação de overlay/produção ou garantia de desempenho em outro computador. O simulador não prova integração real.
* A medição oficial stress.json usa o digest capturado ao iniciar o ensaio; a diferença exclusiva da tabela de aliases PT é registrada acima e validada pelo teste. Os journals foram verificados também em processos novos. O snapshot anterior do parser é evidência histórica, não módulo do runtime.
* evidence/iterations e logs acceptance-iteration*.log guardam tentativas anteriores, inclusive falhas corrigidas e artefatos desatualizados. Somente acceptance.json/acceptance.log e as evidências com o digest acima representam a versão entregue.
