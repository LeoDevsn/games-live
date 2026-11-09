# Conferência do layout enviado — 02/11/2026

Fonte: `Arena Figma.zip`. O ZIP externo contém o `.fig` e um ZIP com 13 exportações PNG, incluindo COLISORES. Arquivo online: https://www.figma.com/design/0itDTgnHDGfj97WBQqLX8I/image-markup-preview-file_00000000f19c820e995e59940ea0fa67?node-id=0-1

O arquivo local foi lido com seu próprio esquema Kiwi: 209 nós; 10 formas dentro de COLISORES (4 retângulos, 2 elipses, 4 vetores triangulares). A geometria reconstruída foi comparada à máscara PNG exportada: interseção/união de 0,999644475, incluindo transformações e deslocamento do grupo.

Coordenadas em `layout.json` são relativas à origem do fundo de 941×1672. O fundo está em (-280,-119) no Figma; o grupo COLISORES em (-312,-151). Portanto a origem do grupo em relação ao fundo é (-32,-32), e não (0,0). As matrizes dos filhos já incluem essa diferença. Não recentralizar o grupo pelo tamanho de sua exportação.

O quadro `Objetivos — marcadores para o mapa` é referência, fora da arena. A/B/C posicionados no mapa e os HUDs estão listados separadamente nas posições originais. Não há mudanças no servidor, nas regras ou na movimentação do jogo nesta importação.

Prévia de conferência: `../../../previews/faction-wars-conferencia-colisores.png` (laranja = áreas marcadas; azul = centros dos objetivos). Essa imagem é documentação de geometria, não um novo fundo de jogo. Conferência numérica: `verification.json`.

Reproduzir, a partir da pasta do jogo: `node scripts/read-fig-layout.mjs` e `node scripts/preview-fig-colliders.mjs`. Leitor usa `kiwi-schema` instalado em `../../.tools/fig-reader/`, além do Node 24; comparação usa o Canvas nativo já instalado no projeto. Formato conferido com as implementações primárias [Kiwi](https://github.com/evanw/kiwi) e [importador da Sketch](https://github.com/sketch-hq/fig2sketch/blob/main/src/figformat/kiwi.py).

Acesso online confirmado com o link correto (último caractere da chave: I maiúsculo). A sessão Figma iniciou e retornou a estrutura e contextos de COLISORES, fundo, título e créditos Safira. As demais consultas retornaram limite de chamadas do plano Starter. Não foram realizadas alterações no documento Figma.
