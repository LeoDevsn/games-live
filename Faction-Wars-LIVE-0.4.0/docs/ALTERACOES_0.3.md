# Arquivos alterados — atualização0.3.0

- `src/combat/combat.js`: novas partidas sem retirada/afastamento do Arqueiro e sem limite de um disparo associado ao recuo. `src/combat/legacy-0.2.js`: implementação anterior preservada para replay técnico.
- `src/rules/rules.js`, `profiles/manifest.json`: perfil spatial-3-no-archer-retreat; archerRetreat:false; movementScale:2 preservado. Regras numéricas mantêm f3602e48.
- `src/ui/arena-layout.js`: coordenadas de apresentação, convergência visual dos pátios e descrição do dono contestado, sem colisões de gameplay.
- `src/ui/arena-scene.js`: arena/sprites PNG, quatro animações em duas direções, pontos circulares no piso, sidebar OBJETIVOS, Nexus com facção/barra, destaque de Campeões, efeitos e contadores de frames efetivamente animados.
- `src/ui/app.js`, `src/ui/index.html`: textos da arena e aviso de perfil histórico; controles locais preservados.
- `scripts/render-medieval.py`, `scripts/assemble-medieval.py`: fontes editáveis da modelagem3D, poses, iluminação e montagem de sprites. `src/ui/assets/*.blend`, `arena-medieval.png`, `troops/*.png`, manifests e README de arte: recursos originais entregues. SVGs antigos preservados.
- `tests/medieval.js`, `tests/medieval-browser.js`, `tests/fixtures/v0.2-replay.json`: testes novos e fixture histórica real; `tests/acceptance.js`: L15 atualizado pela decisão do proprietário; `tests/browser.js`: seleção nas coordenadas atuais e efeitos.
- `scripts/stress.js`, `promote-stress.js`, `clean-smoke.js`, `report.js`, `package_delivery.py`, `verify-0.3.py`: medições/evidências/empacotamento da versão atual; `evidence/`: logs, JSON e screenshots executados.
- `package.json`, `package-lock.json`: versão0.3.0 e comandos de testes/arte; Phaser continua3.90.0. `.gitattributes`, `.gitignore`: preservação binária e exclusão de backups de arte.
- `.vscode/launch.json`, `.vscode/tasks.json`, `README.md`, `docs/CONTINUIDADE_VSCODE.md`, `docs/adr/0005-medieval-no-archer-retreat.md`, `docs/EVIDENCIAS.md`: execução no VS Code, instrução para Codex, decisões e resultados.

Não houve edição dos GDDs/documentos originais em sources/. Economia, reforços, território, vitória, persistência e adaptador HTTP permanecem os módulos existentes; sua execução é validada nos testes. A única alteração funcional da versão0.3 é a decisão do Arqueiro.
