# Convite de entrada — TikFinity

Mensagem pronta:

> Bem-vindo ao Jelly Battle! Qual time você escolhe? Digite A para Bob Esponja ou B para Patrick!

1. Abra o **TikFinity Desktop**, entre na sua conta TikTok dentro dele e conecte a live.
2. Em **Chatbot**, ative **Activate Chatbot**.
3. Em **Actions & Events**, crie uma ação chamada **Jelly Battle — convite**, do tipo **Send Chatbot Message**, com o texto acima.
4. Crie um evento de **entrada de espectador / User joined**, associado à ação de convite. Se quiser mencionar a pessoa, insira a variável de usuário oferecida pelo editor do TikFinity, antes do texto. A sintaxe de variáveis difere entre as telas; use a variável indicada no próprio campo.
5. Configure intervalo por usuário, se disponível, para que reentradas não repitam a saudação continuamente. O limite global de mensagens do Chatbot também se aplica; em uma live movimentada, o convite pode ser atrasado ou limitado.
6. Se o TikFinity solicitar uma tela **My Actions**, adicione o link dessa tela ao LIVE Studio e mantenha-a ativa.
7. Teste com outra conta: entre na live, confira o convite no chat, escreva **A** e envie likes. Depois escreva **B** e envie um presente. Veja a atribuição no painel do jogo.

O jogo registra A/B por identificador do espectador, aceita letras maiúsculas ou minúsculas e conserva a escolha entre rodadas enquanto a página permanece aberta. Digitar outra letra troca o time. Ao recarregar a página, os espectadores precisam escolher novamente. Likes e presentes de alguém sem time não recebem uma atribuição aleatória.

A Event API WebSocket do TikFinity recebe os eventos da live. O envio de mensagens fica a cargo do Chatbot autenticado do próprio TikFinity. O convite exibido no rodapé do jogo ao receber `member` é uma indicação visual e não confirma envio ao chat. O jogo não usa um endpoint de envio inventado nem solicita sua senha TikTok.

**Configuração aplicada neste computador:** Chatbot ativado, ação **Jelly Battle - Convite A ou B** salva, gatilho **Join** para todo mundo ativo, intervalo por usuário de 600 segundos e duração de 1 segundo. A ação usa **Screen 2**, dedicada ao convite. A live ainda precisa ser iniciada por você para testar a mensagem com espectadores reais.

O link dessa tela fica em `TIKFINITY_ACTIONS_OVERLAY_URL`, no `.env` local. Ao conectar ao TikFinity, a arena mantém o widget oficial dessa tela carregado em segundo plano. Assim ele acompanha a fonte da arena. Use essa tela exclusivamente para o convite: imagens, sons ou outros alertas que forem colocados nela também serão executados pelo widget. Em outro computador, configure seu próprio link de tela; ele não é incluído no ZIP.

Fontes oficiais: [Chatbot](https://tikfinity.zerody.one/tiktok/chatbot), [Actions & Events](https://tikfinity.zerody.one/tiktok/actionsandevents), [recursos e envio de mensagens](https://tikfinity.zerody.one/landing/).
