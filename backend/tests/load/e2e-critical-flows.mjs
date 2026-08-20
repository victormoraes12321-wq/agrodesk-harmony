import {
  addMetricResult,
  assertCondition,
  createMetrics,
  ensureUsersForLoad,
  getAdminToken,
  requestApi,
  runConcurrently,
  sleep,
  summarizeMetrics,
  writeJsonResult,
  DEFAULT_PASSWORD,
} from "./_helpers.mjs";

async function loginAs(email) {
  const result = await requestApi("/auth/login", {
    method: "POST",
    body: { username: email, password: DEFAULT_PASSWORD },
  });
  assertCondition(result.ok, `Falha de login para ${email}: ${result.status} ${JSON.stringify(result.data)}`);
  return result.data;
}

function buildTicketPayload(user, descriptionSuffix) {
  return {
    requesterName: user.name,
    requesterPhone: user.phone,
    requesterEmail: user.email,
    departmentId: user.departmentId,
    branchId: user.branchId,
    title: "E2E fluxo critico",
    description: `Fluxo critico automatizado ${descriptionSuffix}`,
  };
}

async function uploadAttachment(token, ticketId, filename, mimeType, content, internal = false) {
  const form = new FormData();
  form.append("file", new Blob([content], { type: mimeType }), filename);
  if (internal) form.append("internal", "true");
  return requestApi(`/tickets/${ticketId}/attachments`, {
    method: "POST",
    token,
    formData: form,
  });
}

