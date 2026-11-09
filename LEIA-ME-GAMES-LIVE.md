# Games Live — plataforma local

Abra **INICIAR-GAMES-LIVE.bat** nesta pasta. Ele abre a biblioteca como aplicativo do Edge, inicia os jogos escolhidos e reutiliza servidores que já estiverem abertos. Requer Node.js 24, já presente neste computador. Alternativa: `npm start`.

Biblioteca: http://127.0.0.1:4180/

| Jogo | Painel | Fonte Navegador 1080 × 1920 |
| --- | --- | --- |
| Jelly Battle | http://127.0.0.1:4174/ | http://127.0.0.1:4174/?studio=1 |
| Faction Wars atualizado | http://127.0.0.1:4173/ | http://127.0.0.1:4176/ |
| Tower Battle 3D | http://127.0.0.1:4175/ | http://127.0.0.1:4175/?studio=1 |
| Seguidor Arena | http://127.0.0.1:4177/ | http://127.0.0.1:4177/?studio=1 |

Atualização atual do Faction: **0.4.3**, com a composição final do arquivo Figma e navegação respeitando os 10 blocos marcados. Formação Defensor → Guerreiro → Arqueiro, Cercos a cada **30 segundos**, caminhada/ataque em spritesheets, rodas girando e contorno amarelo de proteção. [Acabamento e testes](Faction-Wars-LIVE-0.4.0/docs/ATUALIZACAO_0.4.3.md) · [Sprites e prompts](Faction-Wars-LIVE-0.4.0/docs/ATUALIZACAO_0.4.2.md).

O quarto jogo está em **Seguidor Arena**, com **20 HP iniciais**, cura de **5 segundos**, entrada por seguidor confirmado + like, habilidades a cada 50 likes, presentes de 1–5s e rankings locais. Ele inicia em Simulação; escolha LIVE no painel para conectar a audiência. O cenário é espacial, visto de cima, com rastros maiores. A meta de duração média é 2–5 minutos; 40 simulações deram médias de 3min20s sem likes e 4min12s com likes moderados. [Guia completo, valores provisórios e limitações](Seguidor%20Arena/README.md).

**Tower Battle e Seguidor Arena** têm pódio superior personalizável, chat inferior e classificação com os demais participantes. Os GIFs próprios foram desativados conforme a decisão de 02/11; usaremos as animações oficiais do TikTok. A faixa reservada no layout não controla onde o TikTok desenha seus efeitos. Os poderes e impulsos de presentes dentro dos jogos continuam funcionando.

**Faction Wars 0.4.4:** abra pela biblioteca para testar ou preparar LIVE; alternativa direta: `INICIAR-FACTION-WARS-LIVE.bat`. Painel e captura iniciam juntos. Em modo LIVE, o primeiro `!vermelho` ou `!azul` abre os 25s de entrada. [Instruções](Faction-Wars-LIVE-0.4.0/PRONTO-PARA-LIVE.md).

A plataforma prepara os jogos; a transmissão continua sendo iniciada por você no TikTok LIVE Studio. Ao selecionar um jogo, a plataforma desliga a entrada TikFinity dos outros projetos novos. O aplicativo Jelly já aberto é preservado; feche sua fonte/painel quando for transmitir outro jogo.

## Faction Wars: base correta

A pasta usada é **Faction-Wars-LIVE-0.4.0**, baixada do repositório LeoDevsn/faction-wars-live, branch entrega-offline-2026-10-29, commit-base `f0c4bb88e5d9dacf84559c8f6f5b0a4dc13b8c68`. A atualização local identifica-se como 0.4.2.

As duas pastas antigas fornecidas continham o mesmo código 0.2.0/Phaser2D. A primeira foi restaurada após a identificação da base correta. A integração inicial descartada está arquivada em `backups/antes-integracao-20261101-114656/integracao-faction-em-espera/`.

O jogo usa **arte 3D pré-renderizada**, sprites direcionais animados e Phaser. Não é 3D em tempo real. O cenário e as tropas foram aproximados das referências fornecidas; o motor continua decidindo todo movimento, captura, ataque, dano e vitória. Um Nexus por facção, 2000 HP, regras e ausência de recuo do Arqueiro preservados.

Para ensaio local, clique **Nova batalha com cenário → Retomar**. Para teste ao vivo, conecte sua LIVE no TikFinity, abra o painel e clique **Nova partida LIVE**. Envie `!vermelho` ou `!azul` durante os 25 segundos de preparação. Depois use `!guerreiro`, `!defensor`, `!arqueiro` e comandos de rota. Entradas durante o combate aguardam a próxima partida, conforme a regra existente. Curtidas usam `likeCount` pessoal incremental, limitado a 500 por evento. O contador total da sala não gera crédito. Presentes permanecem sem efeito competitivo no Faction.

O painel distingue monitor, controle ativo, WebSocket aberto, eventos recebidos, inatividade e reconexão. Há deduplicação em SQLite e recuperação de eventos pendentes. **Retomar LIVE salva** recupera a sessão atual; **Nova partida LIVE** cria uma partida nova.

## Tower Battle

Foi mantido o motor do protótipo. A nova cena usa WebGL/Three.js local, torres, ilhas, participantes, escudos, ataques e partículas. Caso WebGL falhe, o painel informa a falha e mantém o visual Canvas 2D. Nenhum recurso gráfico depende de CDN.

O motor agora roda no servidor: painel e fonte Navegador compartilham a mesma partida. A primeira mensagem A/B inicia a rodada; o intervalo e a próxima rodada continuam automáticos.

