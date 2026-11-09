# Faction Wars LIVE 0.4.5

**Tela de transmissão:** o iniciador direto abre a arena limpa em `http://127.0.0.1:4176/`. Os controles ficam em `http://127.0.0.1:4173/`. No LIVE Studio, adicione uma fonte **Link / Navegador** com a URL da arena e 1080 × 1920. Na biblioteca, use **Abrir tela da LIVE**; a janela do painel inclui os controles se for capturada.

## Recepção, comandos e voz

No painel há a seção **Recepção / Como jogar**. Ative boas-vindas, ajuda, chat e voz e clique **Salvar recepção**. `!ajuda`, `!help`, `!comandos`, `!jogar`, `!regras` e `!acoes` mostram as instruções na arena antes ou depois de entrar numa facção. O guia explica entrada, tropas, rotas, estratégia, objetivo, likes e fila da próxima rodada. Não cria jogadores nem dispara a preparação. Os comandos de batalha continuam sendo os mesmos.

Boas-vindas usam o evento `member`; quando a versão do TikFinity não o encaminha, a primeira interação reconhecida (comentário, like ou follow) recebe a orientação. `roomUser` é contagem de público e não é tratado como entrada individual. Limites: boas-vindas a cada 20s e uma por pessoa a cada 10min; ajuda a cada 30s por pessoa; respostas ao chat a cada 6s, fila máxima de 12 mensagens com validade de 60s. Não são reproduzidas filas antigas após reiniciar. Em uma entrada simultânea de muitas pessoas, os avisos são agrupados pelo intervalo global.

