# Jelly Battle — TikFinity + Fish Audio

Bob Esponja é o Time A; Patrick é o Time B. O espectador escreve **A** ou **B** no chat, e os likes e presentes seguintes ajudam o time escolhido. A primeira escolha de time recebida pelo chat inicia imediatamente uma partida de 2 minutos; o botão manual mantém a preparação de 15 segundos para testes. As escolhas de time continuam entre rodadas enquanto a página estiver aberta.

## Iniciar no Windows

Instale Node.js 22 ou superior e abra **INICIAR.bat**. Para abrir a arena vertical diretamente, clique em **INICIAR-LIVE-9X16.bat**. Ele inicia o servidor em segundo plano e só abre o navegador quando o jogo está respondendo. Para abrir diretamente a configuração de voz, use **CONFIGURAR-VOZ.bat**. Ambos reutilizam o servidor se ele já estiver funcionando. Não há dependências npm para instalar. Acesse `http://127.0.0.1:4174`. Para executar pelo terminal:

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

O servidor é local, escuta somente em `127.0.0.1` e carrega `.env`. Após alterar pastas ou scripts, encerre a instância do servidor Node.js e execute INICIAR.bat novamente. As credenciais salvas pelo formulário são aplicadas imediatamente. Se a página local não abrir após reiniciar o computador, execute INICIAR.bat ou CONFIGURAR-VOZ.bat; o endereço só funciona com o servidor ligado. Os registros de inicialização ficam em `.logs/local-server.log`. O build não publica o projeto na internet.

## Fish Audio

Abra `http://127.0.0.1:4174/setup.html` para cadastrar a chave e os links ou IDs das vozes pelo formulário local. Salve e teste cada personagem nos botões de áudio. A configuração é aplicada imediatamente ao servidor; a arena atualiza o estado em até 30 segundos. O formulário nunca devolve a chave salva e não usa armazenamento do navegador para guardá-la. Os áudios de teste usam a API real e podem consumir créditos.

Se preferir configurar por arquivo:

Copie `.env.example` para `.env` na pasta `jelly-battle` e preencha:

```dotenv
FISH_AUDIO_API_KEY=sua_chave_privada
FISH_AUDIO_VOICE_ID_A=reference_id_da_voz_do_bob
FISH_AUDIO_VOICE_ID_B=reference_id_da_voz_do_patrick
FISH_AUDIO_MODEL=s2.1-pro
```

Selecione as vozes na sua conta Fish Audio e use o `reference_id` de cada uma. Esses IDs determinam a voz; as gravações das pastas não criam automaticamente uma voz na Fish Audio. A API pode consumir créditos. Não envie a chave no chat, não a coloque no código público e não a inclua em ZIPs. `.env` é ignorado e nunca entra no download gerado pelo jogo.

Reinicie o servidor e abra **Integração da live** para verificar a configuração dos dois times. Em **Testar voz com nome**, selecione **Voz de IA · Fish Audio** e teste cada personagem. O teste por navegador continua disponível como alternativa manual; presentes automáticos usam Fish Audio. A opção **Agradecer presentes automaticamente** vem ativada.

O jogo substitui `{nome}` pelo nome de exibição do remetente e gera a frase inteira, por exemplo: “Vamos lá, Larissa! Vamos pegar todas as águas-vivas!”. Sem a API configurada ou em caso de falha, o especial continua, aparece uma indicação e a fila segue. Não há substituição automática por uma voz comum do navegador.

As chamadas vão ao endpoint oficial `POST https://api.fish.audio/v1/tts`, com chave apenas no servidor, tempo limite, duas gerações simultâneas por instância, limite de geração de 30 pedidos/minuto e cache em memória por 15 minutos. A fila comporta 50 falas; em excesso, novos áudios são descartados e o bônus do presente continua. O cache é separado por conta, modelo e voz.

## Pastas de falas

Em `public/assets/audio/`, os personagens usam `bobesponja/` e `patrick/`. Dentro de cada um:

| Pasta | Quando é usada |
| --- | --- |
| `tela inicial` | Preparação de 15 segundos |
| `durante a batalha` | Falas periódicas durante a partida |
| `capturado` | Captura bem-sucedida |
| `errou a captura` | Tentativa sem captura |
| `presente especial` | Frases com `{nome}` para Fish Audio |
| `vitoria` | Vitória do personagem |

