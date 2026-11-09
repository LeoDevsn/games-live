# Prévia pelo 4G/5G e preparação da integração

Versão0.4.0. Motor/regras/perfil/renderer mantêm os mesmos fontes aprovados da0.3.1. Não houve alteração de HP/dano/cadência/captura/economia/habilidades. A implementação local Node/SQLite continua disponível. Esta entrega acrescenta uma prévia web por aparelho e preparação local da integração; não conecta nem transmite uma LIVE real.

## Link público: o que está pronto e o que falta

`FACTION_WARS_WEB_PREVIEW_0.4.0.zip` contém um site estático executável, com Phaser/PNGs e o motor puro real. Inclui preparação25s, combate até300s, resultados3×5s, habilidades, economia/reforços e Arqueiro sem recuo. Não é screenshot/vídeo/mockup. Cada aparelho tem sua própria batalha simulada: o link não controla o servidor Node do PC e não recebe eventos reais de uma transmissão.

O pacote está pronto para envio ao serviço de hospedagem escolhido pelo proprietário. A URL só existe depois que esse serviço aceitar a implantação. Neste ambiente a chamada à API do GitHub retornou Forbidden e não há ferramenta/credencial de hospedagem disponível; por isso não foi inventado um link publicado. Publicar a prévia de teste está no pedido atual, mas mudar a visibilidade do repositório ou ativar LIVE não foi feito.

Opções concretas:

- GitHub Pages: há workflow manual em `.github/workflows/preview-pages.yml`. Em Settings → Pages escolha GitHub Actions, depois execute **Preview web de teste** na branch de entrega. O workflow não roda automaticamente no push. Pages exige permissão/plano compatível com a visibilidade do repositório. A branch padrão foi conferida por git ls-remote --symref: entrega-offline-2026-10-29. O workflow está nessa branch; não alteramos a branch padrão. Sem API disponível, essa ativação precisa acontecer na conta do proprietário.
- Cloudflare Pages / Netlify / servidor estático: use implantação manual do ZIP ou da pasta `web-preview/`, conforme o fluxo do serviço. O diretório publicado deve conter index.html na raiz. Use HTTPS para WebCrypto e IndexedDB funcionarem corretamente. Não envie a raiz do projeto, sources/, .runtime/, .env ou bancos de dados.

O build funciona tanto na raiz de um domínio quanto em subdiretório, como /faction-wars-live/. Para gerar/servir localmente:

```sh
npm run build:preview
npm run preview
```

A prévia usa IndexedDB por aparelho, journal de eventos/hashes e checkpoint a cada200ticks (10s lógicos), com publicação só depois da transação concluída. Uma segunda escrita sobre estado antigo é rejeitada. Recuperação e exportação de diagnóstico são técnicas, sem vídeo/tela extra. O navegador/OS pode apagar os dados locais; isso não substitui a persistência de produção no PC. O controle Exportar diagnóstico baixa JSON que pode ser verificado em novo processo:

```sh
node scripts/replay-preview.js caminho/arquivo-diagnostico.json
```

## TikFinity — entrada preparada e desativada

`integrations/tikfinity/normalize.js`, `intake.js` e `bridge.js` separam contrato, inbox SQLite durável e transporte WebSocket local. Por padrão nenhuma conexão é aberta. Só existem modos off e shadow: shadow registra/valida, **sem aplicar eventos reais à economia ou aos comandos do jogo**. O simulador usa fixtures explícitas, não chama dados reais de simulados para burlar o contrato do motor.

Contrato preparado para envelopes event/data:

|Evento|Tratamento|
|---|---|
|chat|userId estável + msgId/messageId; encaminhamento proposto de comment ao parser PT/EN existente; não escolhe facção por entrada/follow|
|like|likeMode desativado até verificar a semântica da versão instalada; delta explícito ou contador pessoal configurado; totalLikeCount da sala nunca vira crédito pessoal|
|gift|registro cosmético; não concede crédito, energia, XP, reforço ou recompensa|
|outros|ignorados; não introduzem mecânicas|

A identidade é `tt:userId`, preservada mesmo que nickname mude. userId numérico inseguro (>2^53), ausência de ID estável, delta inválido e ID com conteúdo conflitante ficam em quarentena. A chave inclui a sala e o ID do evento. Duplicatas permanecem bloqueadas após reiniciar. Contador pessoal começa com baseline sem crédito histórico; retorno do contador/quebra de ordem não gera valor negativo. Não há estimativa de likes por totais da sala.

O endpoint local21213 é a convenção observada em exemplos comunitários, não uma confirmação da sua instalação. URL configurável, restrita a ws://loopback; não deve ser exposta por um link público. Comandos de teste:

```sh
npm run integration:check
npm run integration:shadow
```

O segundo imprime desativado e encerra por padrão. Para um teste futuro **somente de observação**, no PC com TikFinity instalado, o operador precisará habilitar explicitamente FW_TIKFINITY_SHADOW=1 e informar FW_TIKFINITY_ROOM_ID. Likes continuam sem semântica habilitada por padrão. Não executamos esse modo contra seu software nem uma LIVE real. O modo shadow não tem rota de aplicação ao jogo; essa ativação e a validação real serão uma etapa posterior específica.

## TikTok LIVE Studio — saída visual pronta para captura

Abra dois terminais no PC:

```sh
npm start
npm run studio
```

Controle a partida na interface normal http://127.0.0.1:4173. A arena para captura aparece em **http://127.0.0.1:4175**, em1080×1920/9:16, sem botões/formulários ou painel de operação. Essa saída é somente leitura: POST e rotas de estado privado são rejeitados; acompanha snapshots SSE do mesmo motor.

No TikTok LIVE Studio, adicione a URL como fonte Link/Navegador, se disponível nessa versão, com largura1080 e altura1920. A FAQ pública do próprio TikFinity menciona Link Source/Browser Source no LIVE Studio. Alternativa: abra essa URL em uma janela do navegador e use Captura de janela, enquadrando a arena. Não há chave de transmissão no jogo e não é necessário fornecê-la ao Codex. Adicionar uma fonte não inicia a transmissão; não clique em iniciar LIVE nesta etapa de preparação.

## Evidências e limites

`evidence/preview.json` cobre Chromium móvel390px, toque, hospedagem estática em subdiretório, recuperação real IndexedDB, rejeição de escritor antigo e batalha completa com replay em processo Node independente. `evidence/integration.json` cobre fixtures, duplicatas/reinício, contador pessoal, presente inerte e WebSocket sintético local. `evidence/studio.json` cobre arena1080×1920 com assets e frames reais e rejeição de escrita na saída de captura.

Nada disso prova funcionamento no TikFinity instalado, captura no LIVE Studio instalado ou operação de LIVE real. Faltam as versões dos programas e um teste controlado no PC para confirmar campos/IDs/semântica de likes e a fonte de captura. Esses são requisitos de validação de integração, não uma pendência da DEC-01 ou autorização para rebalancear regras.

## Referências consultadas

- FAQ oficial: https://github.com/zerodytrash/TikFinity-Public-Docs/blob/b3c9f5474436d3df26949a000264fc83853c9001/faq-en.md — confirma configuração sem conexão e uso de Link Source/Browser Source.
- Exemplo comunitário: https://github.com/darinh/tiktok-overlays/tree/64957f547ee875e65744dc212705b6f3986ca8cd — convenção de Events API WebSocket local21213. Não substitui amostra/contrato da versão do proprietário.