async function main() {
  const startedAt = new Date().toISOString();
  const adminToken = await getAdminToken();
  const { solicitantes, admins } = await ensureUsersForLoad(adminToken, {
    solicitantes: 36,
    admins: 4,
  });

  const requesterA = await loginAs(solicitantes[0].email);
  const requesterB = await loginAs(solicitantes[1].email);
  const adminA = await loginAs(admins[0].email);

  const createRes = await requestApi("/tickets", {
    method: "POST",
    token: requesterA.accessToken,
    body: buildTicketPayload(requesterA.user, `ticket-${Date.now()}`),
  });
  assertCondition(createRes.ok, `Falha ao criar ticket base E2E: ${createRes.status}`);
  const ticketId = createRes.data.id;

  const permissionMetrics = createMetrics("permissions");
  const permissionChecks = await Promise.all([
    requestApi("/reports/overview", { token: requesterA.accessToken }),
    requestApi("/users", { token: requesterA.accessToken }),
    requestApi(`/tickets/${ticketId}`, { token: requesterB.accessToken }),
    requestApi(`/tickets/${ticketId}/priority`, {
      method: "PATCH",
      token: requesterA.accessToken,
      body: { realPriority: "CRITICAL" },
    }),
    requestApi(`/tickets/${ticketId}/assignee`, {
      method: "PATCH",
      token: requesterA.accessToken,
      body: { assigneeUserId: admins[1].id },
    }),
    requestApi(`/tickets/${ticketId}/status`, {
      method: "PATCH",
      token: requesterA.accessToken,
      body: { status: "IN_PROGRESS", note: "Tentativa indevida" },
    }),
    requestApi(`/tickets/${ticketId}/comments`, {
      method: "POST",
      token: requesterA.accessToken,
      body: { content: "Tentativa interna indevida", internal: true },
    }),
  ]);

  permissionChecks.forEach((result, index) =>
    addMetricResult(permissionMetrics, result, { scenario: index + 1 }),
  );

  const waitingWithoutMessage = await requestApi(`/tickets/${ticketId}/status`, {
    method: "PATCH",
    token: adminA.accessToken,
    body: { status: "WAITING_USER" },
  });

  const waitingWithMessage = await requestApi(`/tickets/${ticketId}/status`, {
    method: "PATCH",
    token: adminA.accessToken,
    body: {
      status: "WAITING_USER",
      note: "Favor retornar com foto da tela de erro e horario exato.",
    },
  });

  const requesterDetailAfterWaiting = await requestApi(`/tickets/${ticketId}`, {
    token: requesterA.accessToken,
  });

  const whatsappValid = await requestApi(`/tickets/${ticketId}/whatsapp-prepared`, {
    method: "POST",
    token: adminA.accessToken,
    body: {
      message: "Mensagem de teste para WhatsApp com orientacoes de retorno.",
      phoneUsed: requesterA.user.phone,
      statusAtMoment: "WAITING_USER",
    },
  });

  const whatsappInvalidPhone = await requestApi(`/tickets/${ticketId}/whatsapp-prepared`, {
    method: "POST",
    token: adminA.accessToken,
    body: {
      message: "Mensagem curta invalida?",
      phoneUsed: "123",
      statusAtMoment: "WAITING_USER",
    },
  });

  const uploadAllowed = await uploadAttachment(
    requesterA.accessToken,
    ticketId,
    "evidencia.txt",
    "text/plain",
    "evidencia de teste",
    false,
  );

  const uploadBlockedExe = await uploadAttachment(
    requesterA.accessToken,
    ticketId,
    "malicioso.exe",
    "application/octet-stream",
    "fake exe",
    false,
  );

  const oversizedBuffer = new Uint8Array(11 * 1024 * 1024).fill(65);
  const uploadBlockedLarge = await uploadAttachment(
    requesterA.accessToken,
    ticketId,
    "grande.pdf",
    "application/pdf",
    oversizedBuffer,
    false,
  );

  const concurrentUploadsMetrics = createMetrics("concurrent_uploads");
  const uploadActors = [
    requesterA.accessToken,
    requesterA.accessToken,
    adminA.accessToken,
    adminA.accessToken,
    requesterA.accessToken,
    adminA.accessToken,
  ];

  await runConcurrently(uploadActors.length, async (index) => {
    const result = await uploadAttachment(
      uploadActors[index],
      ticketId,
      `multi-${index + 1}.txt`,
      "text/plain",
      `arquivo concorrente ${index + 1}`,
      false,
    );
    addMetricResult(concurrentUploadsMetrics, result, { upload: index + 1 });
  });

  const adminListBefore = await requestApi("/tickets", { token: adminA.accessToken });
  const ticketIdsBefore = new Set(adminListBefore.data.map((ticket) => ticket.id));

  const realtimeCreate = await requestApi("/tickets", {
    method: "POST",
    token: requesterB.accessToken,
    body: buildTicketPayload(requesterB.user, `realtime-${Date.now()}`),
  });
  assertCondition(realtimeCreate.ok, `Falha ao criar ticket realtime: ${realtimeCreate.status}`);
  const realtimeTicketId = realtimeCreate.data.id;

  let appearedInPolling = false;
  const pollingMetrics = createMetrics("polling_realtime");
  for (let i = 0; i < 10; i += 1) {
    const poll = await requestApi("/tickets", { token: adminA.accessToken });
    addMetricResult(pollingMetrics, poll, { round: i + 1 });
    const ids = new Set((poll.data ?? []).map((ticket) => ticket.id));
    if (ids.has(realtimeTicketId) && !ticketIdsBefore.has(realtimeTicketId)) {
      appearedInPolling = true;
      break;
    }
    await sleep(1000);
  }

  const reportMetrics = createMetrics("reports_queries");
  const reportQueries = await Promise.all([
    requestApi("/reports/overview", { token: adminA.accessToken }),
    requestApi("/reports/overview?status=IN_PROGRESS", { token: adminA.accessToken }),
    requestApi("/reports/overview?priority=HIGH", { token: adminA.accessToken }),
    requestApi("/reports/by-department", { token: adminA.accessToken }),
    requestApi("/reports/by-assignee", { token: adminA.accessToken }),
  ]);
  reportQueries.forEach((result, index) =>
    addMetricResult(reportMetrics, result, { report: index + 1 }),
  );

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    ticketId,
    realtimeTicketId,
    metrics: {
      permissions: summarizeMetrics(permissionMetrics),
      concurrentUploads: summarizeMetrics(concurrentUploadsMetrics),
      pollingRealtime: summarizeMetrics(pollingMetrics),
      reports: summarizeMetrics(reportMetrics),
    },
    statusFlow: {
      waitingWithoutMessageStatus: waitingWithoutMessage.status,
      waitingWithMessageStatus: waitingWithMessage.status,
      requesterDetailStatus: requesterDetailAfterWaiting.status,
      requesterVisibleWaitingMessage: requesterDetailAfterWaiting.data?.waitingRequesterMessage ?? null,
    },
    whatsapp: {
      validStatus: whatsappValid.status,
      invalidPhoneStatus: whatsappInvalidPhone.status,
      invalidPhoneBody: whatsappInvalidPhone.data,
    },
    attachments: {
      allowedStatus: uploadAllowed.status,
      blockedExecutableStatus: uploadBlockedExe.status,
      blockedLargeStatus: uploadBlockedLarge.status,
    },
    realtime: {
      appearedInPolling,
    },
    checks: {
      requesterCannotAccessAdminData:
        (permissionChecks[0].status === 403 || permissionChecks[0].status === 401) &&
        (permissionChecks[1].status === 403 || permissionChecks[1].status === 401),
      requesterCannotAccessOtherTicket: permissionChecks[2].status === 403,
      requesterCannotAlterAdministrativeFields:
        permissionChecks[3].status === 403 &&
        permissionChecks[4].status === 403 &&
        permissionChecks[5].status === 403,
      requesterCannotCreateInternalComment: permissionChecks[6].status === 403,
      waitingUserRequiresMessage: waitingWithoutMessage.status === 400,
      waitingUserWithMessageWorks: waitingWithMessage.ok,
      requesterSeesWaitingMessage: Boolean(requesterDetailAfterWaiting.data?.waitingRequesterMessage),
      whatsappPreparedRegisters: whatsappValid.ok,
      whatsappInvalidPhoneRejected: whatsappInvalidPhone.status === 400,
      attachmentAllowedWorks: uploadAllowed.ok,
      blockedExecutableRejected: uploadBlockedExe.status === 400,
      blockedLargeRejected: uploadBlockedLarge.status === 400 || uploadBlockedLarge.status === 413,
      concurrentUploadsSucceeded: concurrentUploadsMetrics.failed === 0,
      realtimePollingDetectedNewTicket: appearedInPolling,
      reportsEndpointsHealthy: reportMetrics.failed === 0,
    },
  };

  const output = writeJsonResult("e2e-critical-flows.result.json", summary);
  console.log(`E2E critical flows finalizado. Resultado: ${output}`);
  console.log(JSON.stringify(summary.checks, null, 2));

  const failedChecks = Object.entries(summary.checks).filter(([, value]) => !value);
  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Falha no e2e-critical-flows:", error);
  process.exitCode = 1;
});
