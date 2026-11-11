# Roteiro de testes – FibraCampo

## A. Testes automatizados (rodam no computador)
| Comando | O que cobre | Resultado em 18/10/2026 | Reexecução em 11/11/2026 |
|---|---|---|---|
| `python api/test_api_mobile.py` | login, token, lista igual ao monitor (CA01), detalhe/rota, testar agora (CA04), atendimento offline sem duplicar (CA03), validação, eventos de pontos críticos | 8 de 8 ok | 8 de 8 ok (pytest) |
| `cd app && npm test` | tempo fora do ar, busca sem acento, filtros, prioridade, mapa, fila offline (ordem, sem sinal, erro isolado), avisos | 11 de 11 ok | 11 de 11 ok (Node 22, sem tsx) |
| `python docs/capturar.py s1..s4` | fluxo completo no Chromium em modo celular (DevTools, perfil Pixel 7), incluindo modo sem internet | todos os passos ok | – |

## B. Testes em celular real (preencher com a equipe)
| ID | Teste | Aparelho / Android | Resultado | Data |
|---|---|---|---|---|
| T01 | Abrir pelo link HTTPS e instalar na tela inicial | | | |
| T02 | Login com usuário da equipe; senha errada recusada | | | |
| T03 | Lista de fora do ar igual à da sala da TI no mesmo minuto (CA01) | | | |
| T04 | Achar um ponto pelo nome ou serial em menos de 10 s (CA02) – cronometrar | | | |
| T05 | Abrir mapa e "Como chegar" no Google Maps | | | |
| T06 | "Testar agora" em ponto real após manutenção (CA04) | | | |
| T07 | Registrar atendimento em modo avião, com foto e GPS; desligar o modo avião e conferir chegada no servidor (CA03) | | | |
| T08 | Receber aviso de queda/volta de ponto crítico | | | |
| T09 | Sair da conta e conferir que os dados sumiram do aparelho | | | |
| T10 | Repetir T01–T07 em um segundo modelo de celular (CA05) | | | |
