# Continuidade no Codex do VS Code

Abra a pasta que contém package.json, src/ e tests/. Use Node24.19.0. No terminal PowerShell: `npm.cmd start`; acesse http://127.0.0.1:4173. Não é necessário instalar dependências para jogar; Phaser e os PNGs já estão incluídos. F5 também inicia o servidor com .vscode/launch.json.

Escolha **Nova batalha com cenário → Retomar** para usar a decisão atual do Arqueiro. Um journal antigo conserva seu perfil histórico para replay; não é convertido silenciosamente. A pasta .runtime contém as partidas locais e não deve ser copiada sobre dados de outra instalação.

Cole no Codex:

```text
Continue o FACTION WARS LIVE neste projeto existente. Leia README.md, docs/EVIDENCIAS.md, docs/adr/0004-phaser-and-movement-2x.md e docs/adr/0005-medieval-no-archer-retreat.md. Não crie outro projeto.

A versão atual usa Phaser3.90.0, motor puro20Hz separado do renderer e arte3D original prerenderizada no Blender. Os fontes dos modelos estão em scripts/render-medieval.py e src/ui/assets/*.blend; o jogo usa PNGs locais e não precisa do Blender para rodar. Sprites têm32frames: caminhada cima/baixo, ataque cima/baixo, dano cima/baixo, morte cima/baixo,4frames por ação/direção.

Decisões do proprietário: movimento2× nas quatro classes, sem acelerar cadência/captura/relógio; Arqueiro não recua nem se afasta automaticamente para manter distância. Ataques/cadência e Disparo Preciso permanecem. legacy-0.2.js existe somente para replays de perfis anteriores; partidas novas têm archerRetreat:false. Não resta decisão pendente sobre Nexus: HP2000, nenhuma redução de dano, HP0 destrói, ataque20/1s/4tiles, empate técnico se ambos caem no mesmo ciclo.

Preserve economia, reforços, caps32/16/8 só convencionais, Cercos sem cap artificial, ondas20..280, posturas, energia, custos, habilidades dos três Campeões, captura10s neutro e reversão20s/10s com Cerco, vitória por Nexus ou mais pontos aos300s, preparação25s e resultados3×5s. Contestado conta para o dono; HP não desempata. Não invente MVP: MVP não apurado no protótipo.

Visual aprovado como direção: fantasia medieval estilizada, três rotas com paredes que terminam antes das áreas compartilhadas dos dois Nexus; um cristal azul em cima e um vermelho embaixo. Objetivos circulares no piso e sidebar OBJETIVOS A/B/C, mostrando dono real quando contestado. A arte não define colisão, alcance ou dano. Use a imagem de referência do proprietário se ela estiver disponível; não coloque a imagem inteira como falso jogo.

Mantenha journal durável/checkpoints10s/idempotência/replay por perfil e hashes. Preserve os fontes originais em sources/. Não publique o jogo, conecte LIVE/TikTok/TikFinity ou crie recompensas reais. Nova mudança funcional exige decisão específica; detalhes internos de engenharia não exigem confirmação.

Execute os testes pertinentes e relate pass/fail/skip e limitações reais. Comandos: node tests/medieval.js; npm.cmd run test:movement; npm.cmd test. Os testes de navegador usam Chromium via CDP; se não houver Chromium, registre skip e o motivo. Evidências que comparam sourceDigest/engineDigest devem ser regeneradas após alterações; nunca reutilize um pass antigo como execução nova. Consulte README para a sequência completa de medições e replay.

Antes de editar, examine git status e preserve alterações locais do proprietário. Implemente a próxima solicitação concreta, verifique e informe arquivos alterados, comandos executados e resultado. Não rebalanceie o jogo durante ajustes visuais.
```

## Acesso do celular0.3.1

No PC: `npm.cmd run mobile`. Abra no celular o endereço Celular (Wi-Fi) impresso, pela mesma rede. A ponte opcional em scripts/mobile.js e mobile-proxy.js publica somente o acesso LAN:4174 para o backend loopback:4173, valida Host/Origin e preserva SSE/controles. Não altera motor ou renderer. Sem túnel público. Testes: npm run test:mobile e npm run test:mobile-ui.

## Preparação web/integração0.4.0

Leia docs/PREVIEW_E_INTEGRACAO.md e ADR0006. O pedido atual permite preparar/publicar prévia de teste externo, sem ativar LIVE real ou aplicar eventos reais. Build estático em web-preview/ (motor real por aparelho, IndexedDB), TikFinity off/shadow com inbox durável e likes sem semântica habilitada, e saída somente leitura em4175 para captura. Testes: test:preview, integration:check e test:studio. Não confunda prévia por aparelho com um servidor de LIVE compartilhado. API de hospedagem indisponível neste ambiente; não inventar URL publicada.
