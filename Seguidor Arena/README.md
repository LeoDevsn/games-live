# Arena Royale do Plankton

Quarto jogo da Games Live. O piloto da coleção da Fenda do Biquíni agora se passa no laboratório submarino do Plankton. A pasta continua sendo `Seguidor Arena`. Abra **INICIAR-SEGUIDOR-ARENA.bat** ou escolha **Arena Royale do Plankton** na biblioteca da pasta superior. Node.js 24 é necessário; já está instalado neste computador. O jogo não precisa de `npm install` para executar.

- Painel: http://127.0.0.1:4177/
- Fonte Navegador: http://127.0.0.1:4177/?studio=1 — **1080 × 1920**.
- Biblioteca: http://127.0.0.1:4180/

**Trilha sonora:** o modo automático toca 12th Street Rag antes do combate e após a vitória, e Drunken Sailor durante a batalha. Cada faixa fica em loop na sua fase, com volume inicial de 22%. No painel, a seção **Trilha sonora** liga/desliga e ajusta o volume; essas preferências ficam salvas entre aberturas e trocas de jogo. O painel fica silencioso até clicar **Ouvir neste painel**, evitando duplicação com a fonte de transmissão. A música continua entre rodadas e durante a pausa da partida. Se o navegador bloquear a reprodução automática, aparece **Ativar música** na arena. O MP3 fornecido foi incluído localmente, sem serviço externo.

O aplicativo inicia em **Simulação**. Adicione 10 ou 50 participantes, envie +50 likes para um participante ou teste presentes com 1–5 segundos. As iniciais representam usuários sintéticos. Em LIVE, a arena usa foto e nome recebidos do TikFinity; se a foto não vier ou não carregar, mostra as iniciais.

Para aplicar a atualização com o servidor antigo já aberto, execute **REINICIAR-SEGUIDOR-ARENA.bat** e depois atualize o painel/fonte com **Ctrl+F5**. O reiniciador confere a identidade do aplicativo e do processo, pausa para salvar e reinicia somente a porta 4177. Rankings e configurações da LIVE são preservados; a simulação local recomeça. Conferência sem alterar o processo: `node scripts/restart-local.mjs --check`.

## Narrador e chatbot da arena

A seção **Narrador e chatbot** controla voz, chat, volume e o narrador Plankton. Usa automaticamente a chave Fish Audio privada já salva e o perfil exclusivo do Plankton (`84300d9b3d524313b5eebea451b4821f`). O perfil fica em `.runtime/private/game-narrators.json` na raiz da plataforma. A voz do Jelly e do Faction permanece com seus perfis anteriores. Não precisa configurar novamente ao fechar ou trocar de jogo. Preferências ficam em SQLite; chaves não aparecem no navegador.

- Entrada/primeira interação: convite pelo nome. Seguidores antigos recebem orientação para dar like; os demais são orientados a seguir e depois curtir.
- Contagem e início: convoca os recrutas para executar seu plano. Durante a partida, reage ao fechamento da zona e solta provocações com pelo menos 45s sem outra fala, evitando conversa contínua.
- Presente: agradecimento pelo nome e pelo presente, com variação de frases. Agradecimento funciona mesmo se o remetente ainda não estiver na batalha. Streaks intermediárias e eventos duplicados não repetem agradecimentos.
- Vencedor: anuncia o nome do último sobrevivente uma vez por rodada; não repete o resultado antigo ao reiniciar o servidor.
- A música baixa durante a fala e volta ao volume escolhido depois. As falas não se sobrepõem; vencedor tem prioridade na fila. Convites têm intervalo global de 20s e por pessoa de 10min. Filas são limitadas e falas antigas expiram.
- A tela da LIVE reproduz as falas; o painel fica silencioso até um teste manual. Se houver bloqueio do navegador, aparece **Ativar narrador**. Enquanto bloqueado, não solicita novas gerações pagas. Áudios idênticos ficam em cache privado, inclusive entre reinícios.
- O player permite o áudio gerado em `blob:` na política de mídia da página. Falha de reprodução tem botão de desbloqueio também no painel; um teste manual pode tentar novamente imediatamente. A fila libera uma fala que ficar travada por mais de 45s.
- **Testar convite / agradecimento / vencedor** toca somente no painel e não publica mensagem no TikTok. Pode usar a API real para gerar a amostra.

