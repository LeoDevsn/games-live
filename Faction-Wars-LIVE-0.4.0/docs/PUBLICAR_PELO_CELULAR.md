# Gerar o link de teste pelo celular — Netlify

A prévia já está pronta na branch padrão `entrega-offline-2026-10-29`. O Netlify foi escolhido como a opção mais simples para esta etapa. Não é necessário ligar o PC de casa para a prévia: o motor do teste roda no navegador do aparelho.

1. Abra https://app.netlify.com/start no navegador do celular e crie/acesse a conta usando GitHub.
2. Escolha **Add new project → Import an existing project → GitHub** (os nomes podem variar conforme o idioma). Autorize o Netlify a acessar `LeoDevsn/faction-wars-live` e selecione esse repositório. Se ele não aparecer, ajuste a seleção de repositórios autorizados na instalação do Netlify no GitHub.
3. Use a branch **entrega-offline-2026-10-29**. A configuração `netlify.toml` já define comando **node scripts/build-preview.js**, diretório publicado **web-preview** e Node24. Confira esses valores e inicie **Deploy**.
4. Aguarde o build terminar. Abra a URL HTTPS `...netlify.app` que o próprio Netlify mostrar. Essa será a URL do teste para o 4G/5G; o assistente não cria nem adivinha esse endereço antes da implantação.
5. No jogo, toque **Nova batalha com cenário → Retomar**. A preparação dura25s. Cada aparelho tem uma partida de teste própria, com eventos simulados.

O serviço de build precisa ler o repositório autorizado para compilar/copiar os recursos; a pasta publicada é somente web-preview, sem GDDs, bancos de partidas do PC ou adaptador TikFinity. O teste não conecta à LIVE e não inicia transmissão. Não altere a pasta de publicação para a raiz do projeto.

As versões do TikFinity e do TikTok LIVE Studio podem ser informadas quando você chegar em casa. Não são necessárias para abrir esta prévia. A conexão real permanece desativada e ainda precisa de validação no PC. Mais detalhes: PREVIEW_E_INTEGRACAO.md.
