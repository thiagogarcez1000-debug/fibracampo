# Registro da Sprint 03 (26/10 a 08/11/2026)

Período oficial: 26/10 a 08/11/2026. **Nada foi feito no período** (nenhum commit e nenhum card movido).
O trabalho abaixo foi feito em **15/11/2026**, no período da Sprint 4.

## Situação dos cards (15/11/2026)
| Card | Situação | Critério | Evidência |
|---|---|---|---|
| US06 – Testar agora | Código de 18/10 verificado em 15/11 em desenvolvimento; em Validação | CA08 | `docs/capturar.py s3`, `api/test_api_mobile.py::test_testar_agora` |
| US07 – Registro com foto e GPS, sem sinal | Código de 18/10 verificado em 15/11; em Validação | CA05, CA06 | `capturar.py s3` e `s5`, `testes/fila.test.ts` |
| US11 – Saída segura | **Implementado em 15/11**: aviso ao sair com pendentes e pendentes presos ao usuário | CA07 | `app/src/fila.ts`, `app/src/App.tsx`, 2 testes novos, `capturar.py s5` |
| T01 – Aparelho pela VPN | Não executado: `/app/` no servidor responde 401 (módulo não instalado) em 11/11 e 15/11 | CA01–CA04 | `docs/ROTEIRO_DE_TESTES.md` (roteiro corrigido) |
| T02 – Envio offline | Executado só em desenvolvimento (Chromium em modo celular); falta o aparelho | CA05, CA06 | `capturar.py s3` e `s5` |

## Commits de 15/11 por história
A publicação pelo editor web do GitHub grava um arquivo por commit. Para ligar cada commit à mudança funcional,
todas as mensagens começam pelo código da história:
- `feat(US11)`: `app/src/fila.ts`, `app/src/sincronia.ts`, `app/src/App.tsx`, `app/public/estilo.css`
- `test(US11)`: `app/testes/fila.test.ts`
- `test(T02)`: `docs/capturar.py` (etapa s5)
- `fix(CA)`: `api/test_api_mobile.py` e `docs/ROTEIRO_DE_TESTES.md` (numeração dos critérios igual à Seção 5.3)

## Testes (15/11/2026, desenvolvimento, dados fictícios)
- API: 8 de 8; app: 13 de 13 (2 novos de US11).
- `capturar.py s3`: 0 registros no servidor antes do sinal voltar, 1 depois, com foto, GPS e marca offline.
- `capturar.py s5`: pendente continua após fechar e reabrir sem sinal; aviso ao sair; outra conta não vê; técnico volta e o envio acontece.
- Tablet emulado (Galaxy Tab S4): sem rolagem horizontal (712 = 712).

## Validação
Técnica, feita por mim no ambiente de desenvolvimento. A validação institucional (T01 e T02 em aparelho da equipe, pela VPN) não foi realizada.
