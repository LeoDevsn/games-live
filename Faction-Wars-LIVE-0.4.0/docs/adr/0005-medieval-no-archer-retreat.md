# ADR0005 — Arena medieval e remoção do recuo do Arqueiro

Data:29/10/2026. Status: aplicado por instrução explícita do proprietário.

A instrução atual substitui o tema cívico da arte anterior e toda a mecânica de recuo automático do Arqueiro. Novas partidas usam perfil spatial-3-no-archer-retreat com archerRetreat:false. Sem retirada quando perde protetores e sem afastamento para distância preferida: para ao ter alvo válido, ataca à cadência aprovada e avança quando não tem alvo. Os atributos-base e o fator2× de movimento não mudaram; fingerprint das regras numéricas continua f3602e48.

O protocolo de estado permanece compatível. O perfil congelado identifica a decisão. legacy-0.2.js conserva o código anterior exclusivamente para replay técnico de journals antigos (sem migrar perfis/hashes em silêncio). É necessário iniciar Nova batalha para aplicar uma mudança de perfil. Campos históricos retreat/retreatShot/defending são inertes nas partidas novas.

O renderer continua Phaser2D/Canvas e consome snapshots confirmados, sem física de gameplay. Modelos3D originais são construídos por scripts/render-medieval.py no Blender4.3.2, com luz de estúdio, sombras e cavidade; sprites PNG prerenderizados são montados por scripts/assemble-medieval.py. Não são modelos3D em tempo real. Oito sheets, quatro frames por ação/direção (caminhar/atacar/dano/morte, cima/baixo). Campeões têm escala visual maior, manto, estrela e anel dourados, nome e cooldown; essas diferenças não mudam hitbox/alcance.

A arena tem paredes contínuas durante o percurso e duas áreas abertas comuns nas pontas. Há um Nexus visual e lógico por facção, sem colisores de arte. O fan de coordenadas nas pontas é apenas projeção visual; o motor mantém as três lanes independentes e seu alvo estrutural compartilhado. Pontos de piso em A/B/C usam progress do estado, arco circular assinado e cores de contestação; sidebar mostra owner sem transferir posse. UI de Nexus contém somente facção e barra de vida, sem texto de defesa ou HP numérico.

Testes V01–V08 cobrem recuo ausente, disparos contínuos, retomada do avanço,24 combinações classe/facção/lane alcançando e atacando o Nexus, proprietário contestado, replay histórico0.2 e falha transacional. L15 foi substituído pelo teste da decisão atual; os fontes e evidências0.2 permanecem históricos. L17 continua exercitando DEC-01. Evidências atuais e medições executadas estão em docs/EVIDENCIAS.md.
