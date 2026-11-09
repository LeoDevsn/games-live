# Tower Battle LIVE 0.3 — Sr. Sirigueijo × Plankton

Evolução do protótipo original, mantendo a arena lógica **1080 × 1920**, início pelo primeiro comentário A/B e rodadas automáticas. O motor é o mesmo, agora executado uma única vez no servidor para que painel e fonte Navegador compartilhem a partida.

Requer **Node.js 24**. Execute `INICIAR-TOWER-BATTLE.bat` ou `npm start`. Os arquivos necessários ao jogo já estão incluídos; não precisa de `npm install` para executar. Three.js 0.187.0 é servido localmente, com sua licença em `public/vendor/`.

- Painel: http://127.0.0.1:4175/
- Fonte Navegador: http://127.0.0.1:4175/?studio=1 — 1080 × 1920.
- Biblioteca dos quatro jogos: execute `INICIAR-GAMES-LIVE.bat` na pasta Games Live.

## Modos

**LIVE** recebe eventos do TikFinity Desktop local. **Simulação** habilita os botões de teste e utiliza outra partida e outro ranking; a sessão LIVE continua independente. **Replay técnico** importa eventos sintéticos/anonimizados, executa o mesmo normalizador e exibe o estado final, sem socket ou alterações no ranking da LIVE. Os modos de teste aparecem somente no painel de testes; a fonte pública mostra a partida real.

WebSocket aberto é diferente de evento real recebido. O painel mostra conexão, último evento, inatividade, reconexões, falha e renderizador. A reconexão alterna localhost/IPv4 com timeout e backoff. `member`/`follow`/`share` permitem receber os espectadores sem inscrevê-los; um sinal explícito de encerramento do provedor é exibido quando recebido.

## Regras e persistência

Defaults preservados: 120s de rodada, 12s de intervalo, cooldown de chat 3s, 25 curtidas por bloco e reforço opcional limitado por usuário/rodada. Não há entrada implícita por curtida/presente nem troca de time na mesma rodada.

O painel permite editar duração, ataques, HP, blocos, cooldown, curtidas e limites dos reforços. Regras novas entram na próxima rodada. Presentes podem ser desativados ou filtrados por ID; todos usam o mesmo efeito, sem relação com o preço.

Sessão, ranking, regras e deduplicação ficam em `.runtime/tower.sqlite`. Identidades são pseudonimizadas com sal local. Persistência periódica de 1s: uma interrupção abrupta pode perder até o último segundo. A deduplicação mantém até 20000 chaves, com janela de 10min. Não distribua `.runtime/`, `.env` ou dados reais de espectadores.

O ranking conta blocos efetivamente construídos, curtidas, participação e vitórias. Torneios e recompensas externas não foram introduzidos.

## Visual

Cena WebGL com geometria original: ilhas, castelos construídos por camadas, estandartes, participantes, escudos, projéteis e partículas. O HUD permanece nítido em Canvas. Efeitos visuais têm limites próprios e não modificam a simulação. Há fallback 2D se a criação do WebGL falhar. Falha e FPS aparecem no painel.

## Pódio, chat e animações oficiais

O layout 1080×1920 reserva o topo aos três primeiros, mantém as torres 3D no centro e mostra chat e demais colocados na parte inferior. O painel **Transmissão · pódio e chat** permite mudar título, cor e critério do ranking (blocos, vitórias, curtidas ou rodadas).

Conforme a decisão de 02/11, os alertas GIF próprios estão desativados. O TikTok exibe suas animações oficiais de presentes por cima da experiência da LIVE; o jogo não define a posição delas. A faixa inferior não é uma caixa de reprodução dessas animações e não garante que outros elementos fiquem livres. Não é necessário cadastrar GIFs. Os reforços competitivos configurados no Tower continuam independentes dos efeitos oficiais. Testes locais conferem que o modo de efeitos oficiais mantém pódio/chat e não cria camada de GIF próprio.

## Replay técnico

Exemplo pronto em `public/replay-example.json`. Formato:

```json
[{"at":0,"message":{"event":"chat","data":{"user":{"id":"anon-1","nickname":"Teste"},"comment":"A","msgId":"teste-1"}}}]
```

`at` é tempo lógico em milissegundos, em ordem crescente. Use apenas dados sintéticos ou anonimizados. O replay não é vídeo.

## Testes

`npm test`: motor, painel, normalização, gifts/streak, reconexão, sessão SQLite, configuração e replay. Também inicia um servidor e WebSocket **sintético local** para verificar HTTP/SSE, abas compartilhadas, deduplicação após reinício e isolamento de modos. **28 testes passaram** na atualização.