**Chat real do TikTok:** o Event API de `21213` recebe eventos, não publica respostas. O jogo oferece um relay local usando o [contrato documentado de mensagens do TikFinity/Streamer.bot](https://tikfinity.zerody.one/streamerbot-integration). No TikFinity Desktop, entre na sua conta TikTok, ative o Chatbot e configure **Setup → Streamer.bot Connection** com endereço `127.0.0.1`, porta `4173`, endpoint `/chatbot`. Em **Chatbot**, ative **Allow Streamer.bot to push messages to TikFinity**. Teste a conexão. Não precisa instalar Streamer.bot para este relay. Se o !help padrão do TikFinity estiver ligado, desative sua resposta padrão para não duplicar mensagens.

Se você já usa Streamer.bot, preserve a conexão existente. Como alternativa, use Actions & Events do TikFinity: evento de entrada → ação Send Chatbot Message com o texto de boas-vindas abaixo; eventos de comentário exato `!ajuda`, `!help` e `!comandos` → ação de mensagem com os textos do guia. Os mesmos textos estão em `integrations/tikfinity/audience.js`. Não configure as duas rotas de resposta ao mesmo tempo.

> Bem-vindo ao Faction Wars! Entre com !vermelho ou !azul. Para aprender a jogar, envie !ajuda, !help ou !comandos.

O painel distingue **relay conectado** de entrega no TikTok: o protocolo não oferece confirmação de publicação. Confira um comentário real de ajuda no chat. O relay foi conferido com um cliente WebSocket local; a conexão/entrega do Chatbot instalado ainda precisa dessa configuração e validação em live. Nenhuma mensagem de teste é enviada automaticamente.

**Voz:** selecione **Navegador** para português sem API. Clique **Ativar voz neste painel**, mantenha esse painel aberto e capture o áudio do computador no LIVE Studio/OBS. Só o painel ativado fala; a fonte de captura não duplica áudio. Ativar em outro painel desliga o primeiro na mesma origem. Use **Prévia de boas-vindas** ou **Prévia de !ajuda** para conferir texto e voz; essas prévias não vão ao chat do TikTok e funcionam com a partida pausada.

**Fish Audio opcional:** escolha Fish Audio no painel e salve. O Faction carrega automaticamente a configuração privada da plataforma; não precisa abrir o Jelly nem cadastrar novamente as vozes ao trocar de jogo. Use **Verificar API de voz** para conferir a disponibilidade. Somente duas frases fixas são geradas, com cache privado em `.runtime/voice-cache`; mudar a configuração da voz cria um novo cache. A voz A segue a configuração compartilhada do Jelly. A integração foi testada com provedor simulado; os áudios reais dos dois personagens do Jelly também foram gerados com sucesso na restauração da configuração.

As falas automáticas têm intervalo de 30s e validade de 15s, sem fila longa e sem ler comentários arbitrários. Desconectar a LIVE limpa os avisos e respostas pendentes. Prévias são identificadas na tela como **PRÉVIA LOCAL**. Configurações ficam em `.runtime/audience-config.json`.

Testes da recepção: `node tests/audience.js`, `node tests/audience-http.js` e `node tests/audience-ui.js`. Usam eventos locais, um cliente de relay e voz simulada; não equivalem a conferência de áudio e entrega no TikTok real.

## Iniciar o jogo

Abra pela **Games Live → Faction Wars → Abrir painel**, ou dê dois cliques em **INICIAR-FACTION-WARS-LIVE.bat**. O iniciador direto sobe o jogo e a captura, conecta ao TikFinity e deixa a partida aguardando a audiência. Reabrir preserva uma LIVE já ativa. Uma partida LIVE salva com participantes é retomada pelo iniciador; testes locais continuam separados da nova LIVE.

1. Abra o TikFinity Desktop e conecte-o à sua transmissão no mesmo PC.
2. No LIVE Studio, adicione a fonte Navegador/Link `http://127.0.0.1:4176/`, com **1080×1920**.
3. Pela Games Live, clique **Nova partida LIVE** no painel do Faction. O iniciador direto já prepara esse estado.
4. O primeiro comentário `!vermelho` ou `!azul` abre os **25 segundos** para as facções entrarem. Antes dele, o relógio fica parado. Depois, batalha, resultado e próxima partida são automáticos. Quando a próxima partida não tiver participantes na fila, o jogo volta a aguardar um comentário.

Durante o combate: `!guerreiro`, `!defensor` ou `!arqueiro`; a rota pode acompanhar o comando (`!esquerda`, `!centro`, `!direita`). Exemplo: `!defensor !centro`. Likes pessoais alimentam a economia. Presentes não alteram o combate do Faction.

**Teste pela interface:** Nova batalha com cenário → Retomar. Esse botão desativa a entrada LIVE e usa participantes fictícios. Para voltar ao público real, clique Nova partida LIVE. O jogo não inicia nem encerra a transmissão do TikTok.

Painel: http://127.0.0.1:4173/ · Biblioteca: http://127.0.0.1:4180/ · Captura: http://127.0.0.1:4176/

O painel distingue socket aberto de evento recebido. Se aparecer “WebSocket aberto · aguardando evento real”, confirme a conexão do canal no TikFinity e envie um comando no chat da live. “Testar conexão” abre apenas o transporte; “Nova partida LIVE” habilita a participação. “Desconectar LIVE” também pausa a partida.

Para atualizar um painel já aberto, use Ctrl+F5. A captura é somente leitura. Os dados salvos ficam em `.runtime/`; o programa os recupera sem reproduzir novamente todas as partidas antigas na inicialização.

A entrada da LIVE agora mostra cartas Rubra/Safira, retratos das tropas e comandos em destaque. Durante os 25s aparece a contagem circular. Brilhos discretos são animados apenas na preparação; a tela desaparece no combate. Prévias do renderizador Canvas: `../previews/faction-wars-entrada-live.png` e `../previews/faction-wars-preparacao-live.png`. Recriar com `node scripts/preview-entry.mjs` no projeto de desenvolvimento.

Verificação da versão: iniciador, reinicialização com recuperação da LIVE, espera pelo primeiro comentário, 25s de preparação, partida completa, próxima rodada, deduplicação, likes e captura conferidos com eventos locais sintéticos. O socket do TikFinity instalado foi conectado neste PC. A conferência de um comando real e da imagem/FPS no LIVE Studio depende da transmissão em andamento; nenhum evento fictício foi enviado ao TikTok.

Reproduzir os testes: `node tests/launch-live.mjs`, `npm.cmd run test:live`, `npm.cmd run test:live:http`, `npm.cmd run test:rules`. O teste do iniciador utiliza banco e WebSocket próprios, em portas temporárias. Relatórios em `evidence/`.
