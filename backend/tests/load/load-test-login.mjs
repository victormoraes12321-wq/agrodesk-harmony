import {
  addMetricResult,
  createMetrics,
  ensureUsersForLoad,
  getAdminToken,
  requestApi,
  runConcurrently,
  summarizeMetrics,
  writeJsonResult,
  DEFAULT_PASSWORD,
} from "./_helpers.mjs";

async function main() {
  const startedAt = new Date().toISOString();
  const adminToken = await getAdminToken();
  const { solicitantes, admins } = await ensureUsersForLoad(adminToken, {
    solicitantes: 36,
    admins: 4,
  });

  const testUsers = [...solicitantes, ...admins];
  const validLoginMetrics = createMetrics("login_valid_40_concurrent");

  const validLoginResults = await runConcurrently(40, async (index) => {
    const user = testUsers[index];
    const result = await requestApi("/auth/login", {
      method: "POST",
      body: { username: user.email, password: DEFAULT_PASSWORD },
    });
    addMetricResult(validLoginMetrics, result, { email: user.email });
    return result;
  });

  const tokens = validLoginResults
    .filter((res) => res.ok)
    .map((res) => ({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    }));

  const meValidMetrics = createMetrics("auth_me_with_valid_tokens");
  await runConcurrently(tokens.length, async (index) => {
    const token = tokens[index].accessToken;
    const result = await requestApi("/auth/me", { token });
    addMetricResult(meValidMetrics, result, { userId: tokens[index].user.id });
  });

  const invalidTokenMetrics = createMetrics("auth_me_invalid_token");
  await runConcurrently(40, async (index) => {
    const result = await requestApi("/auth/me", {
      token: `invalid-token-${index}`,
    });
    addMetricResult(invalidTokenMetrics, result, { attempt: index + 1 });
  });

  const wrongPasswordMetrics = createMetrics("login_wrong_password");
  await runConcurrently(40, async (index) => {
    const user = testUsers[index];
    const result = await requestApi("/auth/login", {
      method: "POST",
      body: { username: user.email, password: "senha-errada" },
    });
    addMetricResult(wrongPasswordMetrics, result, { email: user.email });
  });

  const inactiveTarget = solicitantes[0];
  const deactivate = await requestApi(`/users/${inactiveTarget.id}/active`, {
    method: "PATCH",
    token: adminToken,
    body: { active: false },
  });

  const inactiveLoginResult = await requestApi("/auth/login", {
    method: "POST",
    body: { username: inactiveTarget.email, password: DEFAULT_PASSWORD },
  });

  const reactivate = await requestApi(`/users/${inactiveTarget.id}/active`, {
    method: "PATCH",
    token: adminToken,
    body: { active: true },
  });

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    users: {
      solicitantes: solicitantes.length,
      admins: admins.length,
      totalConcurrent: 40,
    },
    metrics: {
      validLogin: summarizeMetrics(validLoginMetrics),
      meWithValidToken: summarizeMetrics(meValidMetrics),
      meWithInvalidToken: summarizeMetrics(invalidTokenMetrics),
      wrongPassword: summarizeMetrics(wrongPasswordMetrics),
    },
    inactiveUserFlow: {
      userEmail: inactiveTarget.email,
      deactivateStatus: deactivate.status,
      inactiveLoginStatus: inactiveLoginResult.status,
      reactivateStatus: reactivate.status,
    },
    checks: {
      validLoginsAllSucceeded: validLoginMetrics.ok === 40,
      meWithValidTokenAllSucceeded: meValidMetrics.ok === tokens.length,
      invalidTokensRejected: invalidTokenMetrics.byStatus["401"] === 40,
      wrongPasswordRejected: wrongPasswordMetrics.byStatus["401"] === 40,
      inactiveUserRejected: inactiveLoginResult.status === 401,
    },
  };

  const output = writeJsonResult("load-test-login.result.json", summary);
  console.log(`Load login finalizado. Resultado: ${output}`);
  console.log(JSON.stringify(summary.checks, null, 2));

  const failedChecks = Object.entries(summary.checks).filter(([, value]) => !value);
  if (failedChecks.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Falha no load-test-login:", error);
  process.exitCode = 1;
});
