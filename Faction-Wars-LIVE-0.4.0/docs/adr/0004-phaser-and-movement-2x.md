# ADR0004 — Phaser2D e movimento2× (v0.2.0)

Solicitação e confirmação do proprietário em29/10/2026: **dobrar somente o movimento das tropas**, preservando ataques, captura e relógio. Essa é uma alteração AP aprovada nesta conversa, não um ajuste EXP escondido. Sem autorização para integrar LIVE, alterar dano/HP/custos/energia, inventar MVP ou mudar de tema.

## Movimento e compatibilidade

O perfil novo `spatial-2-movement-2x` grava `movementScale:2` e a origem da aprovação. A tabela base G4/D3/A5/C2 continua rastreável; o deslocamento efetivo é multiplicado por2. Na escala histórica10unidades/tile: G0,8tile/s, D0,6, A1, C0,4; Discurso multiplica estes valores por1,10. O recuo também usa o movimento2×. Não dobra a cadência, alcance, dano, captura, cooldown ou os25/300/15s.

Perfis antigos sem o campo continuam com fator1. O journal/checkpoint contém o perfil e seu hash; uma partida recuperada conserva seu perfil até terminar. O adaptador usa o perfil atual ao criar a preparação seguinte. A versão do protocolo de estado `offline-0.1.0` foi mantida porque a alteração é compatível; a versão do pacote é0.2.0. A fixture real de um journal0.1, checkpoint600..commit640, é reexecutada e comparada em todos os commits.

## Phaser e arte local

Phaser3.90.0, fixado no package-lock e distribuído com MIT/LICENSE e SHA256 em `src/ui/vendor/manifest.json`. Renderer Canvas do Phaser em1080×1920, escala9:16. Nenhum Phaser/CDN/asset é baixado em runtime. `npm start` funciona com Node24 e os arquivos fornecidos, sem node_modules. `npm ci` é necessário somente para reinstalar dependências de desenvolvimento; `npm run vendor` recria a cópia local verificada.

A arte SVG é original e editável: cenário, caminhos, jardins, prédios compartilhados dos Nexus e8sprite sheets (4classes×2facções), cada uma com caminhada/ataque nas duas direções. Gerador em scripts/generate-art.js. O tema continua uma praça cívica fictícia, com roupas/cartoon de campanha e carrinho de Cerco; não é migração para fantasia medieval. Não há fotos/pessoas reais nem aprovação de arte final presumida.

SVG é rasterizado em CanvasTexture uma única vez no carregamento. O perfil inicial medido redesenhando SVG a cada frame era lento; o cache removeu esse gargalo sem reduzir entidades ou remover habilidades. São mantidos todos os122sprites na medição de carga. O limite240 refere-se somente a efeitos cosméticos simultâneos, nunca a tropas ou efeitos de gameplay.

## Motor e apresentação

Motor puro20Hz continua em Node, um escritor e SQLite antes de publicar. `/api/stream` entrega projeções SSE somente de commits confirmados, com os efeitos do lote; não envia dedupe/journal para render. O painel consulta estatísticas completas a1Hz. Efeitos são deduplicados no cliente; cliente lento pode reconectar sem bloquear o motor. Recuperação/reconexão mostra o estado durável, sem reaplicar compras, dano ou resultado.

Phaser interpola posições já confirmadas por50ms, sem extrapolar, atravessar uma colisão lógica ou escrever em estado autoritativo. Caminhada, ataques, impactos, números de dano, projéteis, escudos/Muralha, Chama, Discurso, nascimentos e mortes são apresentação. O voo de um projétil é cosmético (105–165ms), sem segundo dano ou atraso lógico.

A arena mostraHP dos Nexus, donos/contestações/progresso, créditos, energia, postura e janelas. Campeões recebem anel/estrela, nome fictício e cooldown. Clique em tropa abre suas seis estatísticas no painel. Resultados continuam3telas×5s, com “MVP não apurado no protótipo”; o novo ciclo começa após os15s. “Ritmo1/4/16×” é aceleração de teste do simulador inteiro e é separado do fator2× aprovado para movimento.

## Medição e evidência

O benchmark headless usa `engineDigest`, SHA256 dos módulos puros/regras/perfis/persistência/cenários carregados, separado do digest de UI/arte. Assim uma edição de sprite não finge ser alteração do motor medido. Navegador/render usam o digest completo de src/, profiles/ e scenarios/. Logs, replays e resultados estão em evidence/. Não se reaproveitam medições0.1 como evidência0.2.
