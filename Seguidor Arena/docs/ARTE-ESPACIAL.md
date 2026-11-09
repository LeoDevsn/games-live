# Fundo espacial — 01/11/2026

Asset usado: `public/assets/arena-space-v1.png`. Imagem gerada com ImageGen para o jogo, sem substituir o motor. Fundo de espaço aberto com profundidade pré-renderizada; não é geometria 3D em tempo real. A versão anterior de plataforma física foi descartada conforme o pedido.

Prompt utilizado:

```
Use case: stylized-concept. Production background for an original top-down avatar battle game. NEW DIRECTION: an OPEN OUTER-SPACE ENVIRONMENT viewed FULL TOP-DOWN, NOT a physical arena. Create a beautiful cinematic 3D cosmic backdrop in landscape 6:5 aspect ratio, ideally 1536x1280. Deep ink navy open space, sparse crisp distant stars with layered depth, delicate teal nebula wisps near upper-left margin and violet nebula wisps near lower-right margin. A softly illuminated richly shaded 3D blue planet partially cropped at the extreme upper-left corner and a much smaller reddish moon partially cropped at extreme lower-right corner; tiny dim 3D asteroids stay only at the far outside edges. Full top-down overhead / orthographic presentation with NO HORIZON and no camera tilt. The central 80% of the frame MUST be quiet, dark, uncluttered OPEN SPACE for numerous moving circular profile photos and bright trails. No floor, no platform, no stadium, no border, no walls, no architecture, no crystal pillars, no portal ring, no grid, no raised rim, no structures, no UI or decorative panels. No people, no avatars, no spaceships, no logos, no typography, no numbers. Premium elegant realtime-game atmosphere; convincing planet volume and rim lighting, restrained glow, subtle depth and sparse stardust, clean readable playfield. Fill the whole frame with space, no poster frame. This is an environment asset, not a screenshot or mockup.
```

As prévias em `../../previews/` são geradas pelo renderizador Canvas real do jogo, com participantes e estatísticas sintéticos. `seguidor-arena-efeito.png` acrescenta uma ilustração estática da celebração sobre o chat; não demonstra reprodução de GIF. Recriar: `node platform/preview-broadcast.mjs` na pasta Games Live.
