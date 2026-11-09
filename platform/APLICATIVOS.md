# Janelas dos jogos

O Games Live e os quatro jogos usam janelas em modo aplicativo, sem abas ou barra de endereço, com o Edge instalado no PC (Chrome é a alternativa).

- **Executar jogo / Abrir aplicativo**: prepara o jogo e abre somente a arena em uma janela vertical.
- **Abrir painel de testes**: abre os controles em outra janela de aplicativo.
- **Copiar URL para o LIVE Studio**: continua disponível para quem usa fonte de navegador; também é possível capturar a janela do jogo.

Os atalhos `.bat` dos quatro jogos usam o mesmo modo aplicativo. Jelly, Tower e Arena aceitam `--panel` em seus lançadores Node para abrir os controles; o Faction mantém seu painel na biblioteca. `--no-open` continua disponível para iniciar apenas o serviço local.

Ao abrir pelo `INICIAR-GAMES-LIVE.bat`, uma instância antiga do serviço da biblioteca é atualizada somente se o processo Node e o caminho absoluto desta plataforma forem confirmados. Os processos dos jogos continuam rodando. As APIs de abertura aceitam somente origem local, jogo conhecido e os destinos fixos do catálogo.

Fechar a janela do jogo não apaga configurações nem rankings. Os serviços locais continuam disponíveis para a fonte do LIVE Studio.

## Captura em resolução integral

A janela vertical do aplicativo se adapta ao monitor. Ampliar sua captura no LIVE Studio pode suavizar a imagem. Para transmitir sem depender do tamanho dessa janela, use **Adicionar origem → Link**, cole o link da arena e ative a resolução personalizada com **largura 1080** e **altura 1920**, em uma cena vertical. Essa é uma fonte de transmissão local; o jogo continua aberto como aplicativo. Confira a imagem e oculte a captura antiga do Edge. Mantenha somente uma fonte de áudio para o jogo.

### Campo Link recusando endereço IP

O botão de copiar da biblioteca acrescenta `#tiktok.studio` à URL de captura, formato documentado para fontes IP locais pelo fornecedor Live Entrance. O endereço continua local, e o fragmento não é enviado ao servidor. Na instalação 1.38.0, o validador de formato do Studio rejeita IPs puros por exigir um domínio no texto do link. Abertura do aplicativo e painel de operação continuam com seus endereços anteriores.

## Tela LIVE e painel de testes

Arena e Tower têm uma página pública separada em `?studio=1`. Ela lê a sessão real, não carrega os controles do painel e não recebe jogadores, ranking ou falas da simulação/replay. No Jelly, cliques nos personagens, início manual e vozes de teste são bloqueados nessa apresentação. O Faction filtra partidas de teste e orientações simuladas na captura, e seus controles manuais ficam bloqueados enquanto uma partida LIVE está ativa.

**Áudio de transmissão:** ative o som da fonte Link do jogo no LIVE Studio. Desative a captura global de áudio do sistema/desktop e de outras janelas que reproduzem testes. Assim, falas executadas no painel de testes são ouvidas apenas localmente e não entram na transmissão. Essa configuração substitui a orientação anterior de usar áudio global do aplicativo.
