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
  pickRandom,
} from "./_helpers.mjs";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

async function loginAdmins(adminUsers) {
  const metrics = createMetrics("admin_logins");
  const results = await runConcurrently(adminUsers.length, async (index) => {
    const user = adminUsers[index];
    const result = await requestApi("/auth/login", {
      method: "POST",
      body: { email: user.email, password: DEFAULT_PASSWORD },
    });
    addMetricResult(metrics, result, { email: user.email });
    return result;
  });

  const sessions = results
    .filter((item) => item.ok)
    .map((item) => ({ token: item.data.accessToken, user: item.data.user }));

  return { metrics, sessions };
}

async function main() {
  const startedAt = new Date().toISOString();
  const rootAdminToken = await getAdminToken();
  const { admins } = await ensureUsersForLoad(rootAdminToken, {
    solicitantes: 36,
    admins: 4,
  });

  const { metrics: loginMetrics, sessions: adminSessions } = await loginAdmins(admins);
  assertCondition(adminSessions.length === 4, "Nao foi possivel autenticar os 4 TI_ADMIN.");
  const assignableAdmins = adminSessions.filter((session) => session.user.canReceiveTickets);
  assertCondition(
    assignableAdmins.length >= 1,
    "Nenhum TI_ADMIN operacional disponivel para receber OS.",
  );

  const adminToken = adminSessions[0].token;
  const ticketList = await requestApi("/tickets", { token: adminToken });
  assertCondition(ticketList.ok, `Falha ao listar tickets: ${ticketList.status}`);

  const candidateTickets = ticketList.data
    .filter((ticket) =>
      [
        "OPEN",
        "ANALYSIS",
        "IN_PROGRESS",
        "WAITING_USER",
        "WAITING_PARTS_OR_THIRD_PARTY",
        "REOPENED",
      ].includes(ticket.status),
    )
    .slice(0, 20);

  assertCondition(
    candidateTickets.length >= 6,
    "Poucos tickets para teste de ações administrativas.",
  );

  const assignMetrics = createMetrics("admin_assign");
  const priorityMetrics = createMetrics("admin_priority");
  const statusMetrics = createMetrics("admin_status");
  const commentMetrics = createMetrics("admin_comments");
  const technicalMetrics = createMetrics("admin_technical");

  await runConcurrently(candidateTickets.length, async (index) => {
    const ticket = candidateTickets[index];
    const actor = adminSessions[index % adminSessions.length];
    const assignee = assignableAdmins[index % assignableAdmins.length];

    const assignRes = await requestApi(`/tickets/${ticket.id}/assignee`, {
      method: "PATCH",
      token: actor.token,
      body: { assigneeUserId: assignee.user.id },
    });
    addMetricResult(assignMetrics, assignRes, { ticketId: ticket.id });

    const priorityRes = await requestApi(`/tickets/${ticket.id}/priority`, {
      method: "PATCH",
      token: actor.token,
      body: { realPriority: pickRandom(PRIORITIES) },
    });
    addMetricResult(priorityMetrics, priorityRes, { ticketId: ticket.id });

    const statusRes = await requestApi(`/tickets/${ticket.id}/status`, {
      method: "PATCH",
      token: actor.token,
      body: { status: "IN_PROGRESS", note: "Fluxo de teste de carga - em atendimento" },
    });
    addMetricResult(statusMetrics, statusRes, { ticketId: ticket.id });

    const publicComment = await requestApi(`/tickets/${ticket.id}/comments`, {
      method: "POST",
      token: actor.token,
      body: { content: "Comentario publico de teste de carga", internal: false },
    });
    addMetricResult(commentMetrics, publicComment, { ticketId: ticket.id, kind: "public" });

    const internalComment = await requestApi(`/tickets/${ticket.id}/comments`, {
      method: "POST",
      token: actor.token,
      body: { content: "Comentario interno de teste de carga", internal: true },
    });
    addMetricResult(commentMetrics, internalComment, { ticketId: ticket.id, kind: "internal" });

    const technicalRes = await requestApi(`/tickets/${ticket.id}/technical`, {
      method: "PATCH",
      token: actor.token,
      body: {
        diagnosis: "Diagnostico de teste concorrente",
        rootCause: "Teste de estresse operacional",
        solution: "Atualizacao de fluxo concluida",
        partsUsed: "Nenhuma",
        timeSpentMinutes: 15 + (index % 10),
        internalNotes: "Atualizacao tecnica automatizada para validacao",
      },
    });
    addMetricResult(technicalMetrics, technicalRes, { ticketId: ticket.id });
  });

  const conflictTicket = candidateTickets[0];
  const [adminA, adminB, adminC, adminD] = adminSessions;

  const conflictStatusMetrics = createMetrics("conflict_status_parallel");
  const conflictMixedMetrics = createMetrics("conflict_mixed_parallel");

  const [statusA, statusB] = await Promise.all([
    requestApi(`/tickets/${conflictTicket.id}/status`, {
      method: "PATCH",
      token: adminA.token,
      body: { status: "WAITING_USER", note: "Favor enviar print da tela com erro." },
    }),
    requestApi(`/tickets/${conflictTicket.id}/status`, {
      method: "PATCH",
      token: adminB.token,
      body: { status: "IN_PROGRESS", note: "Analise em andamento pela equipe de TI." },
    }),
  ]);
  addMetricResult(conflictStatusMetrics, statusA, { actor: adminA.user.email });
  addMetricResult(conflictStatusMetrics, statusB, { actor: adminB.user.email });

  const [resolveRes, priorityRes] = await Promise.all([
    requestApi(`/tickets/${conflictTicket.id}/resolve`, {
      method: "POST",
      token: adminC.token,
      body: { note: "Resolvido durante teste de conflito." },
    }),
    requestApi(`/tickets/${conflictTicket.id}/priority`, {
      method: "PATCH",
      token: adminD.token,
      body: { realPriority: "CRITICAL" },
    }),
  ]);
  addMetricResult(conflictMixedMetrics, resolveRes, {
    actor: adminC.user.email,
    action: "resolve",
  });
  addMetricResult(conflictMixedMetrics, priorityRes, {
    actor: adminD.user.email,
    action: "priority",
  });

  const conflictDetail = await requestApi(`/tickets/${conflictTicket.id}`, { token: adminToken });
  assertCondition(
    conflictDetail.ok,
    `Falha ao buscar ticket de conflito: ${conflictDetail.status}`,
  );

  const conflictTicketFinal = conflictDetail.data;

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    ticketSampleSize: candidateTickets.length,
    metrics: {
      adminLogins: summarizeMetrics(loginMetrics),
      assign: summarizeMetrics(assignMetrics),
      priority: summarizeMetrics(priorityMetrics),
      status: summarizeMetrics(statusMetrics),
      comments: summarizeMetrics(commentMetrics),
      technical: summarizeMetrics(technicalMetrics),
      conflictStatus: summarizeMetrics(conflictStatusMetrics),
      conflictMixed: summarizeMetrics(conflictMixedMetrics),
    },
    conflictTicket: {
      id: conflictTicket.id,
      finalStatus: conflictTicketFinal.status,
      finalPriority: conflictTicketFinal.realPriority,
      statusHistoryCount: conflictTicketFinal.statusHistory?.length ?? 0,
      commentsCount: conflictTicketFinal.comments?.length ?? 0,
    },
    checks: {
      allAssignSucceeded: assignMetrics.failed === 0,
      allPrioritySucceeded: priorityMetrics.failed === 0,
      allStatusSucceeded: statusMetrics.failed === 0,
      allCommentsSucceeded: commentMetrics.failed === 0,
      allTechnicalSucceeded: technicalMetrics.failed === 0,
      conflictStatusRequestsAccepted: conflictStatusMetrics.ok >= 1,
      mixedConflictRequestsAccepted: conflictMixedMetrics.ok >= 1,
      conflictTicketHasHistory: (conflictTicketFinal.statusHistory?.length ?? 0) > 0,
      conflictTicketNotCorrupted: Boolean(
        conflictTicketFinal.id && conflictTicketFinal.protocolNumber,
      ),
    },
  };

  const output = writeJsonResult("load-test-admin-actions.result.json", summary);
  console.log(`Load admin actions finalizado. Resultado: ${output}`);
  console.log(JSON.stringify(summary.checks, null, 2));

  const failedChecks = Object.entries(summary.checks).filter(([, value]) => !value);
  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Falha no load-test-admin-actions:", error);
  process.exitCode = 1;
});
