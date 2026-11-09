# CODEX — HANDOFF TOWER BATTLE LIVE — 2026-11-01

## Missão imediata

Evoluir o protótipo **já executável** `Tower-Battle-LIVE` para um **MVP pronto para uma live real de teste**, preservando a base funcional, a orientação vertical 9:16 e a participação gratuita por comentários/curtidas. Trabalhe no código deste diretório. **Não reescreva do zero, não reutilize propriedade intelectual da Interactive Live Games e não modifique o projeto Faction Wars LIVE.**

## Estado factual de entrega

- Implementados: arena Canvas 1080×1920, redimensionamento responsivo, times A/B, início com primeiro chat A/B, construção de blocos, curtidas, reforço limitado por gifts, combate automático, vencedor/empate, intervalo e rodada seguinte, simulador e cliente WebSocket local TikFinity com fallback localhost/127.0.0.1.
- Testes automatizados incluídos; executar `npm test` e corrigir falhas antes de mudanças.
- Não comprovado: funcionamento do TikFinity durante uma LIVE real; depende do Desktop e conta do usuário.
- Não implementados: ranking persistente, replay técnico de eventos, configuração granular de gifts, analytics e UX de diagnóstico mais completa.

## Regras de produto

1. **Não invente mecânicas, preços, multiplicadores financeiros nem vantagens proporcionais ao valor de presentes.** Os números do protótipo em `src/rules.mjs` são **provisórios**, não decisões finais; mantenha-os configuráveis.
2. Participação deve funcionar por `A`/`B` sem gastar dinheiro. Presentes são opcionais, com efeitos limitados e não monetizados em relação ao custo.
3. Não inclua loterias, apostas, prêmios em dinheiro, sorteios vinculados a presentes, pressão para enviar presentes, imitações visuais ou assets de terceiros.
4. Respeite os comandos e estados existentes; não introduza mudança silenciosa de time durante rodada. Não quebre o início automático.
5. Não coloque `.env`, chaves, tokens nem dumps de live no frontend ou no ZIP.
6. A comunicação entre evento TikFinity, motor e visual deve permanecer modular. A mesma arquitetura poderá alimentar jogos futuros.

## Fase P0 — tornar confiável a conexão da LIVE (prioridade atual)

- Auditar `src/tikfinity.mjs` com **payloads reais anonimizados** do TikFinity disponíveis durante teste autorizado do streamer, cobrindo `chat`, `gift` (streak/cumulative), `like`, `follow` e `share` (os dois últimos inicialmente telemetria, sem vantagens).
- Separar estados visíveis: WebSocket desconectado / conectado / primeiro evento real recebido / inatividade prolongada / LIVE encerrada se suportada pelo provedor. **Não afirmar “LIVE conectada” com base apenas no WebSocket aberto.**
- Adicionar reconexão robusta, backoff, alternância localhost ↔ 127.0.0.1, e logs diagnósticos sem dados sensíveis.
- Criar módulo de *technical replay* de eventos JSON sintéticos/anonimizados (com timestamps), usando exatamente o mesmo normalizador do modo real. Nenhum replay pode gerar presentes reais.
- Adicionar UI de teste de conectividade / último evento / última falha / modo simulação claramente marcado.
- Integrar tests de regressão de duplicatas: `msgId`, `groupId`, `repeatCount`, `repeatEnd`, mensagens reentregues após reconexão, limites anti-spam e mudanças de time.
- Validar em Windows 11 + navegador fonte do TikTok LIVE Studio/OBS, sem introduzir frameworks desnecessários.

## Fase P1 — maturidade do jogo

- Painel de configuração local para duração, cooldown, HP, número de blocos, critérios de vitória e efeitos de gifts, com validação de faixas e defaults.
- Ranking e pontuação local em SQLite (somente dados mínimos; proteção de dados dos espectadores); reinícios não podem apagar ranking de sessão salvo.
- Participante entra e ataca/constrói de forma visível; feedback por evento (toast curto e efeito visual). Atenção à legibilidade no celular e à sobreposição de UI do TikTok.
- Limitar spam/flood, preservar fairness entre times com públicos muito diferentes. Garantir que emissor desconhecido de `gift`/`like` não receba time implicitamente.
- Medir estabilidade: 30 min de simulação, pelo menos 200 usuários simulados, repetição e desconexões.

## Fase P2 — plataforma multi-jogo

- Extrair barramento de eventos e identidade/participação compartilháveis com Jelly Battle / Plinko, **sem migrar nada até o P0 funcionar**.
- Adicionar gerenciamento de sessões e telemetry anônima/opt-in para medir retenção e interações, não prometer renda.

## Critérios de aceite P0

1. `npm test` passa, inclusive testes novos de replay/reconexão.
2. `npm start` inicia servidor local; `http://127.0.0.1:4175/` abre painel; `/?studio=1` mostra somente arena 9:16 em 1080×1920, sem rolagem.
3. No simulador, o primeiro A/B inicia imediatamente uma rodada, comentários constroem, curtidas aplicam blocos, presentes opcionais ativam efeitos; ao final reinicia sozinho.
4. Um socket falso que dispare `{event:'chat',data:{user:{id:'u1',nickname:'Teste'},comment:'A'}}` inicia a partida e não a duplica ao reentregar mesmo `msgId`.
5. Na LIVE de teste do usuário (único teste que depende de conta real), enviar A/B deve alterar a arena; painel identifica que evento foi recebido; ao fechar o TikFinity perde a conexão e tenta recuperar sem travar.
6. Nenhum segredo no versionamento/distribuição. Arte e marca originais; política da plataforma respeitada.

## Primeiro comando para o Codex

```text
Abra CODEX_HANDOFF.md e README.md. Rode npm test. Inspecione src/tikfinity.mjs, src/engine.mjs e public/main.js. Implemente primeiro a Fase P0, mantendo a gameplay atual, e informe resultados de teste, arquivos alterados e qualquer teste com live real que ainda dependa de mim. Não invente novos parâmetros de mecânica sem minha aprovação.
```

## Não confundir os projetos

- Jelly Battle: referência arquitetural inspecionada; **não importar personagens, áudio ou assets dele**.
- Faction Wars LIVE: regras fechadas anteriormente em GDD próprio; **fora do escopo**.
- Tower Battle LIVE: **projeto novo** com regras provisórias na primeira versão.
