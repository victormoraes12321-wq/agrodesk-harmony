import {
  addMetricResult,
  assertCondition,
  createMetrics,
  ensureUsersForLoad,
  getAdminToken,
  requestApi,
  runConcurrently,
  summarizeMetrics,
  writeJsonResult,
  DEFAULT_PASSWORD,
} from "./_helpers.mjs";

function buildTicketPayload(user, index) {
  const suffix = `${Date.now()}-${index + 1}`;
  return {
    requesterName: user.name,
    requesterPhone: user.phone,
    requesterEmail: user.email,
    departmentId: user.departmentId,
    branchId: user.branchId,
    title: `Carga simultanea ${index + 1}`,
    description: `Teste pesado de criacao simultanea de OS ${suffix}.`,
    impactDescription: "Fluxo de testes de carga",
    preferredServiceTime: "Horario comercial",
  };
}

async function getOverviewTotal(adminToken) {
  const result = await requestApi("/reports/overview", {
    token: adminToken,
  });
  assertCondition(result.ok, `Falha ao obter overview: ${result.status}`);
  return result.data.totalTickets ?? 0;
}

async function main() {
  const startedAt = new Date().toISOString();
  const adminToken = await getAdminToken();
  const { solicitantes } = await ensureUsersForLoad(adminToken, {
    solicitantes: 36,
    admins: 4,
  });

  const requesterUsers = solicitantes.slice(0, 30);
  const loginMetrics = createMetrics("login_30_requesters");
  const loginResults = await runConcurrently(requesterUsers.length, async (index) => {
    const user = requesterUsers[index];
    const result = await requestApi("/auth/login", {
      method: "POST",
      body: { email: user.email, password: DEFAULT_PASSWORD },
    });
    addMetricResult(loginMetrics, result, { email: user.email });
    return result;
  });

  const requesterSessions = loginResults
    .filter((result) => result.ok)
    .map((result) => ({
      token: result.data.accessToken,
      user: result.data.user,
    }));

  assertCondition(requesterSessions.length === 30, "Nem todos os solicitantes autenticaram para teste de criacao.");

  const totalBefore = await getOverviewTotal(adminToken);

  const createTicketsMetrics = createMetrics("create_tickets_30_concurrent");
  const createResults = await runConcurrently(requesterSessions.length, async (index) => {
    const session = requesterSessions[index];
    const payload = buildTicketPayload(session.user, index);
    const result = await requestApi("/tickets", {
      method: "POST",
      token: session.token,
      body: payload,
    });
    addMetricResult(createTicketsMetrics, result, { requester: session.user.email });
    return result;
  });

  const created = createResults.filter((result) => result.ok).map((result) => result.data);
  const createdIds = created.map((ticket) => ticket.id);
  const createdProtocols = created.map((ticket) => ticket.protocolNumber);
  const uniqueProtocols = new Set(createdProtocols);

  const adminList = await requestApi("/tickets", { token: adminToken });
  assertCondition(adminList.ok, `Falha ao listar tickets admin: ${adminList.status}`);
  const listedIds = new Set(adminList.data.map((ticket) => ticket.id));
  const missingInList = createdIds.filter((id) => !listedIds.has(id));

  const totalAfter = await getOverviewTotal(adminToken);

  // Double-submit protection (sequential quick duplicate).
  const duplicateTarget = requesterSessions[0];
  const duplicateMarker = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const duplicatePayload = {
    requesterName: duplicateTarget.user.name,
    requesterPhone: duplicateTarget.user.phone,
    requesterEmail: duplicateTarget.user.email,
    departmentId: duplicateTarget.user.departmentId,
    branchId: duplicateTarget.user.branchId,
    title: "Duplicidade Acidental",
    description: `Teste de bloqueio de duplicidade acidental por duplo clique (${duplicateMarker}).`,
  };

  const duplicateFirst = await requestApi("/tickets", {
    method: "POST",
    token: duplicateTarget.token,
    body: duplicatePayload,
  });
  const duplicateSecond = await requestApi("/tickets", {
    method: "POST",
    token: duplicateTarget.token,
    body: duplicatePayload,
  });

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    totals: {
      before: totalBefore,
      after: totalAfter,
      createdExpected: 30,
      createdSuccess: created.length,
    },
    metrics: {
      requesterLogin: summarizeMetrics(loginMetrics),
      createConcurrent: summarizeMetrics(createTicketsMetrics),
    },
    protocol: {
      createdProtocolsCount: createdProtocols.length,
      uniqueProtocolsCount: uniqueProtocols.size,
    },
    consistency: {
      missingInAdminListCount: missingInList.length,
      missingInAdminList: missingInList,
    },
    duplicateProtection: {
      firstStatus: duplicateFirst.status,
      secondStatus: duplicateSecond.status,
      secondBody: duplicateSecond.data,
    },
    checks: {
      concurrentCreatesAllSucceeded: created.length === 30,
      protocolsAreUnique: uniqueProtocols.size === createdProtocols.length,
      allCreatedVisibleToAdmin: missingInList.length === 0,
      dashboardTotalIncreased: totalAfter >= totalBefore + created.length,
      duplicateSecondBlocked: duplicateFirst.ok && duplicateSecond.status >= 400,
    },
  };

  const output = writeJsonResult("load-test-create-tickets.result.json", summary);
  console.log(`Load create tickets finalizado. Resultado: ${output}`);
  console.log(JSON.stringify(summary.checks, null, 2));

  const failedChecks = Object.entries(summary.checks).filter(([, value]) => !value);
  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Falha no load-test-create-tickets:", error);
  process.exitCode = 1;
});
