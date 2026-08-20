import { requestApi, assertCondition } from "./load/_helpers.mjs";

async function testRegistration() {
  console.log("Iniciando teste automatizado de Auto-Cadastro de Solicitante...");

  // 1. Fetch public departments and branches
  const deptsRes = await requestApi("/departments", { method: "GET" });
  assertCondition(deptsRes.ok, `Falha ao buscar setores públicos: ${deptsRes.status}`);
  const branchesRes = await requestApi("/branches", { method: "GET" });
  assertCondition(branchesRes.ok, `Falha ao buscar filiais públicas: ${branchesRes.status}`);

  const deptId = deptsRes.data[0].id;
  const branchId = branchesRes.data[0].id;

  const testEmail = `novo.solicitante.${Date.now()}@agrodesk.com`;

  // 2. Perform self-registration
  const regRes = await requestApi("/auth/register", {
    method: "POST",
    body: {
      name: "Novo Solicitante de Teste",
      email: testEmail,
      password: "SenhaSegura123",
      departmentId: deptId,
      branchId: branchId,
      phone: "(44) 99887-6655",
      whatsapp: "(44) 99887-6655",
      jobTitle: "Operador de Vendas",
    },
  });

  assertCondition(regRes.ok, `Falha no cadastro público: ${regRes.status} ${JSON.stringify(regRes.data)}`);
  console.log("[OK] Endpoint /auth/register respondeu 201/200 com sucesso!");
  console.log(`- Usuário criado ID: ${regRes.data.user.id}`);
  console.log(`- Permissão atribuída: ${regRes.data.user.role}`);
  console.log(`- Token de Acesso retornado: ${regRes.data.accessToken ? "Sim" : "Não"}`);

  assertCondition(regRes.data.user.role === "SOLICITANTE", "Permissão do cadastrado DEVE ser SOLICITANTE.");

  // 3. Test login with newly registered credentials
  const loginRes = await requestApi("/auth/login", {
    method: "POST",
    body: {
      username: testEmail,
      password: "SenhaSegura123",
    },
  });
  assertCondition(loginRes.ok, `Falha no login do novo solicitante: ${loginRes.status}`);
  console.log("[OK] Login do novo solicitante efetuado com sucesso!");

  // Clean up test user
  const adminToken = await requestApi("/auth/login", {
    method: "POST",
    body: { username: "marcelo.ti@agrodesk.com", password: "MudaSenha@123" },
  });

  if (adminToken.ok) {
    const deleteRes = await requestApi(`/users/${regRes.data.user.id}`, {
      method: "DELETE",
      token: adminToken.data.accessToken,
    });
    console.log(`- Usuário de teste removido: ${deleteRes.status}`);
  }

  console.log("TESTE DE AUTO-CADASTRO FINALIZADO COM 100% DE SUCESSO!");
}

testRegistration().catch(console.error);
