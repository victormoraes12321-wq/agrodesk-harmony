# TEST_PLAN - AgroDesk TI

## Objetivo
Validar o uso real com 40 usuários simultâneos (36 SOLICITANTE + 4 TI_ADMIN), cobrindo autenticação, criação e gestão de OS, permissões, anexos, fluxo de status crítico, WhatsApp operacional, atualização quase em tempo real e estabilidade de build.

## Escopo de testes
1. Login simultâneo (válido, inválido, senha incorreta, usuário inativo).
2. Criação simultânea de 30 OS por solicitantes.
3. Integridade de protocolo único e consistência de listagem admin.
4. Ações simultâneas de 4 admins (status, prioridade, responsável, comentários, técnico).
5. Cenários de conflito de edição na mesma OS.
6. Fluxo `WAITING_USER` com mensagem obrigatória.
7. Fluxo de WhatsApp preparado (válido/inválido + auditoria).
8. Upload de anexos (permitido, executável bloqueado, arquivo grande bloqueado, concorrência).
9. Permissões (403 para acessos indevidos do SOLICITANTE).
10. Atualização quase em tempo real via polling.
11. Relatórios com filtros e performance de endpoint.
12. Build frontend e backend.

## Ferramentas e abordagem
- Node scripts de carga/e2e (backend/tests/load)
- Execução concorrente com `Promise` + `fetch`
- Banco PostgreSQL real + API NestJS real
- Sem mocks para os fluxos críticos testados

## Scripts executados
No diretório `/backend`:
- `npm run load-test-login`
- `npm run load-test-create-tickets`
- `npm run load-test-admin-actions`
- `npm run e2e-critical-flows`
- `npm run load-test-all`

No diretório raiz:
- `npm run build` (frontend)

No diretório `/backend`:
- `npm run build` (backend)

## Critérios mínimos de aceite
- 40 logins válidos simultâneos funcionando.
- 30 OS simultâneas criadas com protocolo único.
- Nenhum solicitante acessando dados/rotas administrativas.
- Comentário interno não exposto para solicitante.
- Fluxo `WAITING_USER` exigindo mensagem.
- Status/prioridade/responsável persistindo corretamente com múltiplos admins.
- Dashboard/listagens atualizáveis sem refresh total (polling).
- Build frontend e backend concluindo com sucesso.
