# Faction Wars 0.4.2 — ajustes para teste

- Todas as classes, Rubra e Safira: spritesheets com poses de caminhada e ataque por direção.
- Cerco: chassi fixo e rotação das rodas por frame.
- Formação: Defensor → Guerreiro → Arqueiro. Os atributos de velocidade continuam os mesmos; aliados à frente limitam a ultrapassagem. Reforços atrás não arrastam uma tropa existente para trás.
- Ondas de Cerco: 30 segundos de combate, um por rota e facção, conforme pedido. O Cerco inicial permanece. Não é respawn após morte e não há novo limite de Cercos vivos.
- Proteção Muralha: contorno amarelo seguindo o alpha da pose, sincronizado aos frames.
- Sprites comuns: 126 → 114; Campeões: 142 → 128, aproximadamente 10% menores.
- Contador de Cerco e ritmo de teste visíveis no HUD.

Perfil novo: `spatial-4-formation-siege30`. Journals antigos preservam o perfil e as ondas históricas; inicie uma nova partida para receber as mudanças. HP, dano, alcance, cadência, captura e habilidades não foram alterados.

Artes: `src/ui/assets/walk-R-v2.png`, `walk-S-v2.png`, `attack-R-v2.png`, `attack-S-v2.png`. Geração pela ferramenta integrada image_gen, sem API/CLI por chave local. As grades foram calibradas no runtime; a passada frontal usa três poses distintas e repete a pose de passagem para fechar o ciclo de quatro frames. Ataques usam preparação, impacto e retorno à pose de guarda. Dano e morte conservam a animação procedural anterior.

Validação: `node tests/formation-siege.js`, `node tests/sprite-frames.js`, `npm run test:rules` (37 passaram, 3 casos externos omitidos), `node tests/medieval.js`, `node tests/movement.js`, `npm run test:live`, `npm run test:live:http`. O teste de sprites executa a composição real dos sheets em Canvas nativo, verifica diferenças entre poses, chassi fixo, rodas móveis e contorno com interior transparente. Prévia inspecionada: `evidence/sprite-preview-v2.png`. Isso não substitui medição de FPS no navegador/Studio.

## Prompts finais

### Caminhada Safira

Use case: stylized-concept. Production transparent WALK-CYCLE SPRITESHEET for Faction Wars game. Reference is the current unit identity/style only. Generate one BLUE SAPPHIRE TEAM walking spritesheet, portrait exactly 1:2 aspect ratio, ideally 1024x2048 pixels, EXACTLY 4 columns × 8 rows of equal cells (32 isolated poses). NO labels, NO grid lines. Columns 1 sword warrior; 2 bulky defender with kite shield; 3 hooded archer with bow/quiver; 4 robust wheeled siege cannon. Same characters, same helmets, blue/gold armor, proportions, orthographic elevated camera as reference. EACH ROW IS A DIFFERENT ANATOMICAL WALK-CYCLE POSE, not a repeated standing character shifted/rotated. Row 1 NORTH/back view: left leg extended forward, right extended backward, arms counter-swing. Row 2 NORTH/back: passing pose left foot planted and right knee bent lifted. Row 3 NORTH/back: right leg extended forward, left backward, opposite arms. Row 4 NORTH/back: passing pose right foot planted and left knee bent lifted. Rows 5,6,7,8 SOUTH/front view repeat corresponding 4 distinct left-contact/passing/right-contact/passing poses. Show clearly different leg silhouettes and foot positions between frames. Keep head/body size, camera, unit identity and framing consistent. Archer holds bow while WALKING rather than aiming in a static attack. Defender walks with heavy shield and visibly bent legs. Cannon rolls NORTH in rows 1-4 and SOUTH in rows 5-8, wheel spokes rotate 0/45/90/135 degrees while chassis stays centered. Uniform exact grid cells; every unit fully contained inside its cell with 10% empty margin on all sides, horizontally centered, ground contact aligned at 88% of each cell height. No object touches another cell. Highly polished stylized fantasy 3D miniature art, detailed metal/gold trim and blue cloth. Genuine transparent alpha background. No ground plane, no shadows outside figures, no UI, health bars, text, symbols, watermarks. Do not add extra units or empty cells. This will be cropped directly in a working game; precise 4x8 grid and consistent scale are mandatory.

### Caminhada Rubra

Create the RED RUBY team color variant of the supplied transparent 4-column × 8-row walking sprite sheet. EDIT TARGET: the supplied blue walk-cycle atlas. Change only blue cloth, blue enamel armor, blue shield faces and blue cannon panels to rich crimson red. Preserve gold trim, silver steel, shadows, all unit identities, camera, silhouettes, leg and arm poses, position, framing, precise 4x8 grid, transparent gutters and alpha background. Do NOT flip or rotate characters. Do NOT combine, crop, remove or add cells. Keep all 32 poses exactly registered to the same grid. No text, labels, frame, grid lines, extra background or watermark. Portrait 1:2 aspect ratio. Genuine transparent background.

### Ataque Safira — grade final

Rebuild the supplied blue attack sprites into a machine-readable SQUARE transparent sprite atlas with EXACTLY FOUR columns and EXACTLY FOUR rows, 16 cells total. This is a precise layout correction, not new art. Keep the same blue/gold character designs. Every cell is exactly one quarter of image width and one quarter of height. Columns remain warrior, defender, archer, siege cannon. Row1 BACK/NORTH windup: sword raised, shield pulled back, bow drawn, cannon ready. Row2 BACK/NORTH strike: sword swing, shield bash, arrow release, cannon recoil/muzzle flash. Row3 FRONT/SOUTH windup: sword raised, shield pulled back, bow drawn, cannon ready. Row4 FRONT/SOUTH strike: sword swing, shield bash, arrow release, cannon recoil/muzzle flash. All figures fully inside their cell with 12% transparent padding, ground contact at 88% cell height. EXACT 4x4 SQUARE grid is essential, not the previous 4x7 or 4x8 arrangement. Consistent body scale, camera and foot baseline across frames. No figures touching, no extra rows/poses, no textual labels, no grid lines. Real transparent alpha background, no floor or shadow. Clean polished stylized 3D game sprites, detailed golden metal armor.

### Ataque Rubra

Edit the supplied square transparent 4x4 attack spritesheet into the RED RUBY team variant. Change ONLY blue cloth, enamel armor, shield faces and cannon panels to crimson/red. Preserve gold/silver metal, identity, attack poses, front/back views, effects, exact positions and all sixteen cells. Keep the full square canvas and exact source registration. Do not add/remove characters, rows, cells or text. Preserve true transparent alpha. No background, no labels, no grid.

