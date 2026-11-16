# Roteiro de testes – FibraCampo

Revisão de 15/11/2026: os critérios abaixo seguem a Seção 5.3 do relatório (a versão de 18/10 usava a numeração antiga).

| Critério | O que verifica | Requisitos | Card |
|---|---|---|---|
| CA01 | Senha errada recusada; nenhuma rota de dados responde sem token ou com token expirado/revogado | RF01, RNF05 | T01 |
| CA02 | Lista de fora do ar igual à do sistema da sala no mesmo ciclo | RF02 | T01 |
| CA03 | Qualquer ponto encontrado por nome ou serial em menos de 10 s | RF03 | T01 |
| CA04 | Detalhe abre o mapa no ponto com a rota certa (10 pontos) | RF04, RF05 | T01 |
| CA05 | Atendimento salvo sem sinal continua no aparelho após fechar e reabrir e chega completo | RF08, RF09, RNF04 | T02 |
| CA06 | Reenvio não duplica e as fotos chegam íntegras | RF09 | T02 |
| CA07 | Ao sair com pendências o app avisa; outra conta não vê os pendentes | RF12, RNF05 | US11 |
| CA08 | "Testar agora" confirma o retorno sem ligar para a TI | RF06 | US06 |
| CA09 | Funciona em pelo menos um celular e um tablet da equipe | RNF01, RNF02 | US10 |

## A. Testes automatizados (ambiente de desenvolvimento, dados fictícios)
| Comando | O que cobre | Resultado em 15/11/2026 |
|---|---|---|
| `python -m pytest api/test_api_mobile.py` | login errado e sem token (CA01), lista igual ao monitor (CA02), detalhe com rota (CA04), testar agora (CA08), reenvio sem duplicar (CA06), validação, eventos críticos | 8 de 8 ok |
| `cd app && npm test` | tempo fora do ar, busca, filtros, prioridade, mapa (CA03/CA04 nas regras), fila offline (CA05), pendentes por usuário (CA07) | 13 de 13 ok |
| `python docs/capturar.py s3` | testar agora (CA08), registro sem sinal com foto e GPS e envio quando o sinal volta (CA05/CA06) | ok |
| `python docs/capturar.py s5` | fechar e reabrir sem sinal (CA05), aviso ao sair com pendente e outra conta (CA07), tablet emulado (CA09 parcial) | ok |

Histórico: em 18/10 e na reexecução de 11/11/2026, 8 de 8 na API e 11 de 11 no app (numeração antiga dos critérios).

## B. T01 – aparelho Android da equipe, pela VPN, no servidor da TI
Condição para executar: módulo `api_mobile` instalado no Painel e app publicado em `/app/`.
Situação em 15/11/2026: **não executado**. Tentativas em 11/11 e 15/11: `/app/` responde 401 (módulo não instalado).

| Cenário | Procedimento | Esperado | Critério | Resultado | Data |
|---|---|---|---|---|---|
| T01-1 | Abrir o link pela VPN e instalar na tela inicial | App abre em tela cheia | CA09 | | |
| T01-2 | Senha errada; depois rota de dados sem token | Recusado e 401 | CA01 | | |
| T01-3 | Comparar a lista do app com a da sala no mesmo ciclo | Sem diferença | CA02 | | |
| T01-4 | Cronometrar a busca de 5 pontos por nome ou serial | Menos de 10 s cada | CA03 | | |
| T01-5 | Abrir o detalhe e a rota de 10 pontos; tocar em "Como chegar" | Ponto e rota certos; mapa do aparelho abre no destino | CA04 | | |
| T01-6 | Ligar o modo avião e reabrir o app | Última lista aparece, com aviso de sem internet | RNF04 | | |

## C. T02 – envio offline no aparelho
| Cenário | Procedimento | Esperado | Critério | Resultado | Data |
|---|---|---|---|---|---|
| T02-1 | Registrar atendimento com foto e GPS em modo avião, fechar e reabrir o app | Pendente continua no aparelho | CA05 | | |
| T02-2 | Desligar o modo avião | Chega completo ao servidor | CA05 | | |
| T02-3 | Forçar reenvio do mesmo registro | Nenhuma duplicata; hash da foto igual | CA06 | | |
| T02-4 | Sair com pendente; entrar com outra conta | Aviso ao sair; outra conta não vê | CA07 | | |
| T02-5 | "Testar agora" em ponto real após manutenção | Retorno confirmado sem ligar para a TI | CA08 | | |
