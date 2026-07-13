# BUGS_FOUND - AgroDesk TI

## Críticos (encontrados durante a bateria)

1. **Colisão de protocolo em criação simultânea de OS**
- Sintoma: parte das 30 criações concorrentes falhava com `400`.
- Erro observado: `Nao foi possivel gerar um protocolo unico para esta OS. Tente novamente.`
- Impacto: risco de perda operacional sob carga real.
- Status: **CORRIGIDO**.

2. **Teste de duplicidade com falso negativo intermitente**
- Sintoma: check `duplicateSecondBlocked` falhava em algumas execuções de suíte.
- Causa: payload de teste de duplicidade era idêntico entre execuções consecutivas e podia colidir com a janela anti-duplicidade da execução anterior.
- Impacto: falso alarme de regressão.
- Status: **CORRIGIDO**.

## Médios

1. **Deprecation warning no runner da suíte pesada**
- Mensagem: `[DEP0190] ... shell option true ...`
- Impacto: não quebra testes, mas merece evolução para execução mais segura.
- Status: **PENDENTE (não bloqueante)**.

2. **Lint global com alta quantidade de erros de estilo/formatação**
- Causa principal: varredura em artefatos compilados e arquivos auxiliares não normalizados.
- Impacto: baixa sinalização de qualidade para CI, porém sem impacto funcional imediato.
- Status: **PENDENTE (não bloqueante para operação)**.

## Baixos

1. **Ausência de suíte unitária/integration formal**
- `npm test` backend atualmente retorna apenas `No tests configured`.
- Impacto: menor cobertura automática de regressões de negócio.
- Status: **PENDENTE**.
