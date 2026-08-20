import { requestApi, assertCondition } from "./load/_helpers.mjs";

async function testProxyAndInstantResolution() {
  console.log("Iniciando teste de Abertura de OS em Nome de Terceiros & Atendimento Rápido...");

  let adminLogin = await requestApi("/auth/login", {
    method: "POST",
    body: { username: "Marcelo", password: "MudaSenha@123" },
  });

  if (!adminLogin.ok) {
    adminLogin = await requestApi("/auth/login", {
      method: "POST",
      body: { username: "Marcelo", password: "NovaSenhaSegura123!" },
    });
  }

  assertCondition(adminLogin.ok, "Falha no login do Admin");
  let adminToken = adminLogin.data.accessToken;

  const changePass = await requestApi("/users/me/password", {
    method: "PATCH",
    token: adminToken,
    body: { currentPassword: "MudaSenha@123", newPassword: "NovaSenhaSegura123!" },
  });

  if (changePass.ok) {
    const relogin = await requestApi("/auth/login", {
      method: "POST",
      body: { username: "Marcelo", password: "NovaSenhaSegura123!" },
    });
    if (relogin.ok) {
      adminToken = relogin.data.accessToken;
    }
  }

  // 2. Fetch users to get a target user (e.g. Victor or Geraldo)
  const usersRes = await requestApi("/users", { method: "GET", token: adminToken });
  if (!usersRes.ok) {
    console.error("DEBUG USERS ERROR:", usersRes.status, JSON.stringify(usersRes.data));
  }
  assertCondition(usersRes.ok, "Falha ao listar usuários");

  const targetUser = usersRes.data.find((u) => u.role === "SOLICITANTE") || usersRes.data[0];
  console.log(`- Usuário selecionado como Solicitante: ${targetUser.name} (${targetUser.id})`);

  // 3. Create Ticket on behalf of Target User with Instant Resolution (Atendimento Rápido)
  const ticketRes = await requestApi("/tickets", {
    method: "POST",
    token: adminToken,
    body: {
      targetUserId: targetUser.id,
      requesterName: targetUser.name,
      requesterPhone: targetUser.phone || "(44) 99999-8888",
      requesterEmail: targetUser.email,
      departmentId: targetUser.departmentId,
      branchId: targetUser.branchId,
      description: "Solicitação verbal no balcão: Substituição rápida de cabo de rede defeituoso no computador.",
      resolveImmediately: true,
      resolutionNotes: "Trocado cabo de rede no balcão de suporte. Testada comunicação com sucesso.",
    },
  });

  assertCondition(ticketRes.ok, `Falha ao criar OS proxy: ${ticketRes.status} ${JSON.stringify(ticketRes.data)}`);
  const ticket = ticketRes.data;

  console.log("[OK] Ordem de Serviço criada com sucesso!");
  console.log(`- Protocolo gerado: ${ticket.protocolNumber}`);
  console.log(`- Solicitante vinculado (requesterId): ${ticket.requesterId}`);
  console.log(`- Status final retornado: ${ticket.status}`);
  console.log(`- Técnico responsável atribuído (assignedToId): ${ticket.assignedToId}`);

  assertCondition(ticket.requesterId === targetUser.id, "O requesterId DEVE ser o ID do usuário selecionado!");
  assertCondition(ticket.status === "RESOLVED", "O status DEVE ser RESOLVED imediatamente para Atendimento Rápido!");
  assertCondition(ticket.assignedToId === adminLogin.data.user.id, "O técnico responsável DEVE ser o Admin que realizou o atendimento!");

  console.log("TESTE DE ABERTURA EM NOME DE TERCEIROS E ATENDIMENTO RÁPIDO CONCLUÍDO COM 100% DE SUCESSO!");
}

testProxyAndInstantResolution().catch(console.error);
