# LOAD_TEST_REPORT - AgroDesk TI

Data da execução: 2026-06-01
Ambiente: local (backend em `http://localhost:3333/api/v1`)
Carga alvo: 40 usuários simultâneos (36 SOLICITANTE, 4 TI_ADMIN)

## Resultado geral
Status: **APROVADO**
Suíte consolidada: `backend/tests/load/results/heavy-suite-summary.result.json`
`success: true` em todos os blocos da suíte pesada.

## 1) Login simultâneo
Arquivo: `backend/tests/load/results/load-test-login.result.json`

- 40/40 logins válidos com sucesso (`201`).
- `/auth/me` com token válido: 40/40 (`200`).
- token inválido rejeitado: 40/40 (`401`).
- senha errada rejeitada: 40/40 (`401`).
- usuário inativo rejeitado: validado com `401` após inativação.

Métricas principais:
- Login válido p95: **1789.74 ms**
- `/auth/me` p95: **48.75 ms**

## 2) Criação simultânea de OS (30 solicitantes)
Arquivo: `backend/tests/load/results/load-test-create-tickets.result.json`

- 30/30 OS criadas com sucesso (`201`).
- Protocolos únicos: **30/30**.
- Todas as OS visíveis para TI_ADMIN na listagem.
- Total no dashboard/overview aumentou corretamente (antes 137, depois 167).
- Proteção de duplo envio: primeira `201`, segunda `400`.

Métricas principais:
- Criação concorrente p95: **265.62 ms**

## 3) Alterações simultâneas por TI_ADMIN
Arquivo: `backend/tests/load/results/load-test-admin-actions.result.json`

- `assign`: 20/20 OK
- `priority`: 20/20 OK
- `status`: 20/20 OK
- comentários: 40/40 OK
- atualização técnica: 20/20 OK
- conflitos paralelos (mesma OS): sem corrupção detectada

Métricas principais:
- Status update p95: **87.27 ms**

## 4) Fluxos críticos e permissões
Arquivo: `backend/tests/load/results/e2e-critical-flows.result.json`

Validações aprovadas:
- SOLICITANTE bloqueado em endpoints admin (`403`) ?
- SOLICITANTE não vê OS de outro usuário ?
- SOLICITANTE não altera prioridade/responsável/status admin ?
- comentário interno por SOLICITANTE bloqueado ?
- `WAITING_USER` sem mensagem retorna `400` ?
- `WAITING_USER` com mensagem funciona e aparece ao solicitante ?
- WhatsApp preparado registra evento ?
- telefone inválido rejeitado (`400`) ?
- anexo permitido ?
- executável bloqueado ?
- arquivo grande bloqueado ?
- uploads concorrentes OK ?
- polling detecta nova OS sem refresh manual ?
- endpoints de relatórios saudáveis ?

Métricas principais:
- Relatórios p95: **12.89 ms**

## 5) Build e estabilidade
- Frontend build: **PASSOU** (`npm run build` na raiz)
- Backend build: **PASSOU** (`npm run build` em `/backend`)
- Testes unitários backend: inexistentes no momento (`npm test` retorna "No tests configured")

## Gargalos encontrados e tratados
1. Colisão de protocolo em alta concorrência (antes da correção): gerava falhas `400` em criação simultânea.
2. Inconsistência do cenário de duplicidade no script de carga (payload reaproveitado entre execuções).

Ambos foram corrigidos e a suíte foi reexecutada com sucesso total.

## Riscos remanescentes
- Warning deprecado no runner da suíte (`shell: true` no spawn). Não bloqueia funcionamento, mas recomenda-se refino posterior.
- Sem suite unitária/integration formal com Jest/Supertest ainda.
- Lint global atual na raiz varre arquivos compilados/backend auxiliares e retorna muitos erros de estilo (não impeditivo para execução, mas dívida técnica de qualidade).