`npm run test:stability`: 200 usuários, 18000 eventos, 18000 duplicatas, 30min de tempo lógico. Relatório em `evidence/stability.json`. Não é ensaio de 30min reais, teste de GPU ou transmissão.

O WebSocket do TikFinity instalado abriu neste PC. O fluxo de um comentário de espectador até a arena da transmissão real ainda depende do teste do operador. A revisão visual final no navegador e a medição de FPS no LIVE Studio ficaram pendentes porque a automação do navegador foi interrompida. Não houve publicação ou início automático de transmissão.

## Arquivos principais

`src/engine.mjs`: motor e ranking; `src/tikfinity.mjs`: normalização/deduplicação; `src/connection.mjs`: transporte; `src/store.mjs`: SQLite; `src/replay.mjs`: replay; `server.mjs`: sessão compartilhada; `public/scene.js`: 3D; `public/render.js`: HUD/fallback; `public/main.js`: painel/SSE.

A URL local pode ser ajustada em `public/live-config.json`. Para fixtures de teste, `TOWER_WS_URL` aceita somente loopback, sem credenciais. `TOWER_DB`, `PORT` e `LIVE_AUTOCONNECT=0` permitem testes isolados.

Contrato do provedor: [TikFinity Desktop API](https://tikfinity.zerody.one/tiktok/dapi). O aplicativo Desktop precisa estar no mesmo PC. Arte, modelos e sons do Jelly não foram importados.
# Entrada da LIVE

Cartas do Sr. Sirigueijo e do Plankton mostram A/B, quantidade de construtores, conversão atual de likes em blocos e intervalo atual do chat. Durante a espera, convidam para o primeiro comentário; no intervalo, mostram resultado e contagem da próxima rodada. No combate, a entrada sai e libera a arena. As instruções acompanham a configuração real da rodada.

No painel há **Entrada da LIVE → Prévia da entrada** e **Próxima dica**. São ações visuais locais. Para transmitir somente o jogo: fonte Link/Navegador `http://127.0.0.1:4175/?studio=1`, 1080 × 1920.


## Tema de construção submarina

A = **Sr. Sirigueijo / Siri Cascudo**. B = **Plankton / Laboratório**. O cenário submarino é local; as torres continuam em WebGL 3D, com materiais e cores de cada chefe, trabalhadores, projéteis e escudos. Os personagens ficam ao lado das respectivas torres. A recepção usa os eventos de entrada, a escolha de equipe, presentes, incentivo durante a obra e anúncio da equipe vencedora. `!ajuda`, `!help` e `!comandos` recebem orientação. Boas-vindas alternam os chefes; presentes e vitórias usam a voz da equipe correspondente. Há intervalos de fala e de envio de chat para limitar repetição.

As vozes ficam no perfil **tower-battle** do arquivo privado central `game-narrators.json`, ao lado da configuração privada já existente. O jogo reutiliza a chave de API salva sem alterar as vozes do Jelly Battle nem da Arena. O painel permite somente ativar/desativar narração/chat, volume e selecionar qual chefe ouvir nas prévias. Não é necessário configurar API ao trocar de jogo.

A fonte pública ignora falas de prévia e não carrega botões de teste. O áudio é sequencial e as legendas longas aparecem em partes na faixa de rádio, longe dos rostos. Capture o áudio da fonte Link no LIVE Studio e desative a captura global do computador para não transmitir prévias do painel. A descrição e o crédito da arte estão em `INFORMACOES-DA-LIVE.md`.

A biblioteca e o inicializador atualizam uma instância antiga do Tower após reconhecer a aplicação e o processo local. A partida e o ranking são recuperados do SQLite. O helper `REINICIAR-TOWER-BATTLE.bat` força essa atualização quando necessário. A conexão é ativada ao selecionar o jogo; os outros jogos são desconectados pela biblioteca. Para o chat, o relay já configurado na porta 4173 aceita a origem Tower. Um relay antigo só é atualizado automaticamente depois de o Faction estar desconectado; isso não altera suas regras ou tema medieval. A conexão já configurada no TikFinity é mantida.

Prévia em imagem: `../../previews/tower-sirigueijo-plankton-webgl.png`. `node scripts/preview-theme.mjs` gera as prévias Canvas; `node scripts/preview-browser.mjs` abre um servidor isolado na porta 4196, com voz, chat e entrada LIVE desativados. `node scripts/verify-webgl.mjs` verifica o carregamento real em Edge headless usando um perfil exclusivo de teste e salva `evidence/theme-webgl.json`. Nenhum dado dos perfis pessoais do navegador é utilizado. O teste de API de voz está em `evidence/voices-provider.json`; frases normais foram geradas e guardadas somente no cache privado, sem reprodução nem publicação no chat.
