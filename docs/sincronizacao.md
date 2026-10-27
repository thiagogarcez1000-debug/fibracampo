# Regras de persistência, sincronização e saída da conta (27/10/2026)

Revisão feita a partir do feedback da Proposta (seções 6.6 e 6.7). São regras de projeto, a implementar e validar nos cards US07, US11 e T02.

## Persistência no aparelho
- Cada atendimento recebe um **id único gerado no aparelho** (UUID) no momento em que é salvo.
- O atendimento é gravado na fila local (IndexedDB) **antes** de qualquer tentativa de envio. Fechar o app, reiniciar o aparelho ou perder o sinal não apaga a fila.
- Estados de cada atendimento: `pendente` → `enviando` → `enviado` (ou `erro`, com o motivo).
- Ao abrir o app, qualquer atendimento que tenha ficado em `enviando` volta para `pendente`.

## Envio e reenvio
- O envio é feito em duas etapas: primeiro os dados do atendimento, depois cada foto. O atendimento só passa a `enviado` quando o servidor confirma os dados e todas as fotos.
- O servidor usa o id único como chave: se receber o mesmo atendimento de novo (reenvio após falha), responde "já recebido" e **não cria duplicata**.
- Cada foto vai com um hash (SHA-256); o servidor confere o hash antes de aceitar, garantindo que a foto chegou inteira.
- Reenvio automático quando a conexão volta e ao abrir o app; depois de 3 falhas seguidas, o atendimento fica em `erro` e aparece na tela de pendências.

## Saída da conta
- Com atendimentos pendentes, o app avisa e oferece enviar antes de sair.
- Se o técnico sair mesmo assim, os pendentes **continuam guardados**, vinculados ao usuário que os criou. Só esse usuário, ao entrar de novo, consegue vê-los e enviá-los. Outra conta não tem acesso.
- Ao sair, são apagados: o token de sessão e a cópia local da lista de pontos.

## Dados guardados no aparelho
- Cópia da lista de pontos (nome, tipo, OLT/porta, CTO, coordenadas e status) para abrir sem sinal. **Não** são guardados IPs de gerência, senhas de equipamentos nem credenciais.
- Fila de atendimentos pendentes e suas fotos, apagados do aparelho depois do envio confirmado.

## Serviços externos
- Mapas (OpenStreetMap): o aparelho baixa apenas os blocos do mapa; nenhum dado da rede ou de atendimento é enviado ao serviço.
- Notificações: o texto mostra só o nome público da unidade e "fora do ar"/"voltou"; sem IP, serial ou detalhes do atendimento. Os detalhes só aparecem dentro do app, após login.
- Logs técnicos do servidor não registram senhas, tokens nem o conteúdo dos atendimentos.
