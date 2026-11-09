# Faction Wars 0.4.3 — acabamento conforme o arquivo Figma

Fonte visual: `Arena Figma.zip`, arquivo `.fig` editável e ZIP interno com camadas PNG. Nenhum elemento foi redesenhado com IA. As imagens locais em `src/ui/assets/figma/` são cópias das exportações fornecidas; os valores variáveis (tempo, créditos, vida e captura) são desenhados pelo Canvas. O quadro de modelos dos objetivos não entra na composição.

## Composição

- Fundo ocupa toda a tela 1080×1920, sem a antiga reserva lateral de 180 pixels.
- Título no alto à esquerda; tempo à direita. O 225s da referência é exemplo: o contador continua usando os 300s aprovados, descontados pelo motor.
- Barra Safira acima do Nexus superior; Rubra abaixo do inferior.
- Créditos e objetivos nas posições exatas do arquivo; créditos mostram o saldo atual até 20.
- A/B/C são círculos nas três rotas. Estados neutro, capturando, conquistado e contestado seguem o estado confirmado do motor; contestação mantém o proprietário real.
- Telemetria de Cerco, energia, estratégia, reforços e buffs fica na mesa de comando. As auras nas tropas continuam visíveis.
- Preparação informa os comandos `!vermelho` e `!azul`. Resultados exibem vencedor e estatísticas agregadas dos Campeões; não anunciam um MVP sem cálculo.

## Colisores e percursos

As 10 formas do grupo COLISORES foram importadas com suas matrizes e com a origem correta de (-32,-32) em relação ao fundo: quatro retângulos, duas elipses e quatro polígonos. As três rotas passam pelos centros A/B/C indicados e terminam antes das bases dos Nexus. O deslocamento lateral de cada tropa diminui perto dos obstáculos para respeitar sua área de contato com o chão, incluindo a largura maior do Cerco.

A interpolação agora percorre essas rotas, em vez de cortar as curvas em linha reta entre atualizações. O combate continua sendo a simulação determinística por rota: progresso lógico, velocidades, alcance, dano, HP, captura, compras, formação e replay não foram modificados. Não foi introduzido um motor físico 3D. Fundo e tropas continuam com arte 3D pré-renderizada em Phaser/Canvas.

## Verificações

- 307584 posições de tropas, quatro classes, três rotas e ambas as facções: fora das áreas bloqueadas. Segmentos interpolados também conferidos, com margem para a área de contato.
- PNGs exportados decodificados e usados nas posições medidas do `.fig`; conferência nativa de HUD, saldos, vida, tempo e estados dos objetivos.
- Métodos reais da ArenaScene exercitados com texturas Canvas nativas e um substituto limitado da API Phaser: preparação, combate, remoção e resultados. Esse teste não substitui a execução do Phaser em navegador.
- Regras: 37 passaram e três verificações de evidências externas foram omitidas explicitamente. Medieval: oito passaram, incluindo todas as classes atacando os Nexus pelas três rotas e replay histórico. Formação: 12 cenários e ondas 30/60s. Sprites: oito combinações de classe/facção, ataque, rodas e contorno amarelo.
- Integração TikFinity: runtime e HTTP/SSE/WebSocket locais com eventos sintéticos, deduplicação e economia. A fonte 4176 permanece somente leitura; todos os novos assets e módulos são idênticos nas duas portas.
- Bundle local e prévia web reconstruídos com os novos módulos e imagens. Dados `.runtime/`, o ZIP de design e ferramentas de importação não viram assets públicos.

Relatórios: `evidence/figma-layout.json`, `figma-render.json`, `figma-scene.json`, `medieval.json`, `formation-siege.json`, `sprite-frames.json` e `live-http.json` (quando presente). Os nomes dos relatórios históricos permanecem os definidos em seus testes.

Prévias em `../../previews/faction-wars-layout-final.png` e `../../previews/faction-wars-combate-final.png`: componentes Canvas usados pelo jogo, com valores e tropas sintéticos para inspeção. Não são capturas do navegador/Studio. Referência dos estados: `evidence/figma-objective-states.png`.

O acesso a janelas/navegador da ferramenta de computador estava indisponível nesta sessão. Ainda falta a conferência visual no navegador/Studio, FPS com audiência real e eventos reais da LIVE. Nenhuma transmissão foi iniciada. Para testar: atualize o painel e a fonte; conecte o TikFinity, clique Nova partida LIVE e entre por comentário durante a preparação de 25 segundos.

Backup anterior aos ajustes: `../../backups/faction-acabamento-20261102-095330/`. O arquivo Figma original foi preservado.
