# Escopo do MVP de Tower Battle LIVE

## Loop de jogo

1. Estado em espera, nenhuma partida rodando.
2. Primeiro `A` ou `B` de espectador válido: início imediato da rodada.
3. Interações do público aumentam o poder visual das torres; ataques automáticos a cada intervalo configurado.
4. Vitória por HP ou vantagem ao terminar o relógio; empate possível.
5. Intermissão curta, então reinício automático enquanto houver pelo menos um espectador registrado.
6. Todos os valores numéricos são **defaults técnicos sujeitos a aprovação**; nenhum valor é promessa de monetização.

## Separação técnica

```
TikFinity Desktop -> WebSocket loopback -> normalizador/antiduplicação
                                        -> motor puro/regras -> renderer Canvas 9:16
Simulador --------------------------------^              |
                                                      testes
```

## Fora de escopo nesta entrega

- Emissões de comentários automáticos no TikTok; robôs de interação externa.
- Pagamento, moeda virtual, prêmios reais ou integração com carteiras.
- Contas, login, hospedagem SaaS, comunidade de criadores, assinatura ou marketplace.
- Integrações não oficiais de plataforma sem validação de termos.
