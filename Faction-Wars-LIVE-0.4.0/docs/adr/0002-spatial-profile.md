# ADR-0002 — Perfil espacial EXP, não balanceamento aprovado

Parte Zero0.4 autoriza escolhas técnicas configuráveis; nenhuma das escolhas abaixo altera HP, dano, alcance, cadência, custo ou duração aprovada. Perfil versionado `exp-spatial-1`, disponível no manifesto, congelado por partida e incluído em cada checkpoint/replay.

* Rota:32tiles, centro16, corredores independentes; distâncias de caminho 1D. Um Nexus por facção com três entradas de caminho, um único acumulador de disparo.
* Ponto fixo:1000subunidades/tile. A velocidade aprovada (4/3/5/2) é interpretada em unidades históricas/s,10unidades históricas=1tile. Logo G0,4tile/s; D0,3; A0,5; C0,2. É convenção EXP de escala, não novo atributo aprovado.
* Zona histórica de10unidades=1tile de largura total:centro±0,5tile. Entrada própria1tile, spawn1tile com deslocamentos iniciais D+0,6/G+0,3/A−0,3/C−0,6 em direção ao inimigo; estes offsets apenas separam formação inicial. Reforços e ondas nascem a1tile. Todos os spawns estão no corredor.
* Hitbox de bloqueio inimigo0,1tile, ponto autoritativo para ataque. Aliados atravessam aliados; propostas simultâneas de inimigos são cortadas no ponto médio se cruzariam. Posição pós-movimento e sobrevivência pós-dano determinam captura; precisão temporal50ms.
* Região de defesa4tiles do Nexus próprio. Alvos C/D primeiro nessa região; fora dela mais próximo; ID estável desempata. Nexus D→G→C→A, distância de caminho e ID em todas as rotas.
* Muralha:raio3tiles no mesmo corredor; emissor+até2C mais avançados+até1convencional por distância/ID. Não completar categorias ausentes. Dura5s independente de morte/afastamento da fonte; sobreposição não soma; seleção de fonte causal por ID para parcelas demonstráveis.
* Arqueiro protegido procura distância preferida1,6tile (16unidades históricas) se inimigo invade essa distância; alcance de ataque continua3tiles. Recuo de A sem G/D fixa destino centro se ultrapassado, senão entrada própria; reforço posterior não cancela; no máximo1tiro em deslocamento, defesa normal ao chegar. Não há reposicionamento ofensivo automático.
* Render usa referência540×960 escalada (mesma proporção de1080×1920), jitter lateral visual determinístico apenas para legibilidade; ele não muda a posição autoritativa nem a zona. Projéteis não têm vida física: golpe é instantâneo no tick; ícones provisórios G/D/A/C, cor e forma e coroa distinguem tipos.

Cadência ENG:incremento inteiro de rate×10 por tick e limiar200, preservando 0,7 e1,2; nascimento vazio, sem alvo satura em1ataque; alvo novo não reinicia; ataque já intencionado não é cancelado por morte no ciclo. Dano usa BigInt racional e um único ceil final.

Captura guarda meios-pontos (−200..200 equivale−100..100). Contribuição individual em sextos de ponto:até3Campeões por zona/facção (um/classe); 0,5÷3 é representável exatamente. Restauração de dono próprio não recebe crédito de progresso inimigo/neutro. Métricas não computáveis de interceptação/atração ficam não apuradas; dano recebido nunca é prova de proteção.