Selecione **Simulação** para testar os botões. Simulação e replay têm ranking isolado e ficam identificados na arena; a sessão LIVE fica pausada durante os testes. Voltar a LIVE restaura sua sessão. O replay técnico aceita JSON com `[{"at":0,"message":{"event":"chat","data":{"user":{"id":"anon-1"},"comment":"A","msgId":"teste-1"}}}]`, usa o mesmo normalizador e mostra o estado final, sem conexão ou efeitos externos.

Partida, ranking, configurações e deduplicação são salvos em `.runtime/tower.sqlite`. Identidades do Tower são pseudonimizadas com sal local. A gravação periódica tem intervalo de 1 segundo: uma queda abrupta pode perder o último segundo. Não apague `.runtime/` se quiser conservar os dados.

Configurações têm validação de limites. Alterações de regras durante uma rodada entram na próxima. Os presentes podem ser desativados ou filtrados por ID; todos usam o mesmo efeito limitado, sem multiplicador por preço. Os números originais de gameplay foram preservados como defaults.

## Validação e limites

- Jelly: 25 testes existentes passaram; fontes do jogo preservadas.
- Tower: 28 testes passaram, cobrindo motor, conexão/reconexão, duplicatas, persistência, replay, HTTP/WebSocket sintético e painel. Consulte a saída de `npm test` no projeto.
- Tower: 200 usuários, 18000 eventos e 18000 duplicatas rejeitadas em **30 minutos de tempo lógico**. Isso não é um ensaio de 30 minutos reais nem teste de FPS. Relatório em `Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE/evidence/stability.json`.
- Faction: 37 testes de regras passaram; 3 casos que exigem evidências atuais de navegador/stress ficaram explicitamente omitidos em `test:rules`. Também passaram 8 verificações medievais, 6 de integração e o teste do runtime LIVE com journal/replay e o teste HTTP/SSE/WebSocket sintetico ponta a ponta.
- Biblioteca: testes de catálogo, HTTP e restrição de inicialização passaram. A inicialização dos três jogos foi exercitada por HTTP.
- O WebSocket do TikFinity instalado neste PC abriu. Foram observados eventos do provedor e uma curtida em monitor. **Ainda falta confirmar comentário → participante → ação visível na transmissão real**, com o operador.
- A automação visual do navegador foi interrompida por não conseguir determinar a URL atual. Não houve revisão final do jogo composto na tela nem medição de FPS no LIVE Studio. Os novos assets foram inspecionados diretamente. Não há promessa de correspondência idêntica ao mockup.
- No Faction, as novas tropas usam sheets direcionais para caminhada/ataque; dano e morte mantêm animação procedural. São aproximações visuais; não são personagens com esqueleto 3D completo. Os modelos Blender e sprites anteriores permanecem disponíveis.
- A matriz histórica `npm test` do Faction exige regenerar evidências de navegador, stress e cenários com o novo digest. Não foi substituída por evidências antigas nem declarada aprovada nesta atualização. Use `npm run test:rules`, `npm run test:live`, `node tests/medieval.js` e `npm run integration:check` para as verificações executáveis sem navegador.

Nenhuma transmissão foi iniciada, nenhum presente foi comprado e nada foi publicado no GitHub. Os servidores ficam em loopback. Backups e dados locais não devem ser incluídos em distribuição pública.

As artes, seus caminhos e os prompts de geração estão em [ARTE-E-PROMPTS.md](Faction-Wars-LIVE-0.4.0/docs/ARTE-E-PROMPTS.md).
# Entradas dos jogos e tela da LIVE

As vozes Fish Audio configuradas ficam salvas privadamente na plataforma e são carregadas ao iniciar. O Jelly recupera automaticamente a configuração em uma nova pasta de versão neste computador. O Faction pode usar a mesma configuração de voz diretamente, sem precisar abrir o Jelly. A chave não é incluída nas fontes públicas, previews ou downloads. Configurações de cada jogo continuam nos bancos locais entre aberturas e trocas de jogo.

Na biblioteca, **Abrir tela da LIVE** abre somente o jogo. **Painel do operador** contém configurações e testes. No TikTok LIVE Studio, adicione **Link / Navegador**, cole a URL da arena e configure **1080 × 1920**. Capturar a janela do painel inclui os controles na transmissão.

URLs: Jelly `http://127.0.0.1:4174/?studio=1`; Faction `http://127.0.0.1:4176/`; Tower `http://127.0.0.1:4175/?studio=1`; Seguidor Arena `http://127.0.0.1:4177/?studio=1`.

Os quatro jogos têm convites de entrada adequados às próprias regras. O Faction mantém as cartas Rubra/Safira. Jelly usa Bob/Patrick dentro da área das águas-vivas, preservando o layout 9:16 já ajustado. Tower explica A/B, blocos, likes e objetivo. Seguidor Arena explica seguir + primeiro like, 20 HP e habilidades a cada 50 likes. As entradas saem durante o combate; contagens e resultados seguem o estado do jogo.

Nos painéis de Jelly, Tower e Seguidor Arena, **Entrada da LIVE → Prévia da entrada** mostra a apresentação somente naquela janela, sem enviar comandos à LIVE. **Próxima dica** muda a dica visível. As telas de transmissão recebem a apresentação real automaticamente.

Prévias dos overlays: `previews/entradas-quatro-jogos.png`. São renders Canvas dos componentes, não uma captura do LIVE Studio. Gerar novamente: `node platform/preview-entry.mjs`. Sincronizar o componente compartilhado: `node platform/sync-entry.mjs`.

