# FIXES_APPLIED - AgroDesk TI

## Correções aplicadas nesta etapa

## 1) Robustez de protocolo sob concorrência
Arquivo alterado:
- `backend/src/modules/tickets/tickets.service.ts`

Ajustes:
- Criação de OS passou a ocorrer dentro de transação Prisma.
- Uso de lock transacional PostgreSQL (`pg_advisory_xact_lock`) para serializar a geração de protocolo.
- Geração de protocolo passou a usar cliente transacional, evitando corrida entre leituras e inserts simultâneos.

Resultado:
- 30/30 criações concorrentes concluídas com protocolo único.

## 2) Proteção contra duplicidade acidental (duplo clique)
Arquivo alterado:
- `backend/src/modules/tickets/tickets.service.ts`

Ajustes:
- Checagem de duplicidade em janela curta (60s) para OS equivalente aberta.
- Normalização de título/descrição para comparação e persistência.
- Mensagem clara ao usuário quando a duplicidade é bloqueada.

Resultado:
- 1ª requisição cria OS (`201`) e 2ª requisição idêntica é bloqueada (`400`).

## 3) Estabilização do teste de duplicidade na carga
Arquivo alterado:
- `backend/tests/load/load-test-create-tickets.mjs`

Ajustes:
- Payload de duplicidade agora recebe marcador único por execução.
- Remove falso negativo causado por repetição entre runs.

Resultado:
- Check `duplicateSecondBlocked` passou consistentemente.

## 4) Scripts de carga/e2e utilizados
Arquivos presentes:
- `backend/tests/load/load-test-login.mjs`
- `backend/tests/load/load-test-create-tickets.mjs`
- `backend/tests/load/load-test-admin-actions.mjs`
- `backend/tests/load/e2e-critical-flows.mjs`
- `backend/tests/load/run-heavy-suite.mjs`
- `backend/tests/load/_helpers.mjs`

## Resultado após correções
- `npm run load-test-all` em `/backend`: **PASSOU**
- `npm run build` frontend: **PASSOU**
- `npm run build` backend: **PASSOU**

## Pendências técnicas (não bloqueantes para a bateria executada)
- Ajustar runner da suíte para eliminar warning `DEP0190` sem quebrar execução em Windows.
- Revisar estratégia de lint para excluir artefatos compilados e reduzir ruído.
- Criar suíte formal de testes unitários/integration (Jest/Supertest) para CI.
