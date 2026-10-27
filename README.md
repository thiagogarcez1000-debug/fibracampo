# FibraCampo – Gerenciador de ONUs Mobile

Aplicativo mobile (Android) para a equipe de campo da rede óptica (GPON) da Prefeitura Municipal de Anápolis.
Projeto extensionista da disciplina **Programação Mobile Aplicada** – UniEVANGÉLICA, 2026/2.

**Aluno:** D2510495 – Thiago José da Silva Garcez (GitHub: thiagogarcez1000-debug)
**Instituição parceira:** Prefeitura Municipal de Anápolis – Gerência de TI
**Kanban:** https://trello.com/b/06m2mJYt

## Objetivo
Levar ao celular/tablet do técnico os pontos da rede fora do ar, o tempo de queda, o mapa com a rota da fibra,
o teste do ponto ("testar agora") e o registro do atendimento com foto e GPS, inclusive sem internet.

## Situação do repositório (27/10/2026)
| Pasta | Situação |
|---|---|
| `docs/` | **Registrada no GitHub**: arquitetura, backlog, regras de sincronização e registro da Sprint 1 |
| `api/` | **Prevista** – módulo `api_mobile.py` ligado ao servidor do Gerenciador (código existe no repositório local desde 18/10/2026; ainda não enviado) |
| `app/` | **Prevista** – PWA em React + TypeScript instalável no Android (na proposta era Flutter; código no repositório local desde 18/10/2026; ainda não enviado) |

Nenhuma senha, IP de equipamento ou planilha da rede é versionada.

## Sprints
| Sprint | Período | Foco |
|---|---|---|
| 1 | 28/09 a 11/10/2026 | Levantamento, arquitetura, API base e login |
| 2 | 12/10 a 25/10/2026 | Início, busca, detalhe do ponto e mapa |
| 3 | 26/10 a 08/11/2026 | Testar agora, registro de atendimento, modo offline |
| 4 | 09/11 a 22/11/2026 | Notificações, histórico, APK e entrega |