O build descobre os arquivos dessas pastas automaticamente. Os nomes de MP3 em `presente especial` viram frases; esses MP3 não são reproduzidos com o marcador literal. Também é possível criar um `.txt` nessa pasta com uma frase por linha. As outras pastas usam as gravações existentes, sem gerar voz por IA. O áudio de preparação é interrompido ao começar a batalha.

Em **Falas e vozes**, você pode personalizar os pools de frases e adicionar gravações. As alterações feitas nessa tela ficam apenas no navegador e perfil usados; elas não são transferidas para o navegador interno do Live Studio. Para ambos usarem o mesmo conteúdo, prefira as pastas do projeto. Se você já salvou um pool de frases no navegador, ele tem preferência sobre os nomes dos arquivos.

## Conectar TikFinity

Abra o **TikFinity Desktop no mesmo computador** e conecte sua live. O jogo conecta automaticamente à Event API em `ws://localhost:21213/`, tenta também `ws://127.0.0.1:21213/` se necessário, com reconexão automática. O teste do WebSocket não verifica sozinho se o TikFinity já está recebendo eventos reais da LIVE; confirme com uma mensagem A/B no chat. Use **Integração da live** para desconectar ou reconectar manualmente. O status confirma a conexão com o aplicativo local; somente os eventos recebidos confirmam que a live está chegando. Para manter a conexão manual, defina `autoConnect: false` em `public/live-config.json`.

Digite **A** ou **B** no chat. A escolha usa o ID do espectador e inicia imediatamente uma nova partida se nenhuma estiver em andamento. Uma escolha durante uma partida apenas entra ou muda de time. Likes e presentes são aplicados durante a batalha; eventos durante a preparação ou após o encerramento não dão pontos ou bônus. A simulação automática é desabilitada quando o modo de conexão é ativado.

Combos de presentes são contabilizados pelo total na notificação final, com um agradecimento por combo. Notificações repetidas com o mesmo ID de mensagem ou grupo são ignoradas. Se o provedor não enviar identificadores, não é possível garantir a identificação de duplicatas sem descartar presentes legítimos.

Por padrão, todo presente ajuda o time escolhido e concede 2 segundos de especial por unidade. Para alterar, edite `public/live-config.json`:

```json
{
  "websocketUrl": "ws://localhost:21213/",
  "defaultGiftSeconds": 2,
  "gifts": [
    {"id": "ID_REAL_DO_PRESENTE", "seconds": 6, "gold": true}
  ]
}
```

Use IDs reais recebidos do TikTok ou `name` com o nome exato do presente. Os presentes Rosa/Coração/etc. do simulador não presumem IDs reais. Uma regra pode definir `team: "A"` ou `team: "B"` para atribuição fixa, caso você queira; omita `team` para respeitar a escolha A/B do espectador. Presentes sem regra seguem `defaultGiftSeconds`.

## Convite automático no chat

Consulte [CHATBOT.md](CHATBOT.md): contém a mensagem pronta e os passos para vincular **entrada de espectador → Send Chatbot Message** no TikFinity. O envio depende do Chatbot autenticado na sua conta. O código do jogo recebe os eventos e registra a resposta A/B; não envia mensagens pelo WebSocket. Neste computador, a ação de convite e o evento Join foram configurados no TikFinity, com intervalo de 600 segundos por usuário. O teste com espectadores reais aguarda a live.

O `.env` também pode conter `TIKFINITY_ACTIONS_OVERLAY_URL`, o link da tela dedicada à ação de convite. A arena carrega esse widget oficial em segundo plano ao conectar ao TikFinity, mantendo a tela de ações ativa. Use uma tela dedicada somente ao convite. O link privado não entra no ZIP e precisa ser configurado novamente em outro computador.

## TikTok LIVE Studio

Adicione uma fonte **Link** com `http://127.0.0.1:4174/?studio=1` e habilite o som dessa fonte. O modo transmissão mostra a arena, conecta ao TikFinity e fica em proporção vertical real **9:16 (1080 × 1920)**, aguarda alguém digitar A ou B para iniciar imediatamente a batalha, mostra o resultado por 8 segundos e aguarda uma nova escolha de time para a próxima partida. Defina a fonte de navegador como **largura 1080, altura 1920**.

Mantenha somente uma instância do jogo reproduzindo as interações. Abrir a arena ativa no navegador e no Studio ao mesmo tempo duplica geração de voz e áudio. Para operar manualmente durante os primeiros testes, use a página normal e capture a janela no Studio. Se o navegador bloquear reprodução automática, libere o som interagindo com a fonte ou use a captura da janela em que o botão **Som** já foi ativado.

