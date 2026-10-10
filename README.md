# FibraCampo – Gerenciador de ONUs Mobile

Aplicativo Android para a equipe de campo da rede óptica (GPON) da Prefeitura Municipal de Anápolis.
Projeto extensionista da disciplina **Programação Mobile Aplicada** – UniEVANGÉLICA, 2026/2.

**Aluno:** Thiago José da Silva Garcez
**Instituição parceira:** Prefeitura Municipal de Anápolis – Gerência de TI

## Objetivo
Levar ao celular do técnico os pontos da rede fora do ar, o tempo de queda, o mapa com a rota da fibra,
o teste do ponto ("testar agora") e o registro do atendimento com foto e GPS, inclusive sem internet.

## Estrutura
- `app/`: aplicativo Flutter (Android 8.0+)
- `api/`: API em Python (FastAPI) que reaproveita a varredura do Gerenciador de ONUs
- `docs/`: relatório, diagramas e wireframes

## Sprints
| Sprint | Período | Foco |
|---|---|---|
| 1 | 28/09 a 11/10/2026 | Levantamento, arquitetura, API base e login |
| 2 | 12/10 a 25/10/2026 | Início, busca, detalhe do ponto e mapa |
| 3 | 26/10 a 08/11/2026 | Testar agora, registro de atendimento, modo offline |
| 4 | 09/11 a 22/11/2026 | Notificações, histórico, APK e entrega |
