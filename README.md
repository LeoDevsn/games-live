# Games Live — biblioteca de jogos para TikTok LIVE

Plataforma local para abrir os jogos e seus painéis de operação, com arenas verticais para captura no TikTok LIVE Studio.

| Jogo | Pasta | Tela da LIVE |
| --- | --- | --- |
| Jelly Battle | `Jelly-Battle-LIVE-9x16` | http://127.0.0.1:4174/?studio=1 |
| Faction Wars | `Faction-Wars-LIVE-0.4.0` | http://127.0.0.1:4176/ |
| Tower Battle | `Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE` | http://127.0.0.1:4175/?studio=1 |
| Arena Royale do Plankton | `Seguidor Arena` | http://127.0.0.1:4177/?studio=1 |

## Preparação

Use Windows e Node.js 24.x. Depois de clonar ou baixar o repositório, abra o PowerShell na pasta do projeto e instale as dependências:

```powershell
npm.cmd --prefix "Faction-Wars-LIVE-0.4.0" ci
npm.cmd --prefix "Tower-Battle-LIVE-Codex-v0.1/Tower-Battle-LIVE" ci
npm.cmd --prefix "Seguidor Arena" ci
```

O Jelly não exige instalação de dependências; seu iniciador gera os arquivos necessários.

Abra **INICIAR-GAMES-LIVE.bat** ou execute `npm.cmd start`. A biblioteca fica em http://127.0.0.1:4180/. Escolha o jogo e use o painel do operador para configurar a partida. No TikTok LIVE Studio, adicione a URL da tela da LIVE como fonte Link/Navegador em **1080 × 1920**.

Para receber eventos da audiência, conecte sua LIVE no TikFinity e configure a integração pelo painel do jogo. A transmissão é iniciada pelo operador no TikTok LIVE Studio.

## Configurações privadas

Chaves de API, arquivos `.env`, perfis de navegador, bancos de dados, partidas salvas, logs, dependências instaladas e backups ficam fora do Git. Configure as vozes localmente pelo painel; o Jelly também inclui `.env.example`. As credenciais e o histórico deste computador não acompanham o repositório.

## Documentação e testes

Consulte [LEIA-ME-GAMES-LIVE.md](LEIA-ME-GAMES-LIVE.md) para instruções detalhadas, limitações e histórico de validação. Cada jogo também tem seu próprio README.

Execute `npm test` na raiz para testar a plataforma. Os testes específicos ficam nos scripts de cada jogo.

Este repositório reúne as versões atuais dos quatro jogos. Pacotes ZIP, cópias antigas e backups permanecem apenas no computador original.
