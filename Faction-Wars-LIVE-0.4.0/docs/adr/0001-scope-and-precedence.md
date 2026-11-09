# ADR-0001 — Escopo e precedência (E0)

Decisão técnica, 29/10/2026. Projeto novo e isolado em `/workspace/faction-wars-offline`, sem alterar o checkout Git vazio, sem worktree e sem publicação. Todos os bytes do pacote recebido estão em `sources/`; os seis hashes do manifesto foram verificados. `reference-text/` contém extrações para leitura, não substitui os DOCX.

Precedência aplicada: mensagem atual do proprietário e Parte Zero; I-B aprovado em 28/10; Parte I e histórico não substituído; contratos da Especificacao_MVP_Offline; relatórios 01–05 apenas como rastreabilidade. Avisos históricos de proibição de implementação e DEC-01 pendente estão substituídos pela autorização offline e aprovação expressa atual. Nada foi escrito no GDD v0.9/AUD-021.

AP: Nexus 2000 HP, proteção estrutural zero inclusive sob postura defensiva, Muralha ou buff; ataque20/1s/4tiles; HP mínimo0; empate técnico no fechamento do mesmo ciclo. Timeout compara quantidade de donos, incluindo contestados, sem HP ou maioria absoluta. Cerco sem teto artificial, ondas20..280. Não há nova votação pendente dessas decisões.

Motor ESM JavaScript em Node24 com APIs puras, não TypeScript: elimina compilação/dependências de runtime e mantém os mesmos contratos modulares testáveis. Render Canvas separado do processo autoritativo, SQLite nativo com WAL/FULL. Interface servida exclusivamente em 127.0.0.1. Sem SDK, websocket ou endpoint de TikTok/TikFinity. README não exige conectividade externa para funcionar. O nome LIVE é apenas o título do projeto.

Não há XP creditado, ranking permanente, temporada, conquista ou apuração de MVP. Estatísticas e E/V são locais à partida. Gifts não alteram competição. Identidades são fictícias, nomes são texto literal. Replay técnico nunca adiciona tela ou duração ao resultado.
