# FibraCampo – Gerenciador de ONUs Mobile

Aplicativo mobile (Android) para a equipe de campo da rede óptica (GPON) da Prefeitura Municipal de Anápolis.
Projeto extensionista da disciplina **Programação Mobile Aplicada** – UniEVANGÉLICA, 2026/2.

**Aluno:** D2510495 – Thiago José da Silva Garcez (GitHub: thiagogarcez1000-debug)
**Instituição parceira:** Prefeitura Municipal de Anápolis – Gerência de TI
**Kanban:** https://trello.com/b/06m2mJYt

## Objetivo
Levar ao celular/tablet do técnico os pontos da rede fora do ar, o tempo de queda, o mapa com a rota da fibra,
o teste do ponto ("testar agora") e o registro do atendimento com foto e GPS, inclusive sem internet.

## Situação do repositório (11/11/2026)
| Pasta | Situação |
|---|---|
| `docs/` | Arquitetura, backlog, regras de sincronização, registro da Sprint 1, roteiro de testes, instalação e `historico_local.md` (os 18 commits locais de 18/10/2026) |
| `api/` | Módulo `api_mobile.py` ligado ao servidor do Painel NOC, instalador com backup, servidor de desenvolvimento (dados fictícios) e 8 testes |
| `app/` | PWA em React + TypeScript (na proposta era Flutter): código-fonte e 11 testes. O build (`app/dist`) e os ícones PNG não são versionados |

O código de `app/` e `api/` foi escrito em 18/10/2026 no repositório local e publicado aqui em 11/11/2026; por isso os commits do GitHub têm a data da publicação.
US01 a US05 foram testadas só em desenvolvimento (dados fictícios). US06 a US10 ainda não foram validadas. A validação no servidor real e no aparelho pela VPN é o card T01.

Nenhuma senha, IP de equipamento ou planilha da rede é versionada.

## Como rodar os testes
```bash
cd api && python -m pytest -q test_api_mobile.py   # 8 testes da API
cd app && npm install && npm test                  # 11 testes do app
```

## Sprints
| Sprint | Período | Foco |
|---|---|---|
| 1 | 28/09 a 11/10/2026 | Levantamento, arquitetura, API base e login |
| 2 | 12/10 a 25/10/2026 | Início, busca, detalhe do ponto e mapa |
| 3 | 26/10 a 08/11/2026 | Testar agora, registro de atendimento, modo offline |
| 4 | 09/11 a 22/11/2026 | Notificações, histórico, APK e entrega |
