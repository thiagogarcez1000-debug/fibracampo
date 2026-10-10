# Arquitetura inicial – FibraCampo

Documento de apoio ao Relatório Incremental (2ª entrega). Os diagramas abaixo são a versão inicial e serão refinados ao longo das sprints.

## Visão geral

```mermaid
flowchart LR
  subgraph Celular["Celular do técnico (Android)"]
    APP["App FibraCampo<br/>Flutter / Dart"] --- LOCAL[("SQLite local<br/>cache + fila offline")]
    APP --- REC["GPS · Câmera · Notificações"]
  end
  APP <-->|HTTPS + token| VPN["VPN Tailscale"]
  subgraph TI["Rede interna da Prefeitura"]
    API["API FibraCampo<br/>Python / FastAPI"] --- DB[("SQLite<br/>pontos, eventos, atendimentos")]
    API --> SCAN["Módulo de varredura<br/>(Gerenciador de ONUs)"]
  end
  VPN <--> API
  SCAN -->|ping| GPON["Rede GPON<br/>6 OLTs · ~580 ONUs"]
  API -->|alerta| FCM["Firebase Cloud Messaging"] -.push.-> APP
```

## Fluxo de navegação

```mermaid
flowchart LR
  A[Abertura] --> L[Login] --> I["Início<br/>resumo + fora do ar"]
  I --> B[Busca e filtros] --> D[Detalhe do ponto]
  I --> D
  N["Notificação"] --> D
  D --> M[Mapa e rota] --> C["Como chegar"]
  D --> T[Testar agora]
  D --> R[Registrar atendimento] --> S["Salvar / fila offline"]
  D --> H[Histórico]
```

## Modelo de dados inicial

```mermaid
erDiagram
  OLT ||--o{ PONTO : possui
  PONTO ||--o{ EVENTO_STATUS : registra
  PONTO ||--o{ ATENDIMENTO : recebe
  USUARIO ||--o{ ATENDIMENTO : realiza
  ATENDIMENTO ||--o{ FOTO : contem
```