## Verificar e exportar

```powershell
npm.cmd test
node scripts/export-standalone.mjs
```

O HTML em `exports/Jelly-Battle.html` inclui os arquivos de áudio e permite simular o jogo sem servidor. Para a integração completa, use INICIAR.bat: a Fish Audio exige o servidor local e o modo transmissão carrega a configuração local. O botão de download do projeto gera um ZIP com fontes e assets, sem `.env` e sem gravações armazenadas apenas no navegador.

Os testes usam eventos e respostas Fish Audio simulados, sem créditos ou mensagens externas. A live real depende do TikFinity conectado, Chatbot configurado e credenciais Fish Audio válidas.

Documentação oficial consultada: [Fish Audio TTS](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech), [TikFinity e Event API](https://tikfinity.zerody.one/landing/), [Chatbot](https://tikfinity.zerody.one/tiktok/chatbot), [overlays no LIVE Studio](https://staging.tikfinity.com/tiktok/obsoverlays).


## Ajustes desta versão — LIVE vertical e início por time

- Acesse **http://127.0.0.1:4174/?studio=1** ou use **INICIAR-LIVE-9X16.bat** para o layout 9:16. Adicione-o como fonte navegador em **1080 × 1920** no TikTok LIVE Studio ou OBS. A página normal permanece como painel de controle e simulador.
- Após conectar ao TikFinity, deixe a arena aguardando. O **primeiro A ou B no chat** começa automaticamente uma rodada de **2 minutos**, sem botão ou contagem. Com a partida em andamento, outras pessoas podem escolher/mudar de time.
- No fim, exibe o resultado por 8 segundos e fica aguardando uma **nova mensagem A ou B** para começar a próxima rodada. Para testar sem espectadores, a página normal ainda possui o botão manual com 15 segundos de preparação.
- Se não conectar, abra TikFinity **Desktop** no mesmo computador, conecte a live e habilite **Event API / WebSocket** na porta **21213**. Verifique o aplicativo em `http://127.0.0.1:4174/setup.html` e acompanhe as mensagens em **Integração da live**.
- O arquivo ZIP distribuído **não inclui `.env`**. Se já configurou a Fish Audio ou a URL de ações do TikFinity, copie seu `.env` privado da versão antiga para a pasta `jelly-battle` do projeto atualizado. Não publique esse arquivo.
- O HTML autônomo de `exports` funciona para **simulação offline**; para live e voz por API, **inicie pelo INICIAR.bat**, não pelo HTML isolado.
# Overlay de entrada no formato de live existente

A entrada agora mostra Bob Esponja e Patrick em cartas, comandos A/B, dicas e o objetivo da captura. Ela fica **dentro de `#ocean`**; o formato 9:16, o placar, o campo e os rankings existentes mantêm suas dimensões. A entrada desaparece no início da batalha. Na LIVE, o primeiro A/B começa imediatamente; o teste manual mantém sua preparação de 15s.

Use `http://127.0.0.1:4174/?studio=1` como fonte Link/Navegador em 1080 × 1920. O título dessa janela indica **Tela da LIVE 9:16**. No painel, **Entrada da LIVE → Prévia da entrada** permite conferir o convite sem executar ações no TikTok.

# Vozes salvas da plataforma

A configuração Fish Audio é carregada automaticamente ao iniciar. Além do `.env` privado do Jelly, a plataforma mantém uma cópia privada de recuperação. Uma nova versão que esteja sem `.env` recupera as vozes salvas no mesmo computador; salvar alterações atualiza a cópia. Fechar o navegador ou trocar de jogo não remove essa configuração. As chaves não entram no download do projeto.

Ao entrar um espectador, Bob e Patrick o convidam pelo nome para A/B usando suas vozes da API. O convite usa `member` e, quando esse evento não chega, a primeira interação reconhecida. Há intervalo global de 20s e limite de 10min por espectador. Presentes têm prioridade sobre convites; um presente sem time recebe agradecimento sem atribuir bônus a um time. Convites não iniciam a batalha.

Na arena da transmissão, **Ativar vozes** libera a reprodução se o navegador bloquear áudio automático. Essa permissão de reprodução é diferente da configuração da API e não pede a chave novamente. O botão desaparece depois que uma fala toca. Diagnóstico da fala fica em **Conectar LIVE → Vozes Fish Audio**. Mantenha uma única arena com áudio na transmissão.

