# Arte3D original — versão0.3

Scripts: scripts/render-medieval.py (Blender4.3.2), scripts/assemble-medieval.py (Python/Pillow). Os arquivos .blend preservam os modelos editáveis; PNGs são os recursos de runtime. Sem downloads/CDN em jogo.

Arena: modelagem de pedras, paredes, vegetação, pátios e dois Nexus, render Cycles CPU48samples sem denoiser. Tropas: meshes de armaduras, espadas, escudos, arcos e canhões mecânicos, luz de estúdio Workbench. Oito sheets1024×512,32frames128×128. Sequência:4walk-up,4walk-down,4attack-up,4attack-down,4hurt-up,4hurt-down,4death-up,4death-down. Cada frame vem de pose distinta de modelo3D, sem substituir animação por fundo estático. Modelos são stylized low-poly, produção inicial; a imagem do proprietário é direção de arte, não promessa de reprodução idêntica.

Layout/calibração e fan dos pátios em src/ui/arena-layout.js são projeções visuais. O motor continua responsável por lane, posição, alcance, alvo e dano. Nenhum polígono de arte é obstáculo de gameplay.

Os SVGs de0.2 permanecem históricos e não são carregados pelo renderer atual. Hashes dos PNGs atuais em medieval-manifest.json.