O chatbot reutiliza **127.0.0.1:4173/chatbot**, já configurado no TikFinity para o Faction. O host compartilha somente o envio de mensagens pela nova rota local `/api/platform-chat`; regras e visual do Faction permanecem iguais. A abertura pelo launcher inicia esse host em segundo plano, pausado, caso esteja fechado. Se houver um host antigo aberto sem essa rota, será necessário reiniciá-lo uma vez para aplicar o código novo. Não precisa reinserir API de voz ou mudar o endpoint do chatbot. O indicador distingue envio ao relay local de confirmação de entrega no TikTok. Referência: [integração Streamer.bot do TikFinity](https://tikfinity.zerody.one/streamerbot-integration).

Prévia isolada: `node scripts/preview-local.mjs` e http://127.0.0.1:4192/. Usa SQLite separado, entrada LIVE e saída de chat desativadas. Os botões de teste usam a API de voz salva. A prévia não substitui o servidor de produção na porta 4177.

## Regras confirmadas

- Todos começam com **20 HP**, conforme o ajuste mais recente.
- **Quem já segue:** o primeiro like pessoal confirma a inscrição, sem seguir novamente. Se a batalha já começou, a vaga fica para a próxima rodada. O TikFinity pode confirmar essa relação no próprio like ou antes, na entrada (`member`), comentário ou compartilhamento. A confirmação fica salva na sessão SQLite, entre rodadas e reinícios.
- **Quem ainda não segue:** seguir confirma a elegibilidade; um like posterior inscreve o jogador para a rodada aberta ou para a próxima, se o combate já começou. Seguir sozinho não cria jogador. Likes anteriores ao follow não ficam guardados para entrada.
- Sem informação do provedor e sem registro anterior, o jogo não consegue confirmar um seguidor antigo apenas pelo nome. Uma confirmação explícita de não seguidor revoga a elegibilidade para novas entradas. O estado desconhecido não apaga uma confirmação anterior. A validação usa `followRole` (1/2), `followInfo.followStatus` ou `isFollower`; contagem de seguidores, selo de moderador e inscrição não são usados para presumir que segue.
- Referência do formato de eventos: [TikTok Live Connector v1.2.3](https://github.com/zerodytrash/TikTok-Live-Connector/tree/v1.2.3#events). O ensaio local confirma a lógica com eventos sintéticos; a entrega desses campos na sua LIVE precisa ser conferida com um seguidor antigo.
- A primeira pessoa aguarda um adversário. Com dois inscritos, aparece um **aviso durante 5s**, sem contagem, explicando o limite de entrada. Depois começa a **preparação de 15s**, com a mensagem **Contagem iniciada, prepare-se!** e o aviso de que novas inscrições ficarão para a próxima após zerar. As inscrições desta rodada ficam abertas até terminar a contagem.
- **Durante o combate, nenhum novo participante é spawnado.** Os cadastrados entram na fila da próxima. O total de participantes da batalha fica fixo.
- Conforme a escolha do proprietário, **um novo like confirma a presença na próxima rodada**. Likes de quem já está lutando continuam contando para habilidades e também confirmam a fila, sem duplicar esses pontos na rodada seguinte. Não basta estar no cadastro de seguidores: sem nova confirmação, não reaparece automaticamente.
- Comentário, presente ou evento de entrada não substituem a confirmação por like. Essa regra evita tratar silêncio como prova de presença: os eventos documentados desta integração informam entradas, sem oferecer confirmação individual de saída. [Referência de eventos](https://github.com/zerodytrash/TikTok-Live-Connector/tree/v1.2.3#events).
- Fila, partida e contagem parcial são recuperadas após reiniciar. Há limite de participantes por rodada; excedentes aguardam a próxima vaga. A fila remove confirmações de quem o provedor informar explicitamente que não segue mais.
- Fotos circulares e nomes se movimentam em direções aleatórias. Ao colidir, um participante realiza o ataque; a iniciativa é aleatória e existe um intervalo entre ataques para evitar dano a cada frame.
- Acerto normal: **2 HP de dano** no alvo e **1 HP de cura** no atacante. Cura nunca ultrapassa 20 HP; os rankings contam somente cura/dano efetivos.
- A cada **50 likes pessoais**, ativa aleatoriamente uma das duas habilidades. Na preparação, os likes ficam acumulados e as habilidades iniciam junto com o combate, sem gastar sua duração antes. Impulsos de presentes recebidos na preparação também iniciam no combate. O saldo restante é conservado.
- **Cura, 5s:** +1 HP por segundo (5 pulsos, até 5 HP) e +2 HP por acerto enquanto ativa.
- **Dano ampliado, 10s:** causa 4 HP por acerto, em vez de 2 HP.
- As duas habilidades podem coexistir. Reativar a mesma renova sua duração, sem somar multiplicadores.
- Eliminados não reaparecem na mesma rodada. Um novo like coloca o jogador na fila da próxima.
- O último sobrevivente vence. Os participantes recebem XP de participação e o vencedor recebe XP extra de vitória, uma vez por rodada.
- Após o resultado, há intervalo e nova rodada. Somente quem confirmou com novo like/está na fila entra novamente. O processo recomeça pelo aviso e pela preparação, sem pular etapas.

Não há dinheiro, apostas ou prêmio financeiro; XP, patentes e rankings são locais ao jogo.

## Ritmo e visual espacial

O novo cenário usa artes em 3D pré-renderizadas do laboratório submarino. O Plankton tem sprites de repouso, fala, risada e vitória; a animação de fala reage à reprodução real do player, com movimento e boca alternando. Não é sincronização fonética. A cabine fica no canto direito da Transmissão do laboratório, com mensagens e legendas à esquerda, liberando todo o campo de batalha.

Versão de teste atual: a arena começa **retangular, ocupando toda a largura útil**, arredonda os cantos durante o fechamento e termina **circular**. A barreira de energia verde, arcos elétricos e partículas acompanham exatamente o limite físico, sem causar dano extra.

| Sobreviventes da rodada | Área útil restante | Formato |
| --- | --- | --- |
| Mais de 80% | 100% | Retangular |
| Mais de 60%, até 80% | 80% | Retangular |
| Mais de 40%, até 60% | 60% | Transição para círculo |
| Mais de 20%, até 40% | 40% | Circular |
| 20% ou menos | 20% | Circular |

Nos intervalos não especificados, mantém o tamanho anterior até atingir o próximo limite. O fechamento máximo agora é 20% da área inicial, inclusive abaixo de 10% de sobreviventes.

Os percentuais se referem à **área total inicial**, um campo de 1.024×880px centrada em (540, 860). A largura inicial passou de 880px para 1.024px, entre x=28 e x=1.052; os 28px laterais acomodam a energia da barreira. A altura permanece em 880px para preservar o espaço entre o pódio e o chat. A conta compensa a área removida dos cantos para preservar o percentual durante a transformação. O limite se move sempre para dentro, sem abrir novamente as laterais. Cada queda de 10 pontos de área leva cerca de 3s. Inscrições durante a batalha ficam na fila e não alteram esta arena; o total de participantes da rodada determina a proporção de sobreviventes. A arena volta a 100% na rodada seguinte; recuperar partidas preserva o fechamento dentro dos novos limites.

Prévia das cinco etapas: `../previews/seguidor-arena-hibrida.png`. Gerar com `node scripts/preview-arena.mjs`. Testes: `node --test tests/arena.test.mjs`.

Meta de duração média: **2 a 5 minutos**. Em 40 simulações determinísticas com 2–200 participantes, incluindo os 5s de aviso e os 15s de preparação, a média foi **2min58s sem likes** e **3min43s com até 2 likes/s por participante**. Casos individuais variaram de 1min38s a 4min46,5s. O menor tempo individual não é fixado; a meta é de média, e o fluxo real de interações pode mudar esses tempos. Relatório atual: `evidence/pacing.json`; o teste anterior com limite de 40% ficou arquivado em `evidence/hybrid-40-pacing.json`.

Prévia do aviso e da contagem: `../previews/seguidor-arena-inscricoes.png`; gerar com `node scripts/preview-lobby.mjs`. Teste do fluxo: `node --test tests/lobby.test.mjs`. Na prévia http://127.0.0.1:4192/, clique **+10 participantes** para iniciar aviso e contagem. Quando começar o combate, clique **+1 participante** para conferir que ele fica na fila. O botão **1 like · confirmar presença** permite testar a confirmação da próxima rodada. A prévia não envia mensagens ou eventos à LIVE real.

A câmera da batalha continua de cima. O fundo espacial foi substituído pelo laboratório, janelas submarinas, bolhas e painéis de controle. Prévias antigas espaciais ficam como histórico. O tema atual aparece em `../previews/plankton-gameplay.png`; gerar com `node scripts/preview-plankton.mjs`. As artes usadas pelo jogo ficam em `public/assets/plankton-lab-v1.png` e `public/assets/plankton-reactions-v1.png`. Prompts e procedência: `evidence/plankton-assets-prompts.json`.

## Pódio, chat e animações oficiais

No painel **Transmissão · pódio e chat**, escolha título, cor e critério do ranking. Os três primeiros ficam no pódio superior; os demais aparecem em páginas abaixo do chat, com vitórias, XP, dano e cura.

Conforme a decisão de 02/11, os alertas GIF próprios estão desativados. As animações oficiais de presentes são exibidas pelo TikTok; o jogo não recebe controle de suas coordenadas. A faixa inferior pode acomodar informações menos importantes, mas não confina esses efeitos nem garante que arena/pódio fiquem livres. As funções dos presentes no jogo (impulso e rastro) continuam separadas da animação oficial. Não é necessário cadastrar GIFs.

A prévia antiga `seguidor-arena-efeito.png` documenta o estudo de alerta próprio anterior a essa decisão; esse alerta não está mais ativo no jogo.

## Presentes e rastros

Cada ID de presente pode ser configurado no painel com duração inteira de **1 a 5 segundos** e rastro `fire` (fogo), `laser` ou `smoke` (fumaça). Os IDs/nomes observados aparecem no painel para facilitar o cadastro. Não há relação automática com o valor monetário.

Presente não mapeado usa o menor impulso: **1 segundo com fumaça**. Presentes não cadastram usuários nem ressuscitam eliminados. Streaks só são processadas no final, com deduplicação por grupo. Repetições não acumulam uma janela de impulso maior que 5 segundos a partir do evento mais recente.

Exemplo de configuração, substituindo o ID:

```json
[{"id":"ID_REAL_DO_PRESENTE","name":"Nome exibido","seconds":3,"trail":"fire"}]
```

## Valores provisórios editáveis

Os valores abaixo não foram definidos pelo proprietário e foram expostos como defaults de teste:

- XP: 10 por participação e +50 pela vitória.
- Patentes: Recruta 0, Bronze 100, Prata 300, Ouro 700, Diamante 1500, Lenda 3000 XP.
- Intervalo entre rodadas: 10s; velocidade base: 115; impulso: velocidade ×2.
- Intervalo entre ataques por atacante: 900ms; limite padrão: 300 participantes simultâneos. Acima do limite, entradas aguardam a próxima rodada.

XP, patentes, presentes e parte dos parâmetros ficam no painel. Parâmetros adicionais são validados em `src/config.mjs`. Alterações durante uma partida entram na próxima rodada. HP/dano/durações e limiar de 50 likes seguem as regras confirmadas acima.

## TikFinity e seguidores

Selecione **LIVE** no painel e conecte sua transmissão no TikFinity Desktop, no mesmo PC. O jogo usa o [Event API local do TikFinity](https://tikfinity.zerody.one/tiktok/dapi), com envelope `event`/`data`, no WebSocket `ws://localhost:21213/`.

Há duas formas de confirmar elegibilidade: receber um evento `follow`, ou receber um status explícito de seguidor no payload (`followRole`/`followInfo.followStatus` 1 ou 2; booleano `isFollower`). Não deduzimos isso pelo número de seguidores, por moderação, assinatura ou presente. Payloads desse tipo constam em [exemplo público no repositório do TikFinity](https://github.com/zerodytrash/TikFinity-Public-Docs/issues/1); o formato real instalado precisa ser conferido durante a LIVE.

Seguidores antigos podem entrar se o provedor informar o status no payload ou se sua confirmação anterior estiver salva. Quando o status não vier e não houver confirmação salva, o jogo não consegue verificá-los automaticamente. Não há consulta privada à conta TikTok nem alteração no perfil do espectador.

Curtidas usam `likeCount` pessoal incremental. `totalLikeCount` da sala nunca vira pontos de um jogador. O painel distingue socket aberto, primeiro evento recebido, inatividade, reconexão e encerramento sinalizado pelo provedor. Socket aberto sozinho não confirma que a transmissão esteja entregando eventos.

## Dados e modos

SQLite local em `.runtime/arena.sqlite`: partida, ranking, configurações e deduplicação. Identidades são pseudonimizadas com sal local. Fotos são carregadas por uma rota local com verificação de CDN; URLs assinadas do provedor não são enviadas ao frontend. Caso uma foto expire, o próximo evento pode atualizar sua URL.

**Simulação e LIVE são sessões separadas.** Trocar de modo pausa a sessão anterior; o ranking sintético não é salvo no ranking da LIVE. Reiniciar o programa volta ao modo Simulação; escolha LIVE para retomar os dados salvos. Reiniciar rodada não apaga ranking, mas não concede XP de vitória/participação para a rodada interrompida.

Gravação periódica: 1s. Uma interrupção abrupta pode perder até o último segundo. A deduplicação guarda até 50000 chaves por 24h. Não compartilhe `.runtime/` ou `.env`. O jogo não inicia sua transmissão nem envia mensagens ao chat.

## Testes e limites da entrega

`npm test`: **18 testes passaram**, cobrindo regras, migração de 50 para 20 HP, seguidores, likes, habilidades, vitória/XP, modo isolado, recuperação SQLite, normalização, controle de avatares e HTTP/SSE/WebSocket sintético. Inclui renderização do Canvas e decodificação de imagem de avatar em teste nativo. Na pasta superior, `npm test` inclui upload/serviço HTTP de GIF, persistência dos vínculos nos dois jogos, deduplicação, fila e camada de mídia com DOM simulado. Reprodução animada no navegador/Studio ainda precisa de inspeção visual.

`npm run test:stress`: 200 participantes, 30 minutos de tempo lógico, com colisões e partidas automáticas. Relatório em `evidence/stress.json`. Não é ensaio de 30 minutos reais nem medição de FPS no LIVE Studio.

Para reinstalar apenas as ferramentas de desenvolvimento: `npm ci --ignore-scripts`. O Canvas nativo é dependência de teste; não é necessário para executar o servidor/jogo.

Falta validar, na LIVE do operador: status real de seguidor, foto vinda do CDN, like disparando entrada, presentes reais e desempenho na fonte de navegador. Nenhuma conta ou transmissão real foi acionada por esses testes. A prévia foi inspecionada por renderização Canvas; a revisão final no navegador/Studio permanece pendente.
# Entrada da LIVE

O convite espacial explica **seguir o canal + primeiro like**, entrada automática com seguidor confirmado e início com dois participantes. Mostra 20 HP, dano e cura por acerto, habilidade a cada 50 likes, cura de 5s, dano ×2 de 15s e XP. O intervalo mostra o sobrevivente e a contagem para a próxima rodada. A apresentação sai durante o combate.

No painel, **Entrada da LIVE → Prévia da entrada** e **Próxima dica** permitem conferir o convite sem alterar jogadores. Para transmitir somente a arena: fonte Link/Navegador `http://127.0.0.1:4177/?studio=1`, 1080 × 1920.


## Faixas liberadas para teste

O padrão **Automático · espera / batalha** toca **12th Street Rag** na espera, no aviso de inscrições, na contagem e no intervalo após a vitória; **Drunken Sailor** toca somente durante o combate. A troca segue a fase real da partida, com cada faixa em loop, sem reiniciar a música a cada atualização da tela. Ao pausar, a faixa atual continua. O modo automático fica salvo ao iniciar esta atualização; volume e ativação anteriores são preservados. O seletor também permite ouvir cada faixa separadamente. São interpretações diferentes das gravações usadas no desenho. Filmic Remix continua disponível. Volume, ativação e seleção ficam salvos; a música reduz o volume durante a fala do narrador.

- **12th Street Rag** — Imperial Marimba Band, 1921: gravação histórica em domínio público. Fonte e arquivo: [Wikimedia Commons / UCSB](https://commons.wikimedia.org/wiki/File:Twelfth_Street_Rag.ogg).
- **Drunken Sailor** — Alexander Nakarada: [download oficial](https://creatorchords.com/music/drunken-sailor/) sob CC BY 4.0. Copie o campo de créditos do painel para a descrição da transmissão.

Licenças, fontes e hashes: `public/assets/audio/CREDITOS-TRILHAS.md` e `evidence/authorized-music.json`. Os MP3 foram baixados sem cortes, aceleração ou mudança de tom. Não foi extraído áudio da coletânea do YouTube.

## Fechamento com poucos jogadores

Durante o combate, com 3 a 9 jogadores vivos, a zona reduz seu alvo em 1 ponto percentual a cada 5 segundos, até 30% da área original. Esse alvo combina com o fechamento por proporção de sobreviventes: a menor área prevalece e as eliminações podem continuar reduzindo até 20%. O relógio não conta espera, aviso ou preparação; o saldo parcial é salvo e reinicia a cada nova rodada.

Ao restarem exatamente dois jogadores, começa o **Death Match**. A zona fecha suavemente até 20% da área original; ao chegar a esse tamanho, passa a reduzir 1 ponto percentual a cada 3 segundos, até o limite de 5%. Se a rodada começar com apenas dois inscritos, o duelo começa ao terminar a preparação. A tela destaca os finalistas, e o Plankton anuncia o duelo uma vez por rodada pelo chat e pela voz já configurada. Área e relógio parcial são preservados ao recuperar a partida. A vitória encerra o duelo e a próxima rodada restaura a arena inteira.

As legendas do Plankton ficam acima do personagem, dentro do painel de transmissão. Falas longas são divididas em trechos acompanhando o áudio, para manter as linhas legíveis e dentro do quadro.

## Runas da arena

Durante o combate, surgem 1 ou 2 runas aleatórias a cada 10 segundos, dentro da zona ativa. Ao passar por uma delas, o jogador a consome automaticamente:

- Fogo: uma única rajada de oito projéteis em direções espaçadas por 45°. Cada projétil atinge apenas o primeiro rival em seu caminho, causa 2 HP e some ao acertar, sair da zona ou completar 3 segundos. Esse dano fixo não recebe o bônus de dano ampliado nem gera cura por contato. Dano e eliminações contam no ranking.
- Proteção: imunidade a golpes e projéteis por 3 segundos. Outra runa renova os 3 segundos, sem somar durações. Uma bolha azul e um contador mostram a proteção.

As runas acompanham a zona que fecha. Itens, projéteis, imunidade e relógio de aparecimento são preservados na recuperação da partida; a nova rodada começa limpa.

Boas-vindas do jogo usam o nome **Arena Royale do Plankton**. Por escolha do criador, o convite fixo do TikFinity foi atualizado e renomeado para **Arena Royale do Plankton - Convite**, mantendo o evento Join ativo. Esse texto é fixo no TikFinity: ao trocar para outro jogo, revise essa Action.

## Resultado da rodada

Ao terminar uma partida, a tela da LIVE exibe um overlay com foto e nome do vencedor, patente, vitórias, XP e contagem até a próxima rodada. O convite para confirmar presença com um novo like aparece nesse intervalo. Durante o combate, o resultado fica oculto. A atualização visual requer recarregar a fonte Link no LIVE Studio; não requer reiniciar o servidor nem altera a partida salva.

Prévia: `../previews/arena-royale-vencedor.png`. Verificação: `node --test tests/render.test.mjs`, incluindo conclusão real de rodada e foto do vencedor.

## Confirmação de participação e voz

O like elegível primeiro inscreve a pessoa no jogo; depois publica a confirmação com o nome no chat da tela. Durante a batalha, novas inscrições são confirmadas para a próxima rodada. Convites de boas-vindas não são confirmações de vaga. Quem já está na partida ou na fila não recebe outra recepção, mesmo após o intervalo de dez minutos; likes que renovam a presença de alguém vivo não interrompem a batalha com outro convite. Incentivos e agradecimentos por presentes continuam ativos.

A confirmação usa duas falas curtas reutilizáveis, com o nome mantido na mensagem visual. Ela tem prioridade sobre convites longos e incentivos, sem interromper agradecimentos de presentes, anúncios de duelo ou de vitória. Inscrições próximas são agrupadas na fila de áudio. O processamento local não elimina o atraso do TikTok nem o atraso do vídeo entregue aos espectadores.

A preparação dura 30 segundos, depois do aviso inicial de 5 segundos. O contador fica grande no centro e destaca os últimos cinco segundos. A fila é revista a cada 2 segundos, ao terminar a rodada e cinco segundos antes do combate, usando a confirmação de seguidor já recebida do TikFinity. A integração local não consulta o TikTok individualmente por pessoa.

Se o like chegar antes da confirmação de seguidor, a inscrição fica pendente, com aviso na tela; assim que um evento confirmar o seguimento, aquele like real pode validar a vaga sem exigir outro toque. A pendência é salva, vale para a rodada indicada e expira após dez minutos ou depois de perder aquela rodada. Ela não concede participação enquanto o seguidor não estiver confirmado, nem inscreve automaticamente pessoas silenciosas em rodadas posteriores. Durante combate, novas confirmações continuam aguardando a próxima partida.

Uma confirmação positiva de seguimento não é apagada por `followRole: 0` ou `followStatus: 0` em interações posteriores. Esses campos zerados são tratados como ausência de confirmação nova, preservando a evidência anterior. Uma indicação booleana explícita `isFollower: false` continua revogando a elegibilidade; uma conta nova sem evidência positiva continua pendente. Os testes reproduzem follow → like com campos zerados → recuperação → nascimento na próxima rodada.

O painel mostra as inscrições pendentes e alerta que um socket aberto em 21213 não comprova conexão ao canal do TikTok. Se o TikFinity estiver aguardando a LIVE começar, nenhum evento real de entrada, like ou follow chegará à Arena por esse transporte.
